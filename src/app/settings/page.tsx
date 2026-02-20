'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from '@/components/settings/MembersTab';
import { AdAccountsTab } from '@/components/settings/AdAccountsTab';
import { useOrganization } from '@/hooks/useOrganization';

export default function SettingsPage() {
  const { role, loading } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  const callerRole = role ?? 'viewer';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization and team</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="ad-accounts">Ad Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Profile settings — coming soon (Task 18.2)
          </div>
        </TabsContent>

        <TabsContent value="organization">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Organization settings — coming soon (Task 18.3)
          </div>
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
      </Tabs>
    </div>
  );
}
