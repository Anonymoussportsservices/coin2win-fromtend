"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/oxs/ActionButton";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/oxs/DataTable";
import { EmptyState } from "@/components/oxs/EmptyState";
import { FilterSelect } from "@/components/oxs/FilterSelect";
import { FilterBar } from "@/components/oxs/FilterBar";
import { LoadingSkeleton } from "@/components/oxs/LoadingSkeleton";
import { SearchInput } from "@/components/oxs/SearchInput";
import { StatusBadge } from "@/components/oxs/StatusBadge";
import { Surface } from "@/components/oxs/Surface";
import { WorkspaceHeader } from "@/components/oxs/WorkspaceHeader";
import { WorkspaceToolbar } from "@/components/oxs/WorkspaceToolbar";

type UserRow = {
  id: string;
  role?: string | null;
  parent_id?: string | null;
  created_by?: string | null;
  agent_code?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  telegram?: string | null;
  phone?: string | null;
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

function roleTone(role?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  const r = String(role || "").toLowerCase();
  if (r === "super_admin") return "warning";
  if (r === "admin") return "info";
  if (r === "master_agent") return "warning";
  if (r === "agent" || r === "sub_agent") return "success";
  return "neutral";
}

function statusTone(active?: boolean | null): "success" | "danger" {
  return active === false ? "danger" : "success";
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

  async function loadUsers() {
    try {
      setLoading(true);
      setMessage("");

      const viewerId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("viewer_id") ||
            localStorage.getItem("agent_viewer_id") ||
            JSON.parse(localStorage.getItem("agent_session_data") || "{}").id ||
            "supercoin"
          : "supercoin";

      const res = await fetch(`/ui-api/admin/users?viewer_id=${encodeURIComponent(viewerId)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail =
          typeof json?.detail === "string"
            ? json.detail
            : json?.detail?.message ||
              (Array.isArray(json?.detail) ? JSON.stringify(json.detail) : "Failed to load users");
        throw new Error(detail);
      }

      setRows(Array.isArray(json?.users) ? json.users : []);
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

      const viewerId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("viewer_id") ||
            localStorage.getItem("agent_viewer_id") ||
            JSON.parse(localStorage.getItem("agent_session_data") || "{}").id ||
            "supercoin"
          : "supercoin";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        String(r.id || "").toLowerCase().includes(q) ||
        String(r.role || "").toLowerCase().includes(q) ||
        String(r.parent_id || "").toLowerCase().includes(q) ||
        String(r.agent_code || "").toLowerCase().includes(q) ||
        String(r.username || "").toLowerCase().includes(q) ||
        String(r.full_name || "").toLowerCase().includes(q) ||
        String(r.email || "").toLowerCase().includes(q);

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

  return (
    <div className="mx-auto w-full max-w-7xl">
      <WorkspaceHeader
        title="Users"
        subtitle="Search, review, and manage users across the platform."
      />

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <Surface>
        <WorkspaceToolbar
          title="User Directory"
          actions={
            <FilterBar>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search users"
                className="min-w-[240px]"
              />
              <FilterSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { label: "All roles", value: "all" },
                  ...roleOptions.map((r) => ({ label: r, value: r })),
                ]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "All status", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Disabled", value: "disabled" },
                ]}
              />
              <ActionButton onClick={loadUsers}>
                Refresh
              </ActionButton>
            </FilterBar>
          }
        >
          Operational view with status and hierarchy context.
        </WorkspaceToolbar>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" message="Adjust search or filters." />
        ) : (
          <>
            <div className="hidden lg:block">
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell>User</DataTableHeaderCell>
                    <DataTableHeaderCell>Role</DataTableHeaderCell>
                    <DataTableHeaderCell>Status</DataTableHeaderCell>
                    <DataTableHeaderCell>Parent</DataTableHeaderCell>
                    <DataTableHeaderCell>Contact</DataTableHeaderCell>
                    <DataTableHeaderCell>Created</DataTableHeaderCell>
                    <DataTableHeaderCell>Actions</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filtered.map((row) => (
                    <DataTableRow key={row.id}>
                      <DataTableCell>
                        <div className="font-black text-white">{row.id}</div>
                        <div className="mt-1 text-xs text-slate-400">{row.username || row.full_name || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">Code: {row.agent_code || "-"}</div>
                      </DataTableCell>

                      <DataTableCell>
                        <StatusBadge tone={roleTone(row.role)}>{row.role || "-"}</StatusBadge>
                      </DataTableCell>

                      <DataTableCell>
                        <StatusBadge tone={statusTone(row.is_active)}>
                          {row.is_active === false ? "disabled" : "active"}
                        </StatusBadge>
                      </DataTableCell>

                      <DataTableCell>
                        {editingId === row.id ? (
                          <div className="grid gap-2">
                            <input value={editParentId} onChange={(e) => setEditParentId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-white outline-none" placeholder="Parent ID" />
                            <input value={editAgentCode} onChange={(e) => setEditAgentCode(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-white outline-none" placeholder="Agent Code" />
                            <input value={editCreatedBy} onChange={(e) => setEditCreatedBy(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-white outline-none" placeholder="Created By" />
                          </div>
                        ) : (
                          <div className="text-xs">
                            <div><span className="text-slate-500">Parent:</span> <span className="text-white">{row.parent_id || "-"}</span></div>
                            <div className="mt-1"><span className="text-slate-500">By:</span> <span className="text-white">{row.created_by || "-"}</span></div>
                          </div>
                        )}
                      </DataTableCell>

                      <DataTableCell>
                        <div className="text-xs">
                          <div className="text-white">{row.email || "-"}</div>
                          <div className="mt-1 text-slate-400">{row.telegram || row.phone || "-"}</div>
                        </div>
                      </DataTableCell>

                      <DataTableCell>
                        <div className="text-xs text-slate-400">{fmtDate(row.created_at)}</div>
                      </DataTableCell>

                      <DataTableCell>
                        <div className="grid min-w-[220px] grid-cols-2 gap-2">
                          <Link
                            href={String(row.role || "").toLowerCase() === "player"
                              ? `/agent/users/${encodeURIComponent(row.id)}`
                              : `/agent/dashboard?viewer_id=${encodeURIComponent(row.id)}`}
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-black text-white transition hover:bg-white/15"
                          >
                            {String(row.role || "").toLowerCase() === "player" ? "Profile" : "Open"}
                          </Link>

                          <Link
                            href={`/agent/dashboard?viewer_id=${encodeURIComponent(row.parent_id || row.id)}`}
                            className="rounded-xl border border-sky-400/20 bg-sky-500/15 px-3 py-2 text-center text-xs font-black text-sky-200 transition hover:bg-sky-500/25"
                          >
                            Hierarchy
                          </Link>

                          {editingId === row.id ? (
                            <>
                              <button onClick={() => saveMetadata(row.id)} disabled={busyId === row.id} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
                                {busyId === row.id ? "Saving..." : "Save"}
                              </button>
                              <button onClick={cancelEdit} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button onClick={() => startEdit(row)} className="rounded-xl border border-amber-400/20 bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-200 transition hover:bg-amber-500/25">
                              Ownership
                            </button>
                          )}

                          <button
                            onClick={() => toggleUser(row)}
                            disabled={busyId === row.id}
                            className={`rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-50 ${row.is_active === false ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" : "border-red-400/20 bg-red-500/15 text-red-200 hover:bg-red-500/25"}`}
                          >
                            {busyId === row.id ? "Working..." : row.is_active === false ? "Enable" : "Disable"}
                          </button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-black text-white">{row.id}</div>
                    <StatusBadge tone={roleTone(row.role)}>{row.role || "-"}</StatusBadge>
                    <StatusBadge tone={statusTone(row.is_active)}>
                      {row.is_active === false ? "disabled" : "active"}
                    </StatusBadge>
                  </div>

                  {editingId === row.id ? (
                    <div className="mt-3 grid gap-3">
                      <input value={editParentId} onChange={(e) => setEditParentId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" placeholder="Parent ID" />
                      <input value={editAgentCode} onChange={(e) => setEditAgentCode(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" placeholder="Agent Code" />
                      <input value={editCreatedBy} onChange={(e) => setEditCreatedBy(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none" placeholder="Created By" />
                    </div>
                  ) : (
                    <div className="mt-2 grid gap-y-1 text-xs leading-tight text-slate-400">
                      <div><span className="text-slate-500">User:</span> <span className="text-white">{row.username || "-"}</span></div>
                      <div><span className="text-slate-500">Name:</span> <span className="text-white">{row.full_name || "-"}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="text-white">{row.email || "-"}</span></div>
                      <div><span className="text-slate-500">Parent:</span> <span className="text-white">{row.parent_id || "-"}</span></div>
                      <div><span className="text-slate-500">Created:</span> <span className="text-white">{fmtDate(row.created_at)}</span></div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                    <Link href={String(row.role || "").toLowerCase() === "player" ? `/agent/users/${encodeURIComponent(row.id)}` : `/agent/dashboard?viewer_id=${encodeURIComponent(row.id)}`} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-black text-white">
                      {String(row.role || "").toLowerCase() === "player" ? "Profile" : "Open"}
                    </Link>
                    <Link href={`/agent/dashboard?viewer_id=${encodeURIComponent(row.parent_id || row.id)}`} className="rounded-2xl border border-sky-400/20 bg-sky-500/15 px-4 py-3 text-center text-sm font-black text-sky-200">
                      Hierarchy
                    </Link>
                    {editingId === row.id ? (
                      <>
                        <button onClick={() => saveMetadata(row.id)} disabled={busyId === row.id} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                          {busyId === row.id ? "Saving..." : "Save"}
                        </button>
                        <button onClick={cancelEdit} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(row)} className="rounded-2xl border border-amber-400/20 bg-amber-500/15 px-4 py-3 text-sm font-black text-amber-200">
                        Ownership
                      </button>
                    )}
                    <button onClick={() => toggleUser(row)} disabled={busyId === row.id} className={`rounded-2xl border px-4 py-3 text-sm font-black disabled:opacity-50 ${row.is_active === false ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200" : "border-red-400/20 bg-red-500/15 text-red-200"}`}>
                      {busyId === row.id ? "Working..." : row.is_active === false ? "Enable" : "Disable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
