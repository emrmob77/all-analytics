"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import AuthPageShell from "@/components/auth/AuthPageShell";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [token, setToken] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token");
    setToken(value ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        token: formData.get("token"),
        password: formData.get("password")
      })
    });

    const payload = (await response.json()) as { ok: boolean };
    setStatus(payload.ok ? "done" : "error");
  }

  return (
    <AuthPageShell subtitle="Use your reset token to set a new password." title="Reset password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Token</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="token" onChange={(event) => setToken(event.target.value)} required type="text" value={token} />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">New Password</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" minLength={8} name="password" required type="password" />
        </label>

        <button className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Update password
        </button>
      </form>

      {status === "done" ? <p className="mt-3 text-sm text-emerald-700">Password updated successfully.</p> : null}
      {status === "error" ? <p className="mt-3 text-sm text-rose-600">Token is invalid or expired.</p> : null}

      <div className="mt-4 text-sm">
        <Link className="text-slate-600 hover:underline" href="/login">
          Back to login
        </Link>
      </div>
    </AuthPageShell>
  );
}
