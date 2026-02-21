'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <svg width="24" height="24" fill="none" stroke="#C5221F" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-bold text-[#202124]">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-sm text-[#5F6368]">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#1A73E8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1557B0]"
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-lg border border-[#E3E8EF] px-5 py-2.5 text-sm font-semibold text-[#5F6368] hover:bg-[#F8F9FA]"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
