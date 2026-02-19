"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import AuthPageShell from "@/components/auth/AuthPageShell";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: {
        message: string;
      };
    };

    setSubmitting(false);

    if (!payload.ok) {
      setError(payload.error?.message ?? "Registration failed.");
      return;
    }

    setMessage("Account created. Redirecting to login...");
    window.setTimeout(() => router.push("/login"), 800);
  }

  return (
    <AuthPageShell subtitle="Create your workspace user account." title="Create account">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Full Name</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="fullName" required type="text" />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="email" required type="email" />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Password</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" minLength={8} name="password" required type="password" />
        </label>

        <button className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" disabled={submitting} type="submit">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 text-sm">
        <Link className="text-slate-600 hover:underline" href="/login">
          Already have an account?
        </Link>
      </div>
    </AuthPageShell>
  );
}
