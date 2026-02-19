import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-lg rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-rose-700">403 - Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">Your current role does not have access to this page.</p>
        <div className="mt-4 flex gap-2">
          <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href="/">
            Back to dashboard
          </Link>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" href="/login">
            Switch account
          </Link>
        </div>
      </section>
    </div>
  );
}
