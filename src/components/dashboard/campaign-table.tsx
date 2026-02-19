'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PLATFORMS, type AdPlatform, type CampaignStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Campaign {
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

// Demo data
const DEMO_CAMPAIGNS: Campaign[] = [
  { name: 'Summer Sale 2025', platform: 'google', status: 'active', budget: 5000, spend: 3241, impressions: 842000, clicks: 14200, ctr: 1.69, conversions: 412, roas: 4.2 },
  { name: 'Brand Awareness Q3', platform: 'meta', status: 'active', budget: 3500, spend: 2890, impressions: 1240000, clicks: 18600, ctr: 1.50, conversions: 290, roas: 3.8 },
  { name: 'Product Launch Reel', platform: 'tiktok', status: 'active', budget: 2000, spend: 1750, impressions: 2100000, clicks: 42000, ctr: 2.00, conversions: 185, roas: 5.1 },
  { name: 'Holiday Pins', platform: 'pinterest', status: 'paused', budget: 1200, spend: 890, impressions: 320000, clicks: 5200, ctr: 1.63, conversions: 98, roas: 2.9 },
  { name: 'Retargeting — Cart', platform: 'google', status: 'active', budget: 2500, spend: 2100, impressions: 420000, clicks: 9800, ctr: 2.33, conversions: 320, roas: 6.8 },
];

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  deleted: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export function CampaignTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Campaigns</CardTitle>
        <p className="text-sm text-muted-foreground">
          {DEMO_CAMPAIGNS.length} campaigns · All Platforms
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_CAMPAIGNS.map((campaign) => {
              const platform = PLATFORMS.find((p) => p.id === campaign.platform);
              const statusStyle = STATUS_STYLES[campaign.status];

              return (
                <TableRow key={campaign.name} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: platform?.bgColor,
                        color: platform?.color,
                      }}
                    >
                      {platform?.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium capitalize',
                        statusStyle.bg,
                        statusStyle.text
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                  <TableCell className="text-right">{campaign.ctr}%</TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="flex justify-end gap-1 text-xs">
                        <span className="font-medium">${campaign.spend.toLocaleString()}</span>
                        <span className="text-muted-foreground">/ ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            campaign.spend / campaign.budget > 0.9
                              ? 'bg-red-500'
                              : campaign.spend / campaign.budget > 0.7
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          )}
                          style={{ width: `${Math.min((campaign.spend / campaign.budget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{campaign.conversions}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-bold',
                        campaign.roas >= 5
                          ? 'text-green-600'
                          : campaign.roas >= 3
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )}
                    >
                      {campaign.roas}x
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
