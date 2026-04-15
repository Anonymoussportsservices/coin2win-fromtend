type Props = {
  user: any;
  profileUser: any;
  fmtDate: (v?: string | null) => string;
};

export default function AuditTrailCard({ user, profileUser, fmtDate }: Props) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div>
        <h2 className="text-xl font-black">KYC & Audit</h2>
        <p className="mt-1 text-sm text-slate-400">
          Operational notes and metadata change history.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">KYC Status</div>
          <div className="mt-2 font-black text-white">{profileUser?.kyc_status || "-"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">KYC Verified At</div>
          <div className="mt-2 font-black text-white">{fmtDate(profileUser?.kyc_verified_at)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4 md:col-span-2">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">KYC Rejected Reason</div>
          <div className="mt-2 font-black text-white">{profileUser?.kyc_rejected_reason || "-"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4 md:col-span-2">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Notes</div>
          <div className="mt-2 font-black text-white">{user?.notes || "-"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4 md:col-span-2 text-xs text-slate-300">
          <div>
            Parent change: <span className="text-white">{fmtDate(user?.last_parent_change_at)}</span> by{" "}
            <span className="text-white">{user?.last_parent_change_by || "-"}</span>
          </div>
          <div className="mt-2">
            Agent code change: <span className="text-white">{fmtDate(user?.last_agent_code_change_at)}</span> by{" "}
            <span className="text-white">{user?.last_agent_code_change_by || "-"}</span>
          </div>
          <div className="mt-2">
            Created by change: <span className="text-white">{fmtDate(user?.last_created_by_change_at)}</span> by{" "}
            <span className="text-white">{user?.last_created_by_change_by || "-"}</span>
          </div>
          <div className="mt-2">
            Last updated: <span className="text-white">{fmtDate(user?.updated_at)}</span> by{" "}
            <span className="text-white">{user?.updated_by || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
