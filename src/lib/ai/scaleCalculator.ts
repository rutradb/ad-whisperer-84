import { CONFIG } from "@/config";

export interface ScaleStep {
  day: number;
  budget: number;
  increase: string;
  cumulative: string;
}

export interface ScaleResult {
  steps: ScaleStep[];
  totalDays: number;
  originalBudget: number;
  targetBudget: number;
}

export function calculateSafeScale(
  currentBudget: number,
  targetBudget: number,
  maxIncreasePercent = CONFIG.MAX_SCALE_PERCENT,
  waitDays = CONFIG.SCALE_WAIT_DAYS
): ScaleResult {
  if (targetBudget <= currentBudget || currentBudget <= 0) {
    return { steps: [], totalDays: 0, originalBudget: currentBudget, targetBudget };
  }

  const steps: ScaleStep[] = [];
  let budget = currentBudget;
  let day = 0;

  steps.push({ day: 0, budget: currentBudget, increase: "Atual", cumulative: "0%" });

  while (budget < targetBudget) {
    const maxIncrease = budget * (maxIncreasePercent / 100);
    const remaining = targetBudget - budget;
    const increase = Math.min(maxIncrease, remaining);
    budget = Math.round(budget + increase);
    day += waitDays;
    const pctIncrease = Math.round((increase / (budget - increase)) * 100);
    const pctCumulative = Math.round(((budget - currentBudget) / currentBudget) * 100);
    steps.push({ day, budget, increase: `+${pctIncrease}%`, cumulative: `+${pctCumulative}%` });
  }

  return { steps, totalDays: day, originalBudget: currentBudget, targetBudget };
}

export function estimateScaleDays(
  currentBudget: number,
  targetBudget: number
): number {
  const result = calculateSafeScale(currentBudget, targetBudget);
  return result.totalDays;
}
