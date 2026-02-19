'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORMS, type PlatformConfig } from '@/types';

const DEFAULT_PLATFORM: PlatformConfig = {
  id: 'google',
  label: 'Unknown',
  color: '#9CA3AF',
  bgColor: '#F3F4F6',
};

interface PlatformMetric {
  platform: string;
  spend: number;
  conversions: number;
  roas: number;
}

// Demo data - will be replaced with real data
const DEMO_DATA: PlatformMetric[] = [
  { platform: 'google', spend: 5341, conversions: 732, roas: 4.5 },
  { platform: 'meta', spend: 3340, conversions: 565, roas: 4.2 },
  { platform: 'tiktok', spend: 1750, conversions: 185, roas: 5.1 },
  { platform: 'pinterest', spend: 1990, conversions: 240, roas: 3.2 },
];

export function PlatformSummary() {
  const totalSpend = DEMO_DATA.reduce((acc, d) => acc + d.spend, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Platform Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DEMO_DATA.map((data) => {
          const platform = PLATFORMS.find((p) => p.id === data.platform) ?? DEFAULT_PLATFORM;
          const percentage = totalSpend > 0 ? Math.round((data.spend / totalSpend) * 100) : 0;

          return (
            <div
              key={data.platform}
              className="rounded-lg p-3"
              style={{ backgroundColor: platform.bgColor }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="text-sm font-medium">{platform.label}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Spend</p>
                  <p className="font-semibold">${data.spend.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conv.</p>
                  <p className="font-semibold">{data.conversions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ROAS</p>
                  <p className="font-semibold">{data.roas}x</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Budget share</span>
                  <span style={{ color: platform.color }} className="font-semibold">
                    {percentage}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: platform.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
