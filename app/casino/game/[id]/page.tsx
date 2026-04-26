"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PlayerShell from "@/components/PlayerShell";

type LaunchState = {
  loading: boolean;
  error: string;
  title: string;
  launchUrl: string;
  mock: boolean;
};

export default function SoftSwissGameLaunchPage() {
  const params = useParams();
  const gameId = String(params?.id || "");
  const [state, setState] = useState<LaunchState>({
    loading: true,
    error: "",
    title: "Casino Game",
    launchUrl: "",
    mock: false,
  });

  useEffect(() => {
    let mounted = true;

    async function launch() {
      try {
        const res = await fetch("/ui-api/casino/softswiss/launch", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            user_id: "player_001",
            game_id: gameId,
            mode: "real",
          }),
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !data?.launch_url) {
          throw new Error(data?.detail || "Unable to launch game");
        }

        if (!mounted) return;
        setState({
          loading: false,
          error: "",
          title: data.title || "Casino Game",
          launchUrl: data.launch_url,
          mock: Boolean(data.mock),
        });
      } catch (e: any) {
        if (!mounted) return;
        setState({
          loading: false,
          error: e?.message || "Launch failed",
          title: "Casino Game",
          launchUrl: "",
          mock: false,
        });
      }
    }

    if (gameId) launch();

    return () => {
      mounted = false;
    };
  }, [gameId]);

  return (
    <PlayerShell title={state.title} subtitle={state.mock ? "Mock launcher session" : "Live casino session"} fullWidth>
      <div className="grid gap-3 text-white">
        {state.loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-300">
            Launching game...
          </div>
        ) : state.error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {state.error}
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_18px_44px_rgba(0,0,0,0.35)]">
            <iframe
              src={state.launchUrl}
              title={state.title}
              className="h-[72vh] w-full border-0"
              allow="autoplay; fullscreen; clipboard-read; clipboard-write"
              allowFullScreen
            />
          </section>
        )}
      </div>
    </PlayerShell>
  );
}
