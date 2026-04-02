"use client";

import { useEffect, useMemo, useState } from "react";

type KycUser = {
  id: string;
  role?: string;
  kyc_status: string;
  kyc_verified_at?: string | null;
  kyc_rejected_reason?: string | null;
  created_at?: string | null;
};

type KycDetail = {
  ok?: boolean;
  user_id?: string;
  kyc_status?: string;
  kyc_level?: number;
  auto_withdraw_enabled?: boolean;
  auto_withdraw_limit?: number;
  kyc_verified_at?: string | null;
  kyc_rejected_reason?: string | null;
  kyc_approved_by?: string | null;
  files?: {
    id_document?: string | null;
    selfie?: string | null;
    proof_of_address?: string | null;
  };
  history?: Array<{
    id: number;
    action: string;
    actor?: string | null;
    from_level?: number | null;
    to_level?: number | null;
    note?: string | null;
    created_at?: string | null;
  }>;
};

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function statusChip(status?: string) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-black border";

  if (s === "pending") {
    return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  }
  if (s === "verified") {
    return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  }
  if (s === "rejected") {
    return `${base} bg-rose-500/15 text-rose-300 border-rose-500/20`;
  }
  if (s === "unverified") {
    return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
  }

  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function smallCard(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-base font-black text-white">{value}</div>
    </div>
  );
}

function actionLabel(action?: string) {
  const map: Record<string, string> = {
    upload_level1: "Uploaded Level 1",
    upload_level2: "Uploaded Level 2",
    approve_kyc: "Approved KYC",
    reject_kyc: "Rejected KYC",
    set_manual: "Set Manual",
  };
  return map[String(action || "")] || String(action || "-");
}

export default function AgentKycPage() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadDetail(userId: string) {
    if (!userId) {
      setDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      const res = await fetch(
        `/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-detail`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load KYC detail");
      setDetail(json);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load KYC detail");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadUsers(preferredId?: string) {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/ui-api/admin/kyc/users", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load KYC queue");

      const list = (json.users || []) as KycUser[];
      setUsers(list);

      const nextId =
        preferredId ||
        selectedId ||
        list[0]?.id ||
        "";

      if (nextId) {
        setSelectedId(nextId);
        await loadDetail(nextId);
      } else {
        setSelectedId("");
        setDetail(null);
      }
    } catch (e: any) {
      setMessage(e?.message || "Error loading KYC queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(userId: string, level: number) {
    try {
      setBusyId(userId);
      setMessage("");

      const res = await fetch(
        `/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kyc_level: level }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Approve failed");

      setMessage(`Approved ${userId} ✅ Level ${level}`);
      await loadUsers(userId);
    } catch (e: any) {
      setMessage(e?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(userId: string) {
    try {
      setBusyId(userId);
      setMessage("");

      const res = await fetch(
        `/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Rejected by admin" }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Reject failed");

      setMessage(`Rejected ${userId} ❌`);
      await loadUsers(userId);
    } catch (e: any) {
      setMessage(e?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "all") return true;
      return String(u.kyc_status || "").toLowerCase() === statusFilter;
    });
  }, [users, statusFilter]);

  const selectedBusy = busyId === selectedId;

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="rounded-[28px] border border-white/5 bg-[linear-gradient(135deg,#1a2c38_0%,#13232d_100%)] p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Operations
            </div>
            <h1 className="mt-2 text-3xl font-black">Agent KYC Review Queue</h1>
            <p className="mt-2 text-sm text-slate-300">
              Review submissions, approve levels, reject documents, and inspect audit history.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200">
            {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#1a2c38] px-4 py-3 text-sm text-slate-100">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Filter</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="unverified">Unverified</option>
            </select>

            <button
              onClick={() => loadUsers(selectedId)}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                Loading queue...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                No KYC users found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const active = selectedId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(u.id);
                      loadDetail(u.id);
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-sky-500/30 bg-sky-500/10"
                        : "border-white/5 bg-[#13232d] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-white">{u.id}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Created: {fmtDate(u.created_at)}
                        </div>
                      </div>
                      <div className={statusChip(u.kyc_status)}>
                        {String(u.kyc_status || "").toUpperCase()}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Selected User
                </div>
                <h2 className="mt-2 text-2xl font-black">{selectedId || "-"}</h2>
              </div>

              {detail?.kyc_status ? (
                <div className={statusChip(detail.kyc_status)}>
                  {String(detail.kyc_status).toUpperCase()}
                </div>
              ) : null}
            </div>

            {detailLoading ? (
              <div className="mt-5 rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                Loading detail...
              </div>
            ) : !detail ? (
              <div className="mt-5 rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">
                Select a user to review KYC.
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {smallCard("KYC Level", String(detail.kyc_level ?? 0))}
                  {smallCard(
                    "Auto WD",
                    detail.auto_withdraw_enabled ? "ON" : "OFF"
                  )}
                  {smallCard(
                    "Threshold",
                    `$${Number(detail.auto_withdraw_limit || 0)}`
                  )}
                  {smallCard("Verified At", fmtDate(detail.kyc_verified_at))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {smallCard("Approved By", detail.kyc_approved_by || "-")}
                  {smallCard(
                    "Rejected Reason",
                    detail.kyc_rejected_reason || "-"
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    disabled={selectedBusy}
                    onClick={() => selectedId && approve(selectedId, 1)}
                    className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white disabled:opacity-60"
                  >
                    Approve L1
                  </button>
                  <button
                    disabled={selectedBusy}
                    onClick={() => selectedId && approve(selectedId, 2)}
                    className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white disabled:opacity-60"
                  >
                    Approve L2
                  </button>
                  <button
                    disabled={selectedBusy}
                    onClick={() => selectedId && reject(selectedId)}
                    className="rounded-2xl bg-rose-500 px-4 py-2 font-black text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h3 className="text-xl font-black">Documents</h3>
              <div className="mt-4 grid gap-3">
                {detail?.files?.id_document ? (
                  <a
                    href={detail.files.id_document}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm font-black text-sky-300"
                  >
                    View ID Document
                  </a>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-400">
                    No ID document
                  </div>
                )}

                {detail?.files?.selfie ? (
                  <a
                    href={detail.files.selfie}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm font-black text-sky-300"
                  >
                    View Selfie
                  </a>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-400">
                    No selfie
                  </div>
                )}

                {detail?.files?.proof_of_address ? (
                  <a
                    href={detail.files.proof_of_address}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm font-black text-sky-300"
                  >
                    View Proof of Address
                  </a>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-400">
                    No proof of address
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h3 className="text-xl font-black">Audit Log</h3>
              <div className="mt-4 grid gap-3">
                {(detail?.history || []).length ? (
                  (detail?.history || []).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-white/5 bg-[#13232d] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">
                          {actionLabel(row.action)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {fmtDate(row.created_at)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        Actor: {row.actor || "-"} · From: {row.from_level ?? "-"} ·
                        To: {row.to_level ?? "-"}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {row.note || "-"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-400">
                    No KYC history yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
