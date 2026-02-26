'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import { getAdPlatformService } from '@/services/ad-platforms';
import { encryptToken, decryptToken } from '@/lib/crypto';

export interface GoogleChildAccount {
    id: string;
    name: string;
}

export async function getConnectedGoogleAdsAccount() {
    const membership = await getUserOrganization();
    if (!membership) return null;

    const supabase = await createClient();
    const { data: adAccount, error } = await supabase
        .from('ad_accounts')
        .select('id, external_account_id, selected_child_account_id, account_name')
        .eq('organization_id', membership.organization.id)
        .eq('platform', 'google')
        .eq('is_active', true)
        .maybeSingle();

    if (error || !adAccount) return null;

    return {
        id: adAccount.id,
        external_account_id: adAccount.external_account_id,
        selected_child_id: adAccount.selected_child_account_id,
        name: adAccount.account_name,
    };
}

export async function fetchGoogleChildAccounts(adAccountId: string): Promise<GoogleChildAccount[]> {
    const membership = await getUserOrganization();
    if (!membership) throw new Error('Unauthorized');

    const supabase = await createClient();

    const { data: tokenRow, error: tokenErr } = await supabase
        .from('ad_account_tokens')
        .select('access_token, refresh_token')
        .eq('ad_account_id', adAccountId)
        .maybeSingle();

    if (tokenErr || !tokenRow?.access_token) {
        throw new Error('Access token not found');
    }

    const { data: accountRow } = await supabase
        .from('ad_accounts')
        .select('external_account_id')
        .eq('id', adAccountId)
        .single();

    if (!accountRow) throw new Error('Account not found');

    const loginCustomerIds = accountRow.external_account_id.split(',').map((id: string) => id.replace(/-/g, '').trim()).filter(Boolean);

    let accessToken = await decryptToken(tokenRow.access_token);
    let tokenRefreshed = false;
    const finalResults: Map<string, GoogleChildAccount> = new Map();

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

    const runQuery = async (loginCustomerId: string, token: string, useLoginHeader: boolean = false) => {
        // Use a clean query targeting level = 1 (direct children).
        // If it's not a manager account, Google API throws an authorization or NOT_MANAGER error which we catch below.
        const query = "SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client WHERE customer_client.level = 1 AND customer_client.manager = false AND customer_client.status = 'ENABLED'";

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'developer-token': devToken,
        };
        if (useLoginHeader) {
            headers['login-customer-id'] = loginCustomerId;
        }

        return fetch(
            `https://googleads.googleapis.com/v19/customers/${loginCustomerId}/googleAds:searchStream`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ query }),
            }
        );
    };

    for (const loginCustomerId of loginCustomerIds) {
        // First attempt WITHOUT the login header. If it's a direct account, this will fail elegantly (which we catch).
        let response = await runQuery(loginCustomerId, accessToken, false);

        // If we got an INVALID_ARGUMENT (which happens when an MCC requires the login-customer-id but we didn't send it)
        // We try again WITH the header.
        let text = await response.text();
        if (!response.ok && text.includes('INVALID_ARGUMENT')) {
            console.log(`[fetchGoogleChildAccounts] INVALID_ARGUMENT without header for ${loginCustomerId}. Retrying WITH login-customer-id header...`);
            response = await runQuery(loginCustomerId, accessToken, true);
            text = await response.text();
        }

        // If unauthorized (access token expired), try refreshing it
        if (response.status === 401 && tokenRow.refresh_token && !tokenRefreshed) {
            console.log('[fetchGoogleChildAccounts] Token expired, attempting to refresh...');
            try {
                const service = getAdPlatformService('google');
                const refreshTokenText = await decryptToken(tokenRow.refresh_token);
                const newTokens = await service.refreshToken(refreshTokenText);

                // Save new tokens to DB
                const newEncryptedAccess = await encryptToken(newTokens.accessToken);
                await supabase
                    .from('ad_account_tokens')
                    .update({
                        access_token: newEncryptedAccess,
                        token_expires_at: newTokens.expiresAt?.toISOString() ?? null,
                    })
                    .eq('ad_account_id', adAccountId);

                accessToken = newTokens.accessToken;
                tokenRefreshed = true;

                // Retry the query
                response = await runQuery(loginCustomerId, accessToken, false);
                text = await response.text();

                if (!response.ok && text.includes('INVALID_ARGUMENT')) {
                    response = await runQuery(loginCustomerId, accessToken, true);
                    text = await response.text();
                }
            } catch (refreshErr) {
                console.error('[fetchGoogleChildAccounts] Failed to refresh token:', refreshErr);
            }
        }

        if (!response.ok) {
            console.error(`Google Ads API Error (fetching children for ${loginCustomerId}):`, text);
            // If it's not a manager account, we just return the account itself
            if (text.includes('NOT_MANAGER') || text.includes('AUTHORIZATION_ERROR')) {
                if (!finalResults.has(loginCustomerId)) {
                    finalResults.set(loginCustomerId, { id: loginCustomerId, name: `Google Ads Account (${loginCustomerId})` });
                }
                continue;
            }

            let errMsg = 'API Error';
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed) && parsed[0]?.error?.message) {
                    errMsg = parsed[0].error.message.split('.')[0];
                } else if (parsed.error && parsed.error.message) {
                    errMsg = parsed.error.message.split('.')[0];
                } else if (parsed[0]?.error?.status) {
                    errMsg = parsed[0].error.status;
                } else {
                    const stringified = JSON.stringify(parsed);
                    errMsg = stringified.length < 50 ? stringified : 'Status ' + response.status;
                }
            } catch {
                errMsg = text.length < 50 ? text : 'Status ' + response.status;
            }

            // Return fallback
            if (!finalResults.has(loginCustomerId)) {
                finalResults.set(loginCustomerId, { id: loginCustomerId, name: `Account ${loginCustomerId} (${errMsg})` });
            }
            continue;
        }

        try {
            const dataChunks = text
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line) => JSON.parse(line));

            for (const chunk of dataChunks) {
                if (!chunk.results) continue;
                for (const row of chunk.results) {
                    if (row.customerClient) {
                        const rawId = row.customerClient.clientCustomer;
                        const name = row.customerClient.descriptiveName ?? 'Unnamed Account';
                        const id = rawId.split('/')[1] ?? rawId;
                        if (!finalResults.has(id)) {
                            finalResults.set(id, { id, name });
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to parse Google Ads streaming response for ${loginCustomerId}:`, err);
        }
    }

    return Array.from(finalResults.values());
}

export async function submitChildAccountSwitch(adAccountId: string, childId: string) {
    const membership = await getUserOrganization();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('ad_accounts')
        .update({ selected_child_account_id: childId })
        .eq('id', adAccountId)
        .eq('organization_id', membership.organization.id);

    if (error) {
        throw new Error('Failed to update selected child account');
    }

    // Optionally trigger a manual sync right here, although letting the user do it via UI is fine too.
}
