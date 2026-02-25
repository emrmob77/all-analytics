'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import Link from 'next/link';
import { addDays } from '@/lib/date';
import { formatCurrency, formatNumber, formatInteger } from '@/lib/format';
import { PLATFORMS, STATUS_STYLES } from '@/types';
import { PlatformIcon } from '@/components/ui/platform-icons';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PlatformFilter } from '@/components/ui/platform-filter';
import { useCampaigns, useBulkUpdateStatus, useUpdateCampaignStatus, useUpdateCampaignBudget } from '@/hooks/useCampaigns';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { AdPlatform, CampaignStatus } from '@/types';
import type { CampaignRow, SortableCampaignColumn } from '@/lib/actions/campaigns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: addDays(today, -29), to: today };
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const STATUS_OPTIONS: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'archived', label: 'Archived' },
];

const PAGE_SIZE = 50;

const colHelper = createColumnHelper<CampaignRow>();

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="border-b border-[#F1F3F4] px-3.5 py-[11px]">
              <div className="h-3 w-full max-w-[120px] rounded bg-[#F1F3F4] animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bulk action confirm dialog
// ---------------------------------------------------------------------------

interface BulkConfirmDialogProps {
  count: number;
  action: CampaignStatus;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function BulkConfirmDialog({ count, action, onConfirm, onCancel, loading }: BulkConfirmDialogProps) {
  const label = action === 'active' ? 'activate' : action === 'paused' ? 'pause' : 'archive';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[340px] rounded-xl border border-[#E3E8EF] bg-white p-6 shadow-xl">
        <div className="mb-1 text-sm font-semibold text-[#202124]">Confirm bulk action</div>
        <p className="mb-5 text-[13px] text-[#5F6368]">
          You are about to <strong>{label}</strong> <strong>{count}</strong> campaign{count !== 1 ? 's' : ''}.
          This cannot be undone easily.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-[7px] border border-[#E3E8EF] px-4 py-1.5 text-[13px] text-[#5F6368] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-[7px] bg-[#1A73E8] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#1669C1] disabled:opacity-50"
          >
            {loading ? 'Updating…' : `Yes, ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Budget edit dialog
// ---------------------------------------------------------------------------

interface BudgetDialogProps {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  onClose: () => void;
}

function BudgetDialog({ campaignId, campaignName, currentBudget, onClose }: BudgetDialogProps) {
  const [value, setValue] = useState(currentBudget.toFixed(2));
  const [error, setError] = useState('');
  const { mutate, isPending } = useUpdateCampaignBudget();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Budget must be greater than 0');
      return;
    }
    mutate(
      { id: campaignId, budget: num },
      {
        onSuccess: onClose,
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={isPending ? undefined : onClose}>
      <div
        className="w-[360px] rounded-xl border border-[#E3E8EF] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-sm font-semibold text-[#202124]">Edit Budget</div>
        <p className="mb-4 truncate text-[12.5px] text-[#9AA0A6]">{campaignName}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-[11.5px] font-medium text-[#5F6368]">
              Daily Budget (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9AA0A6]">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                className="w-full rounded-[7px] border border-[#E3E8EF] py-2 pl-7 pr-3 text-[13px] text-[#202124] outline-none focus:border-[#1A73E8]"
                autoFocus
              />
            </div>
            {error && <p className="mt-1.5 text-[11.5px] text-[#C5221F]">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-[7px] border border-[#E3E8EF] px-4 py-1.5 text-[13px] text-[#5F6368] hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[7px] bg-[#1A73E8] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#1669C1] disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status dropdown cell
// ---------------------------------------------------------------------------

interface StatusCellProps {
  row: CampaignRow;
}

const STATUS_CHANGE_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'archived', label: 'Archived' },
];

function StatusCell({ row }: StatusCellProps) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useState<CampaignStatus | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const { mutate, isPending } = useUpdateCampaignStatus();

  const currentStatus = optimistic ?? row.status;
  const s = STATUS_STYLES[currentStatus] ?? STATUS_STYLES['archived'];

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((v) => !v);
  }

  function handleChange(newStatus: CampaignStatus) {
    if (newStatus === currentStatus) { setOpen(false); return; }
    setOptimistic(newStatus);
    setOpen(false);
    mutate(
      { id: row.id, status: newStatus },
      { onError: () => setOptimistic(null) },
    );
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={isPending}
        className="inline-flex items-center gap-[5px] rounded-[5px] px-[9px] py-[3px] text-[11px] font-medium capitalize transition-opacity disabled:opacity-60"
        style={{ backgroundColor: s.bg, color: s.color }}
      >
        <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ backgroundColor: s.dot }} />
        {currentStatus}
        <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 2.5l3 3 3-3" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="fixed z-40 min-w-[120px] overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            {STATUS_CHANGE_OPTIONS.map((opt) => {
              const os = STATUS_STYLES[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange(opt.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#F8F9FA] ${opt.value === currentStatus ? 'font-semibold' : ''
                    }`}
                >
                  <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ backgroundColor: os.dot }} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CampaignsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [activePlatform, setActivePlatform] = useState<AdPlatform | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'spend', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState<CampaignStatus | null>(null);
  const [budgetDialog, setBudgetDialog] = useState<{ id: string; name: string; budget: number } | null>(null);

  // Reset row selection whenever any query param (including sort) changes
  useEffect(() => {
    setRowSelection({});
  }, [dateRange, activePlatform, statusFilter, search, page, sorting]);

  const sortCol = (sorting[0]?.id ?? 'spend') as SortableCampaignColumn;
  const sortDir = sorting[0]?.desc !== false ? 'desc' : 'asc';

  const { data, isLoading } = useCampaigns({
    from: toISO(dateRange.from),
    to: toISO(dateRange.to),
    platform: activePlatform,
    status: statusFilter,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortColumn: sortCol,
    sortDirection: sortDir,
  });

  const { mutate: bulkUpdate, isPending: bulkPending } = useBulkUpdateStatus();

  const campaigns = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = useMemo(
    () => [
      colHelper.display({
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 cursor-pointer accent-[#1A73E8]"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 cursor-pointer accent-[#1A73E8]"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 36,
      }),
      colHelper.accessor('name', {
        header: 'Campaign',
        cell: (info) => (
          <Link
            href={`/campaigns/${info.row.original.id}`}
            className="font-medium text-[#202124] hover:text-[#1A73E8] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {info.getValue()}
          </Link>
        ),
      }),
      colHelper.accessor('platform', {
        header: 'Platform',
        cell: (info) => {
          const platform = PLATFORMS.find((p) => p.id === info.getValue());
          return (
            <span
              className="inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-medium"
              style={{ backgroundColor: platform?.bgColor, color: platform?.color, borderColor: `${platform?.color}30` }}
            >
              <PlatformIcon platform={info.getValue()} size={11} />
              {platform?.label.split(' ')[0]}
            </span>
          );
        },
      }),
      colHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const campaign = info.row.original;
          // Remount cell when server status changes so any transient optimistic
          // local state cannot outlive authoritative row data.
          return <StatusCell key={`${campaign.id}:${campaign.status}`} row={campaign} />;
        },
      }),
      colHelper.accessor('budget', {
        header: 'Budget',
        cell: (info) => (
          <button
            className="group inline-flex items-center gap-1.5 text-[#5F6368] hover:text-[#1A73E8]"
            onClick={() =>
              setBudgetDialog({
                id: info.row.original.id,
                name: info.row.original.name,
                budget: info.getValue(),
              })
            }
          >
            {info.getValue() > 0 ? formatCurrency(info.getValue(), info.row.original.currency) : '—'}
            <svg
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6"
            >
              <path d="M1.5 7.5V9h1.5l4.5-4.5L6 3l-4.5 4.5zM8.5 1.5l1 1L8.5 3.5l-1-1 1-1z" strokeLinejoin="round" />
            </svg>
          </button>
        ),
      }),
      colHelper.accessor('spend', {
        header: 'Spend',
        cell: (info) => <span className="font-medium text-[#202124]">{info.getValue() > 0 ? formatCurrency(info.getValue(), info.row.original.currency) : '—'}</span>,
      }),
      colHelper.accessor('impressions', {
        header: 'Impressions',
        cell: (info) => <span className="text-[#5F6368]">{info.getValue() > 0 ? formatNumber(info.getValue()) : '—'}</span>,
      }),
      colHelper.accessor('clicks', {
        header: 'Clicks',
        cell: (info) => <span className="text-[#5F6368]">{info.getValue() > 0 ? formatInteger(info.getValue()) : '—'}</span>,
      }),
      colHelper.accessor('ctr', {
        header: 'CTR',
        cell: (info) => <span className="text-[#5F6368]">{info.getValue() > 0 ? `${info.getValue().toFixed(2)}%` : '—'}</span>,
      }),
      colHelper.accessor('conversions', {
        header: 'Conv.',
        cell: (info) => <span className="font-medium text-[#202124]">{info.getValue() > 0 ? info.getValue() : '—'}</span>,
      }),
      colHelper.accessor('roas', {
        header: 'ROAS',
        cell: (info) => {
          const v = info.getValue();
          if (!v) return <span className="text-[#E3E8EF]">—</span>;
          const color = v >= 5 ? '#137333' : v >= 3 ? '#B06000' : '#C5221F';
          return <span className="font-bold" style={{ color }}>{v.toFixed(1)}x</span>;
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: campaigns,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1); // reset to first page when sort changes
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    // manualSorting: server handles sorting before pagination
    manualSorting: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedCount = selectedIds.length;

  function handleBulkConfirm() {
    if (!bulkAction) return;
    bulkUpdate(
      { ids: selectedIds, status: bulkAction },
      {
        onSuccess: () => {
          setRowSelection({});
          setBulkAction(null);
        },
        onError: () => {
          setBulkAction(null);
        },
      },
    );
  }

  function resetFilters() {
    setSearch('');
    setActivePlatform('all');
    setStatusFilter('all');
    setPage(1);
    // rowSelection cleared by the useEffect above
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8F9FA]">
      <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-[#202124]">Campaigns</h1>
            <p className="mt-0.5 text-[12.5px] text-[#9AA0A6]">
              {isLoading ? 'Loading…' : `${total} campaign${total !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <label htmlFor="campaign-search" className="sr-only">Search campaigns</label>
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA0A6]" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="5.5" cy="5.5" r="4.5" /><path d="M10 10l2.5 2.5" />
            </svg>
            <input
              id="campaign-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search campaigns…"
              className="h-8 rounded-[7px] border border-[#E3E8EF] bg-white pl-8 pr-3 text-[12.5px] text-[#202124] outline-none placeholder:text-[#9AA0A6] focus:border-[#1A73E8] w-[200px]"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as CampaignStatus | 'all'); setPage(1); }}
            className="h-8 rounded-[7px] border border-[#E3E8EF] bg-white px-2.5 text-[12.5px] text-[#5F6368] outline-none focus:border-[#1A73E8] cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Platform filter */}
          <PlatformFilter
            selected={activePlatform}
            onChange={(p) => { setActivePlatform(p); setPage(1); }}
          />

          {/* Clear filters */}
          {(search || activePlatform !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[12px] text-[#1A73E8] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div className="mb-3 flex items-center gap-3 rounded-[9px] border border-[#D2E3FC] bg-[#E8F0FE] px-4 py-2.5">
            <span className="text-[13px] font-medium text-[#1A73E8]">
              {selectedCount} selected
            </span>
            <div className="ml-2 flex gap-2">
              <button
                onClick={() => setBulkAction('active')}
                className="rounded-[6px] bg-[#E6F4EA] px-3 py-1 text-[12px] font-medium text-[#137333] hover:bg-[#d4edda]"
              >
                Activate
              </button>
              <button
                onClick={() => setBulkAction('paused')}
                className="rounded-[6px] bg-[#FEF7E0] px-3 py-1 text-[12px] font-medium text-[#B06000] hover:bg-[#fef3cc]"
              >
                Pause
              </button>
              <button
                onClick={() => setBulkAction('archived')}
                className="rounded-[6px] bg-[#F1F3F4] px-3 py-1 text-[12px] font-medium text-[#5F6368] hover:bg-[#e8eaed]"
              >
                Archive
              </button>
            </div>
            <button
              onClick={() => setRowSelection({})}
              className="ml-auto text-[12px] text-[#5F6368] hover:text-[#202124]"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-[#F8F9FA]">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`select-none whitespace-nowrap border-b border-[#E3E8EF] px-3.5 py-[9px] text-left text-[11px] font-medium ${header.column.getCanSort() ? 'cursor-pointer' : ''
                          } ${header.column.getIsSorted() ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && ' ↑'}
                          {header.column.getIsSorted() === 'desc' && ' ↓'}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows cols={columns.length} />
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3.5 py-12 text-center text-sm text-[#9AA0A6]">
                      No campaigns found.{' '}
                      {(search || activePlatform !== 'all' || statusFilter !== 'all') && (
                        <button onClick={resetFilters} className="text-[#1A73E8] hover:underline">
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`cursor-pointer transition-colors ${row.getIsSelected() ? 'bg-[#F0F6FF]' : 'bg-white hover:bg-[#F8FBFF]'
                        }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="border-b border-[#F1F3F4] px-3.5 py-[11px]"
                          style={cell.column.id === 'name' ? { minWidth: 180 } : {}}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between border-t border-[#F1F3F4] px-5 py-3">
              <span className="text-[12px] text-[#9AA0A6]">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#E3E8EF] text-[#5F6368] disabled:opacity-40 hover:bg-gray-50"
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M7 1L3 5l4 4" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-[#9AA0A6]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`flex h-7 w-7 items-center justify-center rounded-[6px] text-[12px] font-medium transition-colors ${page === p
                            ? 'bg-[#1A73E8] text-white'
                            : 'border border-[#E3E8EF] text-[#5F6368] hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#E3E8EF] text-[#5F6368] disabled:opacity-40 hover:bg-gray-50"
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 1l4 4-4 4" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action confirmation dialog */}
      {bulkAction && (
        <BulkConfirmDialog
          count={selectedCount}
          action={bulkAction}
          onConfirm={handleBulkConfirm}
          onCancel={() => setBulkAction(null)}
          loading={bulkPending}
        />
      )}

      {/* Budget edit dialog */}
      {budgetDialog && (
        <BudgetDialog
          campaignId={budgetDialog.id}
          campaignName={budgetDialog.name}
          currentBudget={budgetDialog.budget}
          onClose={() => setBudgetDialog(null)}
        />
      )}
    </div>
  );
}
