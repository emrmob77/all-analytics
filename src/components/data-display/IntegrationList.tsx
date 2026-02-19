import Badge from "@/components/ui/Badge";

interface Integration {
  id: string;
  name: string;
  category: string;
  logo: string;
  logoClassName: string;
  state: "connect" | "beta" | "connected";
}

const integrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    category: "Messaging & Alerts",
    logo: "S",
    logoClassName: "bg-[#4A154B] text-white",
    state: "connect"
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM Sync",
    logo: "SF",
    logoClassName: "bg-[#00A1E0] text-white",
    state: "beta"
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM Automation",
    logo: "HS",
    logoClassName: "bg-[#FF7A59] text-white",
    state: "connected"
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce Data",
    logo: "SH",
    logoClassName: "bg-[#95BF47] text-white",
    state: "connect"
  }
];

/**
 * Integration directory list with connect and state badges.
 */
function IntegrationList() {
  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Available Integrations</h2>
        <button className="min-h-11 text-sm text-primary transition-colors hover:underline" type="button">
          Browse Directory
        </button>
      </div>

      <div className="h-full rounded-xl border border-border-light bg-surface-light p-2 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <ul className="divide-y divide-border-light dark:divide-border-dark">
          {integrations.map((integration) => (
            <li
              className="group flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              key={integration.id}
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold",
                    integration.logoClassName
                  ].join(" ")}
                >
                  {integration.logo}
                </div>
                <div>
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    {integration.name}
                  </h3>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{integration.category}</p>
                </div>
              </div>

              {integration.state === "connect" ? (
                <button
                  className="min-h-11 rounded-md border border-border-light px-3 py-1.5 text-xs font-medium transition-all hover:border-primary hover:text-primary dark:border-border-dark"
                  type="button"
                >
                  Connect
                </button>
              ) : null}

              {integration.state === "beta" ? (
                <Badge size="md" variant="beta" />
              ) : null}

              {integration.state === "connected" ? (
                <div className="flex items-center gap-2">
                  <Badge connectionState="connected" size="sm" variant="connection" />
                  <button
                    className="min-h-11 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted-light transition-all hover:text-primary dark:text-text-muted-dark"
                    type="button"
                  >
                    Configure
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default IntegrationList;
