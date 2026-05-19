"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function money(v: any) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function AgentIntelligencePage() {
  const [viewerId, setViewerId] = useState("");
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load(nextPeriod = period) {
    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams(window.location.search);
      const vid =
        params.get("viewer_id") ||
        localStorage.getItem("agent_viewer_id") ||
        JSON.parse(localStorage.getItem("agent_session_data") || "{}").id ||
        "supercoin";

      setViewerId(vid);
      localStorage.setItem("agent_viewer_id", vid);

      const res = await fetch(
        `/ui-api/admin/intelligence/player-pnl/${encodeURIComponent(vid)}?period=${encodeURIComponent(nextPeriod)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Failed to load intelligence");

      setData(json);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load intelligence");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(period);
  }, []);

  const rows = Array.isArray(data?.items) ? data.items : [];
  const summary = data?.summary || {};

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Intelligence</h1>
          <p className="mt-1 text-sm text-slate-400">
            Daily player win/loss and house PnL across this hierarchy.
          </p>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Viewing: {viewerId || "-"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["today", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                load(p);
              }}
              className={[
                "rounded-xl px-4 py-2 text-xs font-black uppercase",
                period === p ? "bg-emerald-400 text-[#071824]" : "bg-[#13202a] text-slate-300",
              ].join(" ")}
            >
              {p === "7d" ? "7D" : p === "30d" ? "30D" : "Today"}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
          {message}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Total Bet</div>
          <div className="mt-2 text-2xl font-black">{money(summary.total_bet)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Total Win</div>
          <div className="mt-2 text-2xl font-black">{money(summary.total_win)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">House Net</div>
          <div className={["mt-2 text-2xl font-black", Number(summary.house_net || 0) >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
            {money(summary.house_net)}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Players</div>
          <div className="mt-2 text-2xl font-black">{summary.players || 0}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <h2 className="text-xl font-black">Player Win / Loss</h2>
        <p className="mt-1 text-sm text-slate-400">
          Positive player net means player is winning. Positive house net means the house is winning.
        </p>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-2xl bg-[#13202a] px-4 py-4 text-sm text-slate-400">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl bg-[#13202a] px-4 py-4 text-sm text-slate-400">No player activity found.</div>
          ) : (
            rows.map((r: any) => (
              <div key={r.user_id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <Link
                      href={`/agent/users/${encodeURIComponent(r.user_id)}?viewer_id=${encodeURIComponent(viewerId)}`}
                      className="text-base font-black text-white hover:text-sky-300"
                    >
                      {r.user_id}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">Last: {fmtDate(r.last_activity_at)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-6 xl:min-w-[760px]">
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">Bet</div>
                      <div className="font-black">{money(r.total_bet)}</div>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">Win</div>
                      <div className="font-black">{money(r.total_win)}</div>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">Player Net</div>
                      <div className={Number(r.player_net || 0) >= 0 ? "font-black text-emerald-300" : "font-black text-rose-300"}>
                        {money(r.player_net)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">House Net</div>
                      <div className={Number(r.house_net || 0) >= 0 ? "font-black text-emerald-300" : "font-black text-rose-300"}>
                        {money(r.house_net)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">Total Bal</div>
                      <div className="font-black">{money(r.balance_total)}</div>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] p-3">
                      <div className="text-xs text-slate-500">Available</div>
                      <div className="font-black">{money(r.balance_available)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
