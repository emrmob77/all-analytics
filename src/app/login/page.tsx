"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import AuthPageShell from "@/components/auth/AuthPageShell";
import { useAuthSession } from "@/contexts/AuthSessionContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthSession();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      data?: {
        user: {
          id: string;
          email: string;
          fullName: string;
          role: "owner" | "admin" | "member" | "viewer";
          tenantId: string;
        };
        session: {
          expiresAt: string;
        };
      };
      error?: {
        message: string;
      };
    };

    setSubmitting(false);

    if (!payload.ok || !payload.data) {
      setError(payload.error?.message ?? "Login failed.");
      return;
    }

    login({
      user: payload.data.user,
      expiresAt: payload.data.session.expiresAt
    });

    const nextPath =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    router.push(nextPath ?? "/");
  }

  return (
    <AuthPageShell subtitle="Sign in to access workspace dashboards and settings." title="Welcome back">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" defaultValue="owner@allanalytics.app" name="email" type="email" />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Password</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" defaultValue="Allanalytics123!" name="password" type="password" />
        </label>

        <button className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-slate-600 hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="text-slate-600 hover:underline" href="/register">
          Create account
        </Link>
      </div>
    </AuthPageShell>
  );
}
