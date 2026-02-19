"use client";

import { useEffect, useRef, useState } from "react";

import type { Brand } from "@/types/navigation";

interface BrandSelectorProps {
  brand: Brand;
  brands: Brand[];
  onSelectBrand: (brand: Brand) => void;
}

function getAvatarColorClass(avatar: string) {
  if (avatar === "NR") return "bg-blue-100 text-blue-700";
  if (avatar === "ML") return "bg-amber-100 text-amber-700";
  return "bg-secondary text-primary";
}

function BrandSelector({ brand, brands, onSelectBrand }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = "brand-selector-menu";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function getFocusableElements() {
      if (!rootRef.current) return [] as HTMLElement[];
      return Array.from(
        rootRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));
    }

    function getMenuButtons() {
      if (!rootRef.current) return [] as HTMLButtonElement[];
      return Array.from(rootRef.current.querySelectorAll<HTMLButtonElement>('button[data-brand-option="true"]'));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
          return;
        }

        if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const menuButtons = getMenuButtons();
        if (menuButtons.length === 0) return;

        event.preventDefault();
        const activeIndex = menuButtons.findIndex((button) => button === document.activeElement);

        if (activeIndex === -1) {
          menuButtons[0]?.focus();
          return;
        }

        const nextIndex =
          event.key === "ArrowDown"
            ? (activeIndex + 1) % menuButtons.length
            : (activeIndex - 1 + menuButtons.length) % menuButtons.length;

        menuButtons[nextIndex]?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    window.setTimeout(() => {
      const menuButtons = getMenuButtons();
      menuButtons[0]?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative mb-5 px-4" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-lg border border-border-light bg-background-light p-3 text-left transition-colors hover:border-primary dark:border-border-dark dark:bg-background-dark"
        onClick={() => setOpen((prev) => !prev)}
        ref={triggerRef}
        type="button"
      >
        <div
          className={[
            "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
            getAvatarColorClass(brand.avatar)
          ].join(" ")}
        >
          {brand.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-text-main-light dark:text-text-main-dark">
            {brand.name}
          </div>
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
            {brand.activeAdmins} admins active
          </div>
        </div>
        <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark">
          expand_more
        </span>
      </button>

      {open ? (
        <ul
          className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-50 space-y-1 rounded-lg border border-border-light bg-surface-light p-2 shadow-md dark:border-border-dark dark:bg-surface-dark"
          id={menuId}
          role="menu"
          aria-label="Brand options"
        >
          {brands.map((item) => (
            <li key={item.id}>
              <button
                aria-checked={item.id === brand.id}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                data-brand-option="true"
                onClick={() => {
                  onSelectBrand(item);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                role="menuitemradio"
                type="button"
              >
                <div
                  className={[
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
                    getAvatarColorClass(item.avatar)
                  ].join(" ")}
                >
                  {item.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-main-light dark:text-text-main-dark">
                    {item.name}
                  </div>
                  <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    {item.activeAdmins} admins active
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default BrandSelector;
