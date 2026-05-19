"use client";

import { useEffect, useState } from "react";

type LiveFeedItem = {
  id?: string;
  user?: string;
  display_user?: string;
  message?: string;
  game?: string;
  game_name?: string;
  payout?: number;
  amount_usd?: number;
  multiplier?: number | null;
  source?: string;
  created_at?: string;
  occurred_at?: string;
};

function fmtMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function normalizeGameLabel(item: LiveFeedItem) {
  const raw = String(item.game_name || item.game || "Game").toLowerCase();
  if (raw === "crash") return "Crash";
  if (raw === "dice") return "Dice";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function normalizePlayer(item: LiveFeedItem) {
  return String(item.display_user || item.user || "Player");
}

export default function LobbyLiveFeed() {
  const [items, setItems] = useState<LiveFeedItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      try {
        const res = await fetch("/ui-api/studio/live-wins?limit=50", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data?.detail === "string" ? data.detail : "Failed to load live feed");
        }

        const nextItems: LiveFeedItem[] = Array.isArray(data?.items)
          ? data.items.filter((item: any) => String(item?.source || "") === "real")
          : [];

        if (!mounted) return;
        setItems(nextItems);
      } catch {
        if (!mounted) return;
        setItems([]);
      }
    }

    loadFeed();
    const refreshTimer = setInterval(loadFeed, 5000);

    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  const visible = items.slice(0, 12);


  return (
    <section className="block w-full min-w-0 max-w-none rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm sm:rounded-3xl sm:p-4">
      <div className="mb-3 min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">
          Live Bets Feed
        </div>
        <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
          
        </h2>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-400">
          No real live bets yet.
        </div>
      ) : (
        <div className="group overflow-hidden">
          <div className="flex w-max animate-[liveTicker_28s_linear_infinite] gap-2 overflow-x-auto pb-1 group-hover:[animation-play-state:paused] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:w-max md:overflow-x-auto">
          {visible.map((item, i) => {
            const gameLabel = normalizeGameLabel(item);
            const player = normalizePlayer(item);
            const payout = Number(item.payout || item.amount_usd || 0);

            return (
              <div
                key={`${item.id}-${i}`}
                className="flex min-w-[260px] md:min-w-[320px] items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#1a2c38] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:border-emerald-400/25 hover:bg-[#213743]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-black text-white">{player}</span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                      Win
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span>on</span>
                    <span className="font-bold text-sky-300">{gameLabel}</span>
                    {item.multiplier != null ? (
                      <span className="rounded-full bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-emerald-300">
                        {Number(item.multiplier).toFixed(2)}x
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-black text-emerald-300 sm:text-base">{fmtMoney(payout)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payout</div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    <style jsx>{`
        @keyframes liveTicker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-45%);
          }
        }
      `}</style>
    </section>
  );
}
