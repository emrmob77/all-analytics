// Ad Platform Types
export type AdPlatform = 'google' | 'meta' | 'tiktok' | 'pinterest';
export type CampaignStatus = 'active' | 'paused' | 'archived' | 'deleted';
export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type SyncStatus = 'in_progress' | 'completed' | 'failed';
export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

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
  orgId: string;
  accountId: string;
  platform: AdPlatform;
  externalId: string;
  name: string;
  status: CampaignStatus;
  objective?: string;
  budget?: number;
  budgetType?: 'daily' | 'lifetime';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface ChartData {
  date: string;
  [key: string]: string | number;
}

// Platform Config
export interface PlatformConfig {
  id: AdPlatform;
  label: string;
  color: string;
  bgColor: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: 'google', label: 'Google Ads', color: '#1A73E8', bgColor: '#EAF1FB' },
  { id: 'meta', label: 'Meta Ads', color: '#0866FF', bgColor: '#EBF3FF' },
  { id: 'tiktok', label: 'TikTok Ads', color: '#161823', bgColor: '#F5F5F5' },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', bgColor: '#FFF0F1' },
];
