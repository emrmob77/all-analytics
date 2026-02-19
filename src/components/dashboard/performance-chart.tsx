'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PerformanceChartProps {
  className?: string;
}

export function PerformanceChart({ className }: PerformanceChartProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Performance Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Impressions · Last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          {/* Recharts will be integrated here */}
          <p>Chart placeholder - Recharts integration pending</p>
        </div>
      </CardContent>
    </Card>
  );
}
