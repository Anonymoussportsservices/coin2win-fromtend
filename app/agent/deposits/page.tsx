"use client";

import { useEffect, useMemo, useState } from "react";

type DepositRow = {
  id: number;
  user_id: string;
  payment_id: string;
  status: string;
  amount_usd: number;
  pay_currency?: string | null;
  pay_amount?: number | null;
  pay_address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function shortText(value?: string | null, n: number = 16) {
  const v = String(value || "");
  if (!v) return "-";
  return v.length > n ? `${v.slice(0, n)}...` : v;
}

function statusChip(status?: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black border";

  if (["waiting", "pending", "confirming"].includes(s)) return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (["confirmed", "partially_paid", "finished"].includes(s)) return `${base} bg-sky-500/15 text-sky-300 border-sky-500/20`;
  if (["credited", "paid", "completed"].includes(s)) return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (["failed", "expired", "cancelled"].includes(s)) return `${base} bg-red-500/15 text-red-300 border-red-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

export default function AgentDepositsPage() {
  const [viewerId, setViewerId] = useState("supercoin");
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadDeposits(resolvedViewerId?: string) {
    try {
      setLoading(true);
      setMessage("");

      const currentViewerId = resolvedViewerId || viewerId || "supercoin";
      const res = await fetch(`/ui-api/admin/deposits/scoped/${encodeURIComponent(currentViewerId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.detail || "Failed to load deposits");
      }

      setRows(Array.isArray(json?.deposits) ? json.deposits : []);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load deposits");
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
    loadDeposits(resolved);
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        String(r.id).toLowerCase().includes(q) ||
        String(r.user_id || "").toLowerCase().includes(q) ||
        String(r.payment_id || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q) ||
        String(r.pay_currency || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        String(r.status || "").toLowerCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount_usd || 0), 0);
    const waiting = rows.filter((r) => ["waiting", "pending", "confirming"].includes(String(r.status || "").toLowerCase())).length;
    const credited = rows.filter((r) => ["credited", "paid", "completed"].includes(String(r.status || "").toLowerCase())).length;
    const failed = rows.filter((r) => ["failed", "expired", "cancelled"].includes(String(r.status || "").toLowerCase())).length;
    return { total, totalAmount, waiting, credited, failed };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">Deposits</h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          Review deposit invoices, amounts, status, and player activity.
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total</div>
          <div className="mt-2 text-2xl font-black text-white">{stats.total}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Deposit Volume</div>
          <div className="mt-2 text-2xl font-black text-white">{money(stats.totalAmount)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Waiting</div>
          <div className="mt-2 text-2xl font-black text-amber-300">{stats.waiting}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Credited</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{stats.credited}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Failed</div>
          <div className="mt-2 text-2xl font-black text-red-300">{stats.failed}</div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black">Deposit Queue</h2>
            <p className="mt-1 text-sm text-slate-400">Monitor player deposits and payment states.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, player, payment id, status"
              className="w-full min-w-[220px] rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="all">All status</option>
              <option value="waiting">Waiting</option>
              <option value="pending">Pending</option>
              <option value="confirming">Confirming</option>
              <option value="credited">Credited</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => loadDeposits()}
              className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              Loading deposits...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              No deposits found.
            </div>
          ) : (
            filteredRows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-white/5 bg-[#13202a] p-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-black text-white">
                        Deposit #{row.id}
                      </div>
                      <span className={statusChip(row.status)}>{row.status || "unknown"}</span>
                    </div>

                    <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-3">
                      <div><span className="text-slate-500">Player:</span> {row.user_id}</div>
                      <div><span className="text-slate-500">Amount:</span> {money(row.amount_usd)}</div>
                      <div><span className="text-slate-500">Currency:</span> {String(row.pay_currency || "-").toUpperCase()}</div>
                      <div><span className="text-slate-500">Pay amount:</span> {row.pay_amount ?? "-"}</div>
                      <div><span className="text-slate-500">Payment ID:</span> {row.payment_id || "-"}</div>
                      <div><span className="text-slate-500">Created:</span> {fmtDate(row.created_at)}</div>
                    </div>
                  </div>

                  <div className="w-full max-w-xl rounded-2xl border border-white/5 bg-[#0f172a] p-3 text-xs text-slate-400">
                    <div><span className="font-black text-slate-300">Address:</span> {shortText(row.pay_address, 28)}</div>
                    <div className="mt-1"><span className="font-black text-slate-300">Updated:</span> {fmtDate(row.updated_at)}</div>
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
