import Link from "next/link";

import MarketingShell from "@/components/marketing/MarketingShell";

const integrationBadges = [
  "Google Ads",
  "Meta Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Pinterest Ads",
  "Shopify",
  "GA4",
  "Search Console",
  "HubSpot"
];

export default function SaasLandingPage() {
  return (
    <MarketingShell
      subtitle="Unified analytics workspace for agencies and in-house growth teams. Connect channels, monitor performance, and automate reporting in one place."
      title="Allanalytics for Growth Teams"
    >
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">SaaS Product</p>
          <h2 className="mt-3 text-2xl font-semibold">From connectors to dashboards in minutes</h2>
          <p className="mt-3 text-sm text-slate-600">
            Deploy channel integrations, monitor synced KPIs, and route alerts to in-app and email channels with role-based access.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/checkout">
              Start Free Trial
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" href="/contact-sales">
              Book Demo
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">What teams remember</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Cross-platform spend anomaly alerts</li>
            <li>• Workspace-level permissions and auditability</li>
            <li>• Near real-time webhook ingestion</li>
            <li>• One-click connector health diagnostics</li>
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Integrations Showcase</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {integrationBadges.map((integration) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
              key={integration}
            >
              {integration}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold">Acquisition Intelligence</h3>
          <p className="mt-2 text-sm text-slate-600">Monitor campaign quality, pacing, and ROAS trends across all paid channels.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold">Attribution Layer</h3>
          <p className="mt-2 text-sm text-slate-600">Normalize channel metrics, currencies, and timezones into one consistent model.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold">Automation Hub</h3>
          <p className="mt-2 text-sm text-slate-600">Schedule sync jobs, configure alert thresholds, and track delivery logs.</p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white">
        <h2 className="text-2xl font-semibold">Ready to scale with clean analytics?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">Choose your plan, start onboarding, and connect your first data source in under 10 minutes.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900" href="/pricing">
            View Pricing
          </Link>
          <Link className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white" href="/features">
            Explore Features
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
