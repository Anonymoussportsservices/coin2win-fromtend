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
  const [viewerId, setViewerId] = useState("user_81148ba29e");
  const [threshold, setThreshold] = useState("10");
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCRM(resolvedViewerId?: string, resolvedThreshold?: string) {
    try {
      setLoading(true);
      setMessage("");

      const currentViewerId = resolvedViewerId || viewerId || "user_81148ba29e";
      const currentThreshold = resolvedThreshold || threshold || "10";

      const res = await fetch(
        `/ui-api/admin/crm/low-balance/${encodeURIComponent(currentViewerId)}?threshold=${encodeURIComponent(currentThreshold)}`,
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
    const fromStorage = localStorage.getItem("agent_viewer_id") || "";
    const resolved = fromUrl || fromStorage || "user_81148ba29e";
    localStorage.setItem("agent_viewer_id", resolved);
    setViewerId(resolved);
    loadCRM(resolved, threshold);
  }, []);

  const viewerQs = useMemo(() => `?viewer_id=${encodeURIComponent(viewerId)}`, [viewerId]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">CRM</h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          Starter CRM trigger view for low-balance player retention.
        </p>
        <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Viewing: {viewerId === "user_81148ba29e" ? "Global (Admin)" : "Your Network Only"}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
        <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
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

          <div className="flex items-end text-sm text-slate-400">
            Players at or below this available balance will appear here for retention follow-up.
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
                    <div className="text-base font-black text-white">{row.user_id}</div>
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
