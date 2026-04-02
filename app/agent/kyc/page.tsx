"use client";

import { useEffect, useState } from "react";

type KycUser = {
  id: string;
  role?: string;
  kyc_status: string;
  kyc_verified_at?: string | null;
  kyc_rejected_reason?: string | null;
  created_at?: string | null;
};

type KycDetail = {
  user_id: string;
  kyc_status: string;
  kyc_level: number;
  auto_withdraw_enabled: boolean;
  auto_withdraw_limit: number;
  kyc_verified_at?: string;
  kyc_rejected_reason?: string;
  kyc_approved_by?: string;
  files?: {
    id_document?: string;
    selfie?: string;
    proof_of_address?: string;
  };
  history?: any[];
};

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function chip(s: string) {
  if (s === "verified") return "bg-emerald-500/20 text-emerald-300";
  if (s === "pending" || s === "unverified") return "bg-amber-500/20 text-amber-300";
  if (s === "rejected") return "bg-red-500/20 text-red-300";
  return "bg-slate-500/20 text-slate-300";
}

export default function Page() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const res = await fetch("/ui-api/admin/kyc/users", { cache: "no-store" });
    const json = await res.json();
    setUsers(json.users || []);
    if (json.users?.[0]?.id) {
      selectUser(json.users[0].id);
    }
    setLoading(false);
  }

  async function selectUser(id: string) {
    setSelected(id);
    const res = await fetch(`/ui-api/admin/users/${id}/kyc-detail`, { cache: "no-store" });
    const json = await res.json();
    setDetail(json);
  }

  async function approve(id: string, lvl: number) {
    await fetch(`/ui-api/admin/users/${id}/kyc-approve`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ kyc_level: lvl })
    });
    loadUsers();
  }

  async function reject(id: string) {
    await fetch(`/ui-api/admin/users/${id}/kyc-reject`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ reason: "Rejected by admin" })
    });
    loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="grid grid-cols-[320px_1fr] h-screen text-white">
      <div className="bg-[#0f172a] p-4 overflow-y-auto border-r border-white/5">
        <h1 className="font-black text-xl mb-4">KYC Queue</h1>

        {users.map(u => (
          <div
            key={u.id}
            onClick={() => selectUser(u.id)}
            className={`p-3 mb-2 rounded cursor-pointer ${selected===u.id ? "bg-[#1e293b]" : "bg-[#13202a]"}`}
          >
            <div className="text-sm font-bold">{u.id}</div>
            <div className={`text-xs px-2 py-1 inline-block mt-1 rounded ${chip(u.kyc_status)}`}>
              {u.kyc_status}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 overflow-y-auto">
        {!detail ? "Select user..." : (
          <>
            <h2 className="text-2xl font-black mb-4">{detail.user_id}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>Status: {detail.kyc_status}</div>
              <div>Level: {detail.kyc_level}</div>
              <div>Auto WD: {detail.auto_withdraw_enabled ? "ON" : "OFF"}</div>
              <div>Limit: ${detail.auto_withdraw_limit}</div>
              <div>Verified At: {detail.kyc_verified_at || "-"}</div>
              <div>Rejected: {detail.kyc_rejected_reason || "-"}</div>
              <div>Approved By: {detail.kyc_approved_by || "-"}</div>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={()=>approve(detail.user_id,1)} className="bg-sky-500 px-4 py-2 rounded font-bold">Approve L1</button>
              <button onClick={()=>approve(detail.user_id,2)} className="bg-sky-500 px-4 py-2 rounded font-bold">Approve L2</button>
              <button onClick={()=>reject(detail.user_id)} className="bg-red-500 px-4 py-2 rounded font-bold">Reject</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {detail.files?.id_document && (
                <img src={detail.files.id_document} className="rounded border border-white/10"/>
              )}
              {detail.files?.selfie && (
                <img src={detail.files.selfie} className="rounded border border-white/10"/>
              )}
              {detail.files?.proof_of_address && (
                <img src={detail.files.proof_of_address} className="rounded border border-white/10"/>
              )}
            </div>

            <div>
              <h3 className="font-black mb-2">Audit Log</h3>
              {(detail.history || []).map((h,i)=>(
                <div key={i} className="text-xs border-b border-white/5 py-2">
                  {h.action} | {h.actor} | {h.from_level} → {h.to_level} | {h.note}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
