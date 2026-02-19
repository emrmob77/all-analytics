import Link from "next/link";
import type { ReactNode } from "react";

interface MarketingShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const navLinks = [
  { href: "/saas", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/public/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" }
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" }
];

function MarketingShell({ title, subtitle, children }: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#e6f4ea_0%,#f6f8fc_45%,#ffffff_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-lg font-semibold tracking-tight" href="/saas">
            Allanalytics
          </Link>

          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            {navLinks.map((link) => (
              <Link className="rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/login">
              Log in
            </Link>
            <Link className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800" href="/checkout">
              Start trial
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p>
        </section>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm text-slate-600">
          <p>© {new Date().getFullYear()} Allanalytics</p>
          <div className="flex flex-wrap gap-3">
            {legalLinks.map((link) => (
              <Link className="hover:text-slate-900 hover:underline" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
            <Link className="hover:text-slate-900 hover:underline" href="/contact-sales">
              Contact Sales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MarketingShell;
