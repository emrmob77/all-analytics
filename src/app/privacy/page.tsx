import MarketingShell from "@/components/marketing/MarketingShell";

export default function PrivacyPage() {
  return (
    <MarketingShell subtitle="How we process account, billing, and analytics metadata." title="Privacy Policy">
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-700 shadow-sm">
        <p>Allanalytics stores workspace configuration, connector metadata, and usage telemetry to operate the service.</p>
        <p className="mt-3">Data access is controlled via tenant isolation and role-based authorization at API and UI level.</p>
      </section>
    </MarketingShell>
  );
}
