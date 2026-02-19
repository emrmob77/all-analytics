import MarketingShell from "@/components/marketing/MarketingShell";

const integrations = [
  "Google Ads",
  "Meta Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Pinterest Ads",
  "Yandex Ads",
  "GA4",
  "Search Console",
  "Shopify",
  "HubSpot",
  "Salesforce"
];

export default function PublicIntegrationsPage() {
  return (
    <MarketingShell
      subtitle="Connect ad networks, analytics, commerce, and CRM platforms with OAuth2, API key, or service-account authentication."
      title="Integrations"
    >
      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {integrations.map((integration) => (
          <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm" key={integration}>
            {integration}
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
