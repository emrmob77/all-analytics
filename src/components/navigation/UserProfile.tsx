"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

interface UserProfileProps {
  name: string;
  role: string;
  avatarUrl: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

/**
 * Sidebar user profile block with dropdown actions.
 */
function UserProfile({
  avatarUrl,
  collapsed = false,
  name,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onToggleCollapse,
  role
}: UserProfileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (collapsed) {
    return (
      <div className="border-t border-border-light pt-3 dark:border-border-dark" ref={containerRef}>
        <div className="flex flex-col items-center gap-2">
          <button
            aria-expanded={menuOpen}
            aria-label="Open user menu"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <Image
              alt={`${name} profile`}
              className="h-9 w-9 rounded-full object-cover"
              height={36}
              sizes="36px"
              src={avatarUrl}
              width={36}
            />
          </button>

          {onToggleCollapse ? (
            <button
              aria-label="Expand sidebar"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:bg-gray-50 hover:text-primary dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={onToggleCollapse}
              type="button"
            >
              <span className="material-icons-round text-lg">chevron_right</span>
            </button>
          ) : null}
        </div>

        {menuOpen ? (
          <ul className="mt-2 space-y-1 rounded-lg border border-border-light bg-surface-light p-1 text-xs shadow-lg dark:border-border-dark dark:bg-surface-dark">
            <li>
              <button
                className="w-full rounded-md px-2 py-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={onProfileClick}
                type="button"
              >
                Profile
              </button>
            </li>
            <li>
              <button
                className="w-full rounded-md px-2 py-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={onSettingsClick}
                type="button"
              >
                Settings
              </button>
            </li>
            <li>
              <button
                className="w-full rounded-md px-2 py-1 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                onClick={onLogout}
                type="button"
              >
                Logout
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-border-light pt-3 dark:border-border-dark" ref={containerRef}>
      <div className="flex items-center gap-3">
        <button
          aria-expanded={menuOpen}
          aria-label="Open user menu"
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          <Image
            alt={`${name} profile`}
            className="h-10 w-10 rounded-full object-cover"
            height={40}
            sizes="40px"
            src={avatarUrl}
            width={40}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text-main-light dark:text-text-main-dark">{name}</div>
            <div className="truncate text-xs text-text-muted-light dark:text-text-muted-dark">{role}</div>
          </div>
          <span
            className={cn(
              "material-icons-round ml-auto text-base text-text-muted-light transition-transform dark:text-text-muted-dark",
              menuOpen ? "rotate-180" : ""
            )}
          >
            expand_more
          </span>
        </button>

        {onToggleCollapse ? (
          <button
            aria-label="Collapse sidebar"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:bg-gray-50 hover:text-primary dark:text-text-muted-dark dark:hover:bg-gray-800"
            onClick={onToggleCollapse}
            type="button"
          >
            <span className="material-icons-round text-lg">chevron_left</span>
          </button>
        ) : null}
      </div>

      {menuOpen ? (
        <ul className="mt-2 space-y-1 rounded-lg border border-border-light bg-surface-light p-1 text-sm shadow-lg dark:border-border-dark dark:bg-surface-dark">
          <li>
            <button
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={onProfileClick}
              type="button"
            >
              <span className="material-icons-round text-base">person</span>
              Profile
            </button>
          </li>
          <li>
            <button
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={onSettingsClick}
              type="button"
            >
              <span className="material-icons-round text-base">settings</span>
              Settings
            </button>
          </li>
          <li>
            <button
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
              onClick={onLogout}
              type="button"
            >
              <span className="material-icons-round text-base">logout</span>
              Logout
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export default UserProfile;
