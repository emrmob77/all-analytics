"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "@/lib/queryClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import ToastViewport from "./components/ui/ToastViewport";

interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Layout>{children}</Layout>
        <ToastViewport />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
