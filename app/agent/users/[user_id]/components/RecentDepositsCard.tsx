type RecentDepositsCardProps = {
  deposits: Array<{
    id: number;
    payment_id?: string | null;
    status?: string | null;
    amount_usd?: number;
    pay_currency?: string | null;
    pay_address?: string | null;
    created_at?: string | null;
  }>;
  money: (v: number | string | null | undefined) => string;
  fmtDate: (value?: string | null) => string;
  shortText: (value?: string | null, n?: number) => string;
  depositStatusChip: (status?: string | null) => string;
};

export default function RecentDepositsCard({
  deposits,
  money,
  fmtDate,
  shortText,
  depositStatusChip,
}: RecentDepositsCardProps) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <h2 className="text-xl font-black">Recent Deposits</h2>
      <div className="mt-3 grid gap-2">
        {deposits?.length ? deposits.map((d) => (
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
  );
}
