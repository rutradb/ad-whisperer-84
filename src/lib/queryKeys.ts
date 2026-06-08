export const STALE_TIMES = {
  /** 30s — for active dashboards and real-time metrics */
  REALTIME: 30_000,
  /** 2min — for listing pages (campaigns, ad groups, ads) */
  STANDARD: 2 * 60_000,
  /** 5min — for audiences, conversions, labels, rules */
  SLOW_CHANGING: 5 * 60_000,
  /** 30min — for targeting searches, geo constants, static data */
  STATIC: 30 * 60_000,
} as const;
