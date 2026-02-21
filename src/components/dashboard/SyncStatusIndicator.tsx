'use client';

import { useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getRecentSyncLogs, triggerManualSync, type SyncLog } from '@/lib/actions/sync';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

function getStatus(logs: SyncLog[]): SyncStatus {
  const latest = logs[0];
  if (!latest) return 'idle';
  if (latest.status === 'in_progress') return 'syncing';
  if (latest.status === 'completed') return 'success';
  return 'error';
}

const STATUS_CONFIG: Record<SyncStatus, { dot: string; label: string; text: string }> = {
  idle:    { dot: 'bg-gray-300',  label: 'Idle',    text: 'text-gray-500' },
  syncing: { dot: 'bg-blue-400 animate-pulse', label: 'Syncing…', text: 'text-blue-600' },
  success: { dot: 'bg-green-500', label: 'Synced',  text: 'text-green-700' },
  error:   { dot: 'bg-red-500',   label: 'Failed',  text: 'text-red-600' },
};

// ---------------------------------------------------------------------------
// SyncStatusIndicator
// ---------------------------------------------------------------------------

interface SyncStatusIndicatorProps {
  isAdmin: boolean;
  adAccountId?: string;
  /** Poll interval in ms. Default 30 000. */
  pollIntervalMs?: number;
}

export function SyncStatusIndicator({
  isAdmin,
  adAccountId,
  pollIntervalMs = 30_000,
}: SyncStatusIndicatorProps) {
  const queryClient = useQueryClient();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: logs = [] } = useQuery<SyncLog[]>({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { logs: data, error } = await getRecentSyncLogs();
      if (error) throw new Error(error);
      return data;
    },
    refetchInterval: pollIntervalMs,
  });

  function handleSync() {
    setSyncError(null);
    startTransition(async () => {
      const { error } = await triggerManualSync(adAccountId);
      if (error) {
        setSyncError(error);
      } else {
        // Invalidate after short delay so the new sync log appears
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['sync-logs'] }), 1500);
      }
    });
  }

  const latest = logs[0];
  const status = isPending ? 'syncing' : getStatus(logs);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3">
      {/* Status badge */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
        {latest && status !== 'syncing' && (
          <span className="text-xs text-gray-400">
            · {formatRelative(latest.started_at)}
          </span>
        )}
      </div>

      {/* Error tooltip */}
      {latest?.status === 'failed' && latest.error_message && (
        <span
          className="hidden sm:inline text-xs text-red-500 truncate max-w-[180px]"
          title={latest.error_message}
        >
          {latest.error_message}
        </span>
      )}

      {/* Sync error from manual trigger */}
      {syncError && (
        <span className="text-xs text-red-500 truncate max-w-[180px]" title={syncError}>
          {syncError}
        </span>
      )}

      {/* Manual sync button — admin only */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isPending || status === 'syncing'}
          className="h-7 text-xs gap-1.5"
        >
          {isPending || status === 'syncing' ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Syncing…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                <path d="M8 1v3.5L10.5 2 8 1z" fill="currentColor" stroke="none" />
              </svg>
              Sync Now
            </>
          )}
        </Button>
      )}
    </div>
  );
}
