'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from '@/components/settings/MembersTab';
import { AdAccountsTab } from '@/components/settings/AdAccountsTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { OrgTab } from '@/components/settings/OrgTab';
import { NotificationPreferencesTab } from '@/components/settings/NotificationPreferencesTab';
import { useOrganization } from '@/hooks/useOrganization';

const VALID_TABS = ['profile', 'organization', 'members', 'ad-accounts', 'notifications'] as const;
type TabValue = typeof VALID_TABS[number];

function isValidTab(value: string | null): value is TabValue {
  return VALID_TABS.includes(value as TabValue);
}

// Inner component uses useSearchParams — must be wrapped in <Suspense>
function SettingsContent() {
  const { role, loading } = useOrganization();
  const searchParams = useSearchParams();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400">
        Loading…
      </div>
    );
  }

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
        <Suspense fallback={
          <div className="text-sm text-gray-400 py-8 text-center">Loading profile…</div>
        }>
          <ProfileTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="organization">
        <OrgTab />
      </TabsContent>

      <TabsContent value="members">
        <Suspense fallback={
          <div className="text-sm text-gray-400 py-8 text-center">Loading members…</div>
        }>
          <MembersTab callerRole={callerRole as 'owner' | 'admin' | 'member' | 'viewer'} />
        </Suspense>
      </TabsContent>

      <TabsContent value="ad-accounts">
        <Suspense fallback={
          <div className="text-sm text-gray-400 py-8 text-center">Loading ad accounts…</div>
        }>
          <AdAccountsTab isAdmin={callerRole === 'owner' || callerRole === 'admin'} />
        </Suspense>
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationPreferencesTab />
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
