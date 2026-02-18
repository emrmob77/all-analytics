"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useTheme } from "@/contexts/ThemeContext";
import SearchBar from "@/components/ui/SearchBar";

interface HeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  "/": "Overview Dashboard",
  "/performance": "Performance",
  "/campaigns": "Campaigns",
  "/channels": "Channels",
  "/integrations": "Integrations",
  "/attribution": "Attribution",
  "/team": "Team",
  "/settings": "Settings"
};

function getPageTitle(pathname: string) {
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) return "Overview Dashboard";
  return lastSegment
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [actionsOpen, setActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!quickActionsRef.current) return;
      if (event.target instanceof Node && !quickActionsRef.current.contains(event.target)) {
        setActionsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="h-20 border-b border-border-light bg-surface-light px-4 dark:border-border-dark dark:bg-surface-dark md:px-8">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4">
        <h1 className="truncate text-lg font-bold tracking-tight text-text-main-light dark:text-text-main-dark md:text-2xl">
          {getPageTitle(pathname)}
        </h1>

        <div className="flex items-center gap-2 md:gap-4">
          <SearchBar />

          <button
            aria-label="Toggle theme"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light bg-surface-light text-text-muted-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-muted-dark dark:hover:bg-gray-800"
            onClick={toggleTheme}
            type="button"
          >
            <span className="material-icons-round text-lg">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
          </button>

          <div className="relative" ref={quickActionsRef}>
            <button
              aria-expanded={actionsOpen}
              aria-haspopup="menu"
              aria-label="Open quick actions"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light bg-surface-light text-text-muted-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => setActionsOpen((prev) => !prev)}
              type="button"
            >
              <span className="material-icons-round text-lg">more_horiz</span>
            </button>

            {actionsOpen ? (
              <ul
                className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-48 space-y-1 rounded-lg border border-border-light bg-surface-light p-2 shadow-md dark:border-border-dark dark:bg-surface-dark"
                role="menu"
              >
                <li>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-main-light transition-colors hover:bg-gray-50 dark:text-text-main-dark dark:hover:bg-gray-800"
                    onClick={() => setActionsOpen(false)}
                    role="menuitem"
                    type="button"
                  >
                    <span className="material-icons-round text-base">file_download</span>
                    Export report
                  </button>
                </li>
                <li>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-main-light transition-colors hover:bg-gray-50 dark:text-text-main-dark dark:hover:bg-gray-800"
                    onClick={() => setActionsOpen(false)}
                    role="menuitem"
                    type="button"
                  >
                    <span className="material-icons-round text-base">notifications</span>
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-main-light transition-colors hover:bg-gray-50 dark:text-text-main-dark dark:hover:bg-gray-800"
                    onClick={() => setActionsOpen(false)}
                    role="menuitem"
                    type="button"
                  >
                    <span className="material-icons-round text-base">settings</span>
                    Preferences
                  </button>
                </li>
              </ul>
            ) : null}
          </div>

          <button
            aria-label="Open sidebar"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark md:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <span className="material-icons-round text-lg">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
