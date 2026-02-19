import { createHash, randomUUID } from "crypto";

export type AppRole = "owner" | "admin" | "member" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  tenantId: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
  role: AppRole;
  expiresAt: string;
  refreshExpiresAt: string;
  createdAt: string;
}

interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: string;
}

function hashSecret(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function plusHours(hours: number): string {
  const date = new Date();
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

function plusDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

const userStore = new Map<string, AuthUser>();
const userByEmailStore = new Map<string, string>();
const sessionStore = new Map<string, AuthSession>();
const refreshIndexStore = new Map<string, string>();
const passwordResetStore = new Map<string, PasswordResetToken>();

const seedUser: AuthUser = {
  id: newId("user"),
  email: "owner@allanalytics.app",
  fullName: "Allanalytics Owner",
  role: "owner",
  tenantId: "brand-1",
  passwordHash: hashSecret("Allanalytics123!"),
  createdAt: nowIso(),
  updatedAt: nowIso()
};

userStore.set(seedUser.id, seedUser);
userByEmailStore.set(seedUser.email.toLowerCase(), seedUser.id);

function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function listUsers() {
  return [...userStore.values()].map((user) => sanitizeUser(user));
}

function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
  tenantId?: string;
  role?: AppRole;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (userByEmailStore.has(normalizedEmail)) {
    return { error: "EMAIL_IN_USE" as const };
  }

  const now = nowIso();
  const user: AuthUser = {
    id: newId("user"),
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    role: input.role ?? "member",
    tenantId: input.tenantId ?? "brand-1",
    passwordHash: hashSecret(input.password),
    createdAt: now,
    updatedAt: now
  };

  userStore.set(user.id, user);
  userByEmailStore.set(normalizedEmail, user.id);

  return { user: sanitizeUser(user) };
}

function createSessionForUser(user: AuthUser): AuthSession {
  const session: AuthSession = {
    accessToken: newId("access"),
    refreshToken: newId("refresh"),
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    expiresAt: plusHours(8),
    refreshExpiresAt: plusDays(30),
    createdAt: nowIso()
  };

  sessionStore.set(session.accessToken, session);
  refreshIndexStore.set(session.refreshToken, session.accessToken);
  return session;
}

function loginUser(input: { email: string; password: string }) {
  const userId = userByEmailStore.get(input.email.trim().toLowerCase());

  if (!userId) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const user = userStore.get(userId);

  if (!user || user.passwordHash !== hashSecret(input.password)) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const session = createSessionForUser(user);
  return {
    session,
    user: sanitizeUser(user)
  };
}

function getSession(accessToken: string) {
  const session = sessionStore.get(accessToken);

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    revokeSession(session.accessToken);
    return null;
  }

  const user = userStore.get(session.userId);

  if (!user) {
    revokeSession(session.accessToken);
    return null;
  }

  return {
    session,
    user: sanitizeUser(user)
  };
}

function revokeSession(accessToken: string) {
  const session = sessionStore.get(accessToken);

  if (!session) {
    return;
  }

  sessionStore.delete(accessToken);
  refreshIndexStore.delete(session.refreshToken);
}

function refreshSession(refreshToken: string) {
  const accessToken = refreshIndexStore.get(refreshToken);

  if (!accessToken) {
    return { error: "INVALID_REFRESH_TOKEN" as const };
  }

  const session = sessionStore.get(accessToken);

  if (!session || new Date(session.refreshExpiresAt).getTime() <= Date.now()) {
    if (session) {
      revokeSession(session.accessToken);
    }

    return { error: "REFRESH_TOKEN_EXPIRED" as const };
  }

  const user = userStore.get(session.userId);

  if (!user) {
    revokeSession(session.accessToken);
    return { error: "USER_NOT_FOUND" as const };
  }

  revokeSession(session.accessToken);
  const nextSession = createSessionForUser(user);

  return {
    session: nextSession,
    user: sanitizeUser(user)
  };
}

function createPasswordResetToken(email: string) {
  const userId = userByEmailStore.get(email.trim().toLowerCase());

  if (!userId) {
    return null;
  }

  const token = newId("pwd_reset");

  passwordResetStore.set(token, {
    token,
    userId,
    expiresAt: plusHours(1)
  });

  return token;
}

function resetPassword(input: { token: string; nextPassword: string }) {
  const resetToken = passwordResetStore.get(input.token);

  if (!resetToken || new Date(resetToken.expiresAt).getTime() <= Date.now()) {
    return { error: "RESET_TOKEN_INVALID" as const };
  }

  const user = userStore.get(resetToken.userId);

  if (!user) {
    passwordResetStore.delete(input.token);
    return { error: "USER_NOT_FOUND" as const };
  }

  const nextUser: AuthUser = {
    ...user,
    passwordHash: hashSecret(input.nextPassword),
    updatedAt: nowIso()
  };

  userStore.set(nextUser.id, nextUser);
  passwordResetStore.delete(input.token);

  return {
    user: sanitizeUser(nextUser)
  };
}

export {
  createPasswordResetToken,
  getSession,
  listUsers,
  loginUser,
  refreshSession,
  registerUser,
  resetPassword,
  revokeSession
};
