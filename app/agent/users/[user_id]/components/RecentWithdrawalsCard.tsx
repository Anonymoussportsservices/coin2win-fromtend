type RecentWithdrawalsCardProps = {
  withdrawals: Array<{
    id: number;
    status?: string | null;
    amount_usd?: number;
    payout_currency?: string | null;
    payout_address?: string | null;
    refunded?: boolean;
    note?: string | null;
    created_at?: string | null;
  }>;
  money: (v: number | string | null | undefined) => string;
  fmtDate: (value?: string | null) => string;
  shortText: (value?: string | null, n?: number) => string;
  withdrawalStatusChip: (status?: string | null) => string;
};

export default function RecentWithdrawalsCard({
  withdrawals,
  money,
  fmtDate,
  shortText,
  withdrawalStatusChip,
}: RecentWithdrawalsCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <h2 className="text-xl font-black">Recent Withdrawals</h2>
      <div className="mt-3 grid gap-2">
        {withdrawals?.length ? withdrawals.map((w) => (
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
  );
}
