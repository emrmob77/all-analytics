import MarketingShell from "@/components/marketing/MarketingShell";

export default function CookiesPage() {
  return (
    <MarketingShell subtitle="Cookies used for authentication and product analytics." title="Cookie Policy">
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-700 shadow-sm">
        <p>Session cookies are used to keep users signed in and to secure API access.</p>
        <p className="mt-3">Product analytics cookies help us understand feature usage and improve onboarding quality.</p>
      </section>
    </MarketingShell>
  );
}
