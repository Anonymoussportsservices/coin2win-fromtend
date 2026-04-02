"use client";

import { useEffect, useMemo, useState } from "react";

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

type KycState = {
  ok?: boolean;
  user_id?: string;
  kyc_status?: string;
  kyc_level?: number;
  auto_withdraw_enabled?: boolean;
  auto_withdraw_limit?: number;
  has_id_document?: boolean;
  has_selfie?: boolean;
  has_proof_of_address?: boolean;
  kyc_rejected_reason?: string | null;
};

function statusBadge(status?: string) {
  const s = String(status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-black border";
  if (s === "verified") return `${base} border-emerald-500/30 bg-emerald-500/15 text-emerald-300`;
  if (s === "pending") return `${base} border-amber-500/30 bg-amber-500/15 text-amber-300`;
  if (s === "rejected") return `${base} border-rose-500/30 bg-rose-500/15 text-rose-300`;
  return `${base} border-slate-500/30 bg-slate-500/15 text-slate-300`;
}

function statCard(label: string, value: string, accent?: "green" | "blue" | "amber" | "rose") {
  const accents = {
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    blue: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  } as const;

  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-3 inline-flex rounded-2xl border px-4 py-2 text-lg font-black ${accent ? accents[accent] : "border-white/10 bg-white/5 text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function docItem(label: string, uploaded?: boolean) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#13232d] px-4 py-3">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-black border ${
          uploaded
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
            : "border-slate-500/30 bg-slate-500/15 text-slate-300"
        }`}
      >
        {uploaded ? "Uploaded" : "Missing"}
      </span>
    </div>
  );
}

export default function KycPage() {
  const [msg, setMsg] = useState("");
  const [busy1, setBusy1] = useState(false);
  const [busy2, setBusy2] = useState(false);
  const [state, setState] = useState<KycState | null>(null);

  async function loadState() {
    try {
      const res = await fetch("/api/kyc/me", {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setState(json);
    } catch {}
  }

  useEffect(() => {
    loadState();
  }, []);

  async function uploadLevel1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setBusy1(true);
      setMsg("");
      const res = await fetch("/api/kyc/upload-level1", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Level 1 upload failed");
      setMsg("Level 1 enviado ✅");
      await loadState();
    } catch (e: any) {
      setMsg(e?.message || "Level 1 upload failed");
    } finally {
      setBusy1(false);
    }
  }

  async function uploadLevel2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setBusy2(true);
      setMsg("");
      const res = await fetch("/api/kyc/upload-level2", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Level 2 upload failed");
      setMsg("Level 2 enviado ✅");
      await loadState();
    } catch (e: any) {
      setMsg(e?.message || "Level 2 upload failed");
    } finally {
      setBusy2(false);
    }
  }

  const statusText = String(state?.kyc_status || "unverified");
  const levelText = String(state?.kyc_level ?? 0);
  const autoText = state?.auto_withdraw_enabled ? "ON" : "OFF";
  const thresholdText = `$${Number(state?.auto_withdraw_limit || 0)}`;

  const progress = useMemo(() => {
    let count = 0;
    if (state?.has_id_document) count += 1;
    if (state?.has_selfie) count += 1;
    if (state?.has_proof_of_address) count += 1;
    return count;
  }, [state]);

  return (
    <div className="mx-auto max-w-6xl p-6 text-white">
      <div className="rounded-[28px] border border-white/5 bg-[linear-gradient(135deg,#1a2c38_0%,#13232d_100%)] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Security & Compliance</div>
            <h1 className="mt-2 text-3xl font-black">KYC Verification Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Sube tus documentos para activar o ampliar tu nivel de verificación. Esto también define cómo se manejan tus retiros.
            </p>
          </div>
          <div className={statusBadge(statusText)}>{statusText.toUpperCase()}</div>
        </div>
      </div>

      {msg ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a2c38] px-4 py-3 text-sm text-slate-100">
          {msg}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCard("KYC Status", statusText, statusText === "verified" ? "green" : statusText === "pending" ? "amber" : statusText === "rejected" ? "rose" : "blue")}
        {statCard("Current Level", levelText, "blue")}
        {statCard("Auto Withdraw", autoText, state?.auto_withdraw_enabled ? "green" : "amber")}
        {statCard("Threshold", thresholdText, "blue")}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Verification Summary</h2>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
              Documents: {progress}/3
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {docItem("ID Document", state?.has_id_document)}
            {docItem("Selfie", state?.has_selfie)}
            {docItem("Proof of Address", state?.has_proof_of_address)}
          </div>

          {state?.kyc_status === "rejected" && state?.kyc_rejected_reason ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">Rejected Reason</div>
              <div className="mt-2 text-sm text-rose-100">{state.kyc_rejected_reason}</div>
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-white/5 bg-[#13232d] p-4 text-sm text-slate-300">
            <div className="font-black text-white">How levels work</div>
            <div className="mt-2">Level 1 = ID document + selfie.</div>
            <div>Level 2 = proof of address in addition to Level 1.</div>
            <div className="mt-2 text-slate-400">
              Approval timing, reviewer, audit log and document previews can be added next.
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <form onSubmit={uploadLevel1} className="rounded-3xl border border-white/5 bg-[#1a2c38] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Level 1 Upload</h2>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-300">
                ID + Selfie
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">ID Document</span>
                <input
                  name="id_document"
                  type="file"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:font-black file:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Selfie</span>
                <input
                  name="selfie"
                  type="file"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:font-black file:text-white"
                />
              </label>

              <button
                disabled={busy1}
                className="rounded-2xl bg-sky-500 px-4 py-3 font-black text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy1 ? "Uploading..." : "Upload Level 1"}
              </button>
            </div>
          </form>

          <form onSubmit={uploadLevel2} className="rounded-3xl border border-white/5 bg-[#1a2c38] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Level 2 Upload</h2>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                Proof of Address
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Proof of Address</span>
                <input
                  name="proof_of_address"
                  type="file"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-black file:text-white"
                />
              </label>

              <button
                disabled={busy2}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy2 ? "Uploading..." : "Upload Level 2"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
