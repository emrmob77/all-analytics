import Link from "next/link";

import type { NavigationSection } from "@/types/navigation";

interface NavigationMenuProps {
  sections: NavigationSection[];
  activePath: string;
  onItemClick?: () => void;
}

function NavigationMenu({ sections, activePath, onItemClick }: NavigationMenuProps) {
  return (
    <nav className="flex-1 space-y-6 px-4" aria-label="Sidebar navigation">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
            {section.title}
          </h2>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = activePath === item.path;

              return (
                <li key={item.path}>
                  <Link
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "sidebar-item-active"
                        : "text-text-muted-light hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
                    ].join(" ")}
                    href={item.path}
                    onClick={onItemClick}
                  >
                    <span className={["material-icons-round text-[20px]", isActive ? "text-primary" : ""].join(" ")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export default NavigationMenu;
