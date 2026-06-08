export interface ActionType {
  action_type: string;
  value: string;
}

export interface InsightsRow {
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  reach: string;
  frequency: string;
  actions?: ActionType[];
  cost_per_action_type?: ActionType[];
  date_start: string;
  date_stop: string;
  campaign_name?: string;
  campaign_id?: string;
}

export interface ExtendedInsightsRow extends InsightsRow {
  purchase_roas?: ActionType[];
  action_values?: ActionType[];
  website_purchase_roas?: ActionType[];
  conversions?: ActionType[];
  conversion_values?: ActionType[];
  cost_per_conversion?: ActionType[];
  adset_name?: string;
  adset_id?: string;
  ad_name?: string;
  ad_id?: string;
  // Breakdown fields
  age?: string;
  gender?: string;
  device_platform?: string;
  publisher_platform?: string;
  platform_position?: string;
  country?: string;
  region?: string;
  impression_device?: string;
  [key: string]: any;
}

export interface PagingCursors {
  before: string;
  after: string;
}

export interface Paging {
  cursors: PagingCursors;
  next?: string;
  previous?: string;
}

export interface InsightsResponse {
  data: InsightsRow[];
  paging?: Paging;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  start_time?: string;
  updated_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
  bid_strategy?: string;
  spend_cap?: string;
  buying_type?: string;
}

export interface CampaignsResponse {
  data: Campaign[];
  paging?: Paging;
}

export type AdAccount = any;

// --- Utility Functions for Insights ---

export function parseNumeric(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

export function extractActionValue(actions: ActionType[] | undefined, actionType: string): number {
  if (!actions) return 0;
  const found = actions.find(a => a.action_type === actionType);
  return found ? parseFloat(found.value) || 0 : 0;
}

export function computeRoas(row: ExtendedInsightsRow): number {
  if (row.purchase_roas?.length) {
    const roas = row.purchase_roas.find(r => r.action_type === "omni_purchase");
    if (roas) return parseFloat(roas.value) || 0;
  }
  const revenue = extractActionValue(row.action_values, "omni_purchase");
  const spend = parseNumeric(row.spend);
  if (spend === 0) return 0;
  return revenue / spend;
}

export function computeConversions(row: ExtendedInsightsRow): number {
  return (
    extractActionValue(row.actions, "omni_purchase") +
    extractActionValue(row.actions, "offsite_conversion.fb_pixel_purchase") +
    extractActionValue(row.actions, "lead") +
    extractActionValue(row.actions, "omni_complete_registration")
  );
}

export function computeRevenue(row: ExtendedInsightsRow): number {
  return extractActionValue(row.action_values, "omni_purchase");
}

export function computeCpa(row: ExtendedInsightsRow): number {
  const conversions = computeConversions(row);
  const spend = parseNumeric(row.spend);
  if (conversions === 0) return 0;
  return spend / conversions;
}
