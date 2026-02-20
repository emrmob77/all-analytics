'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export function useUser(): UserProfile | null {
  const { user } = useAuthContext();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    fullName:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'User',
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };
}
