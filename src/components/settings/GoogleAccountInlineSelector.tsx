'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { fetchConnectableGoogleAccounts, GoogleChildAccount } from '@/lib/actions/google-ads';

interface GoogleAccountInlineSelectorProps {
    adAccountId: string;
    onSelectCallback: (childIds: string[]) => void;
    onCancelCallback: () => void;
}

export function GoogleAccountInlineSelector({
    adAccountId,
    onSelectCallback,
    onCancelCallback,
}: GoogleAccountInlineSelectorProps) {
    const [accounts, setAccounts] = useState<GoogleChildAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        setAccounts([]);
        setSelectedIds(new Set());

        fetchConnectableGoogleAccounts(adAccountId)
            .then(data => {
                if (!mounted) return;
                setAccounts(data);
                if (data.length === 1) {
                    setSelectedIds(new Set([data[0].id]));
                }
            })
            .catch(err => {
                if (!mounted) return;
                console.error(err);
                setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [adAccountId]);

    function handleConfirm() {
        if (selectedIds.size === 0) return;
        startTransition(() => {
            onSelectCallback(Array.from(selectedIds));
        });
    }

    function toggleSelection(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    return (
        <div className="mt-3 bg-white rounded-xl border border-orange-200 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h3 className="text-[13.5px] font-semibold text-[#202124]">Select Google Ads Accounts</h3>
            <p className="text-[12.5px] text-[#5F6368] mt-0.5 mb-4">
                Choose the accounts you want to sync data for. Select all the active client accounts you want to display on the dashboard.
            </p>

            <div className="py-2">
                {loading ? (
                    <div className="text-sm text-gray-500 text-center py-6 animate-pulse">
                        Finding accessible accounts...
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                        {error}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6">
                        No active Google Ads accounts found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {accounts.map((acc) => {
                            const isSelected = selectedIds.has(acc.id);
                            return (
                                <label
                                    key={acc.id}
                                    className={`
                                        flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm cursor-pointer
                                        ${isSelected
                                            ? 'border-[#1A73E8] bg-[#E8F0FE] ring-1 ring-[#1A73E8]/50'
                                            : 'border-[#E3E8EF] bg-white hover:border-[#D2E3FC] hover:bg-[#F8F9FA]'
                                        }
                                    `}
                                >
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#1A73E8] rounded border-gray-300 focus:ring-[#1A73E8]"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(acc.id)}
                                        />
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isSelected ? 'text-[#1A73E8]' : 'text-[#202124]'}`}>{acc.name}</div>
                                        <div className={`text-xs mt-0.5 font-mono ${isSelected ? 'text-[#1A73E8]/80' : 'text-[#9AA0A6]'}`}>
                                            ID: {acc.id}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-[#E3E8EF]">
                <Button variant="outline" size="sm" onClick={onCancelCallback} disabled={isPending}>
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={selectedIds.size === 0 || isPending || loading}
                >
                    {isPending ? 'Saving...' : `Confirm (${selectedIds.size})`}
                </Button>
            </div>
        </div>
    );
}
