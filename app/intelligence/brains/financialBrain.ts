import type { BrainResult } from "../engine/types";

type FinancialBrainInput = {
  deposits?: number;
  withdrawals?: number;
  netFlow?: number;
  alertsCount?: number;
};

export function runFinancialBrain(input: FinancialBrainInput): BrainResult {
  const deposits = Number(input.deposits || 0);
  const withdrawals = Number(input.withdrawals || 0);
  const netFlow = Number(input.netFlow || 0);
  const alertsCount = Number(input.alertsCount || 0);

  let score = 85;
  if (netFlow < 0) score -= 25;
  if (withdrawals > deposits) score -= 20;
  if (alertsCount > 0) score -= Math.min(alertsCount * 10, 30);

  score = Math.max(0, Math.min(100, score));

  const health = score >= 75 ? "healthy" : score >= 45 ? "watch" : "critical";

  return {
    brain: "financial",
    score,
    health,
    summary: netFlow >= 0 ? "Cash flow is healthy." : "Cash flow needs attention.",
    alerts: withdrawals > deposits ? [{
      title: "Withdrawal pressure",
      detail: "Withdrawals are higher than deposits for this period.",
      severity: "watch",
      scoreImpact: -20,
    }] : [],
    opportunities: netFlow > 0 ? [{
      title: "Positive cash flow",
      detail: "Deposits are currently covering withdrawals.",
      severity: "healthy",
    }] : [],
    recommendations: [{
      title: health === "healthy" ? "No immediate financial action required." : "Review financial movement.",
      detail: health === "healthy"
        ? "Continue monitoring normal cash flow."
        : "Review groups driving negative cash flow before approving additional movement.",
      severity: health,
    }],
    confidence: 90,
  };
}
