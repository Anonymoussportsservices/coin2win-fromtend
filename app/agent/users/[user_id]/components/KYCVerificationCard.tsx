type Props = {
  profileUser: any;
  kycDetail: any;
  savingKyc: boolean;
  approveKyc: (lvl: number) => void;
  rejectKyc: () => void;
  setManualKyc: () => void;
  fmtDate: (v?: string | null) => string;
};

export default function KYCVerificationCard({
  profileUser,
  kycDetail,
  savingKyc,
  approveKyc,
  rejectKyc,
  setManualKyc,
  fmtDate,
}: Props) {
  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div>
        <h2 className="text-xl font-black">KYC Verification</h2>
        <p className="mt-1 text-sm text-slate-400">
          Verification status, controls, review metadata, and documents.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">KYC Status</div>
          <div className="mt-2 font-black text-white">{profileUser?.kyc_status || "-"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">KYC Level</div>
          <div className="mt-2 font-black text-white">{String(profileUser?.kyc_level ?? 0)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Auto Withdraw</div>
          <div className="mt-2 font-black text-white">{profileUser?.auto_withdraw_enabled ? "ON" : "OFF"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Threshold</div>
          <div className="mt-2 font-black text-white">${Number(profileUser?.auto_withdraw_limit ?? 0)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          disabled={savingKyc}
          onClick={() => approveKyc(1)}
          className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white disabled:opacity-60"
        >
          {savingKyc ? "Saving..." : "Approve L1"}
        </button>

        <button
          disabled={savingKyc}
          onClick={() => approveKyc(2)}
          className="rounded-2xl bg-sky-500 px-4 py-2 font-black text-white disabled:opacity-60"
        >
          {savingKyc ? "Saving..." : "Approve L2"}
        </button>

        <button
          disabled={savingKyc}
          onClick={rejectKyc}
          className="rounded-2xl bg-red-500 px-4 py-2 font-black text-white disabled:opacity-60"
        >
          {savingKyc ? "Saving..." : "Reject"}
        </button>

        <button
          disabled={savingKyc}
          onClick={setManualKyc}
          className="rounded-2xl bg-amber-500 px-4 py-2 font-black text-white disabled:opacity-60"
        >
          {savingKyc ? "Saving..." : "Set Manual"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Approved At</div>
          <div className="mt-2 font-black text-white">{fmtDate(kycDetail?.kyc_verified_at)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Approved By</div>
          <div className="mt-2 font-black text-white">{kycDetail?.kyc_approved_by || "-"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Rejected Reason</div>
          <div className="mt-2 font-black text-white">{kycDetail?.kyc_rejected_reason || "-"}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {kycDetail?.files?.id_document ? (
          <a
            href={kycDetail.files.id_document}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300"
          >
            View ID
          </a>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">
            No ID
          </div>
        )}

        {kycDetail?.files?.selfie ? (
          <a
            href={kycDetail.files.selfie}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300"
          >
            View Selfie
          </a>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">
            No Selfie
          </div>
        )}

        {kycDetail?.files?.proof_of_address ? (
          <a
            href={kycDetail.files.proof_of_address}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm font-black text-sky-300"
          >
            View POA
          </a>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-center text-sm text-slate-400">
            No POA
          </div>
        )}
      </div>
    </div>
  );
}
