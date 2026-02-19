"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useBrand } from "@/contexts/BrandContext";
import { useAppStore } from "@/store/appStore";
import BrandSelector from "@/components/navigation/BrandSelector";
import NavigationMenu from "@/components/navigation/NavigationMenu";
import UserProfile from "@/components/navigation/UserProfile";
import Badge from "@/components/ui/Badge";
import Logo from "@/components/ui/Logo";
import { backdropVariants, mobileSidebarVariants, modalTransition, withReducedMotion } from "@/lib/animations";
import { toast } from "@/lib/toast";
import { navigationSections } from "@/modules/moduleRegistry";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarContentProps {
  pathname: string | null;
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function getAvatarColorClass(avatar: string) {
  if (avatar === "NR") return "bg-blue-100 text-blue-700";
  if (avatar === "ML") return "bg-amber-100 text-amber-700";
  return "bg-secondary text-primary";
}

function SidebarContent({ onItemClick, onToggleCollapse, pathname, collapsed = false }: SidebarContentProps) {
  const { brands, activeBrand, isLoading, selectBrand } = useBrand();
  const activePath = pathname ?? "/";

  return (
    <>
      {collapsed ? (
        <div className="flex flex-col items-center px-2 py-3">
          <Logo showExternalLink={false} showText={false} size="md" />
        </div>
      ) : (
        <div className="px-5 py-4">
          <Logo />
        </div>
      )}

      {!collapsed ? (
        activeBrand ? (
          <BrandSelector brand={activeBrand} brands={brands} onSelectBrand={selectBrand} />
        ) : (
          <div className="mb-5 px-4">
            <div className="h-[62px] animate-pulse rounded-lg border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark" />
            {isLoading ? (
              <p className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">Loading brands...</p>
            ) : null}
          </div>
        )
      ) : (
        <div className="mb-4 flex justify-center px-2">
          {activeBrand ? (
            <button
              aria-label={`Active brand ${activeBrand.name}`}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark"
              title={activeBrand.name}
              type="button"
            >
              <span
                className={[
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
                  getAvatarColorClass(activeBrand.avatar)
                ].join(" ")}
              >
                {activeBrand.avatar}
              </span>
            </button>
          ) : (
            <div className="h-10 w-10 animate-pulse rounded-full border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark" />
          )}
        </div>
      )}

      <NavigationMenu activePath={activePath} collapsed={collapsed} onItemClick={onItemClick} sections={navigationSections} />

      {collapsed ? (
        <div className="mt-4 px-2 pb-4 pt-3">
          <div className="space-y-1">
            <button
              className="relative flex min-h-11 w-full items-center justify-center rounded-lg text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => toast.info("Notifications panel will be available soon.")}
              title="Notifications"
              type="button"
            >
              <span className="material-icons-round text-[20px] text-rose-500 dark:text-rose-400">notifications</span>
              <span className="sr-only">Notifications</span>
              <span className="absolute right-1 top-1">
                <Badge size="sm" variant="notification">
                  5
                </Badge>
              </span>
            </button>
            <button
              className="flex min-h-11 w-full items-center justify-center rounded-lg text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => toast.info("Support center will be available soon.")}
              title="Support"
              type="button"
            >
              <span className="material-icons-round text-[20px] text-sky-500 dark:text-sky-400">help_outline</span>
              <span className="sr-only">Support</span>
            </button>
          </div>

          <div className="mt-3">
            <UserProfile
              avatarUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80&fm=webp"
              collapsed
              name="Esra Bayatli"
              onLogout={() => toast.info("Logout action not connected in demo mode.")}
              onProfileClick={() => toast.info("Profile page will be available soon.")}
              onSettingsClick={() => toast.info("Settings page will be available soon.")}
              onToggleCollapse={onToggleCollapse}
              role="Super Admin"
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 px-4 pb-4 pt-3">
          <div className="mb-3 space-y-1">
            <button
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => toast.info("Notifications panel will be available soon.")}
              type="button"
            >
              <span className="material-icons-round text-[20px] text-rose-500 dark:text-rose-400">notifications</span>
              Notifications
              <span className="ml-auto">
                <Badge size="sm" variant="notification">
                  5
                </Badge>
              </span>
            </button>
            <button
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted-light transition-colors hover:bg-gray-50 dark:text-text-muted-dark dark:hover:bg-gray-800"
              onClick={() => toast.info("Support center will be available soon.")}
              type="button"
            >
              <span className="material-icons-round text-[20px] text-sky-500 dark:text-sky-400">help_outline</span>
              Support
            </button>
          </div>

          <UserProfile
            avatarUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80&fm=webp"
            name="Esra Bayatli"
            onLogout={() => toast.info("Logout action not connected in demo mode.")}
            onProfileClick={() => toast.info("Profile page will be available soon.")}
            onSettingsClick={() => toast.info("Settings page will be available soon.")}
            onToggleCollapse={onToggleCollapse}
            role="Super Admin"
          />
        </div>
      )}
    </>
  );
}

/**
 * Responsive application sidebar for desktop and mobile layouts.
 */
function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useAppStore((state) => state.toggleSidebarCollapsed);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function handleChange(event: MediaQueryListEvent) {
      if (event.matches && isOpen) {
        onClose();
      }
    }

    if (mediaQuery.matches && isOpen) {
      onClose();
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <aside
        aria-label="Primary sidebar"
        className={[
          "sidebar-scroll hidden flex-col overflow-y-auto border-r border-border-light bg-surface-light transition-[width] duration-200 dark:border-border-dark dark:bg-surface-dark md:flex",
          sidebarCollapsed ? "w-[88px]" : "w-[280px]"
        ].join(" ")}
      >
        <SidebarContent collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapsed} pathname={pathname} />
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              animate="visible"
              aria-label="Close sidebar"
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              exit="exit"
              initial="hidden"
              onClick={onClose}
              transition={withReducedMotion(Boolean(shouldReduceMotion), modalTransition)}
              type="button"
              variants={backdropVariants}
            />
            <motion.aside
              animate="visible"
              aria-label="Mobile sidebar"
              className="sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col overflow-y-auto border-r border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark md:hidden"
              exit="exit"
              initial="hidden"
              transition={withReducedMotion(Boolean(shouldReduceMotion), modalTransition)}
              variants={mobileSidebarVariants}
            >
              <SidebarContent onItemClick={onClose} pathname={pathname} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
