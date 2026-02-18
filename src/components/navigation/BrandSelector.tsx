"use client";

import { useEffect, useRef, useState } from "react";

import type { Brand } from "@/types/navigation";

interface BrandSelectorProps {
  brand: Brand;
  brands: Brand[];
  onSelectBrand: (brand: Brand) => void;
}

function BrandSelector({ brand, brands, onSelectBrand }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative mb-6 px-4" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-3 rounded-lg border border-border-light bg-background-light p-3 text-left transition-colors hover:border-primary dark:border-border-dark dark:bg-background-dark"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">
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
          role="listbox"
        >
          {brands.map((item) => (
            <li key={item.id}>
              <button
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => {
                  onSelectBrand(item);
                  setOpen(false);
                }}
                type="button"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">
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
