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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [days, setDays] = useState(30);

  const viewerId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("viewer_id") || localStorage.getItem("agent_viewer_id") || "";
  }, []);

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

      const [billingRes, usersRes] = await Promise.all([
        fetch(`/ui-api/admin/billing/summary?${qs.toString()}`, { cache: "no-store" }),
        fetch(`/ui-api/admin/users?viewer_id=${encodeURIComponent(viewerId)}`, { cache: "no-store" }),
      ]);

      const billingJson = await billingRes.json().catch(() => ({}));
      const usersJson = await usersRes.json().catch(() => ({}));

      if (!billingRes.ok) throw new Error(billingJson?.detail || "Failed to load billing summary");
      if (!usersRes.ok) throw new Error(usersJson?.detail || "Failed to load users");

      setData(billingJson);
      setUsers(Array.isArray(usersJson?.users) ? usersJson.users : []);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load billing dashboard");
      setData(null);
      setUsers([]);
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
          casino_enabled: !!edge.casino_enabled,
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
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card title="Billing Charge" value={money(data.summary.total_amount)} sub={data.summary.has_any_run ? "Current period" : "No charge yet"} />
            <Card title="Player Count" value={String(Number(data.summary.player_count || 0))} sub="Players included in billing run" />
            <Card title="Active Players" value={String(Number(data.summary.active_players || 0))} sub={`Played in last ${Number(data.summary.activity_window_days || 0)} days`} />
            <Card title="PPH Amount" value={money(data.summary.pph_amount)} />
            <Card title="Relationships" value={String(Number(data.summary.edge_count || 0))} sub={`${Number(data.summary.run_count || 0)} billing runs`} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card title="GGR Amount" value={money(data.summary.ggr_amount)} />
            <Card title="Originals GGR" value={money(data.summary.originals_ggr)} />
            <Card title="Sportsbook GGR" value={money(data.summary.sportsbook_ggr)} />
            <Card title="Casino GGR" value={money(data.summary.casino_ggr)} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">Hierarchy Tree</h2>
                <div className="text-sm text-slate-400">
                  Viewer: <span className="font-black text-white">{data.viewer?.id || viewerId || "-"}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {tree.map((row) => {
                  const rel = relationshipMap.get(`${row.parent_id || ""}__${row.id}`);
                  const isViewer = row.id === viewerId;
                  const canEnable = !isViewer && (!rel || rel.is_active === false);
                  const indent = row.depth * 18;

                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-white/5 bg-[#13232d] p-4"
                      style={{ marginLeft: `${indent}px` }}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            {row.role}
                          </div>
                          <div className="mt-1 text-lg font-black text-white">{row.id}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {isViewer ? (
                              <span className="rounded-full bg-sky-500/20 px-3 py-1 font-black text-sky-300">
                                Root viewer
                              </span>
                            ) : rel ? (
                              <>
                                <span className={`rounded-full px-3 py-1 font-black ${rel.is_active === false ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                  {rel.is_active === false ? "Billing inactive" : "Billing configured"}
                                </span>
                                <span className={`rounded-full px-3 py-1 font-black ${rel.has_run ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                                  {rel.has_run ? "Run exists" : "No run this period"}
                                </span>
                              </>
                            ) : (
                              <span className="rounded-full bg-amber-500/20 px-3 py-1 font-black text-amber-300">
                                No billing configured
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-sm text-slate-400">
                            Parent: <span className="font-bold text-slate-200">{row.parent_id || "-"}</span>
                            {rel ? (
                              <>
                                {" • "}Relationship:{" "}
                                <span className="font-bold text-slate-200">
                                  {rel.parent_id} bills {rel.child_id}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canEnable ? (
                            <button
                              onClick={() => enableBilling(row)}
                              disabled={busyId === row.id}
                              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60"
                            >
                              {busyId === row.id ? "Saving..." : rel?.is_active === false ? "Reactivate Billing" : "Enable Billing"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Agent Billing</h2>
              <div className="mt-4 grid gap-4">
                {activeRelationships.length ? (
                  activeRelationships.map((edge) => (
                    <div key={edge.id} className="rounded-2xl border border-white/5 bg-[#13232d] p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Billing Link</div>
                      <div className="mt-1 text-lg font-black text-white">{edge.parent_id} bills {edge.child_id}</div>

                      <div className="mt-4 rounded-2xl border border-white/5 bg-[#10202a] p-4">
                        <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Billing Settings</div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Billing Type</div>
                            <select
                              value={edge.billing_type || "hybrid"}
                              onChange={(e) => {
                                const nextType = e.target.value;
                                updateBillingEdge(edge.id, {
                                  billing_type: nextType,
                                  ...(nextType === "pph" ? { ggr_share: 0 } : {}),
                                  ...(nextType === "ggr" ? { pph_rate: 0 } : {}),
                                });
                              }}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none"
                            >
                              <option value="hybrid">Hybrid: PPH + GGR</option>
                              <option value="ggr">GGR Only</option>
                              <option value="pph">PPH Only</option>
                            </select>
                          </div>

                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">PPH Rate</div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              disabled={edge.billing_type === "ggr"}
                              value={edge.pph_rate ?? 0}
                              onChange={(e) => updateBillingEdge(edge.id, { pph_rate: Number(e.target.value || 0) })}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            />
                            <div className="mt-1 text-[11px] text-slate-500">Example: 10 = $10/player</div>
                          </div>

                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">GGR Share</div>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.01"
                              disabled={edge.billing_type === "pph"}
                              value={edge.ggr_share ?? 0}
                              onChange={(e) => updateBillingEdge(edge.id, { ggr_share: Number(e.target.value || 0) })}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            />
                            <div className="mt-1 text-[11px] text-slate-500">Example: 0.20 = 20%</div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-slate-400">
                          Suggested plans: Hybrid = $10 PPH + 0.20 GGR · GGR Only = 0.30
                        </div>
                      </div>

                      <button
                        onClick={() => saveBillingEdge(edge)}
                        disabled={busyId === edge.child_id}
                        className="mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-[#071824] disabled:opacity-60"
                      >
                        {busyId === edge.child_id ? "Saving..." : "Save Billing Settings"}
                      </button>

                      {edge.run ? (
                        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Billing Charge ({edge.run.period_key})</div>
                          <div className="mt-2 text-2xl font-black text-white">{money(edge.run.total_amount)}</div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                            <span>Players: {edge.run.player_count}</span>
                            <span>PPH: {money(edge.run.pph_amount)}</span>
                            <span>GGR: {money(edge.run.ggr_amount)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          No charge generated for this period yet.
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                    No active billing links configured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
