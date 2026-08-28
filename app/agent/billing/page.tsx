"use client";

import { useEffect, useMemo, useState } from "react";

type BillingRun = {
  id: number;
  agent_id: string;
  billing_mode: string;
  period_key: string;
  player_count: number;
  sportsbook_ggr: number;
  casino_ggr: number;
  crash_ggr: number;
  originals_ggr: number;
  pph_amount: number;
  ggr_amount: number;
  total_amount: number;
  details_json?: string;
  created_at?: string | null;
};

type BillingInvoice = BillingRun & {
  parent_id: string;
  child_id: string;
  status?: string;
  paid_at?: string | null;
  paid_by?: string | null;
  note?: string | null;
  is_current?: boolean;
};

type BillingEdge = {
  id: number;
  parent_id: string;
  child_id: string;
  billing_type: string;
  billing_cycle: string;
  pph_rate: number;
  ggr_share: number;
  sportsbook_enabled: boolean;
  casino_enabled: boolean;
  crash_enabled: boolean;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  has_run: boolean;
  run: BillingRun | null;
};

type BillingSummaryResponse = {
  ok: boolean;
  viewer?: {
    id: string;
    role: string;
    parent_id?: string | null;
    created_by?: string | null;
    agent_code?: string | null;
    is_active?: boolean;
    created_at?: string | null;
    billing_type?: string | null;
    pph_rate?: number;
    ggr_share?: number;
  };
  period_key: string;
  summary: {
    edge_count?: number;
    active_relationship_count?: number;
    inactive_relationship_count?: number;
    run_count: number;
    has_any_run: boolean;
    player_count: number;
    active_players: number;
    pph_amount: number;
    ggr_amount: number;
    total_amount: number;
    sportsbook_ggr: number;
    casino_ggr: number;
    crash_ggr: number;
    originals_ggr: number;
    activity_window_days: number;
  };
  edges?: BillingEdge[];
  active_relationships?: BillingEdge[];
  inactive_relationships?: BillingEdge[];
};

type UserRow = {
  id: string;
  role: string;
  parent_id?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  agent_code?: string | null;
};

type TreeNode = UserRow & { depth: number };

function money(v: unknown) {
  const n = Number(v || 0);
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function fmtPct(v: unknown) {
  return `${(Number(v || 0) * 100).toFixed(2)}%`;
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function currentPeriodKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {

  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="mt-3 text-3xl font-black text-white">{value}</div>
      {sub ? <div className="mt-2 text-sm text-slate-400">{sub}</div> : null}
    </div>
  );
}

function buildTree(rows: UserRow[], viewerId: string): TreeNode[] {
  const byParent = new Map<string, UserRow[]>();

  for (const row of rows) {
    const key = String(row.parent_id || "__root__");
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(row);
  }

  for (const [, list] of byParent) {
    list.sort((a, b) => {
      const ra = String(a.role || "");
      const rb = String(b.role || "");
      if (ra !== rb) return ra.localeCompare(rb);
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  const out: TreeNode[] = [];
  const root = rows.find((r) => r.id === viewerId);

  if (root) out.push({ ...root, depth: 0 });
  else out.push({ id: viewerId, role: "viewer", parent_id: null, depth: 0 });

  function walk(parentId: string, depth: number) {
    const kids = byParent.get(parentId) || [];
    for (const kid of kids) {
      out.push({ ...kid, depth });
      walk(kid.id, depth + 1);
    }
  }

  walk(viewerId, 1);
  return out;
}

export default function AgentBillingPage() {
  const [data, setData] = useState<BillingSummaryResponse | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [payableInvoices, setPayableInvoices] = useState<BillingInvoice[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [days, setDays] = useState(30);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [liveEstimate, setLiveEstimate] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string | null>(null);

  const viewerId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("viewer_id") || localStorage.getItem("agent_viewer_id") || "";
  }, []);

  async function refreshLiveEstimate(nextPeriod?: string) {
    if (!viewerId) return;
    const pk = nextPeriod || periodKey;

    try {
      setLiveLoading(true);
      const res = await fetch(`/ui-api/admin/billing/live-estimate/${encodeURIComponent(viewerId)}?period_key=${encodeURIComponent(pk)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok) {
        setLiveEstimate(json);
        setLiveUpdatedAt(new Date().toLocaleTimeString());
      }
    } finally {
      setLiveLoading(false);
    }
  }

  async function load(nextPeriod?: string, nextDays?: number) {
    const pk = nextPeriod || periodKey;
    const dd = nextDays ?? days;

    try {
      setLoading(true);
      setMessage("");

      if (!viewerId) throw new Error("Missing viewer_id");

      const qs = new URLSearchParams({
        viewer_id: viewerId,
        period_key: pk,
        days: String(dd),
      });

      const [billingRes, usersRes, historyRes] = await Promise.all([
        fetch(`/ui-api/admin/billing/summary?${qs.toString()}`, { cache: "no-store" }),
        fetch(`/ui-api/admin/users?viewer_id=${encodeURIComponent(viewerId)}`, { cache: "no-store" }),
        fetch(`/ui-api/admin/billing/history/${encodeURIComponent(viewerId)}?limit=100`, { cache: "no-store" }),
      ]);

      const billingJson = await billingRes.json().catch(() => ({}));
      const usersJson = await usersRes.json().catch(() => ({}));
      const historyJson = await historyRes.json().catch(() => ({}));

      if (!billingRes.ok) throw new Error(billingJson?.detail || "Failed to load billing summary");
      if (!usersRes.ok) throw new Error(usersJson?.detail || "Failed to load users");
      if (!historyRes.ok) throw new Error(historyJson?.detail || "Failed to load billing history");

      setData(billingJson);
      setUsers(Array.isArray(usersJson?.users) ? usersJson.users : []);
      await refreshLiveEstimate(pk);
      setInvoices(Array.isArray(historyJson?.receivable_invoices) ? historyJson.receivable_invoices : Array.isArray(historyJson?.invoices) ? historyJson.invoices : []);
      setPayableInvoices(Array.isArray(historyJson?.payable_invoices) ? historyJson.payable_invoices : []);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load billing dashboard");
      setData(null);
      setUsers([]);
      setLiveEstimate(null);
      setLiveUpdatedAt(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  function updateBillingEdge(edgeId: number, patch: Partial<BillingEdge>) {
    setData((prev) => {
      if (!prev) return prev;

      const patchList = (list?: BillingEdge[]) =>
        (list || []).map((edge) => edge.id === edgeId ? { ...edge, ...patch } : edge);

      return {
        ...prev,
        edges: patchList(prev.edges),
        active_relationships: patchList(prev.active_relationships),
        inactive_relationships: patchList(prev.inactive_relationships),
      };
    });
  }

  async function saveBillingEdge(edge: BillingEdge) {
    try {
      setBusyId(edge.child_id);
      setMessage("");

      const res = await fetch(`/ui-api/admin/billing/edge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: edge.parent_id,
          child_id: edge.child_id,
          billing_type: edge.billing_type || "hybrid",
          pph_rate: Number(edge.pph_rate || 0),
          ggr_share: Number(edge.ggr_share || 0),
          sportsbook_enabled: !!edge.sportsbook_enabled,
          casino_enabled: true,
          crash_enabled: !!edge.crash_enabled,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Failed to save billing link");

      setMessage(`Billing updated for ${edge.child_id} ✅`);
      await load(periodKey, days);
    } catch (e: any) {
      setMessage(e?.message || "Failed to save billing link");
    } finally {
      setBusyId("");
    }
  }

  async function enableBilling(row: UserRow) {
    try {
      if (!row.parent_id) throw new Error("Missing parent_id for billing relationship");
      setBusyId(row.id);
      setMessage("");

      const res = await fetch(`/ui-api/admin/billing/edge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: row.parent_id,
          child_id: row.id,
          billing_type: "hybrid",
          pph_rate: 0,
          ggr_share: 0,
          sportsbook_enabled: true,
          casino_enabled: true,
          crash_enabled: true,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to enable billing");

      setMessage(`Billing enabled for ${row.id} ✅`);
      await load(periodKey, days);
    } catch (e: any) {
      setMessage(e?.message || "Failed to enable billing");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    if (!viewerId) return;
    load(periodKey, days);
  }, [viewerId]);

  const relationshipMap = useMemo(() => {
    const m = new Map<string, BillingEdge>();
    for (const edge of data?.edges || []) {
      m.set(`${edge.parent_id}__${edge.child_id}`, edge);
    }
    return m;
  }, [data]);

  const tree = useMemo(() => {
    const fullTree = buildTree(users, viewerId);
    return fullTree.filter((row) => String(row.role || "").toLowerCase() !== "player");
  }, [users, viewerId]);

  const allActiveRelationships = data?.active_relationships || data?.edges || [];
  const allInactiveRelationships = data?.inactive_relationships || [];

  const activeRelationships = allActiveRelationships.filter(
    (edge) => edge.parent_id === viewerId
  );
  const inactiveRelationships = allInactiveRelationships.filter(
    (edge) => edge.parent_id === viewerId
  );

  const billingRelationships = activeRelationships;

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="rounded-[28px] border border-white/5 bg-[linear-gradient(135deg,#1a2c38_0%,#13232d_100%)] p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Financial</div>
            <h1 className="mt-2 text-3xl font-black">Billing Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Review billing charges, active players, and agent relationships.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Billing Period</div>
              <input
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="YYYY-MM"
                className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Active Player Window</div>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value || 30))}
                className="w-28 rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-white outline-none"
              />
            </div>

            <button
              onClick={() => load(periodKey, days)}
              className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-black text-white"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#1a2c38] p-6 text-slate-400">
          Loading billing dashboard...
        </div>
      ) : !data ? null : (
        <>
          {(() => {
            const isCurrentPeriod = periodKey === currentPeriodKey();
            const liveRows = Array.isArray(liveEstimate?.receivables) ? liveEstimate.receivables : [];
            const liveTotal = Number(liveEstimate?.summary?.receivable_total || 0);
            const liveGgr = liveRows.reduce((sum: number, x: any) => sum + Number(x.ggr_amount || 0), 0);
            const livePph = liveRows.reduce((sum: number, x: any) => sum + Number(x.pph_amount || 0), 0);
            const liveHeads = liveRows.reduce((sum: number, x: any) => sum + Number(x.sportsbook_active_players || 0), 0);

            return (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card
              title={isCurrentPeriod ? "Live Monthly Tab" : "Total Billing"}
              value={money(isCurrentPeriod ? liveTotal : data.summary.total_amount)}
              sub={isCurrentPeriod ? `Live estimate${liveUpdatedAt ? ` · updated ${liveUpdatedAt}` : ""}` : (data.summary.has_any_run ? "Official generated invoice" : "No charge generated yet")}
            />
            <Card
              title="GGR Charge"
              value={money(isCurrentPeriod ? liveGgr : data.summary.ggr_amount)}
              sub={isCurrentPeriod ? "Live casino/originals/studios share" : "Official casino revenue share"}
            />
            <Card
              title="PPH Charge"
              value={money(isCurrentPeriod ? livePph : Math.max(0, Number(data.summary.total_amount || 0) - Number(data.summary.ggr_amount || 0)))}
              sub="Sportsbook active players × PPH rate"
            />
            <Card
              title="Sportsbook Heads"
              value={String(isCurrentPeriod ? liveHeads : Number(data.summary.player_count || 0))}
              sub={isCurrentPeriod ? "Live PPH count" : "Official invoice PPH count"}
            />
            <Card
              title={isCurrentPeriod ? "Live Agreements" : "Inactive Customers"}
              value={String(isCurrentPeriod ? liveRows.length : Math.max(0, Number(data.summary.player_count || 0) - Number(data.summary.active_players || 0)))}
              sub={isCurrentPeriod ? "Direct active billing agreements" : "No activity in current period"}
            />
          </div>

            );
          })()}

          <div className="mt-6 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black">Agent Billing Agreements</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Direct billing agreements only. To bill agents one level lower, open that parent agent first.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                Viewer: <span className="font-black text-white">{data.viewer?.id || viewerId || "-"}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {billingRelationships.length ? (
                billingRelationships.map((edge) => (
                  <div
                    key={edge.id}
                    className={`rounded-3xl border p-5 ${
                      edge.is_active === false
                        ? "border-amber-500/20 bg-amber-500/10"
                        : "border-white/5 bg-[#13232d]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      {(() => {
                        const liveRow = Array.isArray(liveEstimate?.receivables)
                          ? liveEstimate.receivables.find((row: any) => row.child_id === edge.child_id)
                          : null;

                        const lastBill = invoices.find((inv) => inv.child_id === edge.child_id && Number(inv.total_amount || 0) > 0)
                          || invoices.find((inv) => inv.child_id === edge.child_id)
                          || edge.run;

                        const currentTab = periodKey === currentPeriodKey()
                          ? Number(liveRow?.total_amount || 0)
                          : Number(edge.run?.total_amount || 0);

                        return (
                          <>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-white/10 bg-[#0f172a] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                                  Billing Agreement
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    edge.is_active === false
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-emerald-500/20 text-emerald-300"
                                  }`}
                                >
                                  {edge.is_active === false ? "Inactive" : "Active"}
                                </span>
                              </div>

                              <div className="mt-3 text-2xl font-black text-white">
                                {edge.child_id}
                              </div>
                              <div className="mt-1 text-sm text-slate-400">
                                Billed by {edge.parent_id}
                              </div>
                            </div>

                            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[560px] xl:grid-cols-5">
                              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                                  Current Tab
                                </div>
                                <div className="mt-1 text-2xl font-black text-white">{money(currentTab)}</div>
                                <div className="mt-1 text-xs text-slate-300">
                                  {periodKey === currentPeriodKey() ? "Live estimate" : periodKey}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/5 bg-[#0f172a] px-4 py-3 text-sm">
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                  Last Bill
                                </div>
                                <div className="mt-1 text-2xl font-black text-white">{money(lastBill?.total_amount || 0)}</div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {lastBill?.period_key || "-"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/5 bg-[#0f172a] px-4 py-3 text-sm">
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                  Mode
                                </div>
                                <div className="mt-2 text-lg font-black uppercase text-white">{edge.billing_type}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {edge.billing_cycle}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/5 bg-[#0f172a] px-4 py-3 text-sm">
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                  PPH
                                </div>
                                <div className="mt-2 text-lg font-black text-white">{money(edge.pph_rate)}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  sportsbook heads
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/5 bg-[#0f172a] px-4 py-3 text-sm">
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                  GGR
                                </div>
                                <div className="mt-2 text-lg font-black text-white">{fmtPct(edge.ggr_share)}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  revenue share
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/5 bg-[#10202a] p-4">
                      <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                        Billing Settings
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4">
                          <label className="flex items-center justify-between gap-3">
                            <span>
                              <span className="block text-sm font-black text-white">PPH</span>
                              
                            </span>
                            <input
                              type="checkbox"
                              checked={edge.billing_type === "pph" || edge.billing_type === "hybrid"}
                              onChange={(e) => {
                                const pphOn = e.target.checked;
                                const ggrOn = edge.billing_type === "ggr" || edge.billing_type === "hybrid";
                                updateBillingEdge(edge.id, {
                                  billing_type: pphOn && ggrOn ? "hybrid" : pphOn ? "pph" : "ggr",
                                  ...(pphOn ? {} : { pph_rate: 0 }),
                                });
                              }}
                              className="h-5 w-5"
                            />
                          </label>

                          <div className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">PPH Amount</div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            disabled={!(edge.billing_type === "pph" || edge.billing_type === "hybrid")}
                            value={edge.pph_rate ?? 0}
                            onChange={(e) => updateBillingEdge(edge.id, { pph_rate: Number(e.target.value || 0) })}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#13232d] px-3 py-2 font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                          />
                          <div className="mt-1 text-[11px] text-slate-500">10 = $10/player</div>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4">
                          <label className="flex items-center justify-between gap-3">
                            <span>
                              <span className="block text-sm font-black text-white">GGR</span>
                              
                            </span>
                            <input
                              type="checkbox"
                              checked={edge.billing_type === "ggr" || edge.billing_type === "hybrid"}
                              onChange={(e) => {
                                const ggrOn = e.target.checked;
                                const pphOn = edge.billing_type === "pph" || edge.billing_type === "hybrid";
                                updateBillingEdge(edge.id, {
                                  billing_type: pphOn && ggrOn ? "hybrid" : ggrOn ? "ggr" : "pph",
                                  ...(ggrOn ? {} : { ggr_share: 0 }),
                                });
                              }}
                              className="h-5 w-5"
                            />
                          </label>

                          <div className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">GGR %</div>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            disabled={!(edge.billing_type === "ggr" || edge.billing_type === "hybrid")}
                            value={edge.ggr_share ?? 0}
                            onChange={(e) => updateBillingEdge(edge.id, { ggr_share: Number(e.target.value || 0) })}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#13232d] px-3 py-2 font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                          />
                          <div className="mt-1 text-[11px] text-slate-500">0.20 = 20%</div>
                        </div>

                        
                      </div>

                      <div className="mt-3 rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-slate-400">
                        Toggle billing modes on/off, then edit the amount or percentage. Backend saves as PPH, GGR, or Hybrid.
                      </div>
                    </div>

                    <button
                      onClick={() => saveBillingEdge(edge)}
                      disabled={busyId === edge.child_id}
                      className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-60 ${
                        edge.is_active === false
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-emerald-500 text-[#071824]"
                      }`}
                    >
                      {busyId === edge.child_id
                        ? "Saving..."
                        : edge.is_active === false
                          ? "Enable Billing"
                          : "Save Billing Agreement"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                  No direct billing agreements found for this viewer.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            {(() => {
              const historyRows = [
                ...payableInvoices.map((inv) => ({ ...inv, direction: "Payable" as const, counterparty: inv.parent_id })),
                ...invoices.map((inv) => ({ ...inv, direction: "Receivable" as const, counterparty: inv.child_id || inv.agent_id })),
              ].sort((a, b) => {
                const periodCmp = String(b.period_key || "").localeCompare(String(a.period_key || ""));
                if (periodCmp !== 0) return periodCmp;

                const dirRank = (x: any) => x.direction === "Payable" ? 0 : 1;
                const dirCmp = dirRank(a) - dirRank(b);
                if (dirCmp !== 0) return dirCmp;

                return Number(b.total_amount || 0) - Number(a.total_amount || 0);
              });

              const periods = Array.from(new Set(historyRows.map((row) => row.period_key)));

              return (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black">Invoice Timeline</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Professional month-by-month view of payable and receivable invoices.
                      </p>
                    </div>
                    <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
                      {historyRows.length} records
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5">
                    {periods.length ? periods.map((period) => {
                      const rows = historyRows.filter((row) => row.period_key === period);
                      const receivableTotal = rows
                        .filter((row) => row.direction === "Receivable" && row.is_current !== false)
                        .reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
                      const payableTotal = rows
                        .filter((row) => row.direction === "Payable" && row.is_current !== false)
                        .reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
                      const net = receivableTotal - payableTotal;

                      return (
                        <div key={period} className="rounded-3xl border border-white/5 bg-[#13232d] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Billing Period</div>
                              <div className="mt-1 text-2xl font-black text-white">{period}</div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">Receivable</div>
                                <div className="mt-1 text-xl font-black text-white">{money(receivableTotal)}</div>
                              </div>
                              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">Payable</div>
                                <div className="mt-1 text-xl font-black text-white">{money(payableTotal)}</div>
                              </div>
                              <div className="rounded-2xl border border-white/5 bg-[#0f172a] px-4 py-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Net</div>
                                <div className="mt-1 text-xl font-black text-white">{money(net)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-5">
                            {(() => {
                              const payableRows = rows
                                .filter((row: any) => row.direction === "Payable")
                                .sort((a: any, b: any) => Number(b.total_amount || 0) - Number(a.total_amount || 0));

                              const receivableRows = rows
                                .filter((row: any) => row.direction === "Receivable")
                                .sort((a: any, b: any) => Number(b.total_amount || 0) - Number(a.total_amount || 0));

                              const renderInvoiceCard = (inv: any) => (
                                <div key={`${inv.direction}-${inv.id}`} className="rounded-2xl border border-white/5 bg-[#0f172a] p-4">
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                                          inv.direction === "Receivable"
                                            ? "bg-emerald-500/15 text-emerald-300"
                                            : "bg-amber-500/15 text-amber-300"
                                        }`}>
                                          {inv.direction}
                                        </span>
                                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">
                                          {inv.is_current === false ? "Old Version" : "Current"}
                                        </span>
                                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">
                                          {inv.status || "generated"}
                                        </span>
                                      </div>

                                      <div className="mt-2 text-lg font-black text-white">{inv.counterparty || "-"}</div>
                                      <div className="mt-1 text-xs text-slate-500">
                                        {String(inv.billing_mode || "").toUpperCase()} · Players {Number(inv.player_count || 0)} · Generated {fmtDate(inv.created_at)}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-right md:min-w-[360px]">
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">PPH</div>
                                        <div className="mt-1 font-black text-slate-200">{money(inv.pph_amount)}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">GGR</div>
                                        <div className="mt-1 font-black text-slate-200">{money(inv.ggr_amount)}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Total</div>
                                        <div className="mt-1 text-lg font-black text-white">{money(inv.total_amount)}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );

                              return (
                                <>
                                  <div className="rounded-3xl border border-amber-500/10 bg-amber-500/5 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Payable</div>
                                        <div className="mt-1 text-sm text-slate-400">What this account owes upstream.</div>
                                      </div>
                                      <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
                                        {payableRows.length}
                                      </div>
                                    </div>

                                    <div className="grid gap-3">
                                      {payableRows.length ? payableRows.map(renderInvoiceCard) : (
                                        <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4 text-sm text-slate-400">
                                          No payable invoices for this period.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Receivable</div>
                                        <div className="mt-1 text-sm text-slate-400">What direct agents owe this account.</div>
                                      </div>
                                      <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                                        {receivableRows.length}
                                      </div>
                                    </div>

                                    <div className="grid gap-3">
                                      {receivableRows.length ? (
                                        <>
                                          {receivableRows.slice(0, 10).map(renderInvoiceCard)}

                                          {receivableRows.length > 10 ? (
                                            <details className="rounded-2xl border border-white/5 bg-[#0f172a] p-4">
                                              <summary className="cursor-pointer text-sm font-black text-emerald-300">
                                                Show all {receivableRows.length} receivable invoices
                                              </summary>
                                              <div className="mt-4 grid gap-3">
                                                {receivableRows.slice(10).map(renderInvoiceCard)}
                                              </div>
                                            </details>
                                          ) : null}
                                        </>
                                      ) : (
                                        <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4 text-sm text-slate-400">
                                          No receivable invoices for this period.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                        No invoice history found.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

        </>
      )}
    </div>
  );
}
