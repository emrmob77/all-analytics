import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#e9f7ef,transparent_45%),radial-gradient(circle_at_bottom_right,#e6eefc,transparent_40%),#f8fafc] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <Link className="text-sm font-semibold tracking-wide text-slate-500" href="/saas">
          ALLANALYTICS
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export default AuthPageShell;
