"use client";

import { usePathname } from "next/navigation";

import { useBrand } from "@/contexts/BrandContext";
import BrandSelector from "@/components/navigation/BrandSelector";
import NavigationMenu from "@/components/navigation/NavigationMenu";
import { navigationSections } from "@/modules/moduleRegistry";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { brands, activeBrand, isLoading, selectBrand } = useBrand();
  const pathname = usePathname();

  return (
    <>
      <aside
        className={[
          "sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-border-light bg-surface-light transition-transform duration-200 dark:border-border-dark dark:bg-surface-dark md:static",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        ].join(" ")}
      >
        <div className="flex items-center gap-3 p-6">
          <div className="grid h-8 w-8 place-items-center rounded bg-primary text-lg font-bold text-white">A</div>
          <span className="text-xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
            Allanalytics
          </span>
          <button
            aria-label="Open company website"
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted-light transition-colors hover:text-primary dark:text-text-muted-dark"
            type="button"
          >
            <span className="material-icons-round text-lg">open_in_new</span>
          </button>
        </div>

        {activeBrand ? (
          <BrandSelector brand={activeBrand} brands={brands} onSelectBrand={selectBrand} />
        ) : (
          <div className="mb-6 px-4">
            <div className="h-[62px] animate-pulse rounded-lg border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark" />
            {isLoading ? (
              <p className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">Loading brands...</p>
            ) : null}
          </div>
        )}

        <NavigationMenu activePath={pathname} onItemClick={onClose} sections={navigationSections} />

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
              <div className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">Esra Bayatlı</div>
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
