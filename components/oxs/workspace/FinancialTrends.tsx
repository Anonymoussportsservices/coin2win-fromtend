import {
  runFinancialTrendsEngine,
  type FinancialSummary,
  type FinancialTrendItem,
} from "@/app/intelligence/engine/financialTrendsEngine";

type FinancialTrendsProps = {
  current?: FinancialSummary;
  previous?: FinancialSummary;
};

function directionLabel(item: FinancialTrendItem) {
  if (item.direction === "increasing") return "Increasing";
  if (item.direction === "decreasing") return "Decreasing";
  if (item.direction === "stable") return "Stable";
  return "No activity";
}

function directionSymbol(item: FinancialTrendItem) {
  if (item.direction === "increasing") return "↑";
  if (item.direction === "decreasing") return "↓";
  if (item.direction === "stable") return "→";
  return "—";
}

function directionClass(item: FinancialTrendItem) {
  if (item.direction === "increasing") return "text-emerald-300";
  if (item.direction === "decreasing") return "text-rose-300";
  if (item.direction === "stable") return "text-sky-300";
  return "text-slate-500";
}

function TrendRow({ item }: { item: FinancialTrendItem }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#0f172a] px-3 py-3">
      <div className="text-sm font-bold text-slate-300">{item.label}</div>

      <div className="text-right">
        <div className={`text-sm font-black ${directionClass(item)}`}>
          {directionSymbol(item)} {directionLabel(item)}
        </div>

        {item.changePercent !== null ? (
          <div className="mt-1 text-xs text-slate-500">
            {item.changePercent > 0 ? "+" : ""}
            {item.changePercent}%
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FinancialTrends({
  current = {},
  previous = {},
}: FinancialTrendsProps) {
  const result = runFinancialTrendsEngine(current, previous);

  const healthLabel =
    result.health === "healthy"
      ? "Healthy"
      : result.health === "watch"
        ? "Watch"
        : result.health === "critical"
          ? "Critical"
          : "No Data";

  const healthClass =
    result.health === "healthy"
      ? "text-emerald-300"
      : result.health === "watch"
        ? "text-amber-300"
        : result.health === "critical"
          ? "text-rose-300"
          : "text-slate-500";

  return (
    <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Financial Trends
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Current period compared with the previous equivalent period.
          </div>
        </div>

        <div className="rounded-xl bg-[#0f172a] px-3 py-2 text-right">
          <div className="text-xs font-black uppercase text-slate-500">
            Health
          </div>
          <div className={`mt-1 font-black ${healthClass}`}>
            {healthLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <TrendRow item={result.deposits} />
        <TrendRow item={result.withdrawals} />
        <TrendRow item={result.netFlow} />
        <TrendRow item={result.averageDeposit} />
        <TrendRow item={result.averageWithdrawal} />
      </div>

      <div className="mt-4 rounded-xl bg-[#0f172a] px-3 py-3 text-sm font-bold text-slate-300">
        {result.summary}
      </div>
    </div>
  );
}
