import Link from "next/link";

import MarketingShell from "@/components/marketing/MarketingShell";

export default function CheckoutSuccessPage() {
  return (
    <MarketingShell subtitle="Your checkout session completed successfully." title="Payment Success">
      <section className="max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 shadow-sm">
        <p className="text-sm">Subscription is active in trial mode. Continue with workspace onboarding.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" href="/onboarding">
            Start Onboarding
          </Link>
          <Link className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold" href="/billing">
            Open Billing
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
