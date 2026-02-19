"use client";

import { FormEvent, useEffect, useState } from "react";

import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

function KnowledgeBaseModule() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadArticles(nextQuery?: string) {
    setIsLoading(true);

    try {
      const suffix = nextQuery ? `?query=${encodeURIComponent(nextQuery)}` : "";
      const data = await requestApi<{ articles: KnowledgeArticle[] }>(`/api/v1/support/articles${suffix}`);
      setArticles(data.articles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Knowledge base could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadArticles(query);
  }

  return (
    <section className="space-y-4 rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Knowledge Base</h2>
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Search onboarding, integration, and troubleshooting guides.</p>

      <form className="flex flex-wrap gap-2" onSubmit={submitSearch}>
        <input
          className="min-w-60 flex-1 rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs"
          value={query}
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">
          Search
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading articles...</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <article className="rounded-lg border border-border-light p-4 dark:border-border-dark" key={article.id}>
              <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{article.title}</h3>
              <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">{article.summary}</p>
              <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">{article.body}</p>
              <p className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">Tags: {article.tags.join(", ")}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default KnowledgeBaseModule;
