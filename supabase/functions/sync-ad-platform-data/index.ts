import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdPlatform = 'google' | 'meta' | 'tiktok' | 'pinterest';
type CampaignStatus = 'active' | 'paused' | 'stopped' | 'archived';
type KeywordStatus = 'enabled' | 'paused' | 'removed';
type KeywordMatchType = 'exact' | 'phrase' | 'broad';

interface KeywordData {
  external_campaign_id: string;
  external_keyword_id: string;
  text: string;
  match_type: KeywordMatchType;
  status: KeywordStatus;
  quality_score?: number;
}

interface AudienceData {
  external_audience_id: string;
  name: string;
  type: string;
  size: number;
}

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
  keywords?: KeywordData[];
  keywordMetrics?: Record<string, DailyMetric[]>; // externalKeywordId -> metrics
  audiences?: AudienceData[];
  audienceMetrics?: Record<string, DailyMetric[]>; // externalAudienceId -> metrics
}

interface GoogleAdsSearchChunk {
  results?: Array<{
    campaign?: { id: string; name: string; status: string };
    campaignBudget?: { amountMicros: string };
    adGroupCriterion?: {
      criterionId: string;
      status: string;
      keyword?: { text: string; matchType: string };
      qualityInfo?: { qualityScore?: number };
      userList?: { userList: string };
    };
    userList?: {
      id: string;
      name: string;
      type: string;
      sizeForSearch: string;
      sizeForDisplay: string;
    };
    metrics?: {
      costMicros: string;
      impressions: string;
      clicks: string;
      conversions: string;
      conversionsValue: string;
    };
    segments?: { date: string };
    customer?: { manager: boolean; currencyCode?: string };
    customerClient?: { clientCustomer: string; manager: boolean; status: string };
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
    || (errorBody.toLowerCase().includes('version')
      && errorBody.toLowerCase().includes('deprecated'));
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

    if (bodyText.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
      throw new Error(
        'Google Ads developer token is in test mode (DEVELOPER_TOKEN_NOT_APPROVED). ' +
        'Apply for Basic Access at ads.google.com → Tools & Settings → API Center.'
      );
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

    if (bodyText.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
      throw new Error(
        'Google Ads developer token is in test mode (DEVELOPER_TOKEN_NOT_APPROVED). ' +
        'Apply for Basic Access at ads.google.com → Tools & Settings → API Center.'
      );
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
  externalAccountId: string,
  selectedChildId?: string
): Promise<PlatformSyncResult> {
  const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '';
  if (!devToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
  }

  let baseAccountId = externalAccountId;

  // If the stored value is not a plausible customer ID, discover one from Google Ads.
  if (!isLikelyGoogleCustomerId(externalAccountId)) {
    const accessibleCustomers = await googleListAccessibleCustomers(
      accessToken,
      devToken
    );
    const discoveredCustomerId = accessibleCustomers[0];
    if (!discoveredCustomerId) {
      throw new Error('No accessible Google Ads customer found for this account.');
    }
    console.warn(
      `[syncGoogle] external_account_id "${externalAccountId}" is not a customer ID; using "${discoveredCustomerId}" from accessible customers.`
    );
    baseAccountId = discoveredCustomerId;
  }

  let customerId = baseAccountId;
  let loginCustomerId: string | undefined = undefined;

  if (selectedChildId) {
    customerId = selectedChildId;
    console.log(`[syncGoogle] Using explicitly selected child account ${customerId} for MCC ${externalAccountId}`);
    loginCustomerId = externalAccountId; // assume MCC is the connected ad account
  } else {
    // Check if baseAccountId is a manager account
    try {
      const res = await googleAdsSearchStream(
        accessToken,
        baseAccountId,
        `SELECT customer.manager FROM customer LIMIT 1`,
        devToken
      );
      const isManager = res[0]?.results?.[0]?.customer?.manager === true;

      if (isManager) {
        loginCustomerId = baseAccountId;
        // It is an MCC. Let's find an active child client account as fallback.
        const childrenRes = await googleAdsSearchStream(
          accessToken,
          baseAccountId,
          `SELECT customer_client.client_customer FROM customer_client WHERE customer_client.level = 1 AND customer_client.manager = false AND customer_client.status = 'ENABLED' LIMIT 1`,
          devToken,
          loginCustomerId
        );

        const clientCustomerName = childrenRes[0]?.results?.[0]?.customerClient?.clientCustomer;
        if (!clientCustomerName) {
          throw new Error('This Google Ads account is a Manager (MCC) but has no active client accounts.');
        }
        customerId = clientCustomerName.split('/')[1] ?? clientCustomerName;
        console.log(`[syncGoogle] Resolved MCC ${loginCustomerId} to first child account ${customerId}`);
      }
    } catch (err) {
      const errObj = err as Error;
      console.warn('[syncGoogle] Manager resolution failed, proceeding as direct client:', errObj?.message ?? err);
      // If we can't determine it's a manager or query fails, assume it's a direct client account
    }
  }

  // Detect account currency dynamically instead of assuming USD
  let accountCurrency = 'USD';
  try {
    const currencyRes = await googleAdsSearchStream(
      accessToken,
      customerId,
      `SELECT customer.currency_code FROM customer LIMIT 1`,
      devToken,
      loginCustomerId
    );
    const code = currencyRes[0]?.results?.[0]?.customer?.currencyCode;
    if (code) {
      accountCurrency = code;
      console.log(`[syncGoogle] Detected currency ${accountCurrency} for account ${customerId}`);
    }
  } catch (err) {
    console.warn('[syncGoogle] Currency detection failed, defaulting to USD');
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
    loginCustomerId
  );

  const campaigns: CampaignData[] = [];
  const statusMap: Record<string, CampaignStatus> = {
    ENABLED: 'active', PAUSED: 'paused', REMOVED: 'archived',
  };

  for (const row of campaignData.flatMap(c => c.results ?? [])) {
    if (!row.campaign) continue;
    campaigns.push({
      external_campaign_id: row.campaign.id,
      name: row.campaign.name,
      status: statusMap[row.campaign.status] ?? 'paused',
      budget_limit: Number(row.campaignBudget?.amountMicros ?? 0) / 1_000_000,
      budget_used: Number(row.metrics?.costMicros ?? 0) / 1_000_000,
      currency: accountCurrency,
    });
  }

  // Fetch daily metrics (last 30 days)
  const dates = lastNDays(30);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const dailyMetrics: Record<string, DailyMetric[]> = {};
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
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] daily metrics fetch failed (non-fatal):', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

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

  // Fetch keywords
  const keywordData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT campaign.id,
            ad_group_criterion.criterion_id, 
            ad_group_criterion.status,
            ad_group_criterion.keyword.text, 
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.quality_info.quality_score
     FROM keyword_view
     WHERE ad_group_criterion.status != 'REMOVED'`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] keywords fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const keywords: KeywordData[] = [];
  const keywordStatusMap: Record<string, KeywordStatus> = {
    ENABLED: 'enabled', PAUSED: 'paused', REMOVED: 'removed'
  };
  const matchTypeMap: Record<string, KeywordMatchType> = {
    EXACT: 'exact', PHRASE: 'phrase', BROAD: 'broad'
  };

  for (const chunk of keywordData) {
    for (const row of chunk.results ?? []) {
      const campId = row.campaign?.id;
      const crit = row.adGroupCriterion;
      if (!campId || !crit || !crit.keyword) continue;

      keywords.push({
        external_campaign_id: campId,
        external_keyword_id: crit.criterionId,
        text: crit.keyword.text,
        match_type: matchTypeMap[crit.keyword.matchType] ?? 'broad',
        status: keywordStatusMap[crit.status] ?? 'paused',
        quality_score: crit.qualityInfo?.qualityScore ?? 5,
      });
    }
  }

  // Fetch keyword metrics
  const keywordMetricsData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT ad_group_criterion.criterion_id, segments.date,
            metrics.cost_micros, metrics.impressions, metrics.clicks,
            metrics.conversions, metrics.conversions_value
     FROM keyword_view
     WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
       AND ad_group_criterion.status != 'REMOVED'`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] keyword metrics fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const keywordMetrics: Record<string, DailyMetric[]> = {};
  for (const chunk of keywordMetricsData) {
    for (const row of chunk.results ?? []) {
      const critId = row.adGroupCriterion?.criterionId;
      const date = row.segments?.date;
      if (!critId || !date || !row.metrics) continue;

      if (!keywordMetrics[critId]) keywordMetrics[critId] = [];
      keywordMetrics[critId].push({
        date,
        spend: Number(row.metrics.costMicros) / 1_000_000,
        impressions: Number(row.metrics.impressions),
        clicks: Number(row.metrics.clicks),
        conversions: Number(row.metrics.conversions),
        revenue: Number(row.metrics.conversionsValue),
      });
    }
  }

  // Fetch audiences
  const audienceData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT user_list.id, user_list.name, user_list.type, user_list.size_for_search, user_list.size_for_display
     FROM user_list`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] audiences fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const audiences: AudienceData[] = [];
  const audTypeMap: Record<string, string> = {
    REMARKETING: 'Remarketing',
    LOGICAL: 'Custom',
    EXTERNAL_REMARKETING: 'Remarketing',
    RULE_BASED: 'Remarketing',
    SIMILAR: 'Lookalike',
    CRM_BASED: 'Custom'
  };

  for (const chunk of audienceData) {
    for (const row of chunk.results ?? []) {
      const ul = row.userList;
      if (!ul || !ul.id || !ul.name) continue;

      let size = Number(ul.sizeForSearch ?? 0);
      if (!size || size === 0) size = Number(ul.sizeForDisplay ?? 0);

      audiences.push({
        external_audience_id: ul.id.toString(),
        name: ul.name,
        type: audTypeMap[ul.type] ?? 'Interest',
        size: size,
      });
    }
  }

  // Fetch audience metrics
  const audienceMetricsData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT ad_group_criterion.user_list.user_list, segments.date,
            metrics.cost_micros, metrics.impressions, metrics.clicks,
            metrics.conversions, metrics.conversions_value
     FROM ad_group_audience_view
     WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] audience metrics fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const audienceMetrics: Record<string, DailyMetric[]> = {};
  for (const chunk of audienceMetricsData) {
    for (const row of chunk.results ?? []) {
      const userListStr = row.adGroupCriterion?.userList?.userList;
      if (!userListStr) continue;

      const ulParts = userListStr.split('/');
      const ulId = ulParts[ulParts.length - 1];

      const date = row.segments?.date;
      if (!ulId || !date || !row.metrics) continue;

      if (!audienceMetrics[ulId]) audienceMetrics[ulId] = [];
      audienceMetrics[ulId].push({
        date,
        spend: Number(row.metrics.costMicros) / 1_000_000,
        impressions: Number(row.metrics.impressions),
        clicks: Number(row.metrics.clicks),
        conversions: Number(row.metrics.conversions),
        revenue: Number(row.metrics.conversionsValue),
      });
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {}, keywords, keywordMetrics, audiences, audienceMetrics };
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
  const map: Record<AdPlatform, (token: string, accountId: string, selectedChildId?: string) => Promise<PlatformSyncResult>> = {
    google: syncGoogle,
    meta: syncMeta as any,
    tiktok: syncTikTok as any,
    pinterest: syncPinterest as any,
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

  const dbCampaignMap: Record<string, string> = {};

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
    dbCampaignMap[extId] = campaignId;

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

  if (result.keywords && result.keywordMetrics) {
    for (const kw of result.keywords) {
      const campaignId = dbCampaignMap[kw.external_campaign_id];
      if (!campaignId) continue;

      // Upsert keyword
      const { data: dbKeyword, error: kwErr } = await supabase
        .from('keywords')
        .upsert({
          organization_id: adAccount.organization_id,
          ad_account_id: adAccount.id,
          campaign_id: campaignId,
          platform: adAccount.platform,
          external_keyword_id: kw.external_keyword_id,
          text: kw.text,
          match_type: kw.match_type,
          status: kw.status,
          quality_score: kw.quality_score,
        }, { onConflict: 'ad_account_id,external_keyword_id' })
        .select('id')
        .single();

      if (kwErr || !dbKeyword) {
        console.error(`[writeResults] keyword upsert failed: ${kw.external_keyword_id}`, kwErr.message);
        continue;
      }

      const dbKwId = dbKeyword.id;

      // Upsert keyword metrics
      const kMetrics = result.keywordMetrics[kw.external_keyword_id] ?? [];
      if (kMetrics.length > 0) {
        const rows = kMetrics.map(m => ({
          keyword_id: dbKwId,
          date: m.date,
          spend: m.spend,
          impressions: m.impressions,
          clicks: m.clicks,
          conversions: m.conversions,
          revenue: m.revenue,
        }));

        const { error: kmErr } = await supabase
          .from('keyword_metrics')
          .upsert(rows, { onConflict: 'keyword_id,date' });

        if (kmErr) {
          console.error(`[writeResults] keyword_metrics upsert failed for keyword ${dbKwId}:`, kmErr.message);
        }
      }
    }
  }

  if (result.audiences && result.audienceMetrics) {
    for (const aud of result.audiences) {
      // Upsert audience
      const { data: dbAudience, error: audErr } = await supabase
        .from('audiences')
        .upsert({
          organization_id: adAccount.organization_id,
          ad_account_id: adAccount.id,
          platform: adAccount.platform,
          external_audience_id: aud.external_audience_id,
          name: aud.name,
          type: aud.type,
          size: aud.size,
        }, { onConflict: 'ad_account_id,external_audience_id' })
        .select('id')
        .single();

      if (audErr || !dbAudience) {
        console.error(`[writeResults] audience upsert failed: ${aud.external_audience_id}`, audErr?.message);
        continue;
      }

      const dbAudId = dbAudience.id as string;

      // Upsert audience metrics
      const aMetrics = result.audienceMetrics[aud.external_audience_id] ?? [];

      // We might have multiple ad groups targeting the same audience, so we need to aggregate by date first.
      const aggMetrics = new Map<string, DailyMetric>();
      for (const m of aMetrics) {
        if (!aggMetrics.has(m.date)) {
          aggMetrics.set(m.date, { ...m });
        } else {
          const existing = aggMetrics.get(m.date)!;
          existing.spend += m.spend;
          existing.impressions += m.impressions;
          existing.clicks += m.clicks;
          existing.conversions += m.conversions;
          existing.revenue += m.revenue;
        }
      }

      const rowsToInsert = Array.from(aggMetrics.values()).map(m => ({
        audience_id: dbAudId,
        date: m.date,
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: m.revenue,
      }));

      if (rowsToInsert.length > 0) {
        const { error: amErr } = await supabase
          .from('audience_metrics')
          .upsert(rowsToInsert, { onConflict: 'audience_id,date' });

        if (amErr) {
          console.error(`[writeResults] audience_metrics upsert failed for audience ${dbAudId}:`, amErr.message);
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
  const syncSecret = Deno.env.get('SYNC_SHARED_SECRET');
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
    .select('id, organization_id, platform, external_account_id, is_active, selected_child_account_id')
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
    // Return 200 so functions.invoke() passes the body to the caller instead of
    // throwing a generic FunctionsFetchError. The caller checks body.error.
    return new Response(JSON.stringify({ success: false, error: message, sync_log_id: syncLogId }), {
      status: 200,
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
    const result = await syncer(accessToken, adAccount.external_account_id, adAccount.selected_child_account_id);
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
