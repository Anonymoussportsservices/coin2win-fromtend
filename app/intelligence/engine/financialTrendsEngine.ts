export type FinancialSummary = {
  deposit_amount?: number;
  deposit_count?: number;
  withdrawal_amount?: number;
  withdrawal_count?: number;
  net_flow?: number;
};

export type TrendDirection =
  | "increasing"
  | "decreasing"
  | "stable"
  | "no-data";

export type FinancialTrendItem = {
  label: string;
  direction: TrendDirection;
  changePercent: number | null;
  current: number;
  previous: number;
};

export type FinancialTrendsResult = {
  deposits: FinancialTrendItem;
  withdrawals: FinancialTrendItem;
  netFlow: FinancialTrendItem;
  averageDeposit: FinancialTrendItem;
  averageWithdrawal: FinancialTrendItem;
  health: "healthy" | "watch" | "critical" | "no-data";
  summary: string;
};

function number(value: unknown) {
  return Number(value || 0);
}

function calculateTrend(
  label: string,
  currentValue: number,
  previousValue: number
): FinancialTrendItem {
  if (currentValue === 0 && previousValue === 0) {
    return {
      label,
      direction: "no-data",
      changePercent: null,
      current: currentValue,
      previous: previousValue,
    };
  }

  if (previousValue === 0) {
    return {
      label,
      direction: currentValue > 0 ? "increasing" : "stable",
      changePercent: null,
      current: currentValue,
      previous: previousValue,
    };
  }

  const changePercent =
    ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

  let direction: TrendDirection = "stable";

  if (changePercent > 10) direction = "increasing";
  if (changePercent < -10) direction = "decreasing";

  return {
    label,
    direction,
    changePercent: Math.round(changePercent * 10) / 10,
    current: currentValue,
    previous: previousValue,
  };
}

export function runFinancialTrendsEngine(
  current: FinancialSummary = {},
  previous: FinancialSummary = {}
): FinancialTrendsResult {
  const currentDeposits = number(current.deposit_amount);
  const previousDeposits = number(previous.deposit_amount);

  const currentWithdrawals = number(current.withdrawal_amount);
  const previousWithdrawals = number(previous.withdrawal_amount);

  const currentNetFlow = number(current.net_flow);
  const previousNetFlow = number(previous.net_flow);

  const currentDepositCount = number(current.deposit_count);
  const previousDepositCount = number(previous.deposit_count);

  const currentWithdrawalCount = number(current.withdrawal_count);
  const previousWithdrawalCount = number(previous.withdrawal_count);

  const currentAverageDeposit =
    currentDepositCount > 0 ? currentDeposits / currentDepositCount : 0;

  const previousAverageDeposit =
    previousDepositCount > 0 ? previousDeposits / previousDepositCount : 0;

  const currentAverageWithdrawal =
    currentWithdrawalCount > 0
      ? currentWithdrawals / currentWithdrawalCount
      : 0;

  const previousAverageWithdrawal =
    previousWithdrawalCount > 0
      ? previousWithdrawals / previousWithdrawalCount
      : 0;

  const deposits = calculateTrend(
    "Deposits",
    currentDeposits,
    previousDeposits
  );

  const withdrawals = calculateTrend(
    "Withdrawals",
    currentWithdrawals,
    previousWithdrawals
  );

  const netFlow = calculateTrend(
    "Net Flow",
    currentNetFlow,
    previousNetFlow
  );

  const averageDeposit = calculateTrend(
    "Average Deposit",
    currentAverageDeposit,
    previousAverageDeposit
  );

  const averageWithdrawal = calculateTrend(
    "Average Withdrawal",
    currentAverageWithdrawal,
    previousAverageWithdrawal
  );

  const hasData =
    currentDeposits !== 0 ||
    previousDeposits !== 0 ||
    currentWithdrawals !== 0 ||
    previousWithdrawals !== 0;

  if (!hasData) {
    return {
      deposits,
      withdrawals,
      netFlow,
      averageDeposit,
      averageWithdrawal,
      health: "no-data",
      summary: "No financial activity is available for comparison.",
    };
  }

  let health: FinancialTrendsResult["health"] = "healthy";

  if (
    deposits.direction === "decreasing" &&
    withdrawals.direction === "increasing"
  ) {
    health = "critical";
  } else if (
    deposits.direction === "decreasing" ||
    withdrawals.direction === "increasing" ||
    netFlow.direction === "decreasing"
  ) {
    health = "watch";
  }

  const summary =
    health === "healthy"
      ? "Financial movement is stable or improving."
      : health === "watch"
        ? "Financial movement requires monitoring."
        : "Deposit and withdrawal trends require immediate review.";

  return {
    deposits,
    withdrawals,
    netFlow,
    averageDeposit,
    averageWithdrawal,
    health,
    summary,
  };
}
