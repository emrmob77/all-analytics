"use client";

import Link from "next/link";

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

/**
 * Reusable error page for route level crashes.
 */
function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background-light px-6 text-text-main-light dark:bg-background-dark dark:text-text-main-dark">
      <section className="w-full max-w-md rounded-xl border border-border-light bg-surface-light p-8 text-center shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="mb-2 text-sm font-semibold tracking-wide text-red-600 dark:text-red-400">Unexpected issue</p>
        <h1 className="mb-2 text-2xl font-bold">Something broke on this page</h1>
        <p className="mb-4 text-sm text-text-muted-light dark:text-text-muted-dark">
          Please retry this action. If it keeps happening, return to dashboard and continue there.
        </p>

        {error?.message ? (
          <p className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-left text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error.message}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-light px-4 text-sm font-semibold transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800"
            onClick={() => window.history.back()}
            type="button"
          >
            Go back
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            onClick={() => reset?.()}
            type="button"
          >
            Retry
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            href="/"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ErrorPage;
