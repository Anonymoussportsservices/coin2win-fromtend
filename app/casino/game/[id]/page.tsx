"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function GamePage() {
  const params = useParams();
  const gameId = params?.id as string;
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const [sessionPayload, setSessionPayload] = useState("");

  async function loadGame() {
    try {
      setLoading(true);
      setError("");
      setLaunchUrl("");

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

      const res = await fetch("/ui-api/casino/softswiss/launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.launch_url) {
        throw new Error(data?.detail || "Launch failed");
      }

      setLaunchUrl(data.launch_url);
      setSessionPayload(data.session_payload || "");
    } catch (err: any) {
      setError(err?.message || "Game failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function goFullscreen() {
    try {
      if (wrapRef.current && document.fullscreenElement !== wrapRef.current) {
        await wrapRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
  }

  useEffect(() => {
    if (gameId) loadGame();
  }, [gameId]);

  return (
    <div className="min-h-screen bg-[#0f212e] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0f212e]/95 px-3 py-3 backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-black sm:text-base">{gameId}</div>
            <div className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
              {sessionPayload ? `Session ${sessionPayload.slice(0, 8)}...` : "Casino launcher"}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={loadGame}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-200 hover:bg-black/40"
            >
              Reload
            </button>

            <button
              onClick={goFullscreen}
              className="hidden rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-slate-200 hover:bg-black/40 sm:inline-flex"
            >
              Fullscreen
            </button>

            <Link
              href="/casino"
              className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-[#071824] hover:bg-emerald-300"
            >
              Exit
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] p-2 sm:p-4">
        <div
          ref={wrapRef}
          className="relative flex h-[calc(100vh-82px)] min-h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_22px_60px_rgba(0,0,0,0.35)] sm:h-[calc(100vh-96px)] sm:rounded-3xl"
        >
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
              <div className="text-sm font-bold text-slate-300">Loading game...</div>
            </div>
          )}

          {!loading && error && (
            <div className="flex max-w-sm flex-col items-center gap-4 p-6 text-center">
              <div className="text-2xl font-black">Game unavailable</div>
              <div className="text-sm leading-6 text-slate-400">{error}</div>
              <button
                onClick={loadGame}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#071824] hover:bg-emerald-300"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && launchUrl && (
            <iframe
              src={launchUrl}
              className="h-full w-full border-0 bg-black"
              allow="fullscreen; autoplay"
              allowFullScreen
            />
          )}
        </div>
      </main>
    </div>
  );
}
