"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      try {
        const res = await fetch("/api/studio/live-wins?limit=24", {
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

  useEffect(() => {
    if (items.length <= 1) return;

    const rotateTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2800);

    return () => clearInterval(rotateTimer);
  }, [items]);

  const visible = useMemo(() => {
    if (!items.length) return [];
    const ordered = [...items.slice(index), ...items.slice(0, index)];
    return ordered.slice(0, 8);
  }, [items, index]);

  return (
    <section className="block w-full min-w-0 max-w-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="mb-3 min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">
          Live Bets Feed
        </div>
        <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
          Recent real player action
        </h2>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Real wins and cashouts only.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-400">
          No real live bets yet.
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((item, i) => {
            const gameLabel = normalizeGameLabel(item);
            const player = normalizePlayer(item);
            const payout = Number(item.payout || item.amount_usd || 0);

            return (
              <div
                key={item.id ?? `${player}-${gameLabel}-${payout}-${i}`}
                className="flex min-h-[52px] sm:min-h-[72px] items-center justify-center rounded-xl border border-white/5 bg-[linear-gradient(180deg,#1a2c38_0%,#13202a_100%)] px-2.5 py-1.5 sm:px-3 sm:py-2 text-center shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
              >
                <div className="flex flex-wrap items-center justify-center gap-1 text-[11px] font-semibold leading-tight text-white sm:gap-1.5 sm:text-[13px]">
                  <span className="font-bold text-white break-all">{player}</span>
                  <span className="text-slate-300">won</span>
                  <span className="font-black text-emerald-300">{fmtMoney(payout)}</span>
                  <span className="text-slate-400">on</span>
                  <span className="font-semibold text-sky-300">{gameLabel}</span>
                  {item.multiplier != null ? (
                    <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1 py-[2px] text-[8px] font-extrabold text-emerald-300 sm:px-1.5 sm:text-[10px]">
                      {Number(item.multiplier).toFixed(2)}x
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
