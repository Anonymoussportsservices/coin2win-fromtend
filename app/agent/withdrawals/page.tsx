"use client";

import { useEffect, useMemo, useState } from "react";

type QueueStatus = "requested" | "approved" | "sent" | "failed";
type TabKey = QueueStatus | "all";

type WithdrawalLight = {
  id: number;
  user_id: string;
  amount_usd: number;
  status: string;
  created_at?: string | null;
};

type WithdrawalDetail = {
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
  approved_at?: string | null;
  sent_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
  failed_at?: string | null;
  approved_by?: string | null;
  processor_ref?: string | null;
  failure_reason?: string | null;
  audit_trail?: Array<{
    id: number;
    action: string;
    actor_id?: string | null;
    note?: string | null;
    created_at?: string | null;
  }>;
};

type QueueResponse = {
  status: string;
  count: number;
  total_amount: number;
  oldest?: WithdrawalLight | null;
  newest?: WithdrawalLight | null;
  items: WithdrawalLight[];
};

type Metrics = {
  requested: number;
  approved: number;
  sent: number;
  completed: number;
  rejected: number;
  failed: number;
  total_pending_amount: number;
};

type AllResponse = {
  total?: number;
  count?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  withdrawals?: WithdrawalDetail[];
};

const TAB_ORDER: TabKey[] = ["requested", "approved", "sent", "failed", "all"];

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
  if (s === "failed") return `${base} bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function tabBtn(active: boolean) {
  return active
    ? "rounded-2xl bg-white text-black px-4 py-2 text-sm font-black"
    : "rounded-2xl bg-white/10 text-white px-4 py-2 text-sm font-black";
}

export default function AgentWithdrawalsPage() {
  const viewerId =
    typeof window !== "undefined"
      ? (localStorage.getItem("agent_viewer_id") || JSON.parse(localStorage.getItem("agent_session_data") || "{}").id || "supercoin")
      : "supercoin";
  const [tab, setTab] = useState<TabKey>("requested");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queues, setQueues] = useState<Record<string, QueueResponse | null>>({
    requested: null,
    approved: null,
    sent: null,
    failed: null,
  });
  const [allData, setAllData] = useState<AllResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<WithdrawalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [processorRefs, setProcessorRefs] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});

  async function fetchJson(url: string, init?: RequestInit) {
    const res = await fetch(url, { cache: "no-store", ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = json?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.message || detail?.reason_code || "Request failed";
      throw new Error(msg);
    }
    return json;
  }

  async function loadAll() {
    try {
      setLoading(true);
      setMessage("");

      const [metricsJson, requestedJson, approvedJson, sentJson, failedJson, allJson] =
        await Promise.all([
          fetchJson(`/ui-api/admin/withdrawals/metrics?viewer_id=${encodeURIComponent(viewerId)}`),
          fetchJson(`/ui-api/admin/withdrawals/queue/requested?viewer_id=${encodeURIComponent(viewerId)}`),
          fetchJson(`/ui-api/admin/withdrawals/queue/approved?viewer_id=${encodeURIComponent(viewerId)}`),
          fetchJson(`/ui-api/admin/withdrawals/queue/sent?viewer_id=${encodeURIComponent(viewerId)}`),
          fetchJson(`/ui-api/admin/withdrawals/queue/failed?viewer_id=${encodeURIComponent(viewerId)}`),
          fetchJson(`/ui-api/admin/withdrawals?viewer_id=${encodeURIComponent(viewerId)}&limit=50&sort=id_desc`),
        ]);

      setMetrics(metricsJson);
      setQueues({
        requested: requestedJson,
        approved: approvedJson,
        sent: sentJson,
        failed: failedJson,
      });
      setAllData(allJson);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load withdrawals panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      if (busyId !== null) return;

      try {
        await loadAll();
        if (detail?.id) {
          await openDetail(detail.id);
        }
      } catch {}
    };

    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [busyId, detail?.id]);

  async function openDetail(id: number) {
    try {
      setDetailLoading(true);
      const json = await fetchJson(`/ui-api/admin/withdrawals/${id}?viewer_id=${encodeURIComponent(viewerId)}`);
      setDetail(json);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load withdrawal detail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(
    id: number,
    action: "approve" | "complete" | "reject" | "fail" | "mark_sent"
  ) {
    try {
      setBusyId(id);
      setMessage("");

      let body: any = {};
      if (action === "mark_sent") {
        const processor_ref = (processorRefs[id] || "").trim();
        const note = (notes[id] || "").trim();
        if (!processor_ref) {
          throw new Error("processor_ref required");
        }
        body = { processor_ref, note };
      } else if (action === "reject" || action === "fail") {
        const reason = (reasons[id] || "").trim() || (action === "reject" ? "Rejected by admin" : "Withdrawal payout failed");
        body = { reason };
      } else {
        const note = (notes[id] || "").trim();
        body = note ? { note } : {};
      }

      const json = await fetchJson(`/ui-api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setMessage(`Withdrawal #${id} → ${json?.status || action} ✅`);
      await loadAll();
      await openDetail(id);
    } catch (e: any) {
      setMessage(e?.message || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  }

  const activeQueue = queues[tab as QueueStatus];
  const activeItems = useMemo(() => {
    const source =
      tab === "all"
        ? Array.isArray(allData?.withdrawals)
          ? allData!.withdrawals!
          : []
        : Array.isArray(activeQueue?.items)
        ? activeQueue!.items
        : [];

    const q = query.trim().toLowerCase();
    if (!q) return source;

    return source.filter((r: any) => {
      return (
        String(r.id || "").toLowerCase().includes(q) ||
        String(r.user_id || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
      );
    });
  }, [tab, activeQueue, allData, query]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">Withdrawals</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm md:text-base">
          <p className="text-slate-400">
            Review and process payout requests using live operator queues.
          </p>
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-300">
            Auto-refresh 15s
          </span>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Requested</div>
          <div className="mt-2 text-2xl font-black text-amber-300">{metrics?.requested ?? "-"}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Approved</div>
          <div className="mt-2 text-2xl font-black text-sky-300">{metrics?.approved ?? "-"}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Sent</div>
          <div className="mt-2 text-2xl font-black text-violet-300">{metrics?.sent ?? "-"}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Failed</div>
          <div className="mt-2 text-2xl font-black text-fuchsia-300">{metrics?.failed ?? "-"}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Pending Amount</div>
          <div className="mt-2 text-2xl font-black text-white">{money(metrics?.total_pending_amount)}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {TAB_ORDER.map((t) => (
                <button key={t} className={tabBtn(tab === t)} onClick={() => setTab(t)}>
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by id / user / status"
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              />
              <button
                onClick={loadAll}
                className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
              >
                Refresh
              </button>
            </div>
          </div>

          {tab !== "all" && activeQueue ? (
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-300">
                <div>Count: <span className="font-black text-white">{activeQueue.count}</span></div>
                <div className="mt-1">Total: <span className="font-black text-white">{money(activeQueue.total_amount)}</span></div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-300">
                <div className="font-black text-white">Oldest</div>
                <div className="mt-1">#{activeQueue.oldest?.id ?? "-"}</div>
                <div className="mt-1 text-xs text-slate-400">{fmtDate(activeQueue.oldest?.created_at)}</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-300">
                <div className="font-black text-white">Newest</div>
                <div className="mt-1">#{activeQueue.newest?.id ?? "-"}</div>
                <div className="mt-1 text-xs text-slate-400">{fmtDate(activeQueue.newest?.created_at)}</div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
                Loading withdrawals...
              </div>
            ) : activeItems.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
                No withdrawals found.
              </div>
            ) : (
              activeItems.map((row: any) => {
                const status = String(row.status || "").toLowerCase();
                const isBusy = busyId === row.id;

                return (
                  <div key={row.id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDetail(row.id)}
                          className="font-black text-white underline-offset-2 hover:underline"
                        >
                          Withdrawal #{row.id}
                        </button>
                        <span className={statusChip(status)}>{status || "unknown"}</span>
                      </div>

                      <div className="grid gap-1 text-sm text-slate-300">
                        <div>User: <span className="font-black text-white">{row.user_id || "-"}</span></div>
                        <div>Amount: <span className="font-black text-white">{money(row.amount_usd)}</span></div>
                        <div className="text-xs text-slate-400">Created: {fmtDate(row.created_at)}</div>
                      </div>

                      {status === "approved" ? (
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            value={processorRefs[row.id] || ""}
                            onChange={(e) => setProcessorRefs((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="processor_ref"
                            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                          />
                          <input
                            value={notes[row.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="optional note"
                            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => runAction(row.id, "mark_sent")}
                              disabled={isBusy}
                              className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Mark Sent"}
                            </button>
                            <button
                              onClick={() => runAction(row.id, "reject")}
                              disabled={isBusy}
                              className="rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {status === "requested" ? (
                        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                          <input
                            value={reasons[row.id] || ""}
                            onChange={(e) => setReasons((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="reject reason"
                            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => runAction(row.id, "approve")}
                              disabled={isBusy}
                              className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Approve"}
                            </button>
                            <button
                              onClick={() => runAction(row.id, "reject")}
                              disabled={isBusy}
                              className="rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {status === "sent" ? (
                        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                          <input
                            value={reasons[row.id] || ""}
                            onChange={(e) => setReasons((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="failure reason for fail"
                            className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => runAction(row.id, "complete")}
                              disabled={isBusy}
                              className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Complete"}
                            </button>
                            <button
                              onClick={() => runAction(row.id, "fail")}
                              disabled={isBusy}
                              className="rounded-xl bg-fuchsia-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              {isBusy ? "Working..." : "Fail"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <button
                          onClick={() => openDetail(row.id)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <h2 className="text-xl font-black">Withdrawal Detail</h2>
          <p className="mt-1 text-sm text-slate-400">
            Inspect metadata, payout refs, and audit trail without leaving the queue.
          </p>

          {detailLoading ? (
            <div className="mt-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              Loading detail...
            </div>
          ) : !detail ? (
            <div className="mt-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              Select a withdrawal to inspect.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-white">Withdrawal #{detail.id}</div>
                  <span className={statusChip(detail.status)}>{detail.status}</span>
                </div>
                <div className="mt-3 grid gap-2">
                  <div>User: <span className="font-black text-white">{detail.user_id}</span></div>
                  <div>Amount: <span className="font-black text-white">{money(detail.amount_usd)}</span></div>
                  <div>Currency: <span className="font-black text-white">{detail.payout_currency || "-"}</span></div>
                  <div>Address: <span className="font-black text-white break-all">{detail.payout_address || "-"}</span></div>
                  <div>Processor Ref: <span className="font-black text-white">{detail.processor_ref || "-"}</span></div>
                  <div>Approved By: <span className="font-black text-white">{detail.approved_by || "-"}</span></div>
                  <div>Failure Reason: <span className="font-black text-white">{detail.failure_reason || "-"}</span></div>
                  <div>Note: <span className="font-black text-white">{detail.note || "-"}</span></div>
                  <div>Created: <span className="font-black text-white">{fmtDate(detail.created_at)}</span></div>
                  <div>Approved: <span className="font-black text-white">{fmtDate(detail.approved_at)}</span></div>
                  <div>Sent: <span className="font-black text-white">{fmtDate(detail.sent_at)}</span></div>
                  <div>Completed: <span className="font-black text-white">{fmtDate(detail.completed_at)}</span></div>
                  <div>Rejected: <span className="font-black text-white">{fmtDate(detail.rejected_at)}</span></div>
                  <div>Failed: <span className="font-black text-white">{fmtDate(detail.failed_at)}</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                <div className="text-sm font-black text-white">Audit Trail</div>
                <div className="mt-3 grid gap-3">
                  {detail.audit_trail?.length ? (
                    detail.audit_trail.map((a) => (
                      <div key={a.id} className="rounded-xl border border-white/5 bg-[#0f172a] p-3 text-sm text-slate-300">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-white">{a.action}</span>
                          <span className="text-xs text-slate-400">{fmtDate(a.created_at)}</span>
                        </div>
                        <div className="mt-1">Actor: <span className="text-white">{a.actor_id || "-"}</span></div>
                        <div className="mt-1">Note: <span className="text-white">{a.note || "-"}</span></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No audit entries.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
