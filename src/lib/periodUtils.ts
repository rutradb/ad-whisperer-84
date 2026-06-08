import { format, subDays, startOfMonth, subMonths, endOfMonth } from "date-fns";

export type DatePreset = "last_7d" | "last_14d" | "last_30d" | "last_60d" | "last_90d" | "this_month" | "last_month" | "custom";

interface TimeRange {
  since: string;
  until: string;
}

const PRESET_DAYS: Record<string, number> = {
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_60d: 60,
  last_90d: 90,
};

export function getPresetDays(preset: DatePreset): number {
  if (PRESET_DAYS[preset]) return PRESET_DAYS[preset];
  if (preset === "this_month") {
    const today = new Date();
    return today.getDate();
  }
  if (preset === "last_month") {
    const lastMonth = subMonths(new Date(), 1);
    return endOfMonth(lastMonth).getDate();
  }
  return 30;
}

export function getPresetTimeRange(preset: DatePreset): TimeRange | null {
  const today = new Date();
  if (preset === "this_month") {
    return {
      since: format(startOfMonth(today), "yyyy-MM-dd"),
      until: format(today, "yyyy-MM-dd"),
    };
  }
  if (preset === "last_month") {
    const lastMonth = subMonths(today, 1);
    return {
      since: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
      until: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
    };
  }
  return null;
}

export function getPreviousPeriodRange(preset: DatePreset): TimeRange {
  const days = getPresetDays(preset);
  const today = new Date();
  const currentStart = subDays(today, days);
  const previousEnd = subDays(currentStart, 1);
  const previousStart = subDays(previousEnd, days - 1);

  return {
    since: format(previousStart, "yyyy-MM-dd"),
    until: format(previousEnd, "yyyy-MM-dd"),
  };
}

export function calculateDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function formatDelta(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function isDeltaPositive(metric: string, delta: number): boolean {
  const lowerIsBetter = ["cpc", "cpm", "cost_per_action_type", "frequency", "cpa"];
  if (lowerIsBetter.includes(metric)) return delta < 0;
  return delta > 0;
}
