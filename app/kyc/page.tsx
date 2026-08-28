"use client";

import { useEffect, useMemo, useState } from "react";
import PlayerShell from "@/components/PlayerShell";

type KycState = {
  user_id?: string;
  kyc_status?: string;
  kyc_level?: number;
  auto_withdraw_enabled?: boolean;
  auto_withdraw_limit?: number;
  kyc_verified_at?: string | null;
  kyc_rejected_reason?: string | null;
};

function getStoredUserId() {
  try {
    const raw =
      localStorage.getItem("c2w_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("auth_user") ||
      localStorage.getItem("player_session_data") ||
      "{}";
    const parsed = JSON.parse(raw);
    return String(parsed?.id || parsed?.user_id || parsed?.username || localStorage.getItem("user_id") || "").trim();
  } catch {
    return String(localStorage.getItem("user_id") || "").trim();
  }
}

function statusClass(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "verified") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (s === "pending") return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  if (s === "rejected") return "border-red-500/25 bg-red-500/10 text-red-300";
  return "border-slate-500/25 bg-slate-500/10 text-slate-300";
}

export default function KycPage() {
  const [userId, setUserId] = useState("");
  const [kyc, setKyc] = useState<KycState | null>(null);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!userId && !!front && !!back && !submitting;

  const previews = useMemo(() => {
    return {
      front: front ? URL.createObjectURL(front) : "",
      back: back ? URL.createObjectURL(back) : "",
      selfie: selfie ? URL.createObjectURL(selfie) : "",
    };
  }, [front, back, selfie]);

  async function loadStatus(id: string) {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/kyc/me?user_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "Failed to load KYC status");
      setKyc(json);
    } catch (e: any) {
      setMessage(e?.message || "Failed to load KYC status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = getStoredUserId();
    setUserId(id);
    if (id) loadStatus(id);
    else setLoading(false);
  }, []);

  async function submitKyc() {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setMessage("");

      const form = new FormData();
      form.append("user_id", userId);
      form.append("document_front", front as File);
      form.append("document_back", back as File);
      if (selfie) form.append("selfie", selfie);

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: form,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || "KYC upload failed");

      setMessage("Documents uploaded. Your verification is now pending review.");
      setFront(null);
      setBack(null);
      setSelfie(null);
      await loadStatus(userId);
    } catch (e: any) {
      setMessage(e?.message || "KYC upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PlayerShell title="KYC Verification">
      <main className="mx-auto w-full max-w-5xl px-4 py-6 text-white">
        <section className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">Verification</div>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Verify your account</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Take clear photos of the front and back of your ID. A selfie is optional for now, but recommended.
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${statusClass(kyc?.kyc_status)}`}>
              {loading ? "LOADING" : String(kyc?.kyc_status || "unverified").toUpperCase()}
            </div>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-sm text-slate-100">
              {message}
            </div>
          ) : null}

          {!userId ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              Missing player session. Please login again.
            </div>
          ) : null}

          {kyc?.kyc_status === "verified" ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              Your account is verified. Withdrawals are enabled up to your approved limit.
            </div>
          ) : null}

          {kyc?.kyc_status === "rejected" && kyc?.kyc_rejected_reason ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              Rejected reason: {kyc.kyc_rejected_reason}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FileBox label="ID Front" file={front} preview={previews.front} onChange={setFront} required />
            <FileBox label="ID Back" file={back} preview={previews.back} onChange={setBack} required />
            <FileBox label="Selfie" file={selfie} preview={previews.selfie} onChange={setSelfie} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={submitKyc}
              disabled={!canSubmit}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-[#071824] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Submit Verification"}
            </button>
            <div className="text-xs text-slate-400">
              Player: <span className="font-bold text-slate-200">{userId || "-"}</span>
            </div>
          </div>
        </section>
      </main>
    </PlayerShell>
  );
}

function FileBox({
  label,
  file,
  preview,
  onChange,
  required,
}: {
  label: string;
  file: File | null;
  preview: string;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  return (
    <label className="block cursor-pointer rounded-3xl border border-white/5 bg-[#13232d] p-4 transition hover:border-emerald-500/25">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-black text-white">{label}</div>
        {required ? <div className="text-[10px] font-black uppercase text-amber-300">Required</div> : null}
      </div>

      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-[#0f172a]">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center text-sm text-slate-400">Tap to take photo</div>
        )}
      </div>

      <input
        type="file"
        accept="image/*" capture={label === "Selfie" ? "user" : "environment"}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div className="mt-3 truncate text-xs text-slate-400">{file?.name || "No file selected"}</div>
    </label>
  );
}
