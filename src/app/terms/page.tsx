import MarketingShell from "@/components/marketing/MarketingShell";

export default function TermsPage() {
  return (
    <MarketingShell subtitle="Service terms for plans, billing cycles, and acceptable use." title="Terms of Service">
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-700 shadow-sm">
        <p>By using Allanalytics, you agree to platform usage policies, plan limits, and subscription renewal conditions.</p>
        <p className="mt-3">Enterprise agreements may define custom terms, SLAs, and data processing addenda.</p>
      </section>
    </MarketingShell>
  );
}
