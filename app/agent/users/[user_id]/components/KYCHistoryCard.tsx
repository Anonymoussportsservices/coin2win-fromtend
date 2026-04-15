type Props = {
  history: any[];
  fmtDate: (v?: string | null) => string;
};

export default function KYCHistoryCard({ history, fmtDate }: Props) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div>
        <h2 className="text-xl font-black">KYC History</h2>
        <p className="mt-1 text-sm text-slate-400">
          Verification actions and operator decision trail.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {history?.length ? history.map((row) => (
          <div
            key={row.id}
            className="rounded-2xl border border-white/10 bg-[#13232d] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-white">{row.action || "-"}</div>
              <div className="text-xs text-slate-400">{fmtDate(row.created_at)}</div>
            </div>

            <div className="mt-2 text-xs text-slate-300">
              Actor: {row.actor || "-"} · From: {row.from_level ?? "-"} · To: {row.to_level ?? "-"}
            </div>

            <div className="mt-2 text-sm text-slate-300">{row.note || "-"}</div>
          </div>
        )) : (
          <div className="rounded-2xl border border-white/10 bg-[#13232d] p-4 text-sm text-slate-400">
            No KYC history yet.
          </div>
        )}
      </div>
    </div>
  );
}
