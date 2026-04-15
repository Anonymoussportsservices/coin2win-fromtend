"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordClient({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch("/ui-api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();
      setMsg(data?.message || data?.detail || "Done");
    } catch (e: any) {
      setMsg(e?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="text-2xl font-black mb-2">Reset Password</h1>
        <p className="text-sm text-white/70 mb-6">
          Choose a new password for your account.
        </p>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
        />

        <button
          onClick={handleReset}
          disabled={loading || !token || password.length < 6}
          className="mt-4 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold py-3"
        >
          {loading ? "Resetting..." : "Reset Password"}
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
