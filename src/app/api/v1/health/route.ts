import { createApiHandler } from "@/lib/api/handler";

export const GET = createApiHandler(async (_request, context) => ({
  data: {
    service: "allanalytics-bff",
    status: "ok",
    method: context.trace.method,
    path: context.trace.path
  }
}));
