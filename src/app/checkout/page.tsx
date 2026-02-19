"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import MarketingShell from "@/components/marketing/MarketingShell";

const planOptions = ["free", "pro", "team", "enterprise"] as const;
const cycleOptions = ["monthly", "yearly"] as const;

export default function CheckoutPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [defaultPlan, setDefaultPlan] = useState<(typeof planOptions)[number]>("pro");
  const [defaultCycle, setDefaultCycle] = useState<(typeof cycleOptions)[number]>("monthly");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const cycleParam = params.get("cycle");

    if (planParam && planOptions.includes(planParam as (typeof planOptions)[number])) {
      setDefaultPlan(planParam as (typeof planOptions)[number]);
    }

    if (cycleParam && cycleOptions.includes(cycleParam as (typeof cycleOptions)[number])) {
      setDefaultCycle(cycleParam as (typeof cycleOptions)[number]);
    }
  }, []);

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      action: "create",
      tenantId: "brand-1",
      planId: String(formData.get("plan")),
      cycle: String(formData.get("cycle")),
      successUrl: `${window.location.origin}/checkout/success`,
      cancelUrl: `${window.location.origin}/checkout/cancel`
    };

    const response = await fetch("/api/v1/billing/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as {
      ok: boolean;
      data?: { checkoutUrl?: string };
      error?: { message?: string };
    };

    if (!result.ok || !result.data?.checkoutUrl) {
      setStatus("error");
      setMessage(result.error?.message ?? "Checkout could not be started.");
      return;
    }

    window.location.href = result.data.checkoutUrl;
  }

  return (
    <MarketingShell subtitle="Configure your plan and continue to payment sandbox." title="Checkout">
      <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleCheckoutSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Plan</span>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="plan" onChange={(event) => setDefaultPlan(event.target.value as (typeof planOptions)[number])} value={defaultPlan}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Billing cycle</span>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2" name="cycle" onChange={(event) => setDefaultCycle(event.target.value as (typeof cycleOptions)[number])} value={defaultCycle}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={status === "submitting"}
            type="submit"
          >
            {status === "submitting" ? "Creating checkout..." : "Continue to payment"}
          </button>
        </form>

        {status === "error" ? <p className="mt-3 text-sm text-rose-600">{message}</p> : null}

        <p className="mt-5 text-xs text-slate-500">
          By continuing you accept <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/privacy">Privacy</Link>.
        </p>
      </section>
    </MarketingShell>
  );
}
