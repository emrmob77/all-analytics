import { createApiHandler } from "@/lib/api/handler";
import { buildClearSessionCookieHeaders } from "@/lib/auth/cookies";
import { revokeSession } from "@/lib/auth/mockAuthStore";

export const POST = createApiHandler(async (request) => {
  const cookies = request.headers.get("cookie") ?? "";
  const accessToken = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("allanalytics_session="))
    ?.split("=")[1];

  if (accessToken) {
    revokeSession(accessToken);
  }

  return {
    data: {
      success: true
    },
    headers: buildClearSessionCookieHeaders()
  };
}, {
  audit: {
    action: "auth.logout"
  }
});
