import type { BrainResult, IntelligenceItem } from "./types";

export type RecommendationEngineResult = {
  primary: IntelligenceItem | null;
  secondary: IntelligenceItem[];
  total: number;
};

const severityRank = {
  critical: 4,
  watch: 3,
  healthy: 1,
};

export function runRecommendationEngine(results: BrainResult[]): RecommendationEngineResult {
  const recommendations = results.flatMap((result) =>
    result.recommendations.map((item) => ({
      ...item,
      detail: item.detail || result.summary,
      severity: item.severity || result.health,
    }))
  );

  const alerts = results.flatMap((r) => r.alerts || []);
  const hasCritical = alerts.some((a) => a.severity === "critical");
  const hasWatch = alerts.some((a) => a.severity === "watch");
  const worstScore = Math.min(...results.map((r) => Number(r.score || 100)));

  const dynamic: IntelligenceItem[] = [];

  if (hasCritical || worstScore < 45) {
    dynamic.push({
      title: "Investigate operational pressure",
      detail: "Critical signals detected. Review Money Center, agent breakdown, and top withdrawals.",
      severity: "critical",
    });
  } else if (hasWatch || worstScore < 75) {
    dynamic.push({
      title: "Review flagged financial movement",
      detail: "Watch-level signals detected. Identify which agent/group is driving the change.",
      severity: "watch",
    });
  } else {
    dynamic.push({
      title: "No action required",
      detail: "Current financial and risk signals are within healthy range.",
      severity: "healthy",
    });
  }

  const merged = [...dynamic, ...recommendations].sort((a, b) => {
    const severityDiff =
      severityRank[b.severity || "healthy"] - severityRank[a.severity || "healthy"];
    if (severityDiff !== 0) return severityDiff;
    return String(a.title).localeCompare(String(b.title));
  });

  return {
    primary: merged[0] || null,
    secondary: merged.slice(1, 4),
    total: merged.length,
  };
}
