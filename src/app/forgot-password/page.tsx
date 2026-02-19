"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import AuthPageShell from "@/components/auth/AuthPageShell";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email")
      })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      data?: {
        resetToken: string | null;
      };
    };

    if (!payload.ok) {
      setStatus("error");
      return;
    }

    setStatus("sent");
    setToken(payload.data?.resetToken ?? null);
  }

  return (
    <AuthPageShell subtitle="Enter your account email to request a password reset link." title="Forgot password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="email" required type="email" />
        </label>

        <button className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Send reset link
        </button>
      </form>

      {status === "sent" ? (
        <p className="mt-3 text-sm text-emerald-700">
          Reset request received. {token ? `Demo token: ${token}` : "Check your inbox for instructions."}
        </p>
      ) : null}

      {status === "error" ? <p className="mt-3 text-sm text-rose-600">Could not process request.</p> : null}

      <div className="mt-4 text-sm">
        <Link className="text-slate-600 hover:underline" href="/login">
          Back to login
        </Link>
      </div>
    </AuthPageShell>
  );
}
