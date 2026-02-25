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
        .select('access_token')
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

    const accessToken = await decryptToken(tokenRow.access_token);
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';
    const loginCustomerId = accountRow.external_account_id;

    const query = `
    SELECT customer_client.client_customer, customer_client.descriptive_name 
    FROM customer_client 
    WHERE customer_client.level = 1 
      AND customer_client.manager = false 
      AND customer_client.status = 'ENABLED'
  `;

    const requestBody = {
        query,
    };

    const response = await fetch(
        `https://googleads.googleapis.com/v19/customers/${loginCustomerId}/googleAds:searchStream`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'developer-token': devToken,
                'login-customer-id': loginCustomerId,
            },
            body: JSON.stringify(requestBody),
        }
    );

    const text = await response.text();
    if (!response.ok) {
        console.error('Google Ads API Error (fetching children):', text);
        // If it's not a manager account, we just return the account itself
        if (text.includes('NOT_MANAGER')) {
            return [{ id: loginCustomerId, name: 'Direct Google Ads Account' }];
        }
        throw new Error('Failed to fetch Google child accounts');
    }

    const results: GoogleChildAccount[] = [];
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
                    results.push({ id, name });
                }
            }
        }
    } catch (err) {
        console.error('Failed to parse Google Ads streaming response:', err);
    }

    return results;
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
