export type IntelligenceHealth = "healthy" | "watch" | "critical";

export type IntelligenceItem = {
  title: string;
  detail?: string;
  severity?: IntelligenceHealth;
  scoreImpact?: number;
};

export type BrainResult = {
  brain: string;
  score: number;
  health: IntelligenceHealth;
  summary: string;
  alerts: IntelligenceItem[];
  opportunities: IntelligenceItem[];
  recommendations: IntelligenceItem[];
  confidence: number;
};
