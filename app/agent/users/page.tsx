"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  role?: string | null;
  parent_id?: string | null;
  created_by?: string | null;
  agent_code?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  billing_type?: string | null;
  pph_rate?: number;
  ggr_share?: number;
  service_pph?: number;
  service_ggr?: number;
  originals_ggr?: number;
  casino_ggr?: number;
  live_betting_ggr?: number;
  updated_at?: string | null;
  updated_by?: string | null;
  last_parent_change_at?: string | null;
  last_parent_change_by?: string | null;
  last_agent_code_change_at?: string | null;
  last_agent_code_change_by?: string | null;
  last_created_by_change_at?: string | null;
  last_created_by_change_by?: string | null;
};

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

function roleChip(role?: string | null) {
  const r = String(role || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border";
  if (r === "super_admin" || r === "superadmin") return `${base} bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20`;
  if (r === "admin") return `${base} bg-sky-500/15 text-sky-300 border-sky-500/20`;
  if (r === "master_agent") return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (r === "agent") return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (r === "sub_agent") return `${base} bg-lime-500/15 text-lime-300 border-lime-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function statusChip(active?: boolean | null) {
  return active === false
    ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border bg-red-500/15 text-red-300 border-red-500/20"
    : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
}

function inputCls() {
  return "w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none";
}

function getViewerId() {
  if (typeof window === "undefined") return "supercoin";
  try {
    const qs = new URLSearchParams(window.location.search).get("viewer_id");
    if (qs) return qs;
    const local = localStorage.getItem("agent_viewer_id");
    if (local) return local;
    const session = JSON.parse(localStorage.getItem("agent_session_data") || "{}");
    if (session?.id) return session.id;
  } catch {}
  return "supercoin";
}

export default function AgentUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editParentId, setEditParentId] = useState("");
  const [editAgentCode, setEditAgentCode] = useState("");
  const [editCreatedBy, setEditCreatedBy] = useState("");
  const [tab, setTab] = useState<"directory" | "create">("directory");

  const [createRole, setCreateRole] = useState("player");
  const [createParentId, setCreateParentId] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createAgentCode, setCreateAgentCode] = useState("");
  const [createActive, setCreateActive] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setMessage("");
      const viewerId = getViewerId();
      const res = await fetch(`/ui-api/admin/users?viewer_id=${encodeURIComponent(viewerId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load users");
      setRows(Array.isArray(json?.users) ? json.users : []);
      if (!createParentId) setCreateParentId(viewerId);
    } catch (e: any) {
      setRows([]);
      setMessage(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleUser(row: UserRow) {
    try {
      setBusyId(row.id);
      setMessage("");
      const action = row.is_active === false ? "enable" : "disable";
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(row.id)}/${action}`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to ${action} user`);
      setMessage(`${row.id} ${action}d ✅`);
      await loadUsers();
    } catch (e: any) {
      setMessage(e?.message || "Failed to update user");
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(row: UserRow) {
    setEditingId(row.id);
    setEditParentId(row.parent_id || "");
    setEditAgentCode(row.agent_code || "");
    setEditCreatedBy(row.created_by || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditParentId("");
    setEditAgentCode("");
    setEditCreatedBy("");
  }

  async function saveMetadata(userId: string) {
    try {
      setBusyId(userId);
      setMessage("");
      const viewerId = getViewerId();
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/update-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: editParentId,
          agent_code: editAgentCode,
          created_by: editCreatedBy,
          updated_by: viewerId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to save metadata");
      setMessage(`${userId} metadata updated ✅`);
      cancelEdit();
      await loadUsers();
    } catch (e: any) {
      setMessage(e?.message || "Failed to save metadata");
    } finally {
      setBusyId(null);
    }
  }

  async function createUser() {
    try {
      setCreating(true);
      setMessage("");
      const viewerId = getViewerId();
      const payload = {
        viewer_id: viewerId,
        parent_id: createParentId || viewerId,
        role: createRole,
        email: createEmail,
        username: createUsername,
        password: createPassword,
        agent_code: createAgentCode || null,
        is_active: createActive,
      };
      const res = await fetch("/ui-api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to create user");

      setMessage(`${json?.user_id || createUsername} created ✅`);
      setCreateRole("player");
      setCreateEmail("");
      setCreateUsername("");
      setCreatePassword("");
      setCreateAgentCode("");
      setCreateActive(true);
      setTab("directory");
      await loadUsers();
    } catch (e: any) {
      setMessage(e?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        String(r.id || "").toLowerCase().includes(q) ||
        String(r.role || "").toLowerCase().includes(q) ||
        String(r.parent_id || "").toLowerCase().includes(q) ||
        String(r.agent_code || "").toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || String(r.role || "") === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.is_active !== false) ||
        (statusFilter === "disabled" && r.is_active === false);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [rows, query, roleFilter, statusFilter]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => String(r.role || "")).filter(Boolean))).sort();
  }, [rows]);

  const tabBtn = (active: boolean) =>
    `rounded-2xl px-4 py-3 text-sm font-black transition ${active ? "bg-sky-500 text-white" : "bg-white/10 text-slate-200 hover:bg-white/15"}`;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Search, review, create, and manage users across the platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={tabBtn(tab === "directory")} onClick={() => setTab("directory")}>Directory</button>
          <button className={tabBtn(tab === "create")} onClick={() => setTab("create")}>Create User</button>
          <a
            href="/templates/users-import-example.csv"
            download
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white"
          >
            Download CSV Example
          </a>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      {tab === "create" ? (
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">Create User</h2>
            <p className="mt-1 text-sm text-slate-400">
              Same creator for agents and players. Role rules are enforced by backend hierarchy logic.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Role</label>
              <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className={inputCls()}>
                <option value="player">player</option>
                <option value="sub_agent">sub_agent</option>
                <option value="agent">agent</option>
                <option value="master_agent">master_agent</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Parent ID</label>
              <input value={createParentId} onChange={(e) => setCreateParentId(e.target.value)} className={inputCls()} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Email</label>
              <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className={inputCls()} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Username</label>
              <input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} className={inputCls()} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Password</label>
              <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className={inputCls()} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Agent Code</label>
              <input value={createAgentCode} onChange={(e) => setCreateAgentCode(e.target.value.toUpperCase())} className={inputCls()} placeholder="Optional for players" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input id="create_active" type="checkbox" checked={createActive} onChange={(e) => setCreateActive(e.target.checked)} />
            <label htmlFor="create_active" className="text-sm text-slate-300">Create as active</label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={createUser}
              disabled={creating}
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create User"}
            </button>
            <button
              onClick={() => setTab("directory")}
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Back to Directory
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/5 bg-[#13202a] p-4 text-sm text-slate-400">
            <div className="font-black text-white">CSV example columns</div>
            <div className="mt-2">role, parent_id, email, username, password, agent_code, is_active</div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black">User Directory</h2>
              <p className="mt-1 text-sm text-slate-400">Operational view with status and hierarchy context.</p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by id, role, parent, code"
                className="min-w-[240px] rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              >
                <option value="all">All roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>

              <button
                onClick={loadUsers}
                className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
                Loading users...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
                No users found.
              </div>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-black text-white">{row.id}</div>
                        <span className={roleChip(row.role)}>{row.role || "-"}</span>
                        <span className={statusChip(row.is_active)}>{row.is_active === false ? "disabled" : "active"}</span>
                      </div>

                      {editingId === row.id ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Parent ID</label>
                            <input
                              value={editParentId}
                              onChange={(e) => setEditParentId(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Agent Code</label>
                            <input
                              value={editAgentCode}
                              onChange={(e) => setEditAgentCode(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-300">Created By</label>
                            <input
                              value={editCreatedBy}
                              onChange={(e) => setEditCreatedBy(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 grid gap-1 text-sm text-slate-300">
                          <div>Parent: <span className="text-white">{row.parent_id || "-"}</span></div>
                          <div>Agent Code: <span className="text-white">{row.agent_code || "-"}</span></div>
                          <div>Created By: <span className="text-white">{row.created_by || "-"}</span></div>
                          <div>Created: <span className="text-white">{fmtDate(row.created_at)}</span></div>
                          <div>
                            Billing: <span className="text-white">{row.billing_type || "-"}</span>
                            {" • "}PPH: <span className="text-white">{Number(row.pph_rate || 0)}</span>
                            {" • "}GGR: <span className="text-white">{Number(row.ggr_share || 0)}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Service PPH {Number(row.service_pph || 0)} • Service GGR {Number(row.service_ggr || 0)} • Originals {Number(row.originals_ggr || 0)} • Casino {Number(row.casino_ggr || 0)} • Live {Number(row.live_betting_ggr || 0)}
                          </div>
                          <div className="mt-2 text-xs text-slate-400">
                            Parent change: {fmtDate(row.last_parent_change_at)} by {row.last_parent_change_by || "-"}<br />
                            Agent code change: {fmtDate(row.last_agent_code_change_at)} by {row.last_agent_code_change_by || "-"}<br />
                            Created by change: {fmtDate(row.last_created_by_change_at)} by {row.last_created_by_change_by || "-"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={String(row.role || "").toLowerCase() === "player"
                          ? `/agent/users/${encodeURIComponent(row.id)}?viewer_id=${encodeURIComponent(getViewerId())}`
                          : `/agent/dashboard?viewer_id=${encodeURIComponent(row.id)}`}
                        className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                      >
                        {String(row.role || "").toLowerCase() === "player" ? "Profile" : "Open"}
                      </Link>

                      {editingId === row.id ? (
                        <>
                          <button
                            onClick={() => saveMetadata(row.id)}
                            disabled={busyId === row.id}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                          >
                            {busyId === row.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(row)}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-black text-white"
                        >
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => toggleUser(row)}
                        disabled={busyId === row.id}
                        className={`rounded-xl px-3 py-2 text-sm font-black text-white disabled:opacity-50 ${row.is_active === false ? "bg-emerald-500" : "bg-red-500"}`}
                      >
                        {busyId === row.id ? "Working..." : row.is_active === false ? "Enable" : "Disable"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
