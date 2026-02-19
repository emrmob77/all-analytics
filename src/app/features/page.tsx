import MarketingShell from "@/components/marketing/MarketingShell";

const featureGroups = [
  {
    title: "Core Analytics",
    items: ["Unified KPI dashboard", "Brand and workspace segmentation", "Custom reporting"]
  },
  {
    title: "Integrations",
    items: ["OAuth2/API key/service account auth", "Connector lifecycle controls", "Marketplace requests"]
  },
  {
    title: "Operations",
    items: ["Notification thresholds", "Team RBAC", "Support workflows and knowledge base"]
  }
];

export default function FeaturesPage() {
  return (
    <MarketingShell
      subtitle="Feature set designed for agencies, performance marketers, and leadership teams who need reliable growth analytics."
      title="Product Features"
    >
      <section className="grid gap-4 md:grid-cols-3">
        {featureGroups.map((group) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={group.title}>
            <h2 className="text-base font-semibold">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {group.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
