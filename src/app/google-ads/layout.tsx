import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout';

export default function GoogleAdsLayout({ children }: { children: ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
