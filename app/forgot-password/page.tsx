"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch("/ui-api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMsg(data?.message || data?.detail || "If that email exists, a reset link has been generated.");
    } catch (e: any) {
      setMsg(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="text-2xl font-black mb-2">Forgot Password</h1>
        <p className="text-sm text-white/70 mb-6">
          Enter your email and we’ll generate a reset link if the account exists.
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim()}
          className="mt-4 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold py-3"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {msg ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
            {msg}
          </div>
        ) : null}

        <div className="mt-5 text-sm text-white/70">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
