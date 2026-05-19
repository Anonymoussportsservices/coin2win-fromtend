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
};

function money(v: number | string | null | undefined) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AgentCRMPage() {
  const [viewerId, setViewerId] = useState("supercoin");
  const [threshold, setThreshold] = useState("10");
  const [segment, setSegment] = useState("low_balance");
  const [days, setDays] = useState("7");
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bulkAmount, setBulkAmount] = useState("10");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [duplicateWindow, setDuplicateWindow] = useState("today");
  const [protectionDays, setProtectionDays] = useState("30");
  const [protection, setProtection] = useState<any>(null);

  async function grantBulkBonus() {
    const amount = Number(bulkAmount || 0);
    if (!amount || amount <= 0) {
      setMessage("Bonus amount must be greater than 0");
      return;
    }

    const targets = rows.map((r) => r.user_id).filter(Boolean);
    if (!targets.length) {
      setMessage("No CRM rows selected for bulk bonus");
      return;
    }

    const total = amount * targets.length;
    const ok = window.confirm(`Grant $${amount.toFixed(2)} bonus to ${targets.length} players? Max total: $${total.toFixed(2)}. Duplicate protection: ${duplicateWindow}`);
    if (!ok) return;

    try {
      setBulkBusy(true);
      setMessage("");

      const res = await fetch(`/ui-api/admin/crm/bulk-bonus/${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: targets,
          amount,
          segment,
          actor_id: viewerId || "crm",
          duplicate_window: duplicateWindow,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Bulk bonus failed");

      const credited = Number(json.success ?? json.credited ?? 0);
      const skipped = Number(json.skipped ?? json.skipped_duplicates ?? 0);
      const failed = Number(json.failed ?? 0);

      if (credited === 0 && skipped > 0 && failed === 0) {
        setMessage(`No bonus applied — ${skipped} player(s) already received this ${segment} bonus in the selected duplicate window.`);
      } else {
        setMessage(`Bulk bonus complete ✅ Credited: ${credited} | Skipped duplicates: ${skipped} | Failed: ${failed}`);
      }
      await loadCRM();
    } catch (e: any) {
      setMessage(e?.message || "Bulk bonus failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function loadBonusProtection(resolvedViewerId?: string) {
    try {
      const currentViewerId = resolvedViewerId || viewerId || "supercoin";
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

      const currentViewerId = resolvedViewerId || viewerId || "supercoin";
      const currentThreshold = resolvedThreshold || threshold || "10";

      const res = await fetch(
        `/ui-api/admin/crm/low-balance/${encodeURIComponent(currentViewerId)}?threshold=${encodeURIComponent(currentThreshold)}&segment=${encodeURIComponent(segment)}&days=${encodeURIComponent(days)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load CRM");

      setRows(Array.isArray(json?.items) ? json.items : []);
      await loadBonusProtection(currentViewerId);
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
    loadCRM(resolved, threshold);
    loadBonusProtection(resolved);
  }, []);

  useEffect(() => {
    if (!viewerId) return;
    loadBonusProtection();
  }, [viewerId, segment, protectionDays]);

  const viewerQs = useMemo(() => `?viewer_id=${encodeURIComponent(viewerId)}`, [viewerId]);

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

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="grid gap-4 md:grid-cols-[220px_220px_140px_1fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Low Balance Threshold
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
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="low_balance">Low Balance</option>
              <option value="high_balance">High Balance</option>
              <option value="no_bet">No Bet</option>
              <option value="no_deposit">No Deposit</option>
              <option value="inactive">Inactive</option>
            </select>
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

          <div className="flex items-end text-sm text-slate-400">
            Choose a CRM segment and scan players in this hierarchy.
          </div>

          <div className="flex items-end">
            <button
              onClick={() => loadCRM()}
              className="w-full rounded-2xl bg-sky-500 px-4 py-3 font-black text-white"
            >
              Scan CRM
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black">Bulk Actions</h2>
            <p className="mt-1 text-sm text-slate-400">
              Applies to the current CRM result list only.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[160px_190px_180px_auto]">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Bonus Amount
              </label>
              <input
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                placeholder="10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Duplicate Protection
              </label>
              <select
                value={duplicateWindow}
                onChange={(e) => setDuplicateWindow(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              >
                <option value="today">Today</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="off">Off</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Protection Panel Days
              </label>
              <input
                value={protectionDays}
                onChange={(e) => setProtectionDays(e.target.value)}
                onBlur={() => loadBonusProtection()}
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                placeholder="30"
              />
            </div>

            <button
              onClick={grantBulkBonus}
              disabled={bulkBusy || !rows.length}
              className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-[#071824] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkBusy ? "Granting..." : `Grant Bonus to ${rows.length} Players`}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Bonus Protection</h2>
            <p className="mt-1 text-sm text-slate-400">
              Shows players already bonused for this CRM segment within the selected window.
            </p>
          </div>
          <button
            onClick={() => loadBonusProtection()}
            className="rounded-2xl bg-[#13202a] px-4 py-3 text-sm font-black text-slate-200 hover:bg-[#203442]"
          >
            Refresh Protection
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Segment</div>
            <div className="mt-2 text-lg font-black text-white">{protection?.segment || segment}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Window</div>
            <div className="mt-2 text-lg font-black text-white">{protection?.window_days || protectionDays} days</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Already Bonused</div>
            <div className="mt-2 text-2xl font-black text-amber-300">{protection?.already_bonused || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Eligible Now</div>
            <div className="mt-2 text-2xl font-black text-emerald-300">{protection?.eligible_now || 0}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-[#13202a] p-4">
          <div className="mb-3 text-sm font-black text-white">Recently Protected Players</div>
          {protection?.items?.length ? (
            <div className="grid gap-2">
              {protection.items.map((item: any) => (
                <div key={item.user_id} className="grid gap-2 rounded-xl border border-white/5 bg-[#0f172a] p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                  <Link href={`/agent/users/${encodeURIComponent(item.user_id)}${viewerQs}`} className="font-black text-white hover:text-sky-300">
                    {item.user_id}
                  </Link>
                  <div className="text-slate-300">Amount: <span className="font-black text-emerald-300">{money(item.bonus_amount)}</span></div>
                  <div className="text-xs text-slate-400">Last: {item.last_bonus_at ? new Date(item.last_bonus_at).toLocaleString() : "-"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#0f172a] px-4 py-3 text-sm text-slate-400">
              No protected bonus history found for this segment/window.
            </div>
          )}
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
          <div className="mt-2 text-2xl font-black text-emerald-300">Retention</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Suggested Reason</div>
          <div className="mt-2 text-2xl font-black text-white">loss_rebate</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black">Low Balance Candidates</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review players who may need a retention touch, manual bonus, or follow-up.
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
                    <Link
                      href={`/agent/users/${encodeURIComponent(row.user_id)}${viewerQs}`}
                      className="text-base font-black text-white hover:text-sky-300"
                    >
                      {row.user_id}
                    </Link>
                    <div className="mt-2 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                      <div>Username: <span className="text-white">{row.username || "-"}</span></div>
                      <div>Full Name: <span className="text-white">{row.full_name || "-"}</span></div>
                      <div>Email: <span className="text-white">{row.email || "-"}</span></div>
                      <div>Telegram: <span className="text-white">{row.telegram || "-"}</span></div>
                      <div>Parent: <span className="text-white">{row.parent_id || "-"}</span></div>
                      <div>Suggested Reason: <span className="text-emerald-300">{row.suggested_reason || "-"}</span></div>
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
