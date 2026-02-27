'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/actions/organization';
import { getAdPlatformService } from '@/services/ad-platforms';
import { encryptToken, decryptToken } from '@/lib/crypto';

export interface GoogleChildAccount {
    id: string;
    name: string;
    kind?: 'manager' | 'client' | 'direct';
    parent_manager_id?: string;
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
        .select('external_account_id, selected_child_accounts')
        .eq('id', adAccountId)
        .single();

    if (!accountRow) throw new Error('Account not found');

    const externalIds = accountRow.external_account_id
        .split(',')
        .map((id: string) => id.replace(/-/g, '').trim())
        .filter(Boolean);

    const persistedSelectedAccounts = Array.isArray(accountRow.selected_child_accounts)
        ? accountRow.selected_child_accounts
            .map((entry): GoogleChildAccount | null => {
                if (typeof entry === 'string') {
                    const id = entry.replace(/-/g, '').trim();
                    if (!id) return null;
                    return { id, name: `Account ${id}`, kind: 'client' };
                }
                if (!entry || typeof entry !== 'object') return null;

                const raw = entry as Record<string, unknown>;
                const rawId = typeof raw.id === 'string' ? raw.id : '';
                const id = rawId.replace(/-/g, '').trim();
                if (!id) return null;

                return {
                    id,
                    name: typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name : `Account ${id}`,
                    kind: raw.kind === 'manager' || raw.kind === 'client' || raw.kind === 'direct'
                        ? raw.kind
                        : 'client',
                    parent_manager_id: typeof raw.parent_manager_id === 'string' ? raw.parent_manager_id : undefined,
                };
            })
            .filter((account): account is GoogleChildAccount => Boolean(account))
        : [];

    let accessToken = await decryptToken(tokenRow.access_token);
    let tokenRefreshed = false;
    const finalResults: Map<string, GoogleChildAccount> = new Map();

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

    const refreshAccessToken = async (): Promise<boolean> => {
        if (!tokenRow.refresh_token || tokenRefreshed) return false;

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
            return true;
        } catch (refreshErr) {
            console.error('[fetchGoogleChildAccounts] Failed to refresh token:', refreshErr);
            return false;
        }
    };

    const runQuery = async (customerId: string, token: string, query: string, loginCustomerId?: string) => {
        const versions = ['v21', 'v20', 'v19'];
        let last: { response: Response; text: string } | null = null;

        for (const version of versions) {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'developer-token': devToken,
            };
            if (loginCustomerId) {
                headers['login-customer-id'] = loginCustomerId;
            }

            const response = await fetch(
                `https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:searchStream`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ query }),
                }
            );
            const text = await response.text();
            last = { response, text };

            if (response.ok) return { response, text };

            const isVersionIssue =
                response.status === 404
                || text.includes('UNSUPPORTED_VERSION')
                || text.toLowerCase().includes('deprecated');

            if (isVersionIssue) {
                continue;
            }

            return { response, text };
        }

        if (!last) {
            throw new Error('Google Ads query failed before response');
        }
        return last;
    };

    const listAccessibleCustomers = async (): Promise<string[]> => {
        const versions = ['v21', 'v20', 'v19'];

        for (const version of versions) {
            const res = await fetch(
                `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'developer-token': devToken,
                    },
                }
            );

            const text = await res.text();

            if (res.ok) {
                try {
                    const parsed = JSON.parse(text) as { resourceNames?: string[] };
                    return (parsed.resourceNames ?? [])
                        .map((resourceName) => resourceName.split('/')[1] ?? resourceName)
                        .map((id) => id.replace(/-/g, '').trim())
                        .filter(Boolean);
                } catch (err) {
                    console.error('[fetchGoogleChildAccounts] Failed to parse accessible customers:', err);
                    return [];
                }
            }

            if (res.status === 401) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    return listAccessibleCustomers();
                }
            }

            // Try lower API versions for compatibility.
            if (res.status === 404 || text.includes('UNSUPPORTED_VERSION') || text.toLowerCase().includes('deprecated')) {
                continue;
            }
        }

        return [];
    };

    const fetchWithRetry = async (
        customerId: string,
        query: string,
        candidateLoginIds: string[] = []
    ) => {
        const normalizedCandidates = Array.from(
            new Set(
                candidateLoginIds
                    .map((id) => id.replace(/-/g, '').trim())
                    .filter(Boolean)
            )
        );

        const runAndRead = async (loginCustomerId?: string) => {
            return runQuery(customerId, accessToken, query, loginCustomerId);
        };

        let { response, text } = await runAndRead();

        if (!response.ok && response.status === 401) {
            console.log('[fetchGoogleChildAccounts] Token expired, attempting to refresh...');
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                ({ response, text } = await runAndRead());
            }
        }

        if (!response.ok) {
            const needsHeaderRetry =
                text.includes('INVALID_ARGUMENT')
                || text.includes('login-customer-id')
                || text.includes('MISSING_LOGIN_CUSTOMER_ID')
                || text.includes('PERMISSION_DENIED')
                || text.includes('USER_PERMISSION_DENIED');

            if (needsHeaderRetry) {
                const headerCandidates = Array.from(new Set([customerId, ...normalizedCandidates]));

                for (const loginId of headerCandidates) {
                    let withHeader = await runAndRead(loginId);

                    if (!withHeader.response.ok && withHeader.response.status === 401) {
                        const refreshed = await refreshAccessToken();
                        if (refreshed) {
                            withHeader = await runAndRead(loginId);
                        }
                    }

                    if (withHeader.response.ok) {
                        return withHeader;
                    }

                    response = withHeader.response;
                    text = withHeader.text;
                }
            }
        }

        return { response, text };
    };

    const accessibleIds = await listAccessibleCustomers();
    const loginCustomerIds = Array.from(new Set([...externalIds, ...accessibleIds]));

    const customerQuery = "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1";
    const childrenQuery = "SELECT customer_client.client_customer, customer_client.descriptive_name, customer_client.manager, customer_client.status FROM customer_client";

    const kindPriority: Record<'manager' | 'client' | 'direct', number> = {
        manager: 3,
        client: 2,
        direct: 1,
    };

    const upsertAccount = (account: GoogleChildAccount) => {
        const existing = finalResults.get(account.id);
        if (!existing) {
            finalResults.set(account.id, account);
            return;
        }

        const existingKind = (existing.kind ?? 'client') as 'manager' | 'client' | 'direct';
        const nextKind = (account.kind ?? 'client') as 'manager' | 'client' | 'direct';
        if (kindPriority[nextKind] >= kindPriority[existingKind]) {
            finalResults.set(account.id, {
                ...existing,
                ...account,
            });
        }
    };

    for (const loginCustomerId of loginCustomerIds) {
        // Step 1: Query the customer info directly to get its name and check if it's an MCC
        const { response, text } = await fetchWithRetry(loginCustomerId, customerQuery, loginCustomerIds);

        if (!response.ok) {
            console.error(`Google Ads API Error (fetching customer for ${loginCustomerId}):`, text);
            // Fallback if querying self fails
            upsertAccount({ id: loginCustomerId, name: `Account ${loginCustomerId}`, kind: 'direct' });
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

                        upsertAccount({
                            id: loginCustomerId,
                            name: customerName,
                            kind: isManager ? 'manager' : 'direct',
                        });
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to parse Google Ads streaming response (customer) for ${loginCustomerId}:`, err);
        }

        // Step 2: If it's an MCC, fetch its children
        if (isManager) {
            const childrenRes = await fetchWithRetry(loginCustomerId, childrenQuery, loginCustomerIds);
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
                            upsertAccount({
                                id,
                                name,
                                kind: row.customerClient.manager === true ? 'manager' : 'client',
                                parent_manager_id: loginCustomerId,
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to parse Google Ads streaming response (children) for ${loginCustomerId}:`, err);
            }
        }
    }
    for (const persisted of persistedSelectedAccounts) {
        if (!finalResults.has(persisted.id)) {
            finalResults.set(persisted.id, persisted);
        }
    }

    // Safety net: never return an empty list when account is connected.
    // This prevents UI dead-ends when Google API intermittently fails.
    if (finalResults.size === 0) {
        for (const persisted of persistedSelectedAccounts) {
            finalResults.set(persisted.id, persisted);
        }
        for (const id of externalIds) {
            if (!finalResults.has(id)) {
                finalResults.set(id, { id, name: `Account ${id}`, kind: 'direct' });
            }
        }
    }

    const rank: Record<'manager' | 'client' | 'direct', number> = {
        manager: 0,
        direct: 1,
        client: 1,
    };

    return Array.from(finalResults.values()).sort((a, b) => {
        const aKind = (a.kind ?? 'client') as 'manager' | 'client' | 'direct';
        const bKind = (b.kind ?? 'client') as 'manager' | 'client' | 'direct';
        const kindDiff = rank[aKind] - rank[bKind];
        if (kindDiff !== 0) return kindDiff;
        return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
    });
}

// --- ADD THIS EXPORT SO IT CAN BE CALLED DIRECTLY FROM THE NEW MODAL ---
export async function fetchConnectableGoogleAccounts(adAccountId: string): Promise<GoogleChildAccount[]> {
    return fetchGoogleChildAccounts(adAccountId);
}

export async function submitChildAccountsSelection(adAccountId: string, childAccounts: GoogleChildAccount[]) {
    const membership = await getUserOrganization();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const normalizedChildAccounts = Array.from(
        new Map(
            childAccounts.map((account) => [account.id, {
                id: account.id,
                name: account.name,
                kind: account.kind,
                parent_manager_id: account.parent_manager_id,
            }])
        ).values()
    );

    const firstClientLike = normalizedChildAccounts.find((account) => account.kind !== 'manager');

    const { error } = await supabase
        .from('ad_accounts')
        .update({
            selected_child_accounts: normalizedChildAccounts,
            // Keep active view on a direct/client account; if only MCC is selected, leave null to avoid over-filtering.
            selected_child_account_id: firstClientLike?.id ?? null,
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
