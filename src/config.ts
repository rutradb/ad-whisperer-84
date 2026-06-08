export const CONFIG = {
  GOOGLE_ADS_API_VERSION: "v23",
  DEFAULT_DATE_RANGE: "LAST_30_DAYS" as const,
  DEFAULT_GAQL_METRICS: [
    "metrics.impressions",
    "metrics.clicks",
    "metrics.cost_micros",
    "metrics.ctr",
    "metrics.average_cpc",
    "metrics.conversions",
    "metrics.conversions_value",
    "metrics.cost_per_conversion",
    "metrics.conversions_from_interactions_rate",
  ],

  // Performance thresholds
  BLEEDER_CTR_THRESHOLD: 1.0,
  BLEEDER_MIN_SPEND: 10,
  WINNER_CTR_THRESHOLD: 1.5,

  // Scaling rules
  MAX_SCALE_PERCENT: 20,
  SCALE_WAIT_DAYS: 3,

  // Fatigue detection
  FATIGUE_CTR_DROP_PERCENT: 20,
  FATIGUE_CTR_DROP_DAYS: 3,
  FATIGUE_CPC_INCREASE_PERCENT: 15,
  FATIGUE_FREQUENCY_MAX: 3.5,

  // RSA (Responsive Search Ad) limits
  HEADLINE_MIN: 3,
  HEADLINE_MAX: 15,
  HEADLINE_CHAR_LIMIT: 30,
  DESCRIPTION_MIN: 2,
  DESCRIPTION_MAX: 4,
  DESCRIPTION_CHAR_LIMIT: 90,
  PATH_CHAR_LIMIT: 15,

  // Keyword limits
  KEYWORD_MAX_LENGTH: 80,
};

export const FEATURES = {
  AI_DIAGNOSTIC: true,
  AI_COPY_GENERATOR: true,
  AI_OPTIMIZER: true,
  AUDIENCE_MANAGEMENT: true,
  ASSET_UPLOAD: true,
  KEYWORDS: true,
  RECOMMENDATIONS: true,
};

export const DATE_RANGES = [
  { label: "Hoje", value: "TODAY" },
  { label: "Ontem", value: "YESTERDAY" },
  { label: "\u00daltimos 7 dias", value: "LAST_7_DAYS" },
  { label: "\u00daltimos 14 dias", value: "LAST_14_DAYS" },
  { label: "\u00daltimos 30 dias", value: "LAST_30_DAYS" },
  { label: "Este m\u00eas", value: "THIS_MONTH" },
  { label: "M\u00eas passado", value: "LAST_MONTH" },
  { label: "Este trimestre", value: "THIS_QUARTER" },
  { label: "Trimestre passado", value: "LAST_QUARTER" },
] as const;
