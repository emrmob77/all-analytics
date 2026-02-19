"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "@/lib/queryClient";
import Layout from "./components/layout/Layout";
import ToastViewport from "./components/ui/ToastViewport";

interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>{children}</Layout>
      <ToastViewport />
    </QueryClientProvider>
  );
}

export default App;
