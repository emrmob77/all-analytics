"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  debounceMs?: number;
}

function SearchBar({ onSearch, debounceMs = 300 }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSearch?.(query.trim());
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, onSearch, query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;

      event.preventDefault();
      if (window.matchMedia("(max-width: 639px)").matches) {
        setMobileOpen(true);
        return;
      }
      desktopInputRef.current?.focus();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleShortcut);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      mobileInputRef.current?.focus();
    }
  }, [mobileOpen]);

  return (
    <>
      <label className="relative hidden md:block">
        <span className="material-icons-round pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-muted-light dark:text-text-muted-dark">
          search
        </span>
        <input
          aria-label="Search"
          className="w-64 rounded-lg border border-border-light bg-background-light py-2 pl-10 pr-16 text-sm text-text-main-light outline-none transition-colors placeholder:text-text-muted-light focus:border-transparent focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-background-dark dark:text-text-main-dark dark:placeholder:text-text-muted-dark"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          ref={desktopInputRef}
          type="search"
          value={query}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="inline-block rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:border-gray-600 dark:text-gray-400">
            ⌘K
          </kbd>
        </div>
      </label>

      <button
        aria-label="Open search"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-light bg-surface-light text-text-muted-light transition-colors hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-muted-dark dark:hover:bg-gray-800 md:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <span className="material-icons-round text-lg">search</span>
      </button>

      {mobileOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 p-4 md:hidden"
          onClick={() => setMobileOpen(false)}
          role="dialog"
        >
          <div
            className="mt-16 rounded-xl border border-border-light bg-surface-light p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark">search</span>
              <input
                aria-label="Mobile search"
                className="w-full border-0 bg-transparent text-sm text-text-main-light outline-none placeholder:text-text-muted-light focus:ring-0 dark:text-text-main-dark dark:placeholder:text-text-muted-dark"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                ref={mobileInputRef}
                type="search"
                value={query}
              />
              <button
                aria-label="Close search"
                className="min-h-11 min-w-11 rounded-lg text-text-muted-light dark:text-text-muted-dark"
                onClick={() => setMobileOpen(false)}
                type="button"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Shortcut: ⌘K</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default SearchBar;
