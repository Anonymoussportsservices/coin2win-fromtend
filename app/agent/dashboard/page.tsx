"use client";

import { useEffect, useMemo, useState } from "react";

type DownlineRow = {
  id: string;
  role?: string | null;
  parent_id?: string | null;
  created_by?: string | null;
  permissions_json?: string | null;
  agent_code?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  depth?: number;
};

type BillingHistoryRow = {
  id: number;
  billing_mode: string;
  period_key: string;
  details_json?: string | null;
  created_at?: string | null;
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

function roleOptionsForViewer(viewerRole: string) {
  const map: Record<string, string[]> = {
    superadmin: ["master_agent","agent"],
    master_agent: ["agent","sub_agent","player"],
    agent: ["agent","sub_agent","player"],
    sub_agent: ["player"],
    player: [],
  };
  return map[viewerRole] || [];
}

function roleChip(role?: string | null) {
  const r = String(role || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border";

  if (r === "superadmin") return `${base} bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20`;
  if (r === "admin") return `${base} bg-sky-500/15 text-sky-300 border-sky-500/20`;
  if (r === "master_agent") return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (r === "agent") return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (r === "sub_agent") return `${base} bg-lime-500/15 text-lime-300 border-lime-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">
      {children}
    </label>
  );
}

export default function AgentDashboard() {
  const [viewerId, setViewerId] = useState("");
  const [viewerRole, setViewerRole] = useState("");
  const [balance, setBalance] = useState(0);
  const [ggr, setGgr] = useState(0);
  const [downlineCount, setDownlineCount] = useState(0);
  const [tree, setTree] = useState<DownlineRow[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryRow[]>([]);
  const [selectedBillingHistory, setSelectedBillingHistory] = useState<BillingHistoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [newUserId, setNewUserId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState("agent");
const [selectedParent, setSelectedParent] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [servicePph, setServicePph] = useState("0");
  const [serviceGgr, setServiceGgr] = useState("0");
  const [originalsGgr, setOriginalsGgr] = useState("0");
  const [casinoGgr, setCasinoGgr] = useState("0");
  const [liveBettingGgr, setLiveBettingGgr] = useState("0");
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [billingCycle, setBillingCycle] = useState("weekly");

  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
const [drilldown, setDrilldown] = useState<any>(null);
const [selectedDrilldownAgent, setSelectedDrilldownAgent] = useState("");

async function loadDrilldown(agentId: string) {
  setSelectedDrilldownAgent(agentId);
  const qs = new URLSearchParams({ period: moneyPeriod });
  if (moneyPeriod === "custom") {
    if (moneyStartDate) qs.set("start_date", moneyStartDate);
    if (moneyEndDate) qs.set("end_date", moneyEndDate);
  }

  const res = await fetch(`/ui-api/agent/money-center/${viewerId}/drilldown/${agentId}?${qs.toString()}`);
  const json = await res.json().catch(() => ({}));
  if (res.ok && json?.ok) {
    setDrilldown(json);
  }
}
  const [moneyCenter, setMoneyCenter] = useState<any>(null);
  const [moneyPeriod, setMoneyPeriod] = useState("30d");
  const [moneyStartDate, setMoneyStartDate] = useState("");
  const [moneyEndDate, setMoneyEndDate] = useState("");

  function resolveViewerId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("viewer_id") || "";
    const sessionId = JSON.parse(localStorage.getItem("agent_session_data")||"{}").id || "";
    const fromStorage = localStorage.getItem("agent_viewer_id") || "";
    const resolved = fromUrl || fromStorage || sessionId || "";
    if (fromUrl) localStorage.setItem("agent_viewer_id", fromUrl);
    return resolved;
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setPageError("");

      const vid = resolveViewerId();
      if (!vid) throw new Error("Missing viewer_id");

      setViewerId(vid);

      const dashboardRes = await fetch(`/ui-api/agent/dashboard/${encodeURIComponent(vid)}?days=30`, { cache: "no-store" });
      const dashboardJson = await dashboardRes.json().catch(() => ({}));

      if (!dashboardRes.ok) throw new Error(dashboardJson?.detail || "Failed to load dashboard");

      const rows: DownlineRow[] = Array.isArray(dashboardJson?.hierarchy?.tree) ? dashboardJson.hierarchy.tree : [];
      setTree(rows);
      setViewerRole(String(dashboardJson?.viewer?.role || dashboardJson?.hierarchy?.viewer_role || rows?.[0]?.role || ""));
      setBalance(Number(dashboardJson?.summary?.balance_available || 0));
      setGgr(Number(dashboardJson?.summary?.ggr || 0));
      setDownlineCount(Number(dashboardJson?.summary?.active_players || 0));
      setBillingHistory(Array.isArray(dashboardJson?.billing_history) ? dashboardJson.billing_history : []);
      setEdges(Array.isArray(dashboardJson?.billing_config?.edges) ? dashboardJson.billing_config.edges : []);

      setServicePph(String(Number(dashboardJson?.billing_config?.service_pph || 0)));
      setServiceGgr(String(Number(dashboardJson?.billing_config?.service_ggr || 0)));
      setOriginalsGgr(String(Number(dashboardJson?.billing_config?.originals_ggr || 0)));
      setCasinoGgr(String(Number(dashboardJson?.billing_config?.casino_ggr || 0)));
      setLiveBettingGgr(String(Number(dashboardJson?.billing_config?.live_betting_ggr || 0)));

      const allowed = roleOptionsForViewer(String(dashboardJson?.viewer?.role || dashboardJson?.hierarchy?.viewer_role || rows?.[0]?.role || ""));
      if (allowed.length) setRole(allowed[0]);

      await loadMoneyCenter(vid);
    } catch (e: any) {
      setPageError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (viewerId) loadMoneyCenter(viewerId);
    setDrilldown(null);
  }, [viewerId, moneyPeriod, moneyStartDate, moneyEndDate]);

  const selectedParentRole = useMemo(() => {
    if (!selectedParent) return viewerRole;
    const match = tree.find((r) => r.id === selectedParent);
    return String(match?.role || viewerRole);
  }, [selectedParent, tree, viewerRole]);

  const allowedRoles = useMemo(() => roleOptionsForViewer(selectedParentRole), [selectedParentRole]);

  const recentRows = useMemo(() => {
    return [...tree]
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      })
      .slice(0, 8);
  }, [tree]);

  const selectedBillingDetails = useMemo(() => {
    if (!selectedBillingHistory?.details_json) return null;
    try {
      return JSON.parse(selectedBillingHistory.details_json);
    } catch {
      return null;
    }
  }, [selectedBillingHistory]);


  const createdRows = useMemo(() => tree.filter((r) => r.depth !== 0), [tree]);

  const childrenMap = useMemo(() => {
    const map: Record<string, DownlineRow[]> = {};
    for (const row of createdRows) {
      const parent = row.parent_id || "__root__";
      if (!map[parent]) map[parent] = [];
      map[parent].push(row);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return da - db;
      });
    }
    return map;
  }, [createdRows]);

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  async function loadMoneyCenter(vid = viewerId) {
    if (!vid) return;

    const qs = new URLSearchParams({ period: moneyPeriod });
    if (moneyPeriod === "custom") {
      if (moneyStartDate) qs.set("start_date", moneyStartDate);
      if (moneyEndDate) qs.set("end_date", moneyEndDate);
    }

    const res = await fetch(`/ui-api/agent/money-center/${encodeURIComponent(vid)}?${qs.toString()}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json?.ok) setMoneyCenter(json);
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const id of allExpandableIds) next[id] = false;
    setCollapsedIds(next);
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const id of allExpandableIds) next[id] = true;
    setCollapsedIds(next);
  }

  async function createAgent() {
    try {
      if (!viewerId) return alert("Missing viewer_id");
      if (!newUserId.trim()) return alert("Enter username");
      if (!newEmail.trim()) return alert("Enter email");
      if (!newPassword.trim()) return alert("Enter password");
      if (!role) return alert("No valid role available");

      setCreateBusy(true);

      const res = await fetch("/ui-api/admin/agents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          viewer_id: viewerId,
          parent_id: selectedParent || viewerId,
          username: newUserId.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role,
          is_active: true
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.detail || "Failed to create user");
      }

      setNewUserId("");
      setNewEmail("");
      setNewPassword("");
      setSelectedParent("");

      await loadDashboard();

      alert("User created ✅");
    } catch (e:any) {
      alert(e?.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  }

  useEffect(() => {
    if (allowedRoles.length) setRole(allowedRoles[0]);
  }, [selectedParentRole]);

  async function saveMultiBillingConfig() {
    try {
      setBillingBusy(true);
      setBillingMessage("");

      const res = await fetch(`/ui-api/admin/billing/edges/${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_pph: Number(servicePph || 0),
          service_ggr: Number(serviceGgr || 0),
          originals_ggr: Number(originalsGgr || 0),
          casino_ggr: Number(casinoGgr || 0),
          live_betting_ggr: Number(liveBettingGgr || 0),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.detail || "Failed to save multi billing config");

      setBillingMessage("Multi-stream billing config saved ✅");
      await loadDashboard();
    } catch (e: any) {
      setBillingMessage(e?.message || "Failed to save multi billing config");
    } finally {
      setBillingBusy(false);
    }
  }

  function updateEdge(childId:any,patch:any){setEdges(prev=>prev.map(e=>e.child_id===childId?{...e,...patch}:e));}
async function saveEdge(e:any){if(e.child_id===viewerId){alert("You cannot modify your own billing");return;}const res=await fetch("/admin/billing/edge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({parent_id:viewerId,child_id:e.child_id,billing_type:"hybrid",pph_rate:Number(e.pph_rate||0),ggr_share:Number(e.ggr_share||0),sportsbook_enabled:!!e.sportsbook_enabled,casino_enabled:!!e.casino_enabled,crash_enabled:!!e.crash_enabled})});const j=await res.json().catch(()=>({}));if(!res.ok||!j?.ok) throw new Error(j?.detail||"Failed to save billing edge");alert("Saved");await loadDashboard();}
async function runMultiBillingProtected() {
    try {
      setBillingBusy(true);
      setBillingMessage("");

      const res = await fetch(`/ui-api/admin/billing/run-multi-protected/${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing_cycle: billingCycle }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to run protected billing");

      if (json?.ok) {
        setBillingMessage(
          `Protected billing ran ✅ Cycle: ${billingCycle} | Period: ${json?.period_key} | Total: ${money(json?.total_charge || 0)}`
        );
      } else {
        setBillingMessage(json?.message || "No billing result");
      }

      await loadDashboard();
    } catch (e: any) {
      setBillingMessage(e?.message || "Failed to run protected billing");
    } finally {
      setBillingBusy(false);
    }
  }

  function renderNode(row: DownlineRow, level = 0): React.ReactNode {
    const id = row.id || "";
    const children = childrenMap[id] || [];
    const hasChildren = children.length > 0;
    const isCollapsed = !!collapsedIds[id];

    return (
      <div key={id} className="grid gap-2">
        <div
          className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm"
          style={{ marginLeft: `${Math.min(level * 18, 72)}px` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black text-slate-200"
                >
                  {isCollapsed ? "+" : "−"}
                </button>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[10px] text-slate-500">
                  •
                </div>
              )}

              <div className="min-w-0">
                <div className="truncate font-black text-white">{row.id}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Parent: {row.parent_id || "-"} · Depth: {row.depth ?? level}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {String(row.role || "").toLowerCase() !== "player" ? (
                <button
                  onClick={() => {
                    setSelectedParent(row.id || "");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-xl bg-blue-500 px-2 py-1 text-xs font-black text-white"
                >
                  + Add
                </button>
              ) : null}
              <span className={roleChip(row.role)}>{row.role || "player"}</span>
              {hasChildren ? (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black text-slate-300">
                  {children.length} child{children.length === 1 ? "" : "ren"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {hasChildren && !isCollapsed ? (
          <div className="grid gap-2">
            {children.map((child) => renderNode(child, level + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  const rootNode: DownlineRow = {
    id: viewerId,
    role: viewerRole,
    parent_id: null,
    depth: 0,
  };

  const rootChildren = childrenMap[viewerId] || [];
  const allExpandableIds = useMemo(() => {
    return tree
      .filter((row) => (childrenMap[row.id] || []).length > 0)
      .map((row) => row.id);
  }, [tree, childrenMap]);

  const selectedNode = useMemo(() => {
    if (!selectedParent) return null;
    return tree.find((r) => r.id === selectedParent) || (viewerId === selectedParent ? rootNode : null);
  }, [selectedParent, tree, viewerId, rootNode]);


  if (loading) return <div className="p-2 text-white">Loading dashboard...</div>;

  return (
    <div className="mx-auto w-full max-w-7xl">
      {pageError ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-bold text-red-200">
          {pageError}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-bold">
          Viewer: {viewerId || "-"}
        </span>
        <span className={roleChip(viewerRole)}>{viewerRole || "unknown"}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-lg">💰</div>
            <div className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">Ledger</div>
          </div>
          <div className="text-sm font-bold text-slate-400">Balance</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{money(balance)}</div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-2xl bg-sky-500/15 px-3 py-2 text-lg">📊</div>
            <div className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">Revenue</div>
          </div>
          <div className="text-sm font-bold text-slate-400">Revenue / GGR</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{money(ggr)}</div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-2xl bg-amber-500/15 px-3 py-2 text-lg">👥</div>
            <div className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase text-slate-300">Network</div>
          </div>
          <div className="text-sm font-bold text-slate-400">Player Activity</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{downlineCount}</div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black">Create Customer / Agent</h2>
            <p className="mt-1 text-sm text-slate-400">
              Create players or agents under the selected parent in this hierarchy.
            </p>
          </div>
          {selectedNode ? (
            <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
              Parent: {selectedNode.id}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto]">
          <div>
            <FieldLabel>User ID</FieldLabel>
            <input
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="player_123 or agent_123"
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <FieldLabel>Parent</FieldLabel>
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="">{viewerId || "Viewer"}</option>
              {tree
                .filter((row) => String(row.role || "").toLowerCase() !== "player")
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {"—".repeat(Math.max(0, Number(row.depth || 0)))} {row.id} ({row.role || "agent"})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <FieldLabel>Role</FieldLabel>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              {allowedRoles.length ? (
                allowedRoles.map((r) => <option key={r} value={r}>{r}</option>)
              ) : (
                <option value="">No allowed roles</option>
              )}
            </select>
          </div>

          <div className="md:self-end">
            <button
              onClick={createAgent}
              disabled={createBusy || !allowedRoles.length}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createBusy ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Money Center</h2>
            <p className="mt-1 text-sm text-slate-400">Deposits vs withdrawals across this hierarchy.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["today", "7d", "30d", "custom"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMoneyPeriod(p)}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black uppercase transition",
                  moneyPeriod === p ? "bg-emerald-400 text-[#071824]" : "bg-[#13202a] text-slate-300 hover:bg-[#203442]",
                ].join(" ")}
              >
                {p === "7d" ? "7D" : p === "30d" ? "30D" : p === "today" ? "Today" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {moneyPeriod === "custom" ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input type="date" value={moneyStartDate} onChange={(e) => setMoneyStartDate(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
            <input type="date" value={moneyEndDate} onChange={(e) => setMoneyEndDate(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" />
          </div>
        ) : null}

        {moneyCenter?.alerts?.length ? (
          <div className="mb-4 grid gap-2">
            {moneyCenter.alerts.map((a: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200">
                ⚠️ {a.message}
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">Deposits</div>
            <div className="mt-2 text-2xl font-black">{money(moneyCenter?.summary?.deposit_amount)}</div>
            <div className="mt-1 text-xs text-slate-400">{moneyCenter?.summary?.deposit_count || 0} transactions</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-rose-300">Withdrawals</div>
            <div className="mt-2 text-2xl font-black">{money(moneyCenter?.summary?.withdrawal_amount)}</div>
            <div className="mt-1 text-xs text-slate-400">{moneyCenter?.summary?.withdrawal_count || 0} transactions</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-sky-300">Net Flow</div>
            <div className={["mt-2 text-2xl font-black", Number(moneyCenter?.summary?.net_flow || 0) >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
              {money(moneyCenter?.summary?.net_flow)}
            </div>
            <div className="mt-1 text-xs text-slate-400">Deposits minus withdrawals</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:hidden">
          {moneyCenter?.breakdown?.length ? moneyCenter.breakdown.map((row: any) => (
            <button key={row.id} onClick={() => loadDrilldown(row.id)} className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-black text-white">{row.id}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.role || "-"}</div>
                </div>
                <div className={Number(row.net_flow || 0) >= 0 ? "font-black text-emerald-300" : "font-black text-rose-300"}>{money(row.net_flow)}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[#0f172a] p-2 text-emerald-300">Deposits: {money(row.deposit_amount)}</div>
                <div className="rounded-xl bg-[#0f172a] p-2 text-rose-300">WD: {money(row.withdrawal_amount)}</div>
              </div>
            </button>
          )) : <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-400">No money activity for this period.</div>}
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/5 md:block">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-[#0f172a] text-xs uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="p-3 text-left">Agent / Group</th>
                <th className="p-3 text-right">Deposits</th>
                <th className="p-3 text-right">Withdrawals</th>
                <th className="p-3 text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody>
              {moneyCenter?.breakdown?.length ? moneyCenter.breakdown.map((row: any) => (
                <tr key={row.id} onClick={() => loadDrilldown(row.id)} className="cursor-pointer border-t border-white/5 transition hover:bg-[#162633]">
                  <td className="p-3"><div className="font-black text-white">{row.id}</div><div className="mt-1 text-xs text-slate-500">{row.role || "-"}</div></td>
                  <td className="p-3 text-right"><div className="font-black text-emerald-300">{money(row.deposit_amount)}</div><div className="text-xs text-slate-500">{row.deposit_count || 0} tx</div></td>
                  <td className="p-3 text-right"><div className="font-black text-rose-300">{money(row.withdrawal_amount)}</div><div className="text-xs text-slate-500">{row.withdrawal_count || 0} tx</div></td>
                  <td className={["p-3 text-right font-black", Number(row.net_flow || 0) >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>{money(row.net_flow)}</td>
                </tr>
              )) : (
                <tr className="border-t border-white/5"><td className="p-4 text-slate-400" colSpan={4}>No money activity for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {drilldown?.players?.length ? (
          <div className="mt-5 rounded-2xl border border-white/5 bg-[#13202a] p-4">
            <div className="mb-3 font-black text-white">Player Breakdown ({drilldown.agent_id})</div>
            <div className="grid gap-2">
              {drilldown.players.map((p: any) => (
                <div key={p.user_id} className="grid gap-2 rounded-xl border border-white/5 bg-[#0f172a] p-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
                  <div className="font-bold">{p.user_id}</div>
                  <div className="flex flex-wrap gap-3">
                    <span className="text-emerald-300">+{money(p.deposit_amount)}</span>
                    <span className="text-rose-300">-{money(p.withdrawal_amount)}</span>
                    <span className={p.net_flow >= 0 ? "text-emerald-300" : "text-rose-300"}>{money(p.net_flow)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Agent Hierarchy</h2>
            <p className="mt-1 text-sm text-slate-400">True collapsible hierarchy grouped under each real parent.</p>
          </div>
          <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300">
            {createdRows.length} rows
          </div>
        </div>

        <div className="grid gap-2">
          {viewerId ? (
            <div className="grid gap-2">
              {renderNode(rootNode, 0)}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
              No downline rows found yet.
            </div>
          )}
        </div>
      </div>

        <div className="mt-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="mb-4">
            <h2 className="text-xl font-black">Recent Created Customers</h2>
            <p className="mt-1 text-sm text-slate-400">Newest customers and agents created in this hierarchy.</p>
          </div>

          <div className="grid gap-2">
            {recentRows.length ? recentRows.map((row) => (
              <div key={`${row.id}-${row.created_at || ""}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#13202a] px-3 py-3">
                <div className="min-w-0">
                  <div className="truncate font-black text-white">{row.id}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Parent: {row.parent_id || "-"} · {fmtDate(row.created_at)}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={roleChip(row.role)}>{row.role || "player"}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-3 py-4 text-sm text-slate-400">
                No visible users yet.
              </div>
            )}
          </div>
        </div>

    </div>
  );
}
