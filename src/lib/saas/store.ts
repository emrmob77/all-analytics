import { randomUUID } from "crypto";

export type TeamRole = "owner" | "admin" | "member" | "viewer";
export type TeamInviteStatus = "pending" | "accepted" | "expired";
export type SupportPriority = "low" | "medium" | "high";
export type SupportStatus = "open" | "in_progress" | "resolved";

export interface UserProfileSettings {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  language: string;
  timezone: string;
  locale: string;
  role: TeamRole;
  updatedAt: string;
}

export interface WorkspaceSettings {
  tenantId: string;
  name: string;
  logoUrl: string;
  defaultCurrency: string;
  dataRetentionDays: number;
  exportFormat: "csv" | "xlsx" | "json";
  permissionDefaults: TeamRole;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  status: TeamInviteStatus;
  createdAt: string;
}

export interface IntegrationSetting {
  id: string;
  providerKey: string;
  providerName: string;
  authMode: "oauth2" | "api_key" | "service_account";
  lifecycleState: "connected" | "syncing" | "paused" | "failed";
  syncFrequency: "hourly" | "daily";
  lastSyncAt: string | null;
  scopes: string[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: "technical" | "billing" | "integration" | "general";
  priority: SupportPriority;
  description: string;
  status: SupportStatus;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface OnboardingState {
  tenantId: string;
  completed: boolean;
  currentStep: "workspace" | "integration" | "kpi" | "done";
  connectedPlatforms: string[];
  selectedKpis: string[];
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

const userProfileStore = new Map<string, UserProfileSettings>();
const workspaceStore = new Map<string, WorkspaceSettings>();
const teamMemberStore = new Map<string, TeamMember[]>();
const teamInviteStore = new Map<string, TeamInvite[]>();
const integrationSettingStore = new Map<string, IntegrationSetting[]>();
const supportTicketStore = new Map<string, SupportTicket[]>();
const onboardingStore = new Map<string, OnboardingState>();

const knowledgeBaseStore: KnowledgeArticle[] = [
  {
    id: `kb_${randomUUID()}`,
    title: "How to reconnect an expired OAuth integration",
    summary: "Step-by-step OAuth reconnect procedure with scope verification.",
    body: "Open Integrations > select provider > click Reconnect > confirm scopes > run Test Connection.",
    tags: ["oauth", "integrations", "troubleshooting"]
  },
  {
    id: `kb_${randomUUID()}`,
    title: "Understanding ROAS drop alerts",
    summary: "How threshold alerts are computed and how to tune sensitivity.",
    body: "ROAS alerts compare current rolling window with baseline values. Configure threshold in Notification Preferences.",
    tags: ["notifications", "performance", "alerts"]
  },
  {
    id: `kb_${randomUUID()}`,
    title: "Billing and invoice export",
    summary: "Download invoice history and update your payment method.",
    body: "Go to Billing > Open portal > Payment methods > Invoices.",
    tags: ["billing", "invoices"]
  }
];

const defaultTenantId = "brand-1";
const defaultUserId = "user_demo_1";

userProfileStore.set(defaultUserId, {
  id: defaultUserId,
  firstName: "Esra",
  lastName: "Bayatli",
  email: "owner@allanalytics.app",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80&fm=webp",
  language: "en",
  timezone: "Europe/Istanbul",
  locale: "en-US",
  role: "owner",
  updatedAt: nowIso()
});

workspaceStore.set(defaultTenantId, {
  tenantId: defaultTenantId,
  name: "Allanalytics Workspace",
  logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/1f4ca.svg",
  defaultCurrency: "USD",
  dataRetentionDays: 365,
  exportFormat: "csv",
  permissionDefaults: "member",
  updatedAt: nowIso()
});

teamMemberStore.set(defaultTenantId, [
  {
    id: `member_${randomUUID()}`,
    name: "Esra Bayatli",
    email: "owner@allanalytics.app",
    role: "owner",
    status: "active",
    joinedAt: nowIso()
  },
  {
    id: `member_${randomUUID()}`,
    name: "Emre Aksoy",
    email: "emre@allanalytics.app",
    role: "admin",
    status: "active",
    joinedAt: nowIso()
  },
  {
    id: `member_${randomUUID()}`,
    name: "Mina Oz",
    email: "mina@allanalytics.app",
    role: "member",
    status: "active",
    joinedAt: nowIso()
  }
]);

teamInviteStore.set(defaultTenantId, [
  {
    id: `invite_${randomUUID()}`,
    email: "candidate@allanalytics.app",
    role: "member",
    status: "pending",
    createdAt: nowIso()
  }
]);

integrationSettingStore.set(defaultTenantId, [
  {
    id: `integration_${randomUUID()}`,
    providerKey: "google-ads",
    providerName: "Google Ads",
    authMode: "oauth2",
    lifecycleState: "connected",
    syncFrequency: "hourly",
    lastSyncAt: nowIso(),
    scopes: ["ads.read", "campaign.read"]
  },
  {
    id: `integration_${randomUUID()}`,
    providerKey: "meta-ads",
    providerName: "Meta Ads",
    authMode: "oauth2",
    lifecycleState: "syncing",
    syncFrequency: "hourly",
    lastSyncAt: nowIso(),
    scopes: ["ads_management", "read_insights"]
  },
  {
    id: `integration_${randomUUID()}`,
    providerKey: "shopify",
    providerName: "Shopify",
    authMode: "api_key",
    lifecycleState: "paused",
    syncFrequency: "daily",
    lastSyncAt: null,
    scopes: ["orders.read", "products.read"]
  }
]);

supportTicketStore.set(defaultTenantId, [
  {
    id: `ticket_${randomUUID()}`,
    subject: "GA4 attribution mismatch",
    category: "technical",
    priority: "high",
    description: "GA4 revenue differs from dashboard by 3.4%",
    status: "in_progress",
    createdAt: nowIso()
  },
  {
    id: `ticket_${randomUUID()}`,
    subject: "Need invoice for January",
    category: "billing",
    priority: "low",
    description: "Please re-send invoice PDF",
    status: "resolved",
    createdAt: nowIso()
  }
]);

onboardingStore.set(defaultTenantId, {
  tenantId: defaultTenantId,
  completed: false,
  currentStep: "workspace",
  connectedPlatforms: [],
  selectedKpis: [],
  updatedAt: nowIso()
});

function getUserProfile(userId = defaultUserId) {
  return userProfileStore.get(userId) ?? null;
}

function updateUserProfile(userId: string, updates: Partial<UserProfileSettings>) {
  const current = userProfileStore.get(userId);

  if (!current) {
    return null;
  }

  const next: UserProfileSettings = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: nowIso()
  };

  userProfileStore.set(userId, next);
  return next;
}

function getWorkspaceSettings(tenantId = defaultTenantId) {
  return workspaceStore.get(tenantId) ?? null;
}

function updateWorkspaceSettings(tenantId: string, updates: Partial<WorkspaceSettings>) {
  const current = workspaceStore.get(tenantId);

  if (!current) {
    return null;
  }

  const next: WorkspaceSettings = {
    ...current,
    ...updates,
    tenantId: current.tenantId,
    updatedAt: nowIso()
  };

  workspaceStore.set(tenantId, next);
  return next;
}

function listTeamMembers(tenantId = defaultTenantId) {
  return teamMemberStore.get(tenantId) ?? [];
}

function listTeamInvites(tenantId = defaultTenantId) {
  return teamInviteStore.get(tenantId) ?? [];
}

function inviteTeamMember(input: { tenantId: string; email: string; role: TeamRole }) {
  const currentInvites = teamInviteStore.get(input.tenantId) ?? [];
  const invite: TeamInvite = {
    id: `invite_${randomUUID()}`,
    email: input.email,
    role: input.role,
    status: "pending",
    createdAt: nowIso()
  };

  teamInviteStore.set(input.tenantId, [invite, ...currentInvites]);
  return invite;
}

function updateTeamMemberRole(input: { tenantId: string; memberId: string; role: TeamRole }) {
  const members = teamMemberStore.get(input.tenantId) ?? [];

  const nextMembers = members.map((member) =>
    member.id === input.memberId
      ? {
          ...member,
          role: input.role
        }
      : member
  );

  teamMemberStore.set(input.tenantId, nextMembers);
  return nextMembers.find((member) => member.id === input.memberId) ?? null;
}

function removeTeamMember(input: { tenantId: string; memberId: string }) {
  const members = teamMemberStore.get(input.tenantId) ?? [];
  const nextMembers = members.filter((member) => member.id !== input.memberId);

  teamMemberStore.set(input.tenantId, nextMembers);
  return members.length !== nextMembers.length;
}

function listIntegrationSettings(tenantId = defaultTenantId) {
  return integrationSettingStore.get(tenantId) ?? [];
}

function updateIntegrationSettings(input: {
  tenantId: string;
  integrationId: string;
  lifecycleState?: IntegrationSetting["lifecycleState"];
  syncFrequency?: IntegrationSetting["syncFrequency"];
}) {
  const integrations = integrationSettingStore.get(input.tenantId) ?? [];

  const nextIntegrations = integrations.map((integration) =>
    integration.id === input.integrationId
      ? {
          ...integration,
          lifecycleState: input.lifecycleState ?? integration.lifecycleState,
          syncFrequency: input.syncFrequency ?? integration.syncFrequency,
          lastSyncAt:
            input.lifecycleState === "connected" || input.lifecycleState === "syncing"
              ? nowIso()
              : integration.lastSyncAt
        }
      : integration
  );

  integrationSettingStore.set(input.tenantId, nextIntegrations);

  return nextIntegrations.find((integration) => integration.id === input.integrationId) ?? null;
}

function listSupportTickets(tenantId = defaultTenantId) {
  return supportTicketStore.get(tenantId) ?? [];
}

function createSupportTicket(input: {
  tenantId: string;
  subject: string;
  category: SupportTicket["category"];
  priority: SupportPriority;
  description: string;
}) {
  const ticket: SupportTicket = {
    id: `ticket_${randomUUID()}`,
    subject: input.subject,
    category: input.category,
    priority: input.priority,
    description: input.description,
    status: "open",
    createdAt: nowIso()
  };

  const existing = supportTicketStore.get(input.tenantId) ?? [];
  supportTicketStore.set(input.tenantId, [ticket, ...existing]);

  return ticket;
}

function listKnowledgeArticles(query?: string) {
  const normalized = query?.trim().toLowerCase();

  if (!normalized) {
    return knowledgeBaseStore;
  }

  return knowledgeBaseStore.filter((article) => {
    if (article.title.toLowerCase().includes(normalized)) return true;
    if (article.summary.toLowerCase().includes(normalized)) return true;
    return article.tags.some((tag) => tag.toLowerCase().includes(normalized));
  });
}

function getOnboardingState(tenantId = defaultTenantId) {
  return onboardingStore.get(tenantId) ?? null;
}

function upsertOnboardingState(input: {
  tenantId: string;
  currentStep?: OnboardingState["currentStep"];
  connectedPlatforms?: string[];
  selectedKpis?: string[];
  completed?: boolean;
}) {
  const current = onboardingStore.get(input.tenantId) ?? {
    tenantId: input.tenantId,
    completed: false,
    currentStep: "workspace" as const,
    connectedPlatforms: [],
    selectedKpis: [],
    updatedAt: nowIso()
  };

  const next: OnboardingState = {
    ...current,
    currentStep: input.currentStep ?? current.currentStep,
    connectedPlatforms: input.connectedPlatforms ?? current.connectedPlatforms,
    selectedKpis: input.selectedKpis ?? current.selectedKpis,
    completed: input.completed ?? current.completed,
    updatedAt: nowIso()
  };

  onboardingStore.set(input.tenantId, next);
  return next;
}

function getDefaultTenantId() {
  return defaultTenantId;
}

function getDefaultUserId() {
  return defaultUserId;
}

export {
  createSupportTicket,
  getDefaultTenantId,
  getDefaultUserId,
  getOnboardingState,
  getUserProfile,
  getWorkspaceSettings,
  inviteTeamMember,
  listIntegrationSettings,
  listKnowledgeArticles,
  listSupportTickets,
  listTeamInvites,
  listTeamMembers,
  removeTeamMember,
  updateIntegrationSettings,
  updateTeamMemberRole,
  updateUserProfile,
  updateWorkspaceSettings,
  upsertOnboardingState
};
