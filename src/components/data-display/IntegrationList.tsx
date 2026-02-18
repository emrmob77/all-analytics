interface Integration {
  id: string;
  name: string;
  category: string;
  connected: boolean;
  isBeta?: boolean;
  logo: string;
  logoClassName: string;
}

const integrations: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce",
    connected: true,
    logo: "S",
    logoClassName: "bg-emerald-100 text-emerald-700"
  },
  {
    id: "bigquery",
    name: "BigQuery",
    category: "Data Warehouse",
    connected: true,
    logo: "BQ",
    logoClassName: "bg-sky-100 text-sky-700"
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    connected: false,
    isBeta: true,
    logo: "H",
    logoClassName: "bg-orange-100 text-orange-700"
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    category: "Email",
    connected: false,
    logo: "K",
    logoClassName: "bg-violet-100 text-violet-700"
  }
];

function IntegrationList() {
  return (
    <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Integrations</h2>
        <a
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          href="#"
        >
          Browse Directory
          <span className="material-icons-round text-base">arrow_forward</span>
        </a>
      </div>

      <ul className="space-y-2">
        {integrations.map((integration) => (
          <li key={integration.id}>
            <div className="flex items-center gap-3 rounded-lg border border-border-light px-3 py-3 transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-gray-800/50">
              <div
                className={[
                  "grid h-9 w-9 place-items-center rounded-full text-xs font-semibold",
                  integration.logoClassName
                ].join(" ")}
              >
                {integration.logo}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                    {integration.name}
                  </h3>
                  {integration.isBeta ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      BETA
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{integration.category}</p>
              </div>

              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  integration.connected
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                ].join(" ")}
              >
                {integration.connected ? "Connected" : "Inactive"}
              </span>

              <button
                aria-label={`Manage ${integration.name} integration`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
                type="button"
              >
                <span className="material-icons-round text-lg">more_horiz</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default IntegrationList;
