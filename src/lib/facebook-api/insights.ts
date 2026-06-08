import { graphGet } from "./graphClient";
import type { InsightsResponse } from "./types";

export interface InsightsParams {
  fields?: string[];
  date_preset?: string;
  time_range?: { since: string; until: string };
  time_increment?: string | number;
  level?: string;
  breakdowns?: string[];
  action_attribution_windows?: string[];
  filtering?: any[];
  sort?: string[];
  limit?: number;
  after?: string;
  before?: string;
  locale?: string;
}

export async function getAccountInsights(
  actId: string,
  params: InsightsParams = {}
): Promise<InsightsResponse> {
  return graphGet<InsightsResponse>(`${actId}/insights`, params);
}

export async function getCampaignInsights(
  campaignId: string,
  params: InsightsParams = {}
): Promise<InsightsResponse> {
  return graphGet<InsightsResponse>(`${campaignId}/insights`, params);
}

export async function getAdSetInsights(
  adsetId: string,
  params: InsightsParams = {}
): Promise<InsightsResponse> {
  return graphGet<InsightsResponse>(`${adsetId}/insights`, params);
}

export async function getAdInsights(
  adId: string,
  params: InsightsParams = {}
): Promise<InsightsResponse> {
  return graphGet<InsightsResponse>(`${adId}/insights`, params);
}
