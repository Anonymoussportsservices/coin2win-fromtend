"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProfileResponse = {
  ok: boolean;
  profile?: {
    user: {
      id: string;
      email?: string | null;
      username?: string | null;
      full_name?: string | null;
      telegram?: string | null;
      phone?: string | null;
      notes?: string | null;
      role?: string | null;
      parent_id?: string | null;
      created_by?: string | null;
      agent_code?: string | null;
      is_active?: boolean | null;
      created_at?: string | null;
      kyc_status?: string | null;
      kyc_level?: number;
      auto_withdraw_enabled?: boolean | number | null;
      auto_withdraw_limit?: number;
      kyc_verified_at?: string | null;
      kyc_rejected_reason?: string | null;
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
    wallet: {
      balance_total?: number;
      balance_available?: number;
      balance_pending?: number;
      updated_at?: string | null;
    };
    deposit_stats: {
      total_count?: number;
      total_amount?: number;
      credited_amount?: number;
    };
    withdrawal_stats: {
      total_count?: number;
      total_amount?: number;
      completed_amount?: number;
      pending_amount?: number;
    };
    recent_transactions: Array<{
      id: number;
      type: string;
      amount: number;
      balance_after: number;
      reference?: string | null;
      created_at?: string | null;
    }>;
    recent_deposits: Array<{
      id: number;
      payment_id?: string | null;
      status?: string | null;
      amount_usd?: number;
      pay_currency?: string | null;
      pay_amount?: number | null;
      pay_address?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    }>;
    recent_withdrawals: Array<{
      id: number;
      status?: string | null;
      amount_usd?: number;
      payout_currency?: string | null;
      payout_address?: string | null;
      refunded?: boolean;
      note?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    }>;
  };
  detail?: string;
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

function shortText(value?: string | null, n: number = 20) {
  const v = String(value || "");
  if (!v) return "-";
  return v.length > n ? `${v.slice(0, n)}...` : v;
}

function roleChip(role?: string | null) {
  const r = String(role || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border";
  if (r === "super_admin") return `${base} bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20`;
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

function kycChip(status?: string | null) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border";
  if (s === "verified") return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (s === "pending") return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (s === "rejected") return `${base} bg-red-500/15 text-red-300 border-red-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function depositStatusChip(status?: string | null) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-black border";
  if (["waiting", "pending", "confirming"].includes(s)) return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (["credited", "paid", "completed"].includes(s)) return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (["failed", "expired", "cancelled"].includes(s)) return `${base} bg-red-500/15 text-red-300 border-red-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

function withdrawalStatusChip(status?: string | null) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-black border";
  if (s === "requested") return `${base} bg-amber-500/15 text-amber-300 border-amber-500/20`;
  if (s === "approved") return `${base} bg-sky-500/15 text-sky-300 border-sky-500/20`;
  if (s === "sent") return `${base} bg-violet-500/15 text-violet-300 border-violet-500/20`;
  if (s === "completed") return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-500/20`;
  if (s === "rejected") return `${base} bg-red-500/15 text-red-300 border-red-500/20`;
  return `${base} bg-slate-500/15 text-slate-300 border-slate-500/20`;
}

export default function AgentUserProfilePage() {
  const params = useParams<{ user_id: string }>();
  const searchParams = useSearchParams();
  const userId = decodeURIComponent(params.user_id);
  const prefillReason = searchParams.get("prefill_reason") || "";
  const viewerId = searchParams.get("viewer_id") || "user_81148ba29e";

  useEffect(() => {
    if (!prefillReason) return;

    const allowedReasons = new Set([
      "bonus_manual",
      "agent_credit",
      "settlement_adjustment",
      "vip_comp",
      "fraud_reversal",
      "deposit_correction",
      "withdrawal_correction",
      "promo_credit",
      "loss_rebate",
      "balance_fix",
      "test_credit",
      "test_debit",
      "custom",
    ]);

    if (allowedReasons.has(prefillReason)) {
      setWalletAdjustReasonPreset(prefillReason);
      if (prefillReason !== "custom") {
        setWalletAdjustReasonCustom("");
      }
    } else {
      setWalletAdjustReasonPreset("custom");
      setWalletAdjustReasonCustom(prefillReason);
    }
  }, [prefillReason]);
  const viewerQs = `?viewer_id=${encodeURIComponent(viewerId)}`;

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingKyc, setSavingKyc] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [kycDetail, setKycDetail] = useState<any>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("10");
  const [walletAdjustReasonPreset, setWalletAdjustReasonPreset] = useState("bonus_manual");
  const [walletAdjustReasonCustom, setWalletAdjustReasonCustom] = useState("");
  const [walletAdjustLoading, setWalletAdjustLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setMessage("");

        const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/profile`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(json?.detail || "Failed to load profile");

        setData(json);
        setFullNameInput(json?.profile?.user?.full_name || "");
        setTelegramInput(json?.profile?.user?.telegram || "");
        setPhoneInput(json?.profile?.user?.phone || "");
        setNotesInput(json?.profile?.user?.notes || "");
        const kycRes = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-detail`, { cache: "no-store" });
        const kycJson = await kycRes.json().catch(() => ({}));
        if (kycRes.ok) setKycDetail(kycJson);
      } catch (e: any) {
        setMessage(e?.message || "Failed to load profile");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  const profile = data?.profile;
  const user = profile?.user;
  const wallet = profile?.wallet;
  const depositStats = profile?.deposit_stats;
  const withdrawalStats = profile?.withdrawal_stats;
  const profileUser = ((profile as any)?.user ?? (profile as any)?.profile?.user ?? user) as any;

  async function approveKyc(kyc_level: number) {
    try {
      setSavingKyc(true);
      setMessage("");
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_level }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to approve KYC");
      setMessage(`KYC approved ✅ Level ${json?.kyc_level}`);
      window.location.reload();
    } catch (e: any) {
      setMessage(e?.message || "Failed to approve KYC");
    } finally {
      setSavingKyc(false);
    }
  }

  async function rejectKyc() {
    try {
      const reason = window.prompt("Reject reason:", "Document mismatch") || "KYC rejected";
      setSavingKyc(true);
      setMessage("");
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to reject KYC");
      setMessage(`KYC rejected ❌ ${json?.kyc_rejected_reason || ""}`);
      window.location.reload();
    } catch (e: any) {
      setMessage(e?.message || "Failed to reject KYC");
    } finally {
      setSavingKyc(false);
    }
  }

  async function setManualKyc() {
    try {
      setSavingKyc(true);
      setMessage("");
      const currentLevel = Number(profileUser?.kyc_level ?? 0);
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_level: currentLevel, manual_only: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to set manual");
      setMessage("Manual withdrawals only ✅");
      window.location.reload();
    } catch (e: any) {
      setMessage(e?.message || "Failed to set manual");
    } finally {
      setSavingKyc(false);
    }
  }

  async function saveKycTier(kyc_level: number, auto_withdraw_enabled: boolean, auto_withdraw_limit?: number) {
    try {
      setSavingKyc(true);
      setMessage("");
      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/kyc-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_level, auto_withdraw_enabled, auto_withdraw_limit }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to update KYC tier");
      setMessage(`KYC tier updated ✅ Level ${json?.kyc_level} | Auto WD ${json?.auto_withdraw_enabled ? "ON" : "OFF"} | Limit $${Number(json?.auto_withdraw_limit || 0)}`);
      window.location.reload();
    } catch (e: any) {
      setMessage(e?.message || "Failed to update KYC tier");
    } finally {
      setSavingKyc(false);
    }
  }

  const netCash = useMemo(() => {
    return Number(depositStats?.credited_amount || 0) - Number(withdrawalStats?.completed_amount || 0);
  }, [depositStats?.credited_amount, withdrawalStats?.completed_amount]);

  async function saveContactProfile() {
    try {
      setSavingContact(true);
      setMessage("");

      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/update-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullNameInput,
          telegram: telegramInput,
          phone: phoneInput,
          notes: notesInput,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to update profile");

      setMessage("Contact profile updated ✅");

      const reload = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/profile`, {
        cache: "no-store",
      });
      const reloadJson = await reload.json().catch(() => ({}));
      if (reload.ok) {
        setData(reloadJson);
        setFullNameInput(reloadJson?.profile?.user?.full_name || "");
        setTelegramInput(reloadJson?.profile?.user?.telegram || "");
        setPhoneInput(reloadJson?.profile?.user?.phone || "");
        setNotesInput(reloadJson?.profile?.user?.notes || "");
      }
    } catch (e: any) {
      setMessage(e?.message || "Failed to update profile");
    } finally {
      setSavingContact(false);
    }
  }


  async function runWalletAdjust(direction: "credit" | "debit") {
    try {
      setWalletAdjustLoading(true);
      setMessage("");

      const raw = Number(walletAdjustAmount);
      if (!raw || raw <= 0) throw new Error("Enter a valid amount");

      const signedAmount = direction === "debit" ? -raw : raw;

      const resolvedReason =
        walletAdjustReasonPreset === "custom"
          ? (walletAdjustReasonCustom.trim() || "manual_profile_adjustment")
          : walletAdjustReasonPreset;

      const res = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/wallet-adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: signedAmount,
          reason: resolvedReason,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to ${direction} balance`);

      setMessage(`Balance ${direction === "credit" ? "credited" : "debited"} ✅`);

      const reload = await fetch(`/ui-api/admin/users/${encodeURIComponent(userId)}/profile`, {
        cache: "no-store",
      });
      const reloadJson = await reload.json().catch(() => ({}));
      if (reload.ok) {
        setData(reloadJson);
      }
    } catch (e: any) {
      setMessage(e?.message || "Wallet adjustment failed");
    } finally {
      setWalletAdjustLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">User Profile</h1>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Player and account operations view.
          </p>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Viewer Scope: {viewerId === "user_81148ba29e" ? "Global (Admin)" : "Scoped Network"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/agent/users${viewerQs}`}
            className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
          >
            Back to Users
          </Link>
          {user?.parent_id ? (
            <Link
              href={`/agent/dashboard?viewer_id=${encodeURIComponent(user.parent_id)}`}
              className="rounded-2xl bg-sky-500 px-4 py-3 font-black text-white"
            >
              Open Parent
            </Link>
          ) : null}
          <Link
            href={`/agent/deposits${viewerQs}`}
            className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
          >
            Open Deposits
          </Link>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
          Loading profile...
        </div>
      ) : !profile || !user ? (
        <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
          No profile found.
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-black text-white">{user.id}</div>
                  <span className={roleChip(user.role)}>{user.role || "-"}</span>
                  <span className={statusChip(user.is_active)}>{user.is_active === false ? "archived" : "active"}</span>
                  <span className={kycChip(profileUser?.kyc_status)}>{profileUser?.kyc_status || "unknown"}</span>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                  <div>Username: <span className="text-white">{user.username || "-"}</span></div>
                  <div>Full Name: <span className="text-white">{user.full_name || "-"}</span></div>
                  <div>Email: <span className="text-white">{user.email || "-"}</span></div>
                  <div>Telegram: <span className="text-white">{user.telegram || "-"}</span></div>
                  <div>Phone: <span className="text-white">{user.phone || "-"}</span></div>
                  <div>Parent: <span className="text-white">{user.parent_id || "-"}</span></div>
                  <div>Created By: <span className="text-white">{user.created_by || "-"}</span></div>
                  <div>Agent Code: <span className="text-white">{user.agent_code || "-"}</span></div>
                  <div>Created: <span className="text-white">{fmtDate(user.created_at)}</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
                <div>Billing Type: <span className="font-black text-white">{user.billing_type || "-"}</span></div>
                <div className="mt-1">PPH: <span className="text-white">{Number(user.pph_rate || 0)}</span> • GGR: <span className="text-white">{Number(user.ggr_share || 0)}</span></div>
                <div className="mt-1 text-xs text-slate-400">
                  Service PPH {Number(user.service_pph || 0)} • Service GGR {Number(user.service_ggr || 0)} • Originals {Number(user.originals_ggr || 0)} • Casino {Number(user.casino_ggr || 0)} • Live {Number(user.live_betting_ggr || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black">Wallet Adjust</h2>
                <p className="mt-1 text-sm text-slate-400">Credit or debit player balance directly from profile.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Amount</label>
                  <input
                    value={walletAdjustAmount}
                    onChange={(e) => setWalletAdjustAmount(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    placeholder="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Reason</label>
                  <select
                    value={walletAdjustReasonPreset}
                    onChange={(e) => setWalletAdjustReasonPreset(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                  >
                    <option value="bonus_manual">bonus_manual</option>
                    <option value="agent_credit">agent_credit</option>
                    <option value="settlement_adjustment">settlement_adjustment</option>
                    <option value="vip_comp">vip_comp</option>
                    <option value="fraud_reversal">fraud_reversal</option>
                    <option value="deposit_correction">deposit_correction</option>
                    <option value="withdrawal_correction">withdrawal_correction</option>
                    <option value="promo_credit">promo_credit</option>
                    <option value="loss_rebate">loss_rebate</option>
                    <option value="balance_fix">balance_fix</option>
                    <option value="test_credit">test_credit</option>
                    <option value="test_debit">test_debit</option>
                    <option value="custom">custom</option>
                  </select>

                  {walletAdjustReasonPreset === "custom" ? (
                    <input
                      value={walletAdjustReasonCustom}
                      onChange={(e) => setWalletAdjustReasonCustom(e.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      placeholder="manual_profile_adjustment"
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => runWalletAdjust("credit")}
                  disabled={walletAdjustLoading}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white disabled:opacity-60"
                >
                  {walletAdjustLoading ? "Processing..." : "Credit Balance"}
                </button>

                <button
                  type="button"
                  onClick={() => runWalletAdjust("debit")}
                  disabled={walletAdjustLoading}
                  className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white disabled:opacity-60"
                >
                  {walletAdjustLoading ? "Processing..." : "Debit Balance"}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-5">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Wallet Total</div>
              <div className="mt-2 text-2xl font-black text-white">{money(wallet?.balance_total)}</div>
              <div className="mt-2 text-xs text-slate-400">Updated {fmtDate(wallet?.updated_at)}</div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Available</div>
              <div className="mt-2 text-2xl font-black text-white">{money(wallet?.balance_available)}</div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Pending</div>
              <div className="mt-2 text-2xl font-black text-white">{money(wallet?.balance_pending)}</div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Credited Deposits</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">{money(depositStats?.credited_amount)}</div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Net Cash</div>
              <div className="mt-2 text-2xl font-black text-white">{money(netCash)}</div>
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black">Contact & Notes</h2>
                <p className="mt-1 text-sm text-slate-400">Edit operator-facing player metadata.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Full Name</label>
                  <input
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Telegram</label>
                  <input
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Phone</label>
                  <input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    placeholder="+1..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Notes</label>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    placeholder="VIP, slow payer, risk notes, preferences..."
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={saveContactProfile}
                  disabled={savingContact}
                  className="rounded-2xl bg-sky-500 px-4 py-3 font-black text-white disabled:opacity-60"
                >
                  {savingContact ? "Saving..." : "Save Contact Profile"}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
            <h2 className="text-xl font-black">KYC & Withdraw Settings</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              
              <div>KYC Status: <span className="font-black text-white">{profileUser?.kyc_status || "-"}</span></div>
              <div>
                KYC Level:{" "}
                <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 font-black text-emerald-300">
                  {String(profileUser?.kyc_level ?? 0)}
                </span>
              </div>
              <div>Auto Withdraw: <span className="font-black text-white">{profileUser?.auto_withdraw_enabled ? "ON" : "OFF"}</span></div>
              <div>Threshold: <span className="font-black text-white">${Number(profileUser?.auto_withdraw_limit ?? 0)}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={savingKyc} onClick={() => approveKyc(1)} className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white">Approve L1</button>
              <button disabled={savingKyc} onClick={() => approveKyc(2)} className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white">Approve L2</button>
              <button disabled={savingKyc} onClick={() => rejectKyc()} className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white">Reject</button>
              <button disabled={savingKyc} onClick={() => setManualKyc()} className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white">Set Manual</button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Deposit Summary</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div>Total Count: <span className="font-black text-white">{depositStats?.total_count || 0}</span></div>
                <div>Total Amount: <span className="font-black text-white">{money(depositStats?.total_amount)}</span></div>
                <div>Credited Amount: <span className="font-black text-white">{money(depositStats?.credited_amount)}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Withdrawal Summary</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div>Total Count: <span className="font-black text-white">{withdrawalStats?.total_count || 0}</span></div>
                <div>Total Amount: <span className="font-black text-white">{money(withdrawalStats?.total_amount)}</span></div>
                <div>Completed Amount: <span className="font-black text-white">{money(withdrawalStats?.completed_amount)}</span></div>
                <div>Pending Amount: <span className="font-black text-white">{money(withdrawalStats?.pending_amount)}</span></div>
              </div>
            </div>
          </div>


          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">KYC Detail</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div>KYC Status: <span className="font-black text-white">{kycDetail?.kyc_status || "-"}</span></div>
                <div>KYC Level: <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 font-black text-emerald-300">{String(kycDetail?.kyc_level ?? 0)}</span></div>
                <div>Auto Withdraw: <span className="font-black text-white">{kycDetail?.auto_withdraw_enabled ? "ON" : "OFF"}</span></div>
                <div>Threshold: <span className="font-black text-white">${Number(kycDetail?.auto_withdraw_limit || 0)}</span></div>
                <div>Approved At: <span className="font-black text-white">{fmtDate(kycDetail?.kyc_verified_at)}</span></div>
                <div>Approved By: <span className="font-black text-white">{kycDetail?.kyc_approved_by || "-"}</span></div>
                <div>Rejected Reason: <span className="font-black text-white">{kycDetail?.kyc_rejected_reason || "-"}</span></div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {kycDetail?.files?.id_document ? <a href={kycDetail.files.id_document} target="_blank" className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300">View ID</a> : <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">No ID</div>}
                {kycDetail?.files?.selfie ? <a href={kycDetail.files.selfie} target="_blank" className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300">View Selfie</a> : <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">No Selfie</div>}
                {kycDetail?.files?.proof_of_address ? <a href={kycDetail.files.proof_of_address} target="_blank" className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300">View POA</a> : <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">No POA</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">KYC History</h2>
              <div className="mt-3 grid gap-3">
                {(kycDetail?.history || []).length ? (kycDetail.history || []).map((row: any) => (
                  <div key={row.id} className="rounded-2xl border border-white/5 bg-[#13232d] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black text-white">{row.action}</div>
                      <div className="text-xs text-slate-400">{fmtDate(row.created_at)}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-300">
                      Actor: {row.actor || "-"} · From: {row.from_level ?? "-"} · To: {row.to_level ?? "-"}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{row.note || "-"}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-400">No KYC history yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">KYC & Audit</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div>KYC Status: <span className="text-white">{profileUser?.kyc_status || "-"}</span></div>
                <div>KYC Verified At: <span className="text-white">{fmtDate(profileUser?.kyc_verified_at)}</span></div>
                <div>KYC Rejected Reason: <span className="text-white">{profileUser?.kyc_rejected_reason || "-"}</span></div>
                <div>Notes: <span className="text-white">{user.notes || "-"}</span></div>
                <div className="mt-2 text-xs text-slate-400">
                  Parent change: {fmtDate(user.last_parent_change_at)} by {user.last_parent_change_by || "-"}<br />
                  Agent code change: {fmtDate(user.last_agent_code_change_at)} by {user.last_agent_code_change_by || "-"}<br />
                  Created by change: {fmtDate(user.last_created_by_change_at)} by {user.last_created_by_change_by || "-"}<br />
                  Last updated: {fmtDate(user.updated_at)} by {user.updated_by || "-"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Recent Deposits</h2>
              <div className="mt-3 grid gap-2">
                {profile.recent_deposits?.length ? profile.recent_deposits.map((d) => (
                  <div key={d.id} className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-black text-white">Deposit #{d.id}</div>
                      <span className={depositStatusChip(d.status)}>{d.status || "-"}</span>
                    </div>
                    <div className="mt-1">Amount: {money(d.amount_usd)} • Currency: {String(d.pay_currency || "-").toUpperCase()}</div>
                    <div className="mt-1 text-xs text-slate-400">Payment ID: {d.payment_id || "-"} • {fmtDate(d.created_at)}</div>
                    <div className="mt-1 text-xs text-slate-500">Address: {shortText(d.pay_address, 28)}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">No deposits found.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Recent Withdrawals</h2>
              <div className="mt-3 grid gap-2">
                {profile.recent_withdrawals?.length ? profile.recent_withdrawals.map((w) => (
                  <div key={w.id} className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-black text-white">Withdrawal #{w.id}</div>
                      <span className={withdrawalStatusChip(w.status)}>{w.status || "-"}</span>
                    </div>
                    <div className="mt-1">Amount: {money(w.amount_usd)} • Currency: {String(w.payout_currency || "-").toUpperCase()}</div>
                    <div className="mt-1 text-xs text-slate-400">{fmtDate(w.created_at)}</div>
                    <div className="mt-1 text-xs text-slate-500">Address: {shortText(w.payout_address, 28)} {w.refunded ? "• refunded" : ""}</div>
                    {w.note ? <div className="mt-1 text-xs text-amber-300">Note: {w.note}</div> : null}
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">No withdrawals found.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
              <h2 className="text-xl font-black">Recent Transactions</h2>
              <div className="mt-3 grid gap-2">
                {profile.recent_transactions?.length ? profile.recent_transactions.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-white">{t.type}</div>
                      <div className={Number(t.amount || 0) >= 0 ? "font-black text-emerald-300" : "font-black text-red-300"}>
                        {money(t.amount)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Balance After: {money(t.balance_after)} • {fmtDate(t.created_at)}</div>
                    <div className="mt-1 text-xs text-slate-500">Reference: {t.reference || "-"}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">No transactions found.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
