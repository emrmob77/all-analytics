"use client";

import { Suspense } from "react";

import { moduleByKey, type ModuleKey } from "./moduleRegistry";

interface ModulePlaceholderRendererProps {
  moduleKey: ModuleKey;
}

function ModulePlaceholderRenderer({ moduleKey }: ModulePlaceholderRendererProps) {
  const module = moduleByKey[moduleKey];
  const ModuleComponent = module.component;

  return (
    <Suspense
      fallback={
        <section className="rounded-xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading module...</p>
        </section>
      }
    >
      <ModuleComponent />
    </Suspense>
  );
}

export default ModulePlaceholderRenderer;
