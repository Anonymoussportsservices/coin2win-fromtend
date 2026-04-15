type RecentTransactionsCardProps = {
  transactions: Array<{
    id: number;
    type: string;
    amount: number;
    balance_after: number;
    reference?: string | null;
    created_at?: string | null;
  }>;
  money: (v: number | string | null | undefined) => string;
  fmtDate: (value?: string | null) => string;
};

export default function RecentTransactionsCard({
  transactions,
  money,
  fmtDate,
}: RecentTransactionsCardProps) {
  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <h2 className="text-xl font-black">Recent Transactions</h2>
      <div className="mt-3 grid gap-2">
        {transactions?.length ? transactions.map((t) => (
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
  );
}
