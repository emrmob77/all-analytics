interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sections = [
    {
      title: "Analytics",
      items: [
        { label: "Dashboard", icon: "dashboard", active: true },
        { label: "Performance", icon: "insights" },
        { label: "Campaigns", icon: "campaign" },
        { label: "Channels", icon: "hub" }
      ]
    },
    {
      title: "Configuration",
      items: [
        { label: "Integrations", icon: "extension" },
        { label: "Attribution", icon: "settings_suggest" }
      ]
    },
    {
      title: "System",
      items: [
        { label: "Team", icon: "manage_accounts" },
        { label: "Settings", icon: "settings" }
      ]
    }
  ];

  return (
    <>
      <aside
        className={[
          "sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-border-light bg-surface-light transition-transform duration-200 dark:border-border-dark dark:bg-surface-dark md:static",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        ].join(" ")}
      >
        <div className="flex items-center gap-3 p-6">
          <div className="grid h-8 w-8 place-items-center rounded bg-primary text-lg font-bold text-white">G</div>
          <span className="text-xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
            Glowytics
            <span className="align-top text-xs text-text-muted-light dark:text-text-muted-dark">™</span>
          </span>
          <button
            aria-label="Open company website"
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
            type="button"
          >
            <span className="material-icons-round text-lg">open_in_new</span>
          </button>
        </div>

        <div className="mb-6 px-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg border border-border-light bg-background-light p-3 text-left transition-colors hover:border-primary dark:border-border-dark dark:bg-background-dark"
            type="button"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">
              GH
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                Growth Hacking Inc.
              </div>
              <div className="text-xs text-text-muted-light dark:text-text-muted-dark">3 admins active</div>
            </div>
            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark">
              expand_more
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-6 px-4" aria-label="Sidebar navigation">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a
                      className={[
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        item.active
                          ? "sidebar-item-active"
                          : "text-text-muted-light hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
                      ].join(" ")}
                      href="#"
                    >
                      <span className={["material-icons-round text-[20px]", item.active ? "text-primary" : ""].join(" ")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="mb-4 space-y-1">
            <a
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              href="#"
            >
              <span className="material-icons-round text-[20px]">notifications</span>
              Notifications
              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">5</span>
            </a>
            <a
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              href="#"
            >
              <span className="material-icons-round text-[20px]">help_outline</span>
              Support
            </a>
          </div>

          <div className="flex items-center gap-3 border-t border-border-light pt-4 dark:border-border-dark">
            <img
              alt="User profile"
              className="h-10 w-10 rounded-full object-cover"
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
            />
            <div>
              <div className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">Rahat Ali</div>
              <div className="text-xs text-text-muted-light dark:text-text-muted-dark">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          type="button"
        />
      ) : null}
    </>
  );
}

export default Sidebar;
