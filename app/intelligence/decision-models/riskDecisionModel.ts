import type { BrainResult } from "../engine/types";

export type RiskDecisionInput = {
  deposits?: number;
  withdrawals?: number;
  netFlow?: number;
  alertsCount?: number;
};

export function runRiskDecisionModel(input: RiskDecisionInput): BrainResult {
  const deposits = Number(input.deposits || 0);
  const withdrawals = Number(input.withdrawals || 0);
  const netFlow = Number(input.netFlow || 0);
  const alertsCount = Number(input.alertsCount || 0);

  let score = 90;

  if (netFlow < 0) score -= 25;
  if (withdrawals > deposits) score -= 25;
  if (deposits <= 0 && withdrawals > 0) score -= 30;
  if (alertsCount > 0) score -= Math.min(alertsCount * 8, 24);

  score = Math.max(0, Math.min(100, score));

  const health = score >= 75 ? "healthy" : score >= 45 ? "watch" : "critical";

  const alerts = [];

  if (withdrawals > deposits) {
    alerts.push({
      title: "Withdrawal pressure",
      detail: "Withdrawals are higher than deposits.",
      severity: "watch" as const,
      scoreImpact: -25,
    });
  }

  if (deposits <= 0 && withdrawals > 0) {
    alerts.push({
      title: "No deposit coverage",
      detail: "Withdrawals exist without deposit inflow.",
      severity: "critical" as const,
      scoreImpact: -30,
    });
  }

  return {
    brain: "risk",
    score,
    health,
    summary:
      health === "healthy"
        ? "No major operational risk detected."
        : health === "watch"
          ? "Operational risk requires review."
          : "Critical operational risk detected.",
    alerts,
    opportunities: [],
    recommendations: [
      {
        title:
          health === "healthy"
            ? "Continue monitoring."
            : "Review Money Center and agent breakdown.",
        detail:
          health === "healthy"
            ? "No immediate intervention required."
            : "Identify which agents or players are driving financial pressure.",
        severity: health,
      },
    ],
    confidence: 88,
  };
}
