"use client";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAppStore } from "@/store/appStore";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-text-main-light transition-colors duration-200 dark:bg-background-dark dark:text-text-main-dark">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8" id="main-content">
          {children}
          <div className="h-8" />
        </main>
      </div>
    </div>
  );
}

export default Layout;
