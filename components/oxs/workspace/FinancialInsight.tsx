import { runFinancialBrain } from "@/app/intelligence/brains/financialBrain";

type FinancialInsightProps = {
  deposits?: number;
  withdrawals?: number;
  netFlow?: number;
  alertsCount?: number;
};

export function FinancialInsight(props: FinancialInsightProps) {
  const result = runFinancialBrain(props);
  const mainRecommendation = result.recommendations[0];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Financial Insight</div>
          <div className="mt-3 text-lg font-black text-white">{result.summary}</div>
          {result.alerts[0]?.detail ? <div className="mt-2 text-sm text-slate-400">{result.alerts[0].detail}</div> : null}
        </div>
        <div className="rounded-xl bg-[#0f172a] px-3 py-2 text-right">
          <div className="text-xs font-black uppercase text-slate-500">Score</div>
          <div className="text-xl font-black text-white">{result.score}</div>
        </div>
      </div>

      {mainRecommendation ? (
        <div className="mt-4 rounded-xl bg-[#0f172a] px-3 py-2 text-sm font-bold text-slate-200">
          {mainRecommendation.title}
        </div>
      ) : null}
    </div>
  );
}
