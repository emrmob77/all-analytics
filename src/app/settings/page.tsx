'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgTab } from '@/components/settings/OrgTab';
import { useOrganization } from '@/hooks/useOrganization';

// Lazy-load heavy tab components to keep the initial JS bundle small
const ProfileTab = dynamic(
  () => import('@/components/settings/ProfileTab').then((m) => m.ProfileTab),
  { loading: () => <div className="text-sm text-gray-400 py-8 text-center">Loading profile…</div> },
);
const MembersTab = dynamic(
  () => import('@/components/settings/MembersTab').then((m) => m.MembersTab),
  { loading: () => <div className="text-sm text-gray-400 py-8 text-center">Loading members…</div> },
);
const AdAccountsTab = dynamic(
  () => import('@/components/settings/AdAccountsTab').then((m) => m.AdAccountsTab),
  { loading: () => <div className="text-sm text-gray-400 py-8 text-center">Loading ad accounts…</div> },
);
const NotificationPreferencesTab = dynamic(
  () => import('@/components/settings/NotificationPreferencesTab').then((m) => m.NotificationPreferencesTab),
  { loading: () => <div className="text-sm text-gray-400 py-8 text-center">Loading…</div> },
);

const VALID_TABS = ['profile', 'organization', 'members', 'ad-accounts', 'notifications'] as const;
type TabValue = typeof VALID_TABS[number];

function isValidTab(value: string | null): value is TabValue {
  return VALID_TABS.includes(value as TabValue);
}

// Inner component uses useSearchParams — must be wrapped in <Suspense>
function SettingsContent() {
  const { role } = useOrganization();
  const searchParams = useSearchParams();

  const callerRole = role ?? 'viewer';
  const tabParam = searchParams.get('tab');
  const defaultTab: TabValue = isValidTab(tabParam) ? tabParam : 'members';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="ad-accounts">Ad Accounts</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab />
      </TabsContent>

      <TabsContent value="organization">
        <OrgTab />
      </TabsContent>

      <TabsContent value="members">
        <MembersTab callerRole={callerRole as 'owner' | 'admin' | 'member' | 'viewer'} />
      </TabsContent>

      <TabsContent value="ad-accounts">
        <AdAccountsTab isAdmin={callerRole === 'owner' || callerRole === 'admin'} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationPreferencesTab />
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization and team</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400">
          Loading…
        </div>
      }>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
