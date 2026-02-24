import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdPlatform = 'google' | 'meta' | 'tiktok' | 'pinterest';
type CampaignStatus = 'active' | 'paused' | 'stopped' | 'archived';

interface SyncPayload {
  ad_account_id: string;
  triggered_by?: 'manual' | 'scheduled';
}

interface CampaignData {
  external_campaign_id: string;
  name: string;
  status: CampaignStatus;
  budget_limit: number;
  budget_used: number;
  currency: string;
}

interface DailyMetric {
  date: string; // 'YYYY-MM-DD'
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface HourlyMetric {
  hour: string; // ISO 8601
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface PlatformSyncResult {
  campaigns: CampaignData[];
  dailyMetrics: Record<string, DailyMetric[]>;   // externalCampaignId → metrics
  hourlyMetrics: Record<string, HourlyMetric[]>; // externalCampaignId → metrics
}

interface GoogleAdsSearchChunk {
  results?: Array<{
    campaign?: { id: string; name: string; status: string };
    campaignBudget?: { amountMicros: string };
    metrics?: {
      costMicros: string;
      impressions: string;
      clicks: string;
      conversions: string;
      conversionsValue: string;
    };
    segments?: { date: string };
  }>;
}

interface GoogleAccessibleCustomersResponse {
  resourceNames?: string[];
}

interface GoogleAdsErrorDetail {
  errorCode?: Record<string, string>;
  message?: string;
}

// ---------------------------------------------------------------------------
// Crypto — AES-256-GCM via Web Crypto API (Deno compatible)
// Matches the format produced by src/lib/crypto.ts: iv:authTag:ciphertext (hex)
// ---------------------------------------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function decryptToken(encrypted: string): Promise<string> {
  const secret = Deno.env.get('OAUTH_TOKEN_SECRET');
  if (!secret) throw new Error('OAUTH_TOKEN_SECRET is not configured');

  const keyBytes = hexToBytes(secret);
  if (keyBytes.length !== 32) throw new Error('OAUTH_TOKEN_SECRET must be 32 bytes (64 hex chars)');

  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format');
  const [ivHex, authTagHex, ciphertextHex] = parts;

  const iv = hexToBytes(ivHex);
  const authTag = hexToBytes(authTagHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
  );

  // Web Crypto expects ciphertext + authTag concatenated
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Platform API clients
// Each fetches campaigns + daily + hourly metrics for the given account.
// Returns normalised PlatformSyncResult for DB writes.
// ---------------------------------------------------------------------------

/** Returns last N days as 'YYYY-MM-DD' strings (inclusive today). */
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** Last 7 days as hourly ISO timestamps (one per hour). */
function last7DaysHours(): string[] {
  const hours: string[] = [];
  const now = new Date();
  for (let h = 7 * 24 - 1; h >= 0; h--) {
    const d = new Date(now.getTime() - h * 3_600_000);
    d.setUTCMinutes(0, 0, 0);
    hours.push(d.toISOString());
  }
  return hours;
}

function isGoogleVersionUnsupported(errorBody: string): boolean {
  return errorBody.includes('UNSUPPORTED_VERSION')
    || errorBody.toLowerCase().includes('version')
      && errorBody.toLowerCase().includes('deprecated');
}

function parseGoogleErrorMessage(errorBody: string): string {
  try {
    const parsed = JSON.parse(errorBody) as {
      error?: {
        message?: string;
        status?: string;
        details?: Array<{ errors?: GoogleAdsErrorDetail[] }>;
      };
    };
    const topMessage = parsed.error?.message;
    const topStatus = parsed.error?.status;
    const firstDetail = parsed.error?.details
      ?.flatMap(detail => detail.errors ?? [])
      ?.find(detail => detail.message || detail.errorCode);

    if (firstDetail) {
      const errorCode = firstDetail.errorCode
        ? Object.entries(firstDetail.errorCode)
            .map(([key, value]) => `${key}:${value}`)
            .join(',')
        : '';
      const detailMessage = firstDetail.message ?? '';
      const suffix = [errorCode, detailMessage].filter(Boolean).join(' - ');
      if (topMessage && suffix) return `${topMessage} (${suffix})`;
      if (suffix) return suffix;
    }

    if (topMessage && topStatus) return `${topMessage} (${topStatus})`;
    return topMessage ?? errorBody.slice(0, 500);
  } catch {
    return errorBody.slice(0, 500);
  }
}

function isLikelyGoogleCustomerId(accountId: string): boolean {
  return /^\d{10}$/.test(accountId.replace(/-/g, ''));
}

function pickPreferredGoogleCustomerId(
  customerIds: string[],
  loginCustomerId?: string
): string | null {
  if (!customerIds.length) return null;
  if (!loginCustomerId) return customerIds[0];

  const normalizedLoginId = loginCustomerId.replace(/-/g, '');
  const childCustomerId = customerIds.find(id => id !== normalizedLoginId);
  return childCustomerId ?? customerIds[0];
}

async function getGoogleTokenUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function hasServiceRoleCredential(
  token: string | null,
  supabaseUrl: string
): Promise<boolean> {
  if (!token) return false;
  try {
    // Auth admin endpoint only accepts service-role credentials.
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: token,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function googleAdsSearchStream(
  accessToken: string,
  externalAccountId: string,
  query: string,
  developerToken: string,
  loginCustomerId?: string
): Promise<GoogleAdsSearchChunk[]> {
  const versions = ['v21', 'v20', 'v19'];
  const normalizedAccountId = externalAccountId.replace(/-/g, '');
  let lastError = 'Google Ads request failed on all supported API versions.';

  for (const version of versions) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

    const response = await fetch(
      `https://googleads.googleapis.com/${version}/customers/${normalizedAccountId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    const bodyText = await response.text();
    if (response.ok) {
      try {
        return JSON.parse(bodyText) as GoogleAdsSearchChunk[];
      } catch {
        throw new Error(`Google Ads ${version} returned invalid JSON`);
      }
    }

    if (response.status === 404 || isGoogleVersionUnsupported(bodyText)) {
      lastError = `Google Ads ${version} is unavailable for this project`;
      continue;
    }

    if (bodyText.includes('DEVELOPER_TOKEN_INVALID')) {
      throw new Error('Google Ads developer token is invalid. Update GOOGLE_ADS_DEVELOPER_TOKEN in Supabase secrets.');
    }
    if (bodyText.includes('NOT_ADS_USER')) {
      const tokenEmail = await getGoogleTokenUserEmail(accessToken);
      const withEmail = tokenEmail ? ` OAuth user: ${tokenEmail}.` : '';
      throw new Error(`Connected Google user is not associated with any Google Ads account.${withEmail} Add this user to MCC/test account and accept the invitation.`);
    }

    throw new Error(`Google Ads ${version} request failed: ${parseGoogleErrorMessage(bodyText)}`);
  }

  throw new Error(lastError);
}

async function googleListAccessibleCustomers(
  accessToken: string,
  developerToken: string,
  loginCustomerId?: string
): Promise<string[]> {
  const versions = ['v21', 'v20', 'v19'];
  let lastError = 'Unable to fetch accessible Google Ads customers.';

  for (const version of versions) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
    };
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

    const response = await fetch(
      `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
      {
        headers,
      }
    );

    const bodyText = await response.text();
    if (response.ok) {
      try {
        const data = JSON.parse(bodyText) as GoogleAccessibleCustomersResponse;
        return (data.resourceNames ?? [])
          .map(name => name.split('/')[1] ?? name)
          .filter(Boolean);
      } catch {
        throw new Error(`Google Ads ${version} returned invalid JSON for customer lookup`);
      }
    }

    if (response.status === 404 || isGoogleVersionUnsupported(bodyText)) {
      lastError = `Google Ads ${version} is unavailable for this project`;
      continue;
    }

    if (bodyText.includes('DEVELOPER_TOKEN_INVALID')) {
      throw new Error('Google Ads developer token is invalid. Update GOOGLE_ADS_DEVELOPER_TOKEN in Supabase secrets.');
    }
    if (bodyText.includes('NOT_ADS_USER')) {
      const tokenEmail = await getGoogleTokenUserEmail(accessToken);
      const withEmail = tokenEmail ? ` OAuth user: ${tokenEmail}.` : '';
      throw new Error(`Connected Google user is not associated with any Google Ads account.${withEmail} Add this user to MCC/test account and accept the invitation.`);
    }

    throw new Error(`Google Ads ${version} account lookup failed: ${parseGoogleErrorMessage(bodyText)}`);
  }

  throw new Error(lastError);
}

async function syncGoogle(
  accessToken: string,
  externalAccountId: string
): Promise<PlatformSyncResult> {
  const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '';
  const loginCustomerId = (Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID') ?? '').replace(/-/g, '');
  if (!devToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
  }

  // Some OAuth callbacks store Google user "sub" instead of Ads customer ID.
  // If the stored value is not a plausible customer ID, discover one from Google Ads.
  let customerId = externalAccountId;
  if (!isLikelyGoogleCustomerId(externalAccountId)) {
    const accessibleCustomers = await googleListAccessibleCustomers(
      accessToken,
      devToken,
      loginCustomerId || undefined
    );
    const discoveredCustomerId = pickPreferredGoogleCustomerId(
      accessibleCustomers,
      loginCustomerId || undefined
    );
    if (!discoveredCustomerId) {
      throw new Error('No accessible Google Ads customer found for this account.');
    }
    console.warn(
      `[syncGoogle] external_account_id "${externalAccountId}" is not a customer ID; using "${discoveredCustomerId}" from accessible customers.`
    );
    customerId = discoveredCustomerId;
  } else if (loginCustomerId && externalAccountId.replace(/-/g, '') === loginCustomerId) {
    const accessibleCustomers = await googleListAccessibleCustomers(
      accessToken,
      devToken,
      loginCustomerId
    );
    const childCustomerId = pickPreferredGoogleCustomerId(accessibleCustomers, loginCustomerId);
    if (childCustomerId && childCustomerId !== loginCustomerId) {
      console.warn(
        `[syncGoogle] external_account_id "${externalAccountId}" is MCC login customer; using child customer "${childCustomerId}".`
      );
      customerId = childCustomerId;
    }
  }

  // Fetch campaigns via GAQL
  const campaignData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT campaign.id, campaign.name, campaign.status,
                     campaign_budget.amount_micros, metrics.cost_micros
              FROM campaign
              WHERE campaign.status != 'REMOVED'
              ORDER BY campaign.id`,
    devToken,
    loginCustomerId || undefined
  );

  const campaigns: CampaignData[] = [];
  const allResults = campaignData.flatMap(chunk => chunk.results ?? []);

  for (const row of allResults) {
    const statusMap: Record<string, CampaignStatus> = {
      ENABLED: 'active', PAUSED: 'paused', REMOVED: 'archived',
    };
    campaigns.push({
      external_campaign_id: row.campaign.id,
      name: row.campaign.name,
      status: statusMap[row.campaign.status] ?? 'paused',
      budget_limit: Number(row.campaignBudget?.amountMicros ?? 0) / 1_000_000,
      budget_used: Number(row.metrics?.costMicros ?? 0) / 1_000_000,
      currency: 'USD',
    });
  }

  // Fetch daily metrics (last 30 days)
  const dailyMetrics: Record<string, DailyMetric[]> = {};
  const dates = lastNDays(30);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const metricsData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT campaign.id, segments.date,
                     metrics.cost_micros, metrics.impressions,
                     metrics.clicks, metrics.conversions, metrics.conversions_value
              FROM campaign
              WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
                AND campaign.status != 'REMOVED'`,
    devToken,
    loginCustomerId || undefined
  );

  for (const chunk of metricsData) {
    for (const row of chunk.results ?? []) {
      const id = row.campaign?.id;
      const date = row.segments?.date;
      if (!id || !date || !row.metrics) continue;

      if (!dailyMetrics[id]) dailyMetrics[id] = [];
      dailyMetrics[id].push({
        date,
        spend: Number(row.metrics.costMicros) / 1_000_000,
        impressions: Number(row.metrics.impressions),
        clicks: Number(row.metrics.clicks),
        conversions: Number(row.metrics.conversions),
        revenue: Number(row.metrics.conversionsValue),
      });
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {} };
}

async function syncMeta(
  accessToken: string,
  externalAccountId: string
): Promise<PlatformSyncResult> {
  const accountRef = `act_${externalAccountId}`;
  const fields = 'id,name,status,daily_budget,lifetime_budget,budget_remaining,account_currency';

  const campaignRes = await fetch(
    `https://graph.facebook.com/v21.0/${accountRef}/campaigns?fields=${fields}&limit=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!campaignRes.ok) throw new Error(`Meta campaigns fetch failed: ${await campaignRes.text()}`);

  const campaignData = await campaignRes.json() as { data?: Array<{ id: string; name: string; status: string; daily_budget?: string; lifetime_budget?: string; budget_remaining?: string; account_currency?: string }> };
  const statusMap: Record<string, CampaignStatus> = {
    ACTIVE: 'active', PAUSED: 'paused', DELETED: 'archived', ARCHIVED: 'archived',
  };

  const campaigns: CampaignData[] = (campaignData.data ?? []).map(c => {
    // lifetime_budget and daily_budget are mutually exclusive on Meta campaigns.
    // budget_remaining is only meaningful for lifetime campaigns.
    const isLifetime = c.lifetime_budget != null && Number(c.lifetime_budget) > 0;
    const budgetLimit = isLifetime
      ? Number(c.lifetime_budget) / 100
      : Number(c.daily_budget ?? 0) / 100;
    const budgetUsed = isLifetime
      ? Math.max(0, budgetLimit - Number(c.budget_remaining ?? 0) / 100)
      : 0; // actual spend for daily campaigns comes from insights, not campaign fields

    return {
      external_campaign_id: c.id,
      name: c.name,
      status: statusMap[c.status] ?? 'paused',
      budget_limit: budgetLimit,
      budget_used: budgetUsed,
      currency: c.account_currency ?? 'USD',
    };
  });

  // Daily insights (last 30 days)
  const dates = lastNDays(30);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const insightFields = 'campaign_id,date_start,spend,impressions,clicks,actions,action_values';
  const insightRes = await fetch(
    `https://graph.facebook.com/v21.0/${accountRef}/insights?fields=${insightFields}&time_range={"since":"${startDate}","until":"${endDate}"}&time_increment=1&level=campaign&limit=500`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const dailyMetrics: Record<string, DailyMetric[]> = {};
  if (insightRes.ok) {
    const insightData = await insightRes.json() as { data?: Array<{ campaign_id: string; date_start: string; spend: string; impressions: string; clicks: string; actions?: Array<{ action_type: string; value: string }>; action_values?: Array<{ action_type: string; value: string }> }> };
    for (const row of insightData.data ?? []) {
      const id = row.campaign_id;
      if (!dailyMetrics[id]) dailyMetrics[id] = [];
      const conversions = (row.actions ?? []).find(a => a.action_type === 'purchase')?.value ?? '0';
      const revenue = (row.action_values ?? []).find(a => a.action_type === 'purchase')?.value ?? '0';
      dailyMetrics[id].push({
        date: row.date_start,
        spend: parseFloat(row.spend ?? '0'),
        impressions: parseInt(row.impressions ?? '0'),
        clicks: parseInt(row.clicks ?? '0'),
        conversions: parseFloat(conversions),
        revenue: parseFloat(revenue),
      });
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {} };
}

async function syncTikTok(
  accessToken: string,
  externalAccountId: string
): Promise<PlatformSyncResult> {
  const campaignRes = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${externalAccountId}&fields=["campaign_id","campaign_name","status","budget","budget_mode"]`,
    { headers: { 'Access-Token': accessToken } }
  );
  if (!campaignRes.ok) throw new Error(`TikTok campaigns fetch failed: ${await campaignRes.text()}`);

  const campaignData = await campaignRes.json() as { code: number; data?: { list?: Array<{ campaign_id: string; campaign_name: string; status: string; budget: number; budget_mode: string }> } };
  if (campaignData.code !== 0) throw new Error(`TikTok API error: ${JSON.stringify(campaignData)}`);

  const statusMap: Record<string, CampaignStatus> = {
    CAMPAIGN_STATUS_ENABLE: 'active',
    CAMPAIGN_STATUS_DISABLE: 'paused',
    CAMPAIGN_STATUS_DELETE: 'archived',
  };

  const campaigns: CampaignData[] = (campaignData.data?.list ?? []).map(c => ({
    external_campaign_id: c.campaign_id,
    name: c.campaign_name,
    status: statusMap[c.status] ?? 'paused',
    budget_limit: c.budget,
    budget_used: 0,
    currency: 'USD',
  }));

  // Daily report
  const dates = lastNDays(30);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const reportRes = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${externalAccountId}&report_type=BASIC&dimensions=["campaign_id","stat_time_day"]&metrics=["spend","impressions","clicks","conversion","real_value"]&start_date=${startDate}&end_date=${endDate}&page_size=200`,
    { headers: { 'Access-Token': accessToken } }
  );

  const dailyMetrics: Record<string, DailyMetric[]> = {};
  if (reportRes.ok) {
    const reportData = await reportRes.json() as { code: number; data?: { list?: Array<{ dimensions: { campaign_id: string; stat_time_day: string }; metrics: { spend: string; impressions: string; clicks: string; conversion: string; real_value: string } }> } };
    if (reportData.code === 0) {
      for (const row of reportData.data?.list ?? []) {
        const id = row.dimensions.campaign_id;
        if (!dailyMetrics[id]) dailyMetrics[id] = [];
        dailyMetrics[id].push({
          date: row.dimensions.stat_time_day.slice(0, 10),
          spend: parseFloat(row.metrics.spend ?? '0'),
          impressions: parseInt(row.metrics.impressions ?? '0'),
          clicks: parseInt(row.metrics.clicks ?? '0'),
          conversions: parseFloat(row.metrics.conversion ?? '0'),
          revenue: parseFloat(row.metrics.real_value ?? '0'),
        });
      }
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {} };
}

async function syncPinterest(
  accessToken: string,
  externalAccountId: string
): Promise<PlatformSyncResult> {
  const campaignRes = await fetch(
    `https://api.pinterest.com/v5/ad_accounts/${externalAccountId}/campaigns?page_size=100`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  if (!campaignRes.ok) throw new Error(`Pinterest campaigns fetch failed: ${await campaignRes.text()}`);

  const campaignData = await campaignRes.json() as { items?: Array<{ id: string; name: string; status: string; daily_spend_cap?: number; lifetime_spend_cap?: number }> };
  const statusMap: Record<string, CampaignStatus> = {
    ACTIVE: 'active', PAUSED: 'paused', ARCHIVED: 'archived',
  };

  const campaigns: CampaignData[] = (campaignData.items ?? []).map(c => ({
    external_campaign_id: c.id,
    name: c.name,
    status: statusMap[c.status] ?? 'paused',
    budget_limit: (c.daily_spend_cap ?? c.lifetime_spend_cap ?? 0) / 1_000_000,
    budget_used: 0,
    currency: 'USD',
  }));

  // Analytics
  const dates = lastNDays(30);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const analyticsRes = await fetch(
    `https://api.pinterest.com/v5/ad_accounts/${externalAccountId}/campaigns/analytics?start_date=${startDate}&end_date=${endDate}&campaign_ids=${campaigns.map(c => c.external_campaign_id).join(',')}&columns=SPEND_IN_DOLLAR,IMPRESSION_1,CLICK_TYPE_1,CHECKOUT_ROAS,TOTAL_CONVERSIONS`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  const dailyMetrics: Record<string, DailyMetric[]> = {};
  if (analyticsRes.ok) {
    const analyticsData = await analyticsRes.json() as Array<{ campaign_id: string; date: string; metrics: { SPEND_IN_DOLLAR?: number; IMPRESSION_1?: number; CLICK_TYPE_1?: number; TOTAL_CONVERSIONS?: number; CHECKOUT_ROAS?: number } }>;
    for (const row of analyticsData) {
      const id = row.campaign_id;
      if (!dailyMetrics[id]) dailyMetrics[id] = [];
      dailyMetrics[id].push({
        date: row.date,
        spend: row.metrics.SPEND_IN_DOLLAR ?? 0,
        impressions: row.metrics.IMPRESSION_1 ?? 0,
        clicks: row.metrics.CLICK_TYPE_1 ?? 0,
        conversions: row.metrics.TOTAL_CONVERSIONS ?? 0,
        revenue: (row.metrics.SPEND_IN_DOLLAR ?? 0) * (row.metrics.CHECKOUT_ROAS ?? 0),
      });
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {} };
}

function getPlatformSyncer(platform: AdPlatform) {
  const map: Record<AdPlatform, (token: string, accountId: string) => Promise<PlatformSyncResult>> = {
    google: syncGoogle,
    meta: syncMeta,
    tiktok: syncTikTok,
    pinterest: syncPinterest,
  };
  return map[platform];
}

// ---------------------------------------------------------------------------
// DB writes
// ---------------------------------------------------------------------------

async function writeResults(
  supabase: ReturnType<typeof createClient>,
  adAccount: { id: string; organization_id: string; platform: AdPlatform; external_account_id: string },
  result: PlatformSyncResult
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();

  for (const campaign of result.campaigns) {
    // Upsert campaign
    const { data: dbCampaign, error: campErr } = await supabase
      .from('campaigns')
      .upsert(
        {
          organization_id: adAccount.organization_id,
          ad_account_id: adAccount.id,
          platform: adAccount.platform,
          external_campaign_id: campaign.external_campaign_id,
          name: campaign.name,
          status: campaign.status,
          budget_limit: campaign.budget_limit,
          budget_used: campaign.budget_used,
          currency: campaign.currency,
        },
        { onConflict: 'ad_account_id,external_campaign_id' }
      )
      .select('id')
      .single();

    if (campErr || !dbCampaign) {
      console.error(`[writeResults] campaign upsert failed for ${campaign.external_campaign_id}:`, campErr?.message ?? 'no data returned');
      continue;
    }

    const campaignId = dbCampaign.id as string;
    const extId = campaign.external_campaign_id;

    // Upsert daily metrics
    const daily = result.dailyMetrics[extId] ?? [];
    if (daily.length > 0) {
      const rows = daily.map(m => ({
        campaign_id: campaignId,
        date: m.date,
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: m.revenue,
      }));
      const { error: dailyErr } = await supabase
        .from('campaign_metrics')
        .upsert(rows, { onConflict: 'campaign_id,date' });
      if (dailyErr) {
        console.error(`[writeResults] campaign_metrics upsert failed for campaign ${campaignId}:`, dailyErr.message);
      }
    }

    // Upsert hourly metrics (only last 7 days)
    const hourly = result.hourlyMetrics[extId] ?? [];
    if (hourly.length > 0) {
      const rows = hourly
        .filter(m => m.hour >= sevenDaysAgo)
        .map(m => ({
          campaign_id: campaignId,
          hour: m.hour,
          spend: m.spend,
          impressions: m.impressions,
          clicks: m.clicks,
          conversions: m.conversions,
        }));
      if (rows.length > 0) {
        const { error: hourlyErr } = await supabase
          .from('hourly_metrics')
          .upsert(rows, { onConflict: 'campaign_id,hour' });
        if (hourlyErr) {
          console.error(`[writeResults] hourly_metrics upsert failed for campaign ${campaignId}:`, hourlyErr.message);
        }
      }
    }
  }

  // Update last_synced_at on the ad_account
  await supabase
    .from('ad_accounts')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', adAccount.id);

}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const syncSecret = Deno.env.get('OAUTH_TOKEN_SECRET');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authorize caller using either a valid service-role credential or the shared sync secret.
  const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  const apiKey = req.headers.get('apikey');
  const inboundSyncSecret = req.headers.get('x-sync-secret');
  const keyCandidates = Array.from(new Set([bearerToken, apiKey].filter(Boolean) as string[]));
  let hasValidServiceKey = false;
  for (const token of keyCandidates) {
    if (await hasServiceRoleCredential(token, supabaseUrl)) {
      hasValidServiceKey = true;
      break;
    }
  }
  const authorized = hasValidServiceKey
    || (syncSecret != null && syncSecret !== '' && inboundSyncSecret === syncSecret);

  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: SyncPayload;
  try {
    payload = await req.json() as SyncPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { ad_account_id, triggered_by = 'scheduled' } = payload;
  if (!ad_account_id) {
    return new Response(JSON.stringify({ error: 'ad_account_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use service role to bypass RLS inside the Edge Function
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch ad account
  const { data: adAccount, error: accountErr } = await supabase
    .from('ad_accounts')
    .select('id, organization_id, platform, external_account_id, is_active')
    .eq('id', ad_account_id)
    .maybeSingle();

  if (accountErr || !adAccount) {
    return new Response(JSON.stringify({ error: 'Ad account not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!adAccount.is_active) {
    return new Response(JSON.stringify({ error: 'Ad account is not active' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create sync_log entry
  const { data: syncLog, error: logErr } = await supabase
    .from('sync_logs')
    .insert({
      organization_id: adAccount.organization_id,
      ad_account_id: adAccount.id,
      status: 'in_progress',
      triggered_by,
    })
    .select('id')
    .single();

  if (logErr || !syncLog) {
    return new Response(JSON.stringify({ error: 'Failed to create sync log' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const syncLogId = syncLog.id as string;

  async function failSync(message: string): Promise<Response> {
    await supabase
      .from('sync_logs')
      .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
      .eq('id', syncLogId);
    return new Response(JSON.stringify({ error: message, sync_log_id: syncLogId }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch + decrypt access token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('ad_account_tokens')
    .select('access_token')
    .eq('ad_account_id', ad_account_id)
    .maybeSingle();

  if (tokenErr || !tokenRow?.access_token) {
    return failSync('No access token found for this ad account');
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(tokenRow.access_token);
  } catch (err) {
    return failSync(`Token decryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Run platform sync
  try {
    const syncer = getPlatformSyncer(adAccount.platform as AdPlatform);
    if (!syncer) {
      return failSync(`Unsupported platform: ${adAccount.platform}`);
    }
    const result = await syncer(accessToken, adAccount.external_account_id);
    await writeResults(supabase, adAccount as { id: string; organization_id: string; platform: AdPlatform; external_account_id: string }, result);

    await supabase
      .from('sync_logs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', syncLogId);

    return new Response(
      JSON.stringify({
        success: true,
        sync_log_id: syncLogId,
        campaigns_synced: result.campaigns.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return failSync(err instanceof Error ? err.message : String(err));
  }
});
