// Ad Platform Types
export type AdPlatform = 'google' | 'meta' | 'tiktok' | 'pinterest' | 'google-analytics' | 'search-console';
export type CampaignStatus = 'active' | 'paused' | 'stopped' | 'archived';
export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type SyncStatus = 'in_progress' | 'completed' | 'failed';
export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days';

// User & Organization
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: Role;
  createdAt: Date;
  user?: User;
  organization?: Organization;
}

// Ad Accounts & Campaigns
export interface AdAccount {
  id: string;
  orgId: string;
  platform: AdPlatform;
  accountId: string;
  accountName: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  platform: AdPlatform;
  status: CampaignStatus;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
}

// Metrics
export interface CampaignMetric {
  id: string;
  campaignId: string;
  orgId: string;
  platform: AdPlatform;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue?: number;
  ctr?: number;
  cpc?: number;
  roas?: number;
  createdAt: Date;
}

export interface HourlyMetric {
  id: string;
  orgId: string;
  platform: AdPlatform;
  date: Date;
  hour: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  createdAt: Date;
}

// Sync & Logs
export interface SyncLog {
  id: string;
  orgId: string;
  accountId: string;
  status: SyncStatus;
  recordsSynced?: number;
  errorMessage?: string;
  startedAt: Date;
  finishedAt?: Date;
}

// Utility Types
export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpa: number;
}

export interface ChartDataPoint {
  day: number;
  google: number;
  meta: number;
  tiktok: number;
  pinterest: number;
}

export interface HourlyDataPoint {
  h: string;
  ctr: number;
}

// Platform Config
export interface PlatformConfig {
  id: AdPlatform | 'all';
  label: string;
  color: string;
  bgColor: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: 'all', label: 'All Platforms', color: '#1A73E8', bgColor: '#EAF1FB' },
  { id: 'google', label: 'Google Ads', color: '#1A73E8', bgColor: '#EAF1FB' },
  { id: 'meta', label: 'Meta Ads', color: '#0866FF', bgColor: '#EBF3FF' },
  { id: 'tiktok', label: 'TikTok Ads', color: '#161823', bgColor: '#F5F5F5' },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', bgColor: '#FFF0F1' },
];

// Status styles for campaigns
export const STATUS_STYLES: Record<CampaignStatus, { bg: string; color: string; dot: string }> = {
  active: { bg: '#E6F4EA', color: '#137333', dot: '#34A853' },
  paused: { bg: '#FEF7E0', color: '#B06000', dot: '#F9AB00' },
  stopped: { bg: '#F1F3F4', color: '#5F6368', dot: '#9AA0A6' },
  archived: { bg: '#F1F3F4', color: '#5F6368', dot: '#9AA0A6' },
};

// Demo data - campaigns
export const DEMO_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Summer Sale 2025', platform: 'google', status: 'active', budget: 5000, spend: 3241, impressions: 842000, clicks: 14200, ctr: 1.69, conversions: 412, roas: 4.2 },
  { id: '2', name: 'Brand Awareness Q3', platform: 'meta', status: 'active', budget: 3500, spend: 2890, impressions: 1240000, clicks: 18600, ctr: 1.50, conversions: 290, roas: 3.8 },
  { id: '3', name: 'Product Launch Reel', platform: 'tiktok', status: 'active', budget: 2000, spend: 1750, impressions: 2100000, clicks: 42000, ctr: 2.00, conversions: 185, roas: 5.1 },
  { id: '4', name: 'Holiday Pins', platform: 'pinterest', status: 'paused', budget: 1200, spend: 890, impressions: 320000, clicks: 5200, ctr: 1.63, conversions: 98, roas: 2.9 },
  { id: '5', name: 'Retargeting — Cart', platform: 'google', status: 'active', budget: 2500, spend: 2100, impressions: 420000, clicks: 9800, ctr: 2.33, conversions: 320, roas: 6.8 },
  { id: '6', name: 'Influencer Collab', platform: 'tiktok', status: 'stopped', budget: 4000, spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, roas: 0 },
  { id: '7', name: 'Spring Collection', platform: 'meta', status: 'active', budget: 3000, spend: 2450, impressions: 980000, clicks: 15700, ctr: 1.60, conversions: 275, roas: 4.5 },
  { id: '8', name: 'Discovery Ads', platform: 'pinterest', status: 'active', budget: 1500, spend: 1100, impressions: 460000, clicks: 7600, ctr: 1.65, conversions: 142, roas: 3.4 },
];

// Seeded pseudo-random number generator for deterministic values (avoids hydration mismatch)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Demo data - 90 days of impressions per platform (supports 7d, 30d, 90d ranges)
export const DEMO_CHART_DATA: ChartDataPoint[] = Array.from({ length: 90 }, (_, i) => ({
  day: i + 1,
  google: Math.round(3200 + Math.sin(i * 0.4) * 800 + seededRandom(i * 4 + 1) * 300),
  meta: Math.round(2800 + Math.cos(i * 0.35) * 700 + seededRandom(i * 4 + 2) * 300),
  tiktok: Math.round(1900 + Math.sin(i * 0.5 + 1) * 600 + seededRandom(i * 4 + 3) * 250),
  pinterest: Math.round(900 + Math.cos(i * 0.6 + 2) * 300 + seededRandom(i * 4 + 4) * 150),
}));

// Demo data - hourly CTR
export const DEMO_HOURLY_DATA: HourlyDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}h`,
  ctr: +(0.8 + Math.sin(i * 0.5) * 0.6 + seededRandom(i * 7) * 0.3).toFixed(2),
}));
