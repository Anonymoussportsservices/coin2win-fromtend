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

  async function editBilling(edge: BillingEdge) {
    try {
      const pphRaw = window.prompt(`PPH Rate for ${edge.child_id}`, String(edge.pph_rate ?? 0));
      if (pphRaw === null) return;
      const ggrRaw = window.prompt(`GGR Share for ${edge.child_id} (example 0.25 = 25%)`, String(edge.ggr_share ?? 0));
      if (ggrRaw === null) return;

      const pph = Number(pphRaw);
      const ggr = Number(ggrRaw);

      if (!Number.isFinite(pph) || pph < 0) throw new Error("Invalid PPH rate");
      if (!Number.isFinite(ggr) || ggr < 0 || ggr > 1) throw new Error("GGR share must be between 0 and 1");

      setBusyId(edge.child_id);
      setMessage("");

      const res = await fetch(`/ui-api/admin/billing/edge-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: edge.parent_id,
          child_id: edge.child_id,
          pph_rate: pph,
          ggr_share: ggr,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.detail || json?.error || "Failed to update billing");

      setMessage(`Billing updated for ${edge.child_id} ✅`);
      await load(periodKey, days);
    } catch (e: any) {
      setMessage(e?.message || "Failed to update billing");
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
              Hierarchy, billing status, monthly runs, and financial relationships.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Period</div>
              <input
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="YYYY-MM"
                className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Active Window</div>
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
            <Card title="Relationships" value={String(Number(data.summary.edge_count || 0))} sub={`${Number(data.summary.run_count || 0)} runs`} />
            <Card title="Player Count" value={String(Number(data.summary.player_count || 0))} sub="From billing runs" />
            <Card title="Active Players" value={String(Number(data.summary.active_players || 0))} sub={`${Number(data.summary.activity_window_days || 0)}-day live window`} />
            <Card title="PPH Amount" value={money(data.summary.pph_amount)} />
            <Card title="Total Amount" value={money(data.summary.total_amount)} sub={data.summary.has_any_run ? "Billing run exists" : "No runs yet"} />
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
                  const canEnable = !isViewer && !rel;
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
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-black text-emerald-300">
                                  Billing configured
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
                              {busyId === row.id ? "Enabling..." : "Enable Billing"}
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
              <h2 className="text-xl font-black">Billing Relationships</h2>
              <div className="mt-4 grid gap-4">
                {data.edges?.length ? (
                  data.edges.map((edge) => (
                    <div key={edge.id} className="rounded-2xl border border-white/5 bg-[#13232d] p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Relationship
                      </div>
                      <div className="mt-1 text-lg font-black text-white">
                        {edge.parent_id} bills {edge.child_id}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#10202a] p-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Mode</div>
                          <div className="mt-1 font-black text-white">{edge.billing_type}</div>
                        </div>
                        <div className="rounded-2xl bg-[#10202a] p-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Cycle</div>
                          <div className="mt-1 font-black text-white">{edge.billing_cycle}</div>
                        </div>
                        <div className="rounded-2xl bg-[#10202a] p-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">PPH Rate</div>
                          <div className="mt-1 font-black text-white">{money(edge.pph_rate)}</div>
                        </div>
                        <div className="rounded-2xl bg-[#10202a] p-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">GGR Share</div>
                          <div className="mt-1 font-black text-white">{fmtPct(edge.ggr_share)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full px-3 py-1 font-black ${edge.sportsbook_enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"}`}>Sportsbook</span>
                        <span className={`rounded-full px-3 py-1 font-black ${edge.casino_enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"}`}>Casino</span>
                        <span className={`rounded-full px-3 py-1 font-black ${edge.crash_enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"}`}>Originals</span>
                      </div>

                      {edge.run ? (
                        <div className="mt-4 rounded-2xl border border-white/5 bg-[#10202a] p-4">
                          <div className="text-sm font-black text-white">Latest run for {edge.run.period_key}</div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Player Count</div>
                              <div className="mt-1 font-black text-white">{edge.run.player_count}</div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Total</div>
                              <div className="mt-1 font-black text-white">{money(edge.run.total_amount)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">PPH</div>
                              <div className="mt-1 font-black text-white">{money(edge.run.pph_amount)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">GGR</div>
                              <div className="mt-1 font-black text-white">{money(edge.run.ggr_amount)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Originals GGR</div>
                              <div className="mt-1 font-black text-white">{money(edge.run.originals_ggr)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Created</div>
                              <div className="mt-1 font-black text-white">{fmtDate(edge.run.created_at)}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          No billing run exists yet for this period.
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                    No billing relationships configured yet.
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">History</div>
                {inactiveRelationships.length ? (
                  <div className="grid gap-4">
                    {inactiveRelationships.map((edge) => (
                      <div key={edge.id} className="rounded-3xl border border-white/5 bg-[#10202a] p-5 opacity-90">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Historical Relationship</div>
                            <div className="mt-1 text-lg font-black text-white">
                              {edge.parent_id} billed {edge.child_id}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-white/10 px-3 py-1 font-black text-slate-300">
                                Inactive
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1 font-black text-slate-300">
                                {edge.billing_type}
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1 font-black text-slate-300">
                                {edge.billing_cycle}
                              </span>
                              <span className={`rounded-full px-3 py-1 font-black ${edge.has_run ? "bg-sky-500/20 text-sky-300" : "bg-slate-500/20 text-slate-300"}`}>
                                {edge.has_run ? "Historical run exists" : "No run recorded"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">PPH</div>
                              <div className="mt-2 text-lg font-black text-white">{money(edge.pph_rate)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">GGR %</div>
                              <div className="mt-2 text-lg font-black text-white">{fmtPct(edge.ggr_share)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Updated</div>
                              <div className="mt-2 text-sm font-black text-white">{fmtDate(edge.updated_at)}</div>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Created</div>
                              <div className="mt-2 text-sm font-black text-white">{fmtDate(edge.created_at)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                    No historical billing relationships found.
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
