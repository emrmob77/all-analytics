import { createApiHandler } from "@/lib/api/handler";
import { readStringParam } from "@/lib/api/validation";
import { listKnowledgeArticles } from "@/lib/saas/store";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);

  return {
    data: {
      articles: listKnowledgeArticles(readStringParam(url.searchParams, "query", { maxLength: 120 }))
    }
  };
});
