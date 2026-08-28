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

function fmtDate(v?: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "-";
  }
}

function segmentLabel(v: string) {
  const map: Record<string, string> = {
    low_balance: "Low Balance",
    high_balance: "High Balance",
    no_bet: "No Bet",
    no_deposit: "No Deposit",
    inactive: "Inactive",
  };
  return map[v] || v;
}

function reasonLabel(v?: string | null) {
  const map: Record<string, string> = {
    loss_rebate: "Loss Rebate",
    deposit_bonus: "Deposit Bonus",
    reactivation_bonus: "Reactivation",
    play_push: "Play Push",
    retention: "Retention",
  };
  return map[String(v || "")] || String(v || "-");
}

export default function AgentCRMPage() {
  const [viewerId, setViewerId] = useState("");
  const [threshold, setThreshold] = useState("10");
  const [segment, setSegment] = useState("low_balance");
  const [days, setDays] = useState("7");
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bulkAmount, setBulkAmount] = useState("10");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [duplicateWindow, setDuplicateWindow] = useState("today");
  const [protectionDays, setProtectionDays] = useState("30");
  const [protection, setProtection] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);

  const selectedIds = useMemo(
    () => rows.map((r) => r.user_id).filter((id) => selected[id]),
    [rows, selected]
  );

  const estimatedCost = selectedIds.length * Number(bulkAmount || 0);
  const viewerQs = useMemo(() => `?viewer_id=${encodeURIComponent(viewerId)}`, [viewerId]);

  function toggleRow(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => { next[r.user_id] = true; });
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  async function grantBulkBonus() {
    const amount = Number(bulkAmount || 0);
    if (!amount || amount <= 0) return setMessage("Bonus amount must be greater than 0");
    if (!selectedIds.length) return setMessage("No players selected");

    const ok = window.confirm(`Grant ${money(amount)} to ${selectedIds.length} selected players? Total: ${money(estimatedCost)}`);
    if (!ok) return;

    try {
      setBulkBusy(true);
      setMessage("");

      const res = await fetch(`/ui-api/admin/crm/bulk-bonus/${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: selectedIds,
          amount,
          segment,
          actor_id: viewerId || "crm",
          duplicate_window: duplicateWindow,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Bulk bonus failed");

      setMessage(`Credited: ${Number(json.success || 0)} · Skipped: ${Number(json.skipped || 0)} · Failed: ${Number(json.failed || 0)}`);
      clearSelection();
      await loadCRM();
      await loadCRMHistory();
    } catch (e: any) {
      setMessage(e?.message || "Bulk bonus failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function loadCRMHistory(resolvedViewerId?: string) {
    try {
      const currentViewerId = resolvedViewerId || viewerId;
      if (!currentViewerId) return;

      const res = await fetch(
        `/ui-api/admin/crm/history/${encodeURIComponent(currentViewerId)}?limit=50`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok) setHistory(json);
    } catch {
      setHistory(null);
    }
  }

  async function loadBonusProtection(resolvedViewerId?: string) {
    try {
      const currentViewerId = resolvedViewerId || viewerId;
      if (!currentViewerId) return;

      const res = await fetch(
        `/ui-api/admin/crm/bonus-protection/${encodeURIComponent(currentViewerId)}?segment=${encodeURIComponent(segment)}&window_days=${encodeURIComponent(protectionDays)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok) setProtection(json);
    } catch {
      setProtection(null);
    }
  }

  async function loadCRM(resolvedViewerId?: string, resolvedThreshold?: string) {
    try {
      setLoading(true);
      setMessage("");

      const currentViewerId = resolvedViewerId || viewerId;
      const currentThreshold = resolvedThreshold || threshold || "10";
      if (!currentViewerId) throw new Error("Missing viewer");

      const res = await fetch(
        `/ui-api/admin/crm/low-balance/${encodeURIComponent(currentViewerId)}?threshold=${encodeURIComponent(currentThreshold)}&segment=${encodeURIComponent(segment)}&days=${encodeURIComponent(days)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load CRM");

      setRows(Array.isArray(json?.items) ? json.items : []);
      setSelected({});
      await loadBonusProtection(currentViewerId);
      await loadCRMHistory(currentViewerId);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load CRM");
      setRows([]);
      setSelected({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
    const resolved = params.get("viewer_id") || localStorage.getItem("agent_viewer_id") || session.id || "supercoin";
    localStorage.setItem("agent_viewer_id", resolved);
    setViewerId(resolved);
    loadCRM(resolved, threshold);
    loadBonusProtection(resolved);
    loadCRMHistory(resolved);
  }, []);

  useEffect(() => {
    if (!viewerId) return;
    loadBonusProtection();
  }, [viewerId, segment, protectionDays]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">CRM Center</h1>
        <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          {viewerId || "-"}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Spend Today</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{money(history?.dashboard?.today?.spend || 0)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Spend 7D</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{money(history?.dashboard?.seven_days?.spend || 0)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Spend 30D</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{money(history?.dashboard?.thirty_days?.spend || 0)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Campaigns 30D</div>
          <div className="mt-2 text-2xl font-black text-white">{history?.dashboard?.thirty_days?.campaigns || 0}</div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 text-xl font-black">Segments</div>
        <div className="grid gap-4 md:grid-cols-[180px_220px_120px_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Threshold</label>
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Segment</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none">
              <option value="low_balance">Low Balance</option>
              <option value="high_balance">High Balance</option>
              <option value="no_bet">No Bet</option>
              <option value="no_deposit">No Deposit</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Days</label>
            <input value={days} onChange={(e) => setDays(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
          </div>

          <div className="flex items-end">
            <button onClick={() => loadCRM()} className="w-full rounded-2xl bg-sky-500 px-5 py-3 font-black text-white">
              Scan
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Candidates</div>
          <div className="mt-2 text-2xl font-black text-white">{rows.length}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Selected</div>
          <div className="mt-2 text-2xl font-black text-sky-300">{selectedIds.length}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Protected</div>
          <div className="mt-2 text-2xl font-black text-amber-300">{protection?.already_bonused || 0}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Estimated Cost</div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{money(estimatedCost)}</div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 text-xl font-black">Bulk Bonus</div>
        <div className="grid gap-3 md:grid-cols-[160px_180px_160px_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Amount</label>
            <input value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Protection</label>
            <select value={duplicateWindow} onChange={(e) => setDuplicateWindow(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none">
              <option value="today">Today</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="off">Off</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Window</label>
            <input value={protectionDays} onChange={(e) => setProtectionDays(e.target.value)} onBlur={() => loadBonusProtection()} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
          </div>

          <button onClick={selectAll} disabled={!rows.length} className="rounded-2xl bg-[#13202a] px-4 py-3 font-black text-slate-200 disabled:opacity-50">
            Select All
          </button>

          <button onClick={clearSelection} disabled={!selectedIds.length} className="rounded-2xl bg-[#13202a] px-4 py-3 font-black text-slate-200 disabled:opacity-50">
            Clear
          </button>

          <button onClick={grantBulkBonus} disabled={bulkBusy || !selectedIds.length} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824] disabled:opacity-50">
            {bulkBusy ? "Granting..." : "Grant Bonus"}
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Bonus Protection</h2>
          <button onClick={() => loadBonusProtection()} className="rounded-2xl bg-[#13202a] px-4 py-3 text-sm font-black text-slate-200">
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Segment</div>
            <div className="mt-2 text-lg font-black text-white">{segmentLabel(protection?.segment || segment)}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Window</div>
            <div className="mt-2 text-lg font-black text-white">{protection?.window_days || protectionDays} days</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Protected</div>
            <div className="mt-2 text-2xl font-black text-amber-300">{protection?.already_bonused || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Eligible</div>
            <div className="mt-2 text-2xl font-black text-emerald-300">{protection?.eligible_now || 0}</div>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">CRM History</h2>
          <button onClick={() => loadCRMHistory()} className="rounded-2xl bg-[#13202a] px-4 py-3 text-sm font-black text-slate-200">
            Refresh
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">CRM Spend</div>
            <div className="mt-2 text-2xl font-black text-emerald-300">{money(history?.summary?.total_spend || 0)}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Credited</div>
            <div className="mt-2 text-2xl font-black text-white">{history?.summary?.success || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Skipped</div>
            <div className="mt-2 text-2xl font-black text-amber-300">{history?.summary?.skipped || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Failed</div>
            <div className="mt-2 text-2xl font-black text-red-300">{history?.summary?.failed || 0}</div>
          </div>
        </div>

        <div className="grid gap-3">
          {history?.items?.length ? history.items.map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-300">
                      {segmentLabel(item.segment)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">
                      {item.duplicate_window || "-"}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white">{item.actor_id || "-"}</div>
                  <div className="mt-1 text-xs text-slate-400">{fmtDate(item.created_at)}</div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-right md:min-w-[440px]">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Amount</div>
                    <div className="mt-1 font-black text-white">{money(item.amount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Credited</div>
                    <div className="mt-1 font-black text-emerald-300">{item.success || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Skipped</div>
                    <div className="mt-1 font-black text-amber-300">{item.skipped || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Spend</div>
                    <div className="mt-1 font-black text-white">{money(item.credited_total)}</div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              No history found.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2 className="text-xl font-black">Candidates</h2>
          <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
            {segmentLabel(segment)}
          </div>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">No candidates found.</div>
          ) : (
            rows.map((row) => (
              <div key={row.user_id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <input type="checkbox" checked={!!selected[row.user_id]} onChange={() => toggleRow(row.user_id)} className="mt-1 h-5 w-5" />

                    <div className="min-w-0">
                      <Link href={`/agent/users/${encodeURIComponent(row.user_id)}${viewerQs}`} className="text-base font-black text-white hover:text-sky-300">
                        {row.user_id}
                      </Link>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-300">
                          {reasonLabel(row.suggested_reason)}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">
                          {row.parent_id || "-"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                        <div>Username: <span className="text-white">{row.username || "-"}</span></div>
                        <div>Full Name: <span className="text-white">{row.full_name || "-"}</span></div>
                        <div>Email: <span className="text-white">{row.email || "-"}</span></div>
                        <div>Telegram: <span className="text-white">{row.telegram || "-"}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:min-w-[520px]">
                    <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3 text-sm text-slate-300">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Balance</div>
                      <div className="mt-2">Available: <span className="font-black text-white">{money(row.balance_available)}</span></div>
                      <div>Total: <span className="text-white">{money(row.balance_total)}</span></div>
                      <div>Pending: <span className="text-white">{money(row.balance_pending)}</span></div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3 text-sm text-slate-300">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Activity</div>
                      <div className="mt-2">Last Bet: <span className="text-white">{fmtDate(row.last_bet_at)}</span></div>
                      <div>Last Deposit: <span className="text-white">{fmtDate(row.last_deposit_at)}</span></div>
                      <div>Last Withdrawal: <span className="text-white">{fmtDate(row.last_withdrawal_at)}</span></div>
                    </div>

                    <Link href={`/agent/users/${encodeURIComponent(row.user_id)}${viewerQs}`} className="rounded-2xl bg-sky-500 px-4 py-3 text-center font-black text-white md:col-span-2">
                      Player Profile
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
