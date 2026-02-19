"use client";

import Link from "next/link";

/**
 * Reusable 404 page content used by app router not-found route.
 */
function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background-light px-6 text-text-main-light dark:bg-background-dark dark:text-text-main-dark">
      <section className="w-full max-w-md rounded-xl border border-border-light bg-surface-light p-8 text-center shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="mb-2 text-sm font-semibold tracking-wide text-text-muted-light dark:text-text-muted-dark">404</p>
        <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-sm text-text-muted-light dark:text-text-muted-dark">
          The requested page does not exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-light px-4 text-sm font-semibold transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800"
            onClick={() => window.history.back()}
            type="button"
          >
            Go back
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            href="/"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
