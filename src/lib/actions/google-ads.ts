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
        .select('id, external_account_id, selected_child_account_id, selected_child_accounts, account_name')
        .eq('organization_id', membership.organization.id)
        .eq('platform', 'google')
        .eq('is_active', true)
        .maybeSingle();

    if (error || !adAccount) return null;

    return {
        id: adAccount.id,
        external_account_id: adAccount.external_account_id,
        selected_child_account_id: adAccount.selected_child_account_id,
        selected_child_accounts: adAccount.selected_child_accounts,
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

    const runQuery = async (loginCustomerId: string, token: string, query: string, useLoginHeader: boolean = false) => {
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

    const fetchWithRetry = async (loginCustomerId: string, query: string) => {
        let response = await runQuery(loginCustomerId, accessToken, query, false);
        let text = await response.text();

        // If we got an INVALID_ARGUMENT (which happens when an MCC requires the login-customer-id but we didn't send it)
        if (!response.ok && text.includes('INVALID_ARGUMENT')) {
            console.log(`[fetchGoogleChildAccounts] INVALID_ARGUMENT without header for ${loginCustomerId}. Retrying WITH login-customer-id header...`);
            response = await runQuery(loginCustomerId, accessToken, query, true);
            text = await response.text();
        }

        // If unauthorized (access token expired), try refreshing it
        if (response.status === 401 && tokenRow.refresh_token && !tokenRefreshed) {
            console.log('[fetchGoogleChildAccounts] Token expired, attempting to refresh...');
            try {
                const service = getAdPlatformService('google');
                const refreshTokenText = await decryptToken(tokenRow.refresh_token);
                const newTokens = await service.refreshToken(refreshTokenText);

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

                response = await runQuery(loginCustomerId, accessToken, query, false);
                text = await response.text();

                if (!response.ok && text.includes('INVALID_ARGUMENT')) {
                    response = await runQuery(loginCustomerId, accessToken, query, true);
                    text = await response.text();
                }
            } catch (refreshErr) {
                console.error('[fetchGoogleChildAccounts] Failed to refresh token:', refreshErr);
            }
        }

        return { response, text };
    };

    const customerQuery = "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1";
    const childrenQuery = "SELECT customer_client.client_customer, customer_client.descriptive_name FROM customer_client WHERE customer_client.level = 1 AND customer_client.manager = false AND customer_client.status = 'ENABLED'";

    for (const loginCustomerId of loginCustomerIds) {
        // Step 1: Query the customer info directly to get its name and check if it's an MCC
        const { response, text } = await fetchWithRetry(loginCustomerId, customerQuery);

        if (!response.ok) {
            console.error(`Google Ads API Error (fetching customer for ${loginCustomerId}):`, text);
            // Fallback if querying self fails
            if (!finalResults.has(loginCustomerId)) {
                finalResults.set(loginCustomerId, { id: loginCustomerId, name: `Account ${loginCustomerId}` });
            }
            continue;
        }

        let isManager = false;
        let customerName = `Account ${loginCustomerId}`;

        try {
            const dataChunks = text.split('\n').filter((line) => line.trim().length > 0).map((line) => JSON.parse(line));
            for (const chunk of dataChunks) {
                if (!chunk.results) continue;
                for (const row of chunk.results) {
                    if (row.customer) {
                        customerName = row.customer.descriptiveName ?? customerName;
                        isManager = row.customer.manager === true;

                        // We add the account itself if it's a direct account
                        if (!isManager) {
                            if (!finalResults.has(loginCustomerId)) {
                                finalResults.set(loginCustomerId, { id: loginCustomerId, name: customerName });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to parse Google Ads streaming response (customer) for ${loginCustomerId}:`, err);
        }

        // Step 2: If it's an MCC, fetch its children
        if (isManager) {
            const childrenRes = await fetchWithRetry(loginCustomerId, childrenQuery);
            if (!childrenRes.response.ok) {
                console.error(`Failed to fetch children for manager ${loginCustomerId}:`, childrenRes.text);
                continue;
            }

            try {
                const dataChunks = childrenRes.text.split('\n').filter((line) => line.trim().length > 0).map((line) => JSON.parse(line));
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
                console.error(`Failed to parse Google Ads streaming response (children) for ${loginCustomerId}:`, err);
            }
        }
    }

    return Array.from(finalResults.values());
}

// --- ADD THIS EXPORT SO IT CAN BE CALLED DIRECTLY FROM THE NEW MODAL ---
export async function fetchConnectableGoogleAccounts(adAccountId: string): Promise<GoogleChildAccount[]> {
    return fetchGoogleChildAccounts(adAccountId);
}

export async function submitChildAccountsSelection(adAccountId: string, childIds: string[]) {
    const membership = await getUserOrganization();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('ad_accounts')
        .update({
            selected_child_accounts: childIds,
            selected_child_account_id: childIds[0] || null // Maintain active view context
        })
        .eq('id', adAccountId)
        .eq('organization_id', membership.organization.id);

    if (error) {
        throw new Error('Failed to update selected child accounts');
    }

    // After a successful manual switch from the settings page, trigger background sync
    // triggerManualSync can be imported or handled cleanly by the caller (we'll assume UI handles the toast!)
}

export async function updateActiveGoogleAdsView(adAccountId: string, childId: string) {
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
        throw new Error('Failed to update active view');
    }
}
