"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import MarketingShell from "@/components/marketing/MarketingShell";
import { listBillingPlans } from "@/lib/billing/plans";

const plans = listBillingPlans();

export default function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const pricingLabel = useMemo(
    () =>
      cycle === "monthly"
        ? (planPrice: { monthlyPriceUsd: number }) => `$${planPrice.monthlyPriceUsd}/mo`
        : (planPrice: { yearlyPriceUsd: number }) => `$${planPrice.yearlyPriceUsd}/yr`,
    [cycle]
  );

  return (
    <MarketingShell subtitle="Choose a plan based on connector volume, workspace size, and support SLA." title="Pricing">
      <section className="mb-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm">
        <button
          className={[
            "rounded-md px-3 py-2",
            cycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          ].join(" ")}
          onClick={() => setCycle("monthly")}
          type="button"
        >
          Monthly
        </button>
        <button
          className={[
            "rounded-md px-3 py-2",
            cycle === "yearly" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          ].join(" ")}
          onClick={() => setCycle("yearly")}
          type="button"
        >
          Yearly
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={plan.id}>
            <h2 className="text-base font-semibold">{plan.name}</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight">{pricingLabel(plan)}</p>
            <p className="mt-1 text-xs text-slate-500">Trial: {plan.trialDays} days</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link
              className="mt-5 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
              href={`/checkout?plan=${plan.id}&cycle=${cycle}`}
            >
              Continue
            </Link>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
