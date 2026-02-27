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
  child_ad_account_id?: string;
}

interface AudienceData {
  external_audience_id: string;
  name: string;
  type: string;
  size: number;
  child_ad_account_id?: string;
}

interface AdGroupData {
  external_campaign_id: string;
  external_adgroup_id: string;
  name: string;
  status: string;
  child_ad_account_id?: string;
}

interface SyncPayload {
  ad_account_id: string;
  triggered_by?: 'manual' | 'scheduled';
}

interface SyncExecutionOptions {
  deadlineMs?: number;
}

interface SelectedGoogleAccount {
  id: string;
  name?: string;
  kind?: 'manager' | 'client' | 'direct';
  parent_manager_id?: string;
}

interface CampaignData {
  external_campaign_id: string;
  name: string;
  status: CampaignStatus;
  budget_limit: number;
  budget_used: number;
  currency: string;
  child_ad_account_id?: string;
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
  adgroups?: AdGroupData[];
  adgroupMetrics?: Record<string, DailyMetric[]>; // externalAdgroupId -> metrics
}

const UPSERT_CHUNK_SIZE = 250;
const STALE_SYNC_LOCK_MINUTES = 20;
const SYNC_TIME_BUDGET_MS = 120_000;

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
    adGroup?: {
      id: string;
      name: string;
      status: string;
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

function createEmptySyncResult(): PlatformSyncResult {
  return {
    campaigns: [],
    dailyMetrics: {},
    hourlyMetrics: {},
    keywords: [],
    keywordMetrics: {},
    audiences: [],
    audienceMetrics: {},
    adgroups: [],
    adgroupMetrics: {},
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function assertTimeBudget(deadlineMs: number | undefined, stage: string): void {
  if (!deadlineMs) return;
  if (Date.now() > deadlineMs) {
    throw new Error(`Sync time budget exceeded during ${stage}. Retry will continue from saved state.`);
  }
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

function normalizeSelectedGoogleAccounts(selectedChildIds?: unknown[]): SelectedGoogleAccount[] {
  if (!Array.isArray(selectedChildIds)) return [];

  const normalized: SelectedGoogleAccount[] = [];

  for (const entry of selectedChildIds) {
    if (typeof entry === 'string') {
      const id = entry.replace(/-/g, '').trim();
      if (id) normalized.push({ id, kind: 'client' });
      continue;
    }

    if (!entry || typeof entry !== 'object') continue;

    const record = entry as Record<string, unknown>;
    const rawId = typeof record.id === 'string' ? record.id : '';
    const id = rawId.replace(/-/g, '').trim();
    if (!id) continue;

    const rawKind = typeof record.kind === 'string' ? record.kind : undefined;
    const kind = rawKind === 'manager' || rawKind === 'client' || rawKind === 'direct'
      ? rawKind
      : undefined;

    normalized.push({
      id,
      name: typeof record.name === 'string' ? record.name : undefined,
      kind,
      parent_manager_id: typeof record.parent_manager_id === 'string' ? record.parent_manager_id : undefined,
    });
  }

  const merged = new Map<string, SelectedGoogleAccount>();
  for (const account of normalized) {
    const existing = merged.get(account.id);
    if (!existing) {
      merged.set(account.id, account);
      continue;
    }

    if (existing.kind !== 'manager' && account.kind === 'manager') {
      merged.set(account.id, account);
    }
  }

  return Array.from(merged.values());
}

async function determineLoginCustomerIdForTarget(
  accessToken: string,
  targetCustomerId: string,
  loginCustomerIds: string[],
  devToken: string
): Promise<string | undefined> {
  try {
    await googleAdsSearchStream(accessToken, targetCustomerId, `SELECT customer.id FROM customer LIMIT 1`, devToken);
    return undefined;
  } catch {
    // Requires login-customer-id header.
  }

  for (const loginId of loginCustomerIds) {
    try {
      await googleAdsSearchStream(
        accessToken,
        targetCustomerId,
        `SELECT customer.id FROM customer LIMIT 1`,
        devToken,
        loginId
      );
      return loginId;
    } catch {
      // Try next login customer.
    }
  }

  if (loginCustomerIds.length > 0) {
    console.warn(`[syncGoogle] Could not verify login-customer-id for ${targetCustomerId}. Falling back to ${loginCustomerIds[0]}`);
    return loginCustomerIds[0];
  }

  return undefined;
}

async function resolveManagerChildAccountIds(
  accessToken: string,
  managerId: string,
  loginCustomerIds: string[],
  devToken: string
): Promise<string[]> {
  const loginCustomerId = await determineLoginCustomerIdForTarget(
    accessToken,
    managerId,
    loginCustomerIds,
    devToken
  );

  const childRows = await googleAdsSearchStream(
    accessToken,
    managerId,
    `SELECT customer_client.client_customer
       FROM customer_client
       WHERE customer_client.manager = false
         AND customer_client.status = 'ENABLED'`,
    devToken,
    loginCustomerId
  );

  const childIds = childRows
    .flatMap(chunk => chunk.results ?? [])
    .map(row => row.customerClient?.clientCustomer)
    .filter((value): value is string => Boolean(value))
    .map(resourceName => resourceName.split('/')[1] ?? resourceName)
    .map(id => id.replace(/-/g, '').trim())
    .filter(Boolean);

  return Array.from(new Set(childIds));
}

async function syncGoogle(
  accessToken: string,
  externalAccountId: string,
  selectedChildIds?: unknown[],
  options?: SyncExecutionOptions
): Promise<PlatformSyncResult> {
  assertTimeBudget(options?.deadlineMs, 'google setup');
  if (!selectedChildIds || selectedChildIds.length === 0) {
    console.log('[syncGoogle] No selected child account IDs provided. Skipping sync. Setup is incomplete.');
    return createEmptySyncResult();
  }

  const mergedResult: PlatformSyncResult = {
    campaigns: [],
    dailyMetrics: {},
    hourlyMetrics: {},
    adgroups: [],
    adgroupMetrics: {},
    keywords: [],
    keywordMetrics: {},
    audiences: [],
    audienceMetrics: {},
  };

  const selectedAccounts = normalizeSelectedGoogleAccounts(selectedChildIds);
  if (selectedAccounts.length === 0) {
    console.log('[syncGoogle] No valid selected Google accounts found in selection payload.');
    return createEmptySyncResult();
  }

  const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '';
  if (!devToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
  }

  const loginCustomerIdSet = new Set(
    externalAccountId
    .split(',')
    .map(id => id.replace(/-/g, '').trim())
    .filter(Boolean)
  );

  try {
    const accessibleCustomers = await googleListAccessibleCustomers(accessToken, devToken);
    for (const customerId of accessibleCustomers) {
      const normalized = customerId.replace(/-/g, '').trim();
      if (normalized) loginCustomerIdSet.add(normalized);
    }
  } catch (err) {
    console.warn(
      '[syncGoogle] Failed to extend login customer candidates from accessible customers:',
      err instanceof Error ? err.message : String(err)
    );
  }

  const loginCustomerIds = Array.from(loginCustomerIdSet);

  if (loginCustomerIds.length === 0) {
    throw new Error('No accessible Google Ads customer found for this account.');
  }

  const directOrClientIds = selectedAccounts
    .filter(account => account.kind !== 'manager')
    .map(account => account.id);

  const selectedManagerIds = selectedAccounts
    .filter(account => account.kind === 'manager')
    .map(account => account.id);

  const managerExpandedIds: string[] = [];
  for (const managerId of selectedManagerIds) {
    try {
      const childIds = await resolveManagerChildAccountIds(
        accessToken,
        managerId,
        loginCustomerIds,
        devToken
      );
      if (childIds.length === 0) {
        console.warn(`[syncGoogle] Manager ${managerId} has no enabled client accounts to sync.`);
      }
      managerExpandedIds.push(...childIds);
    } catch (err) {
      console.error(
        `[syncGoogle] Failed to resolve manager children for ${managerId}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  const idsToSync = Array.from(new Set([...directOrClientIds, ...managerExpandedIds]));
  if (idsToSync.length === 0) {
    console.log('[syncGoogle] Selection resolved to 0 syncable client accounts.');
    return createEmptySyncResult();
  }

  for (const childId of idsToSync) {
    assertTimeBudget(options?.deadlineMs, `google child account ${childId}`);
    try {
      console.log(`[syncGoogle] Syncing child account: ${childId}`);
      const result = await syncGoogleSingle(accessToken, externalAccountId, childId, options);

      // Merge results safely
      mergedResult.campaigns.push(...result.campaigns);
      Object.assign(mergedResult.dailyMetrics, result.dailyMetrics);
      Object.assign(mergedResult.hourlyMetrics, result.hourlyMetrics);

      if (result.adgroups && mergedResult.adgroups) mergedResult.adgroups.push(...result.adgroups);
      if (result.adgroupMetrics && mergedResult.adgroupMetrics) Object.assign(mergedResult.adgroupMetrics, result.adgroupMetrics);

      if (result.keywords && mergedResult.keywords) mergedResult.keywords.push(...result.keywords);
      if (result.keywordMetrics && mergedResult.keywordMetrics) Object.assign(mergedResult.keywordMetrics, result.keywordMetrics);

      if (result.audiences && mergedResult.audiences) mergedResult.audiences.push(...result.audiences);
      if (result.audienceMetrics && mergedResult.audienceMetrics) Object.assign(mergedResult.audienceMetrics, result.audienceMetrics);

    } catch (e: any) {
      console.error(`[syncGoogle] Failed to sync child ${childId}:`, e.message);
      // Continue to next child instead of crashing the whole batch
    }
  }

  return mergedResult;
}

async function syncGoogleSingle(
  accessToken: string,
  externalAccountId: string,
  selectedChildId?: string,
  options?: SyncExecutionOptions
): Promise<PlatformSyncResult> {
  assertTimeBudget(options?.deadlineMs, 'google single account setup');
  const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '';
  if (!devToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
  }

  let accountCurrency = 'USD';

  const loginCustomerIdSet = new Set(
    externalAccountId
      .split(',')
      .map(id => id.replace(/-/g, '').trim())
      .filter(Boolean)
  );

  try {
    const accessibleCustomers = await googleListAccessibleCustomers(accessToken, devToken);
    for (const customerId of accessibleCustomers) {
      const normalized = customerId.replace(/-/g, '').trim();
      if (normalized) loginCustomerIdSet.add(normalized);
    }
  } catch (err) {
    console.warn(
      '[syncGoogleSingle] Failed to extend login customer candidates from accessible customers:',
      err instanceof Error ? err.message : String(err)
    );
  }

  const loginCustomerIds = Array.from(loginCustomerIdSet);
  if (loginCustomerIds.length === 0) {
    throw new Error('No accessible Google Ads customer found for this account.');
  }

  let customerId = selectedChildId || loginCustomerIds[0];
  let correctLoginCustomerId: string | undefined = undefined;

  // Let's determine the correct login-customer-id and find the active account if we need to
  if (selectedChildId) {
    console.log(`[syncGoogle] Attempting to find correct login-customer-id for explicitly selected child ${customerId}`);
    correctLoginCustomerId = await determineLoginCustomerIdForTarget(
      accessToken,
      customerId,
      loginCustomerIds,
      devToken
    );
  } else {
    // If no child was explicitly selected, we find the first manager account and get its first child. 
    // Or if it's not a manager, just use it.
    let resolved = false;
    for (const loginId of loginCustomerIds) {
      try {
        const res = await googleAdsSearchStream(
          accessToken,
          loginId,
          `SELECT customer.manager FROM customer LIMIT 1`,
          devToken,
          undefined // Using itself as login customer ID or undefined
        );
        const isManager = res[0]?.results?.[0]?.customer?.manager === true;

        if (isManager) {
          correctLoginCustomerId = loginId;
          // Find first child
          const childrenRes = await googleAdsSearchStream(
            accessToken,
            loginId,
            `SELECT customer_client.client_customer FROM customer_client WHERE customer_client.manager = false AND customer_client.status = 'ENABLED' LIMIT 1`,
            devToken,
            correctLoginCustomerId
          );
          const clientCustomerName = childrenRes[0]?.results?.[0]?.customerClient?.clientCustomer;
          if (clientCustomerName) {
            customerId = clientCustomerName.split('/')[1] ?? clientCustomerName;
            resolved = true;
            break;
          }
        } else {
          customerId = loginId;
          correctLoginCustomerId = undefined;
          resolved = true;
          break;
        }
      } catch (e) {
        // keep trying next
      }
    }
    if (!resolved) {
      customerId = loginCustomerIds[0];
    }
  }

  const loginCustomerId = correctLoginCustomerId;
  console.log(`[syncGoogle] Final target customerId: ${customerId}, loginCustomerId: ${loginCustomerId || 'none'}`);
  assertTimeBudget(options?.deadlineMs, 'google currency lookup');
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
  assertTimeBudget(options?.deadlineMs, 'google campaigns fetch');
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
      child_ad_account_id: customerId,
    });
  }

  // Fetch daily metrics (last 30 days)
  assertTimeBudget(options?.deadlineMs, 'google campaign metrics fetch');
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
  assertTimeBudget(options?.deadlineMs, 'google keywords fetch');
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
        child_ad_account_id: customerId,
      });
    }
  }

  // Fetch keyword metrics
  assertTimeBudget(options?.deadlineMs, 'google keyword metrics fetch');
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
  assertTimeBudget(options?.deadlineMs, 'google audiences fetch');
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
        child_ad_account_id: customerId,
      });
    }
  }

  // Fetch audience metrics
  assertTimeBudget(options?.deadlineMs, 'google audience metrics fetch');
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

  // Fetch adgroups
  assertTimeBudget(options?.deadlineMs, 'google adgroups fetch');
  const adgroupData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT campaign.id, ad_group.id, ad_group.name, ad_group.status
     FROM ad_group
     WHERE ad_group.status != 'REMOVED'`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] adgroups fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const adgroups: AdGroupData[] = [];
  const adgroupStatusMap: Record<string, string> = {
    ENABLED: 'active', PAUSED: 'paused', REMOVED: 'stopped'
  };

  for (const chunk of adgroupData) {
    for (const row of chunk.results ?? []) {
      const campId = row.campaign?.id;
      const ag = row.adGroup;
      if (!campId || !ag || !ag.id) continue;

      adgroups.push({
        external_campaign_id: campId,
        external_adgroup_id: ag.id,
        name: ag.name,
        status: adgroupStatusMap[ag.status] ?? 'paused',
        child_ad_account_id: customerId,
      });
    }
  }

  // Fetch adgroup metrics
  assertTimeBudget(options?.deadlineMs, 'google adgroup metrics fetch');
  const adgroupMetricsData = await googleAdsSearchStream(
    accessToken,
    customerId,
    `SELECT ad_group.id, segments.date, metrics.cost_micros, metrics.impressions,
            metrics.clicks, metrics.conversions, metrics.conversions_value
     FROM ad_group
     WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`,
    devToken,
    loginCustomerId
  ).catch(err => {
    console.warn('[syncGoogle] adgroup metrics fetch failed:', err.message);
    return [] as GoogleAdsSearchChunk[];
  });

  const adgroupMetrics: Record<string, DailyMetric[]> = {};
  for (const chunk of adgroupMetricsData) {
    for (const row of chunk.results ?? []) {
      const agId = row.adGroup?.id;
      const date = row.segments?.date;
      if (!agId || !date || !row.metrics) continue;

      if (!adgroupMetrics[agId]) adgroupMetrics[agId] = [];
      adgroupMetrics[agId].push({
        date,
        spend: Number(row.metrics.costMicros) / 1_000_000,
        impressions: Number(row.metrics.impressions),
        clicks: Number(row.metrics.clicks),
        conversions: Number(row.metrics.conversions),
        revenue: Number(row.metrics.conversionsValue),
      });
    }
  }

  return { campaigns, dailyMetrics, hourlyMetrics: {}, keywords, keywordMetrics, audiences, audienceMetrics, adgroups, adgroupMetrics };
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

type PlatformSyncer = (
  accessToken: string,
  externalAccountId: string,
  selectedChildIds?: unknown[],
  options?: SyncExecutionOptions
) => Promise<PlatformSyncResult>;

function getPlatformSyncer(platform: AdPlatform): PlatformSyncer {
  const map: Record<AdPlatform, PlatformSyncer> = {
    google: syncGoogle,
    meta: (token, accountId) => syncMeta(token, accountId),
    tiktok: (token, accountId) => syncTikTok(token, accountId),
    pinterest: (token, accountId) => syncPinterest(token, accountId),
  };
  return map[platform];
}

// ---------------------------------------------------------------------------
// DB writes
// ---------------------------------------------------------------------------

async function writeResults(
  supabase: ReturnType<typeof createClient>,
  adAccount: { id: string; organization_id: string; platform: AdPlatform; external_account_id: string },
  result: PlatformSyncResult,
  options?: SyncExecutionOptions
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
  const dbCampaignMap: Record<string, string> = {};

  const uniqueCampaigns = Array.from(
    new Map(result.campaigns.map(campaign => [campaign.external_campaign_id, campaign])).values()
  );

  const campaignRows = uniqueCampaigns.map(campaign => ({
    organization_id: adAccount.organization_id,
    ad_account_id: adAccount.id,
    platform: adAccount.platform,
    external_campaign_id: campaign.external_campaign_id,
    name: campaign.name,
    status: campaign.status,
    budget_limit: campaign.budget_limit,
    budget_used: campaign.budget_used,
    currency: campaign.currency,
    child_ad_account_id: campaign.child_ad_account_id,
  }));

  type CampaignIdRow = { id: string; external_campaign_id: string };
  for (const chunk of chunkArray(campaignRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'campaign upsert');
    const { data, error } = await supabase
      .from('campaigns')
      .upsert(chunk, { onConflict: 'ad_account_id,external_campaign_id' })
      .select('id, external_campaign_id');

    if (error) {
      console.error('[writeResults] campaign batch upsert failed:', error.message);
      continue;
    }

    for (const row of ((data ?? []) as CampaignIdRow[])) {
      dbCampaignMap[row.external_campaign_id] = row.id;
    }
  }

  const unresolvedCampaignIds = uniqueCampaigns
    .map(campaign => campaign.external_campaign_id)
    .filter(externalId => !dbCampaignMap[externalId]);

  for (const chunk of chunkArray(unresolvedCampaignIds, UPSERT_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, external_campaign_id')
      .eq('ad_account_id', adAccount.id)
      .in('external_campaign_id', chunk);

    if (error) {
      console.error('[writeResults] campaign id fetch failed:', error.message);
      continue;
    }

    for (const row of ((data ?? []) as CampaignIdRow[])) {
      dbCampaignMap[row.external_campaign_id] = row.id;
    }
  }

  const campaignDailyAgg = new Map<string, {
    campaign_id: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>();

  for (const [externalCampaignId, metrics] of Object.entries(result.dailyMetrics)) {
    const campaignId = dbCampaignMap[externalCampaignId];
    if (!campaignId) continue;

    for (const metric of metrics) {
      const key = `${campaignId}:${metric.date}`;
      const existing = campaignDailyAgg.get(key);
      if (!existing) {
        campaignDailyAgg.set(key, {
          campaign_id: campaignId,
          date: metric.date,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
          revenue: metric.revenue,
        });
      } else {
        existing.spend += metric.spend;
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.conversions += metric.conversions;
        existing.revenue += metric.revenue;
      }
    }
  }

  const campaignDailyRows = Array.from(campaignDailyAgg.values());
  for (const chunk of chunkArray(campaignDailyRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'campaign_metrics upsert');
    const { error } = await supabase
      .from('campaign_metrics')
      .upsert(chunk, { onConflict: 'campaign_id,date' });
    if (error) {
      console.error('[writeResults] campaign_metrics batch upsert failed:', error.message);
    }
  }

  const campaignHourlyAgg = new Map<string, {
    campaign_id: string;
    hour: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>();

  for (const [externalCampaignId, metrics] of Object.entries(result.hourlyMetrics)) {
    const campaignId = dbCampaignMap[externalCampaignId];
    if (!campaignId) continue;

    for (const metric of metrics) {
      if (metric.hour < sevenDaysAgo) continue;

      const key = `${campaignId}:${metric.hour}`;
      const existing = campaignHourlyAgg.get(key);
      if (!existing) {
        campaignHourlyAgg.set(key, {
          campaign_id: campaignId,
          hour: metric.hour,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
        });
      } else {
        existing.spend += metric.spend;
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.conversions += metric.conversions;
      }
    }
  }

  const campaignHourlyRows = Array.from(campaignHourlyAgg.values());
  for (const chunk of chunkArray(campaignHourlyRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'hourly_metrics upsert');
    const { error } = await supabase
      .from('hourly_metrics')
      .upsert(chunk, { onConflict: 'campaign_id,hour' });
    if (error) {
      console.error('[writeResults] hourly_metrics batch upsert failed:', error.message);
    }
  }

  const keywordIdMap: Record<string, string> = {};
  const keywords = result.keywords ?? [];

  if (keywords.length > 0) {
    const keywordRowsByExternal = new Map<string, {
      organization_id: string;
      ad_account_id: string;
      campaign_id: string;
      platform: AdPlatform;
      external_keyword_id: string;
      text: string;
      match_type: KeywordMatchType;
      status: KeywordStatus;
      quality_score?: number;
      child_ad_account_id?: string;
    }>();

    for (const keyword of keywords) {
      const campaignId = dbCampaignMap[keyword.external_campaign_id];
      if (!campaignId) continue;

      const existing = keywordRowsByExternal.get(keyword.external_keyword_id);
      if (existing && existing.campaign_id !== campaignId) {
        console.warn(
          `[writeResults] duplicate keyword ${keyword.external_keyword_id} mapped to multiple campaigns in one sync; latest row wins`
        );
      }

      keywordRowsByExternal.set(keyword.external_keyword_id, {
        organization_id: adAccount.organization_id,
        ad_account_id: adAccount.id,
        campaign_id: campaignId,
        platform: adAccount.platform,
        external_keyword_id: keyword.external_keyword_id,
        text: keyword.text,
        match_type: keyword.match_type,
        status: keyword.status,
        quality_score: keyword.quality_score,
        child_ad_account_id: keyword.child_ad_account_id,
      });
    }

    type KeywordIdRow = { id: string; external_keyword_id: string };
    const keywordRows = Array.from(keywordRowsByExternal.values());
    for (const chunk of chunkArray(keywordRows, UPSERT_CHUNK_SIZE)) {
      assertTimeBudget(options?.deadlineMs, 'keywords upsert');
      const { data, error } = await supabase
        .from('keywords')
        .upsert(chunk, { onConflict: 'ad_account_id,external_keyword_id' })
        .select('id, external_keyword_id');
      if (error) {
        console.error('[writeResults] keywords batch upsert failed:', error.message);
        continue;
      }
      for (const row of ((data ?? []) as KeywordIdRow[])) {
        keywordIdMap[row.external_keyword_id] = row.id;
      }
    }

    const unresolvedKeywordIds = keywordRows
      .map(row => row.external_keyword_id)
      .filter(externalId => !keywordIdMap[externalId]);

    for (const chunk of chunkArray(unresolvedKeywordIds, UPSERT_CHUNK_SIZE)) {
      const { data, error } = await supabase
        .from('keywords')
        .select('id, external_keyword_id')
        .eq('ad_account_id', adAccount.id)
        .in('external_keyword_id', chunk);
      if (error) {
        console.error('[writeResults] keyword id fetch failed:', error.message);
        continue;
      }
      for (const row of ((data ?? []) as KeywordIdRow[])) {
        keywordIdMap[row.external_keyword_id] = row.id;
      }
    }
  }

  const keywordMetricAgg = new Map<string, {
    keyword_id: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>();

  for (const [externalKeywordId, metrics] of Object.entries(result.keywordMetrics ?? {})) {
    const keywordId = keywordIdMap[externalKeywordId];
    if (!keywordId) continue;

    for (const metric of metrics) {
      const key = `${keywordId}:${metric.date}`;
      const existing = keywordMetricAgg.get(key);
      if (!existing) {
        keywordMetricAgg.set(key, {
          keyword_id: keywordId,
          date: metric.date,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
          revenue: metric.revenue,
        });
      } else {
        existing.spend += metric.spend;
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.conversions += metric.conversions;
        existing.revenue += metric.revenue;
      }
    }
  }

  const keywordMetricRows = Array.from(keywordMetricAgg.values());
  for (const chunk of chunkArray(keywordMetricRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'keyword_metrics upsert');
    const { error } = await supabase
      .from('keyword_metrics')
      .upsert(chunk, { onConflict: 'keyword_id,date' });
    if (error) {
      console.error('[writeResults] keyword_metrics batch upsert failed:', error.message);
    }
  }

  const audienceIdMap: Record<string, string> = {};
  const audiences = result.audiences ?? [];
  if (audiences.length > 0) {
    const audienceRowsByExternal = new Map<string, {
      organization_id: string;
      ad_account_id: string;
      platform: AdPlatform;
      external_audience_id: string;
      name: string;
      type: string;
      size: number;
      child_ad_account_id?: string;
    }>();

    for (const audience of audiences) {
      audienceRowsByExternal.set(audience.external_audience_id, {
        organization_id: adAccount.organization_id,
        ad_account_id: adAccount.id,
        platform: adAccount.platform,
        external_audience_id: audience.external_audience_id,
        name: audience.name,
        type: audience.type,
        size: audience.size,
        child_ad_account_id: audience.child_ad_account_id,
      });
    }

    type AudienceIdRow = { id: string; external_audience_id: string };
    const audienceRows = Array.from(audienceRowsByExternal.values());
    for (const chunk of chunkArray(audienceRows, UPSERT_CHUNK_SIZE)) {
      assertTimeBudget(options?.deadlineMs, 'audiences upsert');
      const { data, error } = await supabase
        .from('audiences')
        .upsert(chunk, { onConflict: 'ad_account_id,external_audience_id' })
        .select('id, external_audience_id');
      if (error) {
        console.error('[writeResults] audiences batch upsert failed:', error.message);
        continue;
      }
      for (const row of ((data ?? []) as AudienceIdRow[])) {
        audienceIdMap[row.external_audience_id] = row.id;
      }
    }
  }

  const audienceMetricAgg = new Map<string, {
    audience_id: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>();

  for (const [externalAudienceId, metrics] of Object.entries(result.audienceMetrics ?? {})) {
    const audienceId = audienceIdMap[externalAudienceId];
    if (!audienceId) continue;

    for (const metric of metrics) {
      const key = `${audienceId}:${metric.date}`;
      const existing = audienceMetricAgg.get(key);
      if (!existing) {
        audienceMetricAgg.set(key, {
          audience_id: audienceId,
          date: metric.date,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
          revenue: metric.revenue,
        });
      } else {
        existing.spend += metric.spend;
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.conversions += metric.conversions;
        existing.revenue += metric.revenue;
      }
    }
  }

  const audienceMetricRows = Array.from(audienceMetricAgg.values());
  for (const chunk of chunkArray(audienceMetricRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'audience_metrics upsert');
    const { error } = await supabase
      .from('audience_metrics')
      .upsert(chunk, { onConflict: 'audience_id,date' });
    if (error) {
      console.error('[writeResults] audience_metrics batch upsert failed:', error.message);
    }
  }

  const adgroupIdMap: Record<string, string> = {};
  const adgroups = result.adgroups ?? [];
  if (adgroups.length > 0) {
    const adgroupRowsByExternal = new Map<string, {
      organization_id: string;
      ad_account_id: string;
      campaign_id: string;
      platform: AdPlatform;
      external_adgroup_id: string;
      name: string;
      status: string;
      child_ad_account_id?: string;
    }>();

    for (const adgroup of adgroups) {
      const campaignId = dbCampaignMap[adgroup.external_campaign_id];
      if (!campaignId) continue;
      adgroupRowsByExternal.set(adgroup.external_adgroup_id, {
        organization_id: adAccount.organization_id,
        ad_account_id: adAccount.id,
        campaign_id: campaignId,
        platform: adAccount.platform,
        external_adgroup_id: adgroup.external_adgroup_id,
        name: adgroup.name,
        status: adgroup.status,
        child_ad_account_id: adgroup.child_ad_account_id,
      });
    }

    type AdgroupIdRow = { id: string; external_adgroup_id: string };
    const adgroupRows = Array.from(adgroupRowsByExternal.values());
    for (const chunk of chunkArray(adgroupRows, UPSERT_CHUNK_SIZE)) {
      assertTimeBudget(options?.deadlineMs, 'adgroups upsert');
      const { data, error } = await supabase
        .from('adgroups')
        .upsert(chunk, { onConflict: 'ad_account_id,external_adgroup_id' })
        .select('id, external_adgroup_id');
      if (error) {
        console.error('[writeResults] adgroups batch upsert failed:', error.message);
        continue;
      }
      for (const row of ((data ?? []) as AdgroupIdRow[])) {
        adgroupIdMap[row.external_adgroup_id] = row.id;
      }
    }
  }

  const adgroupMetricAgg = new Map<string, {
    adgroup_id: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>();

  for (const [externalAdgroupId, metrics] of Object.entries(result.adgroupMetrics ?? {})) {
    const adgroupId = adgroupIdMap[externalAdgroupId];
    if (!adgroupId) continue;

    for (const metric of metrics) {
      const key = `${adgroupId}:${metric.date}`;
      const existing = adgroupMetricAgg.get(key);
      if (!existing) {
        adgroupMetricAgg.set(key, {
          adgroup_id: adgroupId,
          date: metric.date,
          spend: metric.spend,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
          revenue: metric.revenue,
        });
      } else {
        existing.spend += metric.spend;
        existing.impressions += metric.impressions;
        existing.clicks += metric.clicks;
        existing.conversions += metric.conversions;
        existing.revenue += metric.revenue;
      }
    }
  }

  const adgroupMetricRows = Array.from(adgroupMetricAgg.values());
  for (const chunk of chunkArray(adgroupMetricRows, UPSERT_CHUNK_SIZE)) {
    assertTimeBudget(options?.deadlineMs, 'adgroup_metrics upsert');
    const { error } = await supabase
      .from('adgroup_metrics')
      .upsert(chunk, { onConflict: 'adgroup_id,date' });
    if (error) {
      console.error('[writeResults] adgroup_metrics batch upsert failed:', error.message);
    }
  }

  assertTimeBudget(options?.deadlineMs, 'last_synced_at update');
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
    .select('id, organization_id, platform, external_account_id, is_active, selected_child_accounts')
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

  // Mark stale in-progress logs as failed so they do not block future syncs forever.
  const staleThresholdIso = new Date(
    Date.now() - STALE_SYNC_LOCK_MINUTES * 60_000
  ).toISOString();
  await supabase
    .from('sync_logs')
    .update({
      status: 'failed',
      error_message: 'Auto-failed stale in-progress sync lock',
      completed_at: new Date().toISOString(),
    })
    .eq('ad_account_id', adAccount.id)
    .eq('status', 'in_progress')
    .is('completed_at', null)
    .lt('started_at', staleThresholdIso);

  // Refuse concurrent sync runs for the same ad account.
  const { data: activeSyncLog } = await supabase
    .from('sync_logs')
    .select('id')
    .eq('ad_account_id', adAccount.id)
    .eq('status', 'in_progress')
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSyncLog?.id) {
    return new Response(JSON.stringify({
      success: false,
      sync_log_id: activeSyncLog.id,
      error: 'A sync is already in progress for this ad account. Please wait for it to finish.',
    }), {
      status: 200,
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
    const logErrorCode = (logErr as { code?: string } | null)?.code;
    if (logErrorCode === '23505') {
      const { data: lockedLog } = await supabase
        .from('sync_logs')
        .select('id')
        .eq('ad_account_id', adAccount.id)
        .eq('status', 'in_progress')
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return new Response(JSON.stringify({
        success: false,
        sync_log_id: lockedLog?.id ?? null,
        error: 'A sync is already in progress for this ad account. Please wait for it to finish.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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
    const executionOptions: SyncExecutionOptions = {
      deadlineMs: Date.now() + SYNC_TIME_BUDGET_MS,
    };
    const syncer = getPlatformSyncer(adAccount.platform as AdPlatform);
    if (!syncer) {
      return failSync(`Unsupported platform: ${adAccount.platform}`);
    }
    const result = await syncer(
      accessToken,
      adAccount.external_account_id,
      adAccount.selected_child_accounts,
      executionOptions
    );
    await writeResults(
      supabase,
      adAccount as { id: string; organization_id: string; platform: AdPlatform; external_account_id: string },
      result,
      executionOptions
    );

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
