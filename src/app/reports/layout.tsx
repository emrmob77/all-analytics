import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
