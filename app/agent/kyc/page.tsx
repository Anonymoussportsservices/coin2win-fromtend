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
    front?: string | null;
    back?: string | null;
    selfie?: string | null;
    id_document?: string | null;
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

function kycFileUrl(url?: string | null, viewerId?: string) {
  const base = String(url || "").replace("/api/admin/kyc/file/", "/ui-api/admin/kyc/file/");
  if (!base) return "";
  return viewerId ? `${base}?viewer_id=${encodeURIComponent(viewerId)}` : base;
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
  const viewerId = typeof window !== "undefined"
    ? (localStorage.getItem("agent_viewer_id") || JSON.parse(localStorage.getItem("agent_session_data") || "{}").id || "supercoin")
    : "supercoin";
  const [users, setUsers] = useState<KycUser[]>([]);
  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [overrideLevel, setOverrideLevel] = useState("2");
  const [overridePerWd, setOverridePerWd] = useState("");
  const [overrideDaily, setOverrideDaily] = useState("");
  const [overrideWeekly, setOverrideWeekly] = useState("");
  const [overrideMonthly, setOverrideMonthly] = useState("");
  const [overrideMinWd, setOverrideMinWd] = useState("");
  const [overrideManualReviewOver, setOverrideManualReviewOver] = useState("");
  const [overrideAutoWd, setOverrideAutoWd] = useState(true);
  const [overrideCooldown, setOverrideCooldown] = useState("");
  const [overrideDebug, setOverrideDebug] = useState("");

  async function prefillOverrideLimits(userId: string) {
    try {
      const res = await fetch(
        `/ui-api/kyc/me?user_id=${encodeURIComponent(userId)}&_=${Date.now()}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));
      const lim = json?.limits || {};
      setOverrideDebug(
        `Loaded ${userId}: source=${lim?.source || "-"} owner=${lim?.owner_id || "-"} per=${lim?.per_withdrawal_limit ?? "-"} daily=${lim?.daily_limit ?? "-"} weekly=${lim?.weekly_limit ?? "-"} monthly=${lim?.monthly_limit ?? "-"}`
      );

      setOverrideLevel(String(json?.kyc_level || lim?.level || 2));
      setOverrideMinWd(String(lim?.min_withdrawal ?? 20));
      setOverridePerWd(String(lim?.per_withdrawal_limit ?? 0));
      setOverrideDaily(String(lim?.daily_limit ?? 0));
      setOverrideWeekly(String(lim?.weekly_limit ?? 0));
      setOverrideMonthly(String(lim?.monthly_limit ?? 0));
      setOverrideManualReviewOver(String(lim?.requires_manual_review_over ?? 0));
      setOverrideAutoWd(Boolean(lim?.auto_withdraw_enabled ?? true));
      setOverrideCooldown(String(lim?.cooldown_minutes ?? 0));
    } catch (e: any) {
      setOverrideDebug(e?.message || "Could not load effective KYC limits");
      setMessage(e?.message || "Could not load effective KYC limits");
    }
  }

  async function loadDetail(userId: string) {
    if (!userId) {
      setDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      const res = await fetch(
        `/ui-api/admin/kyc/users/${encodeURIComponent(userId)}?viewer_id=${encodeURIComponent(viewerId)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load KYC detail");
      setDetail(json);

      await prefillOverrideLimits(userId);
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

      const res = await fetch(`/ui-api/admin/kyc/users?viewer_id=${encodeURIComponent(viewerId)}`, { cache: "no-store" });
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
        `/ui-api/admin/kyc/users/${encodeURIComponent(userId)}/approve?viewer_id=${encodeURIComponent(viewerId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(
        typeof json?.detail === "string"
          ? json.detail
          : json?.detail?.message || "Approve failed"
      );

      setMessage(`Approved ${userId} ✅ Level ${level}`);
      await loadUsers(userId);
    } catch (e: any) {
      setMessage(e?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function savePlayerOverride(userId: string) {
    if (!userId) return;

    try {
      setBusyId(userId);
      setMessage("");

      const minWd = Number(overrideMinWd || 0);
      const perWd = Number(overridePerWd || 0);
      const daily = Number(overrideDaily || 0);
      const weekly = Number(overrideWeekly || 0);
      const monthly = Number(overrideMonthly || 0);
      const manualOver = Number(overrideManualReviewOver || 0);

      if (perWd > 0 && minWd > perWd) {
        throw new Error("Minimum WD cannot be greater than Per WD.");
      }
      if (perWd > 0 && daily > 0 && perWd > daily) {
        throw new Error("Daily limit cannot be lower than Per WD.");
      }
      if (daily > 0 && weekly > 0 && daily > weekly) {
        throw new Error("Weekly limit cannot be lower than Daily limit.");
      }
      if (weekly > 0 && monthly > 0 && weekly > monthly) {
        throw new Error("Monthly limit cannot be lower than Weekly limit.");
      }
      if (manualOver > 0 && perWd > 0 && manualOver > perWd) {
        throw new Error("Manual Review Over cannot be greater than Per WD.");
      }

      const res = await fetch("/ui-api/admin/kyc/player-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewer_id: viewerId,
          user_id: userId,
          level: Number(overrideLevel || 2),
          min_withdrawal: minWd,
          per_withdrawal_limit: perWd,
          daily_limit: daily,
          weekly_limit: weekly,
          monthly_limit: monthly,
          requires_manual_review_over: manualOver,
          auto_withdraw_enabled: overrideAutoWd,
          cooldown_minutes: Number(overrideCooldown || 0),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json?.detail === "string" ? json.detail : "Failed to save VIP override");

      setMessage(`VIP override saved for ${userId} ✅`);
      await loadUsers(userId);
    } catch (e: any) {
      setMessage(e?.message || "Failed to save VIP override");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(userId: string) {
    const reason = window.prompt("Reject reason:", "Document mismatch")?.trim();
    if (!reason) return;

    try {
      setBusyId(userId);
      setMessage("");

      const res = await fetch(
        `/ui-api/admin/kyc/users/${encodeURIComponent(userId)}/reject?viewer_id=${encodeURIComponent(viewerId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(
        typeof json?.detail === "string"
          ? json.detail
          : json?.detail?.message || "Reject failed"
      );

      setMessage(`Rejected ${userId} ❌ ${json?.reason || reason}`);
      await loadUsers(userId);
    } catch (e: any) {
      setMessage(e?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      if (statusFilter === "all") return true;
      return String(u.kyc_status || "").toLowerCase() === statusFilter;
    });

    // pending first, then unverified, then rest
    return filtered.sort((a, b) => {
      const order: Record<string, number> = {
        pending: 0,
        unverified: 1,
        rejected: 2,
        verified: 3,
      };
      const sa = String(a.kyc_status || "").toLowerCase();
      const sb = String(b.kyc_status || "").toLowerCase();
      return (order[sa] ?? 99) - (order[sb] ?? 99);
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
              Review submissions, approve levels, reject documents, and inspect history.
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
                  KYC Review
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
                {viewerId === "supercoin" ? (
                <div key={`vip-${selectedId}`} className="mt-5 rounded-3xl border border-sky-500/10 bg-[#10202a] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">VIP Withdrawal Override</h3>
                      <div className="mt-1 text-xs text-slate-400">
                        Supercoin only. Overrides inherited KYC limits for this player. Use 0 on max limits for unlimited.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectedId && prefillOverrideLimits(selectedId)}
                      className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-300"
                    >
                      Reload Effective Limits
                    </button>
                  </div>

                  {overrideDebug ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-xs font-bold text-slate-300">
                      {overrideDebug}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Level</div>
                      <select
                        value={overrideLevel}
                        onChange={(e) => setOverrideLevel(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none"
                      >
                        <option value="1">L1</option>
                        <option value="2">L2</option>
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Minimum WD</div>
                      <input value={overrideMinWd} onChange={(e) => setOverrideMinWd(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Per WD</div>
                      <input value={overridePerWd} onChange={(e) => setOverridePerWd(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Daily</div>
                      <input value={overrideDaily} onChange={(e) => setOverrideDaily(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Weekly</div>
                      <input value={overrideWeekly} onChange={(e) => setOverrideWeekly(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Monthly</div>
                      <input value={overrideMonthly} onChange={(e) => setOverrideMonthly(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Manual Review Over</div>
                      <input value={overrideManualReviewOver} onChange={(e) => setOverrideManualReviewOver(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Cooldown Minutes</div>
                      <input value={overrideCooldown} onChange={(e) => setOverrideCooldown(e.target.value)} type="number" min="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 font-black text-white outline-none" />
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2">
                      <span>
                        <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Auto WD</span>
                        <span className="block text-xs text-slate-500">Allow withdrawal requests</span>
                      </span>
                      <input type="checkbox" checked={overrideAutoWd} onChange={(e) => setOverrideAutoWd(e.target.checked)} className="h-5 w-5" />
                    </label>
                  </div>

                  <button
                    disabled={selectedBusy || viewerId !== "supercoin"}
                    onClick={() => selectedId && savePlayerOverride(selectedId)}
                    className="mt-4 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {viewerId !== "supercoin" ? "Supercoin Only" : selectedBusy ? "Saving..." : "Save VIP Override"}
                  </button>
                </div>
                ) : null}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">Documents</h3>
                  <div className="mt-1 text-xs text-slate-400">
                    Submitted player KYC photos. Open any image for full-size review.
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: "ID Front", url: detail?.files?.front || detail?.files?.id_document },
                  { label: "ID Back", url: detail?.files?.back },
                  { label: "Selfie", url: detail?.files?.selfie },
                ].map((doc) => {
                  const url = kycFileUrl(doc.url, viewerId);

                  return (
                    <div key={doc.label} className="rounded-2xl border border-white/10 bg-[#13232d] p-3">
                      <div className="mb-3 text-sm font-black text-white">{doc.label}</div>

                      {url ? (
                        <>
                          <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]">
                            <img
                              src={url}
                              alt={doc.label}
                              className="aspect-[4/3] w-full object-cover"
                            />
                          </a>

                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 block rounded-xl bg-sky-500/15 px-3 py-2 text-center text-xs font-black text-sky-300"
                          >
                            Open Full Size
                          </a>
                        </>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0f172a] text-sm text-slate-500">
                          Not submitted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">History</h3>
                  <div className="mt-1 text-xs text-slate-400">
                    KYC audit trail: actor, timestamp, IP, device, and before/after values.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-[#13232d] px-3 py-1 text-xs font-black text-slate-300">
                  {(detail?.history || []).length} event{(detail?.history || []).length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {(detail?.history || []).length ? (
                  (detail?.history || []).map((row: any) => {
                    const before = row.payload_before || {};
                    const after = row.payload_after || {};
                    const ua = String(row.user_agent || "-");
                    const shortUa = ua.length > 84 ? `${ua.slice(0, 84)}...` : ua;

                    return (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-white/5 bg-[#13232d] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-white">
                              {actionLabel(row.action)}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {fmtDate(row.created_at)}
                            </div>
                          </div>

                          <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                            {row.actor || "-"}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-white/5 bg-[#0f172a] p-3 text-xs text-slate-300">
                            <div className="font-black uppercase tracking-[0.14em] text-slate-500">Security</div>
                            <div className="mt-2">IP: <span className="font-bold text-white">{row.ip_address || "-"}</span></div>
                            <div className="mt-1 break-words">Device: <span className="font-bold text-white">{shortUa}</span></div>
                            <div className="mt-1">Path: <span className="font-bold text-white">{row.request_path || "-"}</span></div>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-[#0f172a] p-3 text-xs text-slate-300">
                            <div className="font-black uppercase tracking-[0.14em] text-slate-500">KYC Change</div>
                            <div className="mt-2">
                              Status: <span className="font-bold text-slate-400">{before.kyc_status ?? "-"}</span>
                              {" → "}
                              <span className="font-bold text-white">{after.kyc_status ?? "-"}</span>
                            </div>
                            <div className="mt-1">
                              Level: <span className="font-bold text-slate-400">{before.kyc_level ?? "-"}</span>
                              {" → "}
                              <span className="font-bold text-white">{after.kyc_level ?? "-"}</span>
                            </div>
                            <div className="mt-1">
                              Limit: <span className="font-bold text-slate-400">${Number(before.auto_withdraw_limit || 0).toFixed(2)}</span>
                              {" → "}
                              <span className="font-bold text-white">${Number(after.auto_withdraw_limit || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {row.note ? (
                          <div className="mt-3 rounded-xl border border-white/5 bg-[#0f172a] px-3 py-2 text-sm text-slate-300">
                            Note: <span className="font-bold text-white">{row.note}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
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
