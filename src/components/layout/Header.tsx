"use client";

import { useTheme } from "@/contexts/ThemeContext";
import usePageTitle from "@/hooks/usePageTitle";
import SearchBar from "@/components/ui/SearchBar";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const pageTitle = usePageTitle();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-20 flex-shrink-0 items-center justify-between border-b border-border-light bg-surface-light px-4 dark:border-border-dark dark:bg-surface-dark md:px-8">
      <h1 className="truncate text-lg font-bold tracking-tight text-text-main-light dark:text-text-main-dark md:text-2xl">
        {pageTitle}
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

        <button
          aria-label="Open quick actions"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light bg-surface-light text-text-muted-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-muted-dark dark:hover:bg-gray-800"
          type="button"
        >
          <span className="material-icons-round text-lg">more_horiz</span>
        </button>

        <button
          aria-label="Open sidebar"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark md:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="material-icons-round text-lg">menu</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
