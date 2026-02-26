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
    onSelectCallback: (childId: string) => void;
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
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open) return;

        let mounted = true;
        setLoading(true);
        setError(null);
        setAccounts([]);
        setSelectedId(null);

        fetchConnectableGoogleAccounts(adAccountId)
            .then(data => {
                if (!mounted) return;
                setAccounts(data);
                if (data.length > 0) {
                    setSelectedId(data[0].id);
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
        if (!selectedId) return;
        startTransition(() => {
            onSelectCallback(selectedId);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Google Ads Account</DialogTitle>
                    <DialogDescription>
                        Choose the specific Google Ads account you want to sync data for. If you connected an MCC (Manager Account), select one of its active client accounts.
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
                            {accounts.map((acc) => (
                                <button
                                    key={acc.id}
                                    onClick={() => setSelectedId(acc.id)}
                                    className={`
                    w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm
                    ${selectedId === acc.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <div className="font-semibold">{acc.name}</div>
                                    <div className={`text-xs mt-0.5 font-mono ${selectedId === acc.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                        ID: {acc.id}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedId || isPending || loading}
                    >
                        {isPending ? 'Saving...' : 'Confirm Selection'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
