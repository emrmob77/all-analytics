import MarketingShell from "@/components/marketing/MarketingShell";

export default function SecurityPage() {
  return (
    <MarketingShell
      subtitle="Security baseline includes strict headers, JWT verification, tenant isolation checks, and auditable critical actions."
      title="Security"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Application Security</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• JWT verification and role assertions</li>
            <li>• API rate limiting and input sanitization</li>
            <li>• Request tracing and audit events</li>
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Operational Controls</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Connector credential rotation policy</li>
            <li>• Webhook signature verification and replay prevention</li>
            <li>• Dead-letter queue for failed ingestion events</li>
          </ul>
        </article>
      </section>
    </MarketingShell>
  );
}
