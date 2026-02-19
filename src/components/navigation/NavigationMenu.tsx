"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NavigationSection } from "@/types/navigation";
import type { BrandLogoName } from "@/components/ui/BrandLogoIcon";
import OptimizedBrandLogo from "@/components/ui/OptimizedBrandLogo";

interface NavigationMenuProps {
  sections: NavigationSection[];
  activePath: string;
  onItemClick?: () => void;
  collapsed?: boolean;
}

function getBrandIcon(icon: string): BrandLogoName | null {
  if (icon === "brand:google-ads") return "google-ads";
  if (icon === "brand:facebook") return "facebook";
  if (icon === "brand:ga4") return "ga4";
  if (icon === "brand:tiktok") return "tiktok";
  if (icon === "brand:search-console") return "search-console";
  if (icon === "brand:linkedin") return "linkedin";
  if (icon === "brand:yandex-ads") return "yandex-ads";
  return null;
}

function getMaterialIconColorClass(icon: string) {
  if (icon === "dashboard") return "text-indigo-500 dark:text-indigo-400";
  if (icon === "insights") return "text-violet-500 dark:text-violet-400";
  if (icon === "show_chart") return "text-emerald-500 dark:text-emerald-400";
  if (icon === "shopping_bag") return "text-amber-500 dark:text-amber-400";
  if (icon === "extension") return "text-cyan-500 dark:text-cyan-400";
  if (icon === "task_alt") return "text-teal-500 dark:text-teal-400";
  if (icon === "description") return "text-orange-500 dark:text-orange-400";
  if (icon === "auto_awesome") return "text-fuchsia-500 dark:text-fuchsia-400";
  if (icon === "settings") return "text-slate-500 dark:text-slate-400";
  return "text-text-muted-light dark:text-text-muted-dark";
}

function NavigationMenu({ sections, activePath, onItemClick, collapsed = false }: NavigationMenuProps) {
  const sectionTitles = useMemo(() => sections.map((section) => section.title), [sections]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sectionTitles.map((title) => [title, true]))
  );

  function toggleSection(sectionTitle: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle]
    }));
  }

  return (
    <nav className={collapsed ? "space-y-3 px-2" : "space-y-4 px-4"} aria-label="Sidebar navigation">
      {sections.map((section) => (
        <section key={section.title}>
          {!collapsed ? (
            <button
              aria-controls={`nav-section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
              aria-expanded={openSections[section.title] ?? true}
              className="mb-2 flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => toggleSection(section.title)}
              type="button"
            >
              {section.title}
              <span
                className={[
                  "material-icons-round text-base normal-case transition-transform duration-200",
                  openSections[section.title] ?? true ? "rotate-180" : ""
                ].join(" ")}
              >
                expand_more
              </span>
            </button>
          ) : null}

          {(collapsed || (openSections[section.title] ?? true)) ? (
            <ul
              className={collapsed ? "space-y-1" : "space-y-0.5"}
              id={`nav-section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
              role="menu"
              aria-label={section.title}
            >
              {section.items.map((item) => {
                const isActive = activePath === item.path;
                const brandIcon = getBrandIcon(item.icon);
                const materialColor = getMaterialIconColorClass(item.icon);

                return (
                  <li key={item.path}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "flex min-h-11 w-full items-center rounded-lg transition-colors",
                        collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2 text-sm leading-5",
                        isActive
                          ? "sidebar-item-active"
                          : "text-text-muted-light hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
                      ].join(" ")}
                      href={item.path}
                      onKeyDown={(event) => {
                        if (event.key === " ") {
                          event.preventDefault();
                          event.currentTarget.click();
                        }
                      }}
                      onClick={onItemClick}
                      role="menuitem"
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={collapsed ? "grid h-6 w-6 shrink-0 place-items-center" : "grid h-5 w-5 shrink-0 place-items-center"}>
                        {brandIcon ? (
                          <OptimizedBrandLogo
                            brand={brandIcon}
                            className={isActive ? "opacity-100" : "opacity-95"}
                            size={18}
                          />
                        ) : (
                          <span
                            className={[
                              "material-icons-round text-[18px]",
                              materialColor,
                              isActive ? "opacity-100" : "opacity-95"
                            ].join(" ")}
                          >
                            {item.icon}
                          </span>
                        )}
                      </span>
                      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ))}
    </nav>
  );
}

export default NavigationMenu;
