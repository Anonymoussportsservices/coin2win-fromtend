import { runFinancialBrain } from "@/app/intelligence/brains/financialBrain";
import { runRiskBrain } from "@/app/intelligence/brains/riskBrain";
import { runTrendBrain } from "@/app/intelligence/brains/trendBrain";
import { runRecommendationEngine } from "@/app/intelligence/engine/recommendationEngine";

type RecommendationPanelProps = {
  deposits?: number;
  withdrawals?: number;
  netFlow?: number;
  alertsCount?: number;
};

export function RecommendationPanel(props: RecommendationPanelProps) {
  const financial = runFinancialBrain(props);
  const trend = runTrendBrain({
    current: props.netFlow || 0,
    previous: 0,
    label: "Net flow",
  });
  const risk = runRiskBrain(props);

  const result = runRecommendationEngine([financial, trend, risk]);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        Recommended Action
      </div>

      {result.primary ? (
        <div className="mt-3 rounded-xl bg-[#0f172a] p-4">
          <div className="text-lg font-black text-white">
            {result.primary.title}
          </div>

          {result.primary.detail ? (
            <div className="mt-2 text-sm text-slate-400">
              {result.primary.detail}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-400">
          No recommendation available.
        </div>
      )}

      {result.secondary.length ? (
        <div className="mt-4 grid gap-2">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Additional Recommendations
          </div>

          {result.secondary.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-xl border border-white/5 bg-[#0f172a] px-3 py-3"
            >
              <div className="text-sm font-black text-white">
                {item.title}
              </div>

              {item.detail ? (
                <div className="mt-1 text-xs text-slate-400">
                  {item.detail}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
