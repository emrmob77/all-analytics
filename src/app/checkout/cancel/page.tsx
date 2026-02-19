import Link from "next/link";

import MarketingShell from "@/components/marketing/MarketingShell";

export default function CheckoutCancelPage() {
  return (
    <MarketingShell subtitle="Checkout flow was canceled." title="Payment Canceled">
      <section className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <p className="text-sm">No charges were made. You can restart checkout when ready.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white" href="/checkout">
            Retry Checkout
          </Link>
          <Link className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold" href="/pricing">
            Back to Pricing
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
