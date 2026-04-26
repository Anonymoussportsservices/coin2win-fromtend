"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MockSoftSwissGameContent() {
  const params = useSearchParams();
  const gameId = params.get("game_id") || "unknown";
  const sessionPayload = params.get("session_payload") || "";
  const mode = params.get("mode") || "real";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f212e] p-6 text-white">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#1a2c38] p-8 text-center shadow-2xl">
        <div className="text-6xl">🎰</div>
        <h1 className="mt-5 text-3xl font-black">SoftSwiss Mock Game</h1>
        <p className="mt-2 text-slate-300">Launcher iframe test is working.</p>
        <div className="mt-6 grid gap-3 rounded-2xl bg-black/25 p-4 text-left text-sm">
          <div><b>Game:</b> {gameId}</div>
          <div><b>Mode:</b> {mode}</div>
          <div className="break-all"><b>Session:</b> {sessionPayload}</div>
        </div>
      </section>
    </main>
  );
}

export default function MockSoftSwissGamePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0f212e]" />}>
      <MockSoftSwissGameContent />
    </Suspense>
  );
}
