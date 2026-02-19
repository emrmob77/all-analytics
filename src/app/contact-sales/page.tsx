"use client";

import { useState } from "react";

import MarketingShell from "@/components/marketing/MarketingShell";

export default function ContactSalesPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <MarketingShell
      subtitle="Tell us about your team size, current stack, and target use cases. We'll propose an implementation path."
      title="Contact Sales"
    >
      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Work Email</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" required type="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Company</span>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" required type="text" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">What do you need?</span>
            <textarea className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2" required />
          </label>
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
            Send Request
          </button>
        </form>

        {submitted ? <p className="mt-3 text-sm text-emerald-700">Request received. Sales team will contact you shortly.</p> : null}
      </section>
    </MarketingShell>
  );
}
