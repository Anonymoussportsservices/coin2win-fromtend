import { Timeline, TimelineItem } from "@/components/oxs/Timeline";

type LedgerTransaction = {
  id: string | number;
  type?: string | null;
  amount?: number | string | null;
  balance_after?: number | string | null;
  reference?: string | null;
  created_at?: string | null;
};

type LedgerTimelineProps = {
  items?: LedgerTransaction[];
  money: (value: any) => string;
  formatDate: (value?: string | null) => string;
};

export function LedgerTimeline({ items = [], money, formatDate }: LedgerTimelineProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-4 text-sm text-slate-400">
        No transactions found.
      </div>
    );
  }

  return (
    <Timeline>
      {items.map((transaction) => {
        const amount = Number(transaction.amount || 0);
        const positive = amount >= 0;

        return (
          <TimelineItem
            key={transaction.id}
            title={transaction.type || "Transaction"}
            timestamp={formatDate(transaction.created_at)}
            meta={`Balance After: ${money(transaction.balance_after)} · Reference: ${transaction.reference || "-"}`}
            tone={positive ? "success" : "danger"}
          >
            <span className={positive ? "font-black text-emerald-300" : "font-black text-red-300"}>
              {money(transaction.amount)}
            </span>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
