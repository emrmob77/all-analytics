import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { buildSessionCookieHeaders } from "@/lib/auth/cookies";
import { getSession, refreshSession } from "@/lib/auth/mockAuthStore";

function parseCookieValue(cookieHeader: string, key: string) {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`))
    ?.split("=")[1];
}

export const GET = createApiHandler(async (request) => {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const accessToken = parseCookieValue(cookieHeader, "allanalytics_session");

  if (accessToken) {
    const activeSession = getSession(accessToken);

    if (activeSession) {
      return {
        data: {
          user: activeSession.user,
          session: activeSession.session
        }
      };
    }
  }

  const refreshToken = parseCookieValue(cookieHeader, "allanalytics_refresh");

  if (refreshToken) {
    const refreshed = refreshSession(refreshToken);

    if (!("error" in refreshed)) {
      return {
        data: {
          user: refreshed.user,
          session: refreshed.session
        },
        headers: buildSessionCookieHeaders(refreshed.session)
      };
    }
  }

  throw new ApiError({
    status: 401,
    code: "SESSION_NOT_FOUND",
    message: "No active session found.",
    expose: true
  });
}, {
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "auth-session"
  }
});
