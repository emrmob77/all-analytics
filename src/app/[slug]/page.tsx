import { notFound, redirect } from "next/navigation";

import App from "@/App";
import DynamicRouteModule from "@/modules/DynamicRouteModule";
import { dynamicRouteSlugs, getDynamicRouteConfig } from "@/modules/dynamicRoutes";

interface DynamicRoutePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return dynamicRouteSlugs.map((slug) => ({ slug }));
}

export default async function DynamicRoutePage({ params }: DynamicRoutePageProps) {
  const { slug } = await params;
  const config = getDynamicRouteConfig(slug);

  if (!config) {
    notFound();
  }

  if (config.kind === "redirect" && config.redirectTo) {
    redirect(config.redirectTo);
  }

  return (
    <App>
      <DynamicRouteModule config={config} />
    </App>
  );
}
