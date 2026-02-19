interface SessionCookieInput {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

function buildSessionCookieHeaders(input: SessionCookieInput) {
  const shared = "Path=/; HttpOnly; SameSite=Lax";
  const accessCookie = `allanalytics_session=${input.accessToken}; ${shared}; Expires=${new Date(input.expiresAt).toUTCString()}`;
  const refreshCookie = `allanalytics_refresh=${input.refreshToken}; ${shared}; Expires=${new Date(input.refreshExpiresAt).toUTCString()}`;

  const headers = new Headers();
  headers.append("set-cookie", accessCookie);
  headers.append("set-cookie", refreshCookie);

  return headers;
}

function buildClearSessionCookieHeaders() {
  const shared = "Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const headers = new Headers();
  headers.append("set-cookie", `allanalytics_session=; ${shared}`);
  headers.append("set-cookie", `allanalytics_refresh=; ${shared}`);
  return headers;
}

export { buildClearSessionCookieHeaders, buildSessionCookieHeaders };
