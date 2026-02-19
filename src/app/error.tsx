"use client";

import ErrorPage from "@/pages/ErrorPage";

interface RouteErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function RouteErrorPage({ error, reset }: RouteErrorPageProps) {
  return <ErrorPage error={error} reset={reset} />;
}
