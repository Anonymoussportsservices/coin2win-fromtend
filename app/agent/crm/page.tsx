"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CRMRow = {
  user_id: string;
  parent_id?: string | null;
  role?: string | null;
  is_active?: boolean;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  telegram?: string | null;
  balance_available?: number;
  balance_total?: number;
  balance_pending?: number;
  trigger_type?: string;
  suggested_reason?: string;
  last_bet_at?: string | null;
  last_deposit_at?: string | null;
  last_withdrawal_at?: string | null;
};

function money(v: number | string | null | undefined) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentCRMPage() {
  const [viewerId, setViewerId] = useState("supercoin");
  const [threshold, setThreshold] = useState("10");
  const [segment, setSegment] = useState("low_balance");
  const [days, setDays] = useState("7");
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCRM(resolvedViewerId?: string, resolvedThreshold?: string, resolvedSegment?: string, resolvedDays?: string) {
    try {
      setLoading(true);
      setMessage("");

      const currentViewerId = resolvedViewerId || viewerId || "supercoin";
      const currentThreshold = resolvedThreshold || threshold || "10";
      const currentSegment = resolvedSegment || segment || "low_balance";
      const currentDays = resolvedDays || days || "7";

      const params = new URLSearchParams();
      params.set("threshold", currentThreshold);
      params.set("segment", currentSegment);
      params.set("days", currentDays);

      const res = await fetch(
        `/ui-api/admin/crm/low-balance/${encodeURIComponent(currentViewerId)}?${params.toString()}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load CRM");

      setRows(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load CRM");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("viewer_id") || "";
    const fromStorage = localStorage.getItem("agent_viewer_id") || localStorage.getItem("agent_viewer_id") || JSON.parse(localStorage.getItem("agent_session_data")||"{}").id || "";
    const resolved = fromUrl || fromStorage || "supercoin";
    localStorage.setItem("agent_viewer_id", resolved);
    setViewerId(resolved);
    loadCRM(resolved, threshold, segment, days);
  }, []);

  const viewerQs = useMemo(() => `?viewer_id=${encodeURIComponent(viewerId)}`, [viewerId]);
  const segmentLabel = useMemo(() => {
    if (segment === "no_bet") return "No Bet";
    if (segment === "no_deposit") return "No Deposit";
    if (segment === "inactive") return "Inactive";
    if (segment === "high_balance") return "High Balance";
    return "Low Balance";
  }, [segment]);
  const suggestedActionLabel = useMemo(() => {
    if (segment === "high_balance") return "Play Push";
    if (segment === "no_deposit") return "Deposit Push";
    return "Retention";
  }, [segment]);
  const suggestedReasonLabel = useMemo(() => {
    if (segment === "high_balance") return "play_push";
    if (segment === "no_deposit") return "deposit_bonus";
    if (segment === "no_bet" || segment === "inactive") return "reactivation_bonus";
    return "loss_rebate";
  }, [segment]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">CRM</h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          Starter CRM trigger view for low-balance player retention.
        </p>
        <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Viewing: {viewerId === "supercoin" ? "Global (Admin)" : "Your Network Only"}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

            <div className="mb-3 text-sm text-slate-400">
        Active Segment: <span className="text-white font-bold">{segmentLabel}</span>
      </div>
<div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="grid gap-4 md:grid-cols-[220px_220px_220px_1fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="low_balance">Low Balance</option>
              <option value="no_bet">No Bet</option>
              <option value="no_deposit">No Deposit</option>
              <option value="inactive">Inactive</option>
              <option value="high_balance">High Balance</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Threshold
            </label>
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="10"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Days
            </label>
            <input
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="7"
            />
          </div>


          <div className="flex items-end">
            <button
              onClick={() => loadCRM()}
              className="rounded-2xl bg-sky-500 px-4 py-3 font-black text-white"
            >
              Scan CRM
            </button>
          </div>
        </div>

          <div className="mt-4 border-t border-white/10 pt-4 text-sm text-slate-400">
            {segment === "low_balance"
              ? "Players at or below this available balance will appear here for retention follow-up."
              : segment === "high_balance"
              ? "Players at or above this available balance will appear here for engagement follow-up."
              : `Players matching ${segmentLabel.toLowerCase()} activity over the last ${days || "7"} days will appear here.`}
          </div>

      </div>



      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Matches</div>
          <div className="mt-2 text-2xl font-black text-white">{rows.length}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Trigger</div>
          <div className="mt-2 text-2xl font-black text-amber-300">Low Balance</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Suggested Action</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{suggestedActionLabel}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Suggested Reason</div>
          <div className="mt-2 text-2xl font-black text-white">{suggestedReasonLabel}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black">{segmentLabel} Candidates</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review players who may need a manual bonus, reactivation touch, deposit push, or follow-up.
          </p>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              Loading CRM candidates...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              No low-balance candidates found.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.user_id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-black text-white">{row.user_id}</div>
                    <div className="mt-2 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                      <div>Username: <span className="text-white">{row.username || "-"}</span></div>
                      <div>Full Name: <span className="text-white">{row.full_name || "-"}</span></div>
                      <div>Email: <span className="text-white">{row.email || "-"}</span></div>
                      <div>Telegram: <span className="text-white">{row.telegram || "-"}</span></div>
                      <div>Parent: <span className="text-white">{row.parent_id || "-"}</span></div>
                      <div>Suggested Reason: <span className="text-emerald-300">{row.suggested_reason || "-"}</span></div>
                      <div>Last Bet: <span className="text-white">{fmtDate(row.last_bet_at)}</span></div>
                      <div>Last Deposit: <span className="text-white">{fmtDate(row.last_deposit_at)}</span></div>
                      <div>Last Withdrawal: <span className="text-white">{fmtDate(row.last_withdrawal_at)}</span></div>
                    </div>
                  </div>

                  <div className="flex min-w-[260px] flex-col gap-3">
                    <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3 text-sm text-slate-300">
                      <div>Available: <span className="font-black text-white">{money(row.balance_available)}</span></div>
                      <div className="mt-1">Total: <span className="text-white">{money(row.balance_total)}</span></div>
                      <div className="mt-1">Pending: <span className="text-white">{money(row.balance_pending)}</span></div>
                    </div>

                    <Link
                      href={`/agent/users/${encodeURIComponent(row.user_id)}${viewerQs}`}
                      className="rounded-2xl bg-sky-500 px-4 py-3 text-center font-black text-white"
                    >
                      Open Profile
                    </Link>
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
