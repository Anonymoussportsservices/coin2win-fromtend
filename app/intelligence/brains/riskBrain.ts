import { runRiskDecisionModel, type RiskDecisionInput } from "../decision-models/riskDecisionModel";

export function runRiskBrain(input: RiskDecisionInput) {
  return runRiskDecisionModel(input);
}
