'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchConnectableGoogleAccounts, GoogleChildAccount } from '@/lib/actions/google-ads';
import { toast } from 'sonner';

interface GoogleAccountSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adAccountId: string;
    onSelectCallback: (childIds: string[]) => void;
}

export function GoogleAccountSelectorModal({
    open,
    onOpenChange,
    adAccountId,
    onSelectCallback,
}: GoogleAccountSelectorModalProps) {
    const [accounts, setAccounts] = useState<GoogleChildAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open) return;

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
    }, [open, adAccountId]);

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Google Ads Accounts</DialogTitle>
                    <DialogDescription>
                        Choose the Google Ads accounts you want to sync data for. If you connected an MCC (Manager Account), select all the active client accounts you want to display on the dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
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
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(acc.id)}
                                            />
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{acc.name}</div>
                                            <div className={`text-xs mt-0.5 font-mono ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                                ID: {acc.id}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || isPending || loading}
                    >
                        {isPending ? 'Saving...' : `Confirm (${selectedIds.size})`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
