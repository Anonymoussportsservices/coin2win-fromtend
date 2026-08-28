import type { BrainResult } from "../engine/types";

type TrendBrainInput = {
  current?: number;
  previous?: number;
  label?: string;
};

export function runTrendBrain(input: TrendBrainInput): BrainResult {
  const current = Number(input.current || 0);
  const previous = Number(input.previous || 0);
  const label = input.label || "Metric";

  const change = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;

  let score = 80;
  if (change < -20) score -= 25;
  if (change > 20) score += 10;
  score = Math.max(0, Math.min(100, score));

  const health = score >= 75 ? "healthy" : score >= 45 ? "watch" : "critical";

  return {
    brain: "trend",
    score,
    health,
    summary:
      change > 10
        ? `${label} is trending up.`
        : change < -10
          ? `${label} is trending down.`
          : `${label} is stable.`,
    alerts: change < -20 ? [{
      title: "Negative trend detected",
      detail: `${label} dropped more than 20% compared to the previous period.`,
      severity: "watch",
      scoreImpact: -25,
    }] : [],
    opportunities: change > 20 ? [{
      title: "Positive trend detected",
      detail: `${label} increased more than 20% compared to the previous period.`,
      severity: "healthy",
    }] : [],
    recommendations: [{
      title: health === "healthy" ? "Continue monitoring trend." : "Review trend drivers.",
      detail: health === "healthy"
        ? "Trend movement is within acceptable range."
        : "Investigate which agents or players are driving the trend change.",
      severity: health,
    }],
    confidence: previous === 0 ? 60 : 85,
  };
}
