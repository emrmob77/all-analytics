import MarketingShell from "@/components/marketing/MarketingShell";

export default function AboutPage() {
  return (
    <MarketingShell
      subtitle="Allanalytics builds analytics workflows that combine channel performance, attribution quality, and operational execution."
      title="About Allanalytics"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-6 text-slate-700">
          The product is designed for teams running multi-platform paid media and commerce operations. Our focus is reliable data ingestion,
          clear decision surfaces, and predictable team workflows across acquisition, reporting, and support.
        </p>
      </section>
    </MarketingShell>
  );
}
