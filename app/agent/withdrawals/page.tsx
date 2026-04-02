"use client";

import { useEffect, useMemo, useState } from "react";

type WithdrawalRow = {
  id: number;
  user_id: string;
  amount_usd: number;
  status: string;
  payout_currency?: string | null;
  payout_address?: string | null;
  note?: string | null;
  refunded?: boolean | null;
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

function statusChip(status?: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black border";

  if (s === "requested") return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (s === "approved") return `${base} bg-sky-500/15 text-sky-300 border-sky-500/20`;
  if (s === "sent") return `${base} bg-violet-500/15 text-violet-300 border-violet-500/20`;
  if (s === "completed") return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (s === "rejected") return `${base} bg-red-500/15 text-red-300 border-red-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

export default function AgentWithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState("Rejected by admin");

  async function loadWithdrawals() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/ui-api/admin/withdrawals", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.detail || "Failed to load withdrawals");
      }

      setRows(Array.isArray(json?.withdrawals) ? json.withdrawals : []);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load withdrawals");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWithdrawals();
  }, []);

  async function runAction(id: number, action: "approve" | "mark_sent" | "complete") {
    try {
      setBusyId(id);
      setMessage("");

      const res = await fetch(`/ui-api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.detail || `Failed to ${action}`);
      }

      setMessage(`Withdrawal #${id} → ${json?.status || action} ✅`);
      await loadWithdrawals();
    } catch (e: any) {
      setMessage(e?.message || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  }

  async function rejectWithdrawal(id: number) {
    try {
      setBusyId(id);
      setMessage("");

      const res = await fetch(`/ui-api/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "Rejected by admin" }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.detail || "Failed to reject withdrawal");
      }

      setMessage(`Withdrawal #${id} rejected/refunded ✅`);
      await loadWithdrawals();
    } catch (e: any) {
      setMessage(e?.message || "Failed to reject withdrawal");
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        String(r.id).toLowerCase().includes(q) ||
        String(r.user_id || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q) ||
        String(r.payout_currency || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        String(r.status || "").toLowerCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const stats = useMemo(() => {
    const requested = rows.filter((r) => String(r.status).toLowerCase() === "requested").length;
    const approved = rows.filter((r) => String(r.status).toLowerCase() === "approved").length;
    const sent = rows.filter((r) => String(r.status).toLowerCase() === "sent").length;
    const completed = rows.filter((r) => String(r.status).toLowerCase() === "completed").length;
    const rejected = rows.filter((r) => String(r.status).toLowerCase() === "rejected").length;
    return { requested, approved, sent, completed, rejected, total: rows.length };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">Withdrawals</h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          Review and process payout requests.
        </p>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total</div>
          <div className="mt-2 text-2xl font-black text-white">{stats.total}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Requested</div>
          <div className="mt-2 text-2xl font-black text-amber-300">{stats.requested}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Approved</div>
          <div className="mt-2 text-2xl font-black text-sky-300">{stats.approved}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Sent</div>
          <div className="mt-2 text-2xl font-black text-violet-300">{stats.sent}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Completed</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{stats.completed}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Rejected</div>
          <div className="mt-2 text-2xl font-black text-red-300">{stats.rejected}</div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black">Withdrawal Queue</h2>
            <p className="mt-1 text-sm text-slate-400">Approve, reject/refund, mark sent, and complete payout requests.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, user, status, currency"
              className="w-full min-w-[220px] rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="all">All status</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={loadWithdrawals}
              className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">
            Reject / Refund Reason
          </label>
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            placeholder="Reason used when rejecting/refunding"
          />
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              Loading withdrawals...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              No withdrawals found.
            </div>
          ) : (
            filteredRows.map((row) => {
              const status = String(row.status || "").toLowerCase();
              const isBusy = busyId === row.id;

              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-white/5 bg-[#13202a] p-4"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-black text-white">
                          Withdrawal #{row.id}
                        </div>
                        <span className={statusChip(status)}>{status || "unknown"}</span>
                        {row.refunded ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black border bg-red-500/15 text-red-300 border-red-500/20">
                            refunded
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-slate-300">
                        <div>User: <span className="font-black text-white">{row.user_id || "-"}</span></div>
                        <div>Amount: <span className="font-black text-white">{money(row.amount_usd)}</span></div>
                        <div>
                          Payout: <span className="text-white">{row.payout_currency || "-"}</span>
                          {row.payout_address ? ` • ${row.payout_address}` : ""}
                        </div>
                        {row.note ? <div>Note: <span className="text-white">{row.note}</span></div> : null}
                        <div className="text-xs text-slate-400">
                          Created: {fmtDate(row.created_at)} • Updated: {fmtDate(row.updated_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {status === "requested" ? (
                        <>
                          <button
                            onClick={() => runAction(row.id, "approve")}
                            disabled={isBusy}
                            className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Approve"}
                          </button>
                          <button
                            onClick={() => rejectWithdrawal(row.id)}
                            disabled={isBusy}
                            className="rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Reject / Refund"}
                          </button>
                        </>
                      ) : null}

                      {status === "approved" ? (
                        <>
                          <button
                            onClick={() => runAction(row.id, "mark_sent")}
                            disabled={isBusy}
                            className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Mark Sent"}
                          </button>
                          <button
                            onClick={() => runAction(row.id, "complete")}
                            disabled={isBusy}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Complete"}
                          </button>
                          <button
                            onClick={() => rejectWithdrawal(row.id)}
                            disabled={isBusy}
                            className="rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Reject / Refund"}
                          </button>
                        </>
                      ) : null}

                      {status === "sent" ? (
                        <>
                          <button
                            onClick={() => runAction(row.id, "complete")}
                            disabled={isBusy}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Complete"}
                          </button>
                          <button
                            onClick={() => rejectWithdrawal(row.id)}
                            disabled={isBusy}
                            className="rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isBusy ? "Working..." : "Reject / Refund"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
