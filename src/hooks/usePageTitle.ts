"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import { getPageTitleByPath } from "@/modules/moduleRegistry";

function usePageTitle() {
  const pathname = usePathname();

  const pageTitle = useMemo(() => getPageTitleByPath(pathname ?? "/"), [pathname]);

  useEffect(() => {
    document.title = `Allanalytics - ${pageTitle}`;
  }, [pageTitle]);

  return pageTitle;
}

export default usePageTitle;
