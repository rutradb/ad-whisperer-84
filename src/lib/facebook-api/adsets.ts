import { graphGet } from "./graphClient";
import type { Paging } from "./types";

export interface AdSet {
  id: string;
  name: string;
  campaign_id?: string;
  effective_status: string;
  optimization_goal?: string;
  billing_event?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
  bid_amount?: string;
  targeting?: any;
  start_time?: string;
  end_time?: string;
  created_time?: string;
}

export interface AdSetsResponse {
  data: AdSet[];
  paging?: Paging;
}

export interface AdSetQueryParams {
  fields?: string[];
  effective_status?: string[];
  limit?: number;
  after?: string;
  before?: string;
}

export async function getAdSetsByAccount(
  actId: string,
  params: AdSetQueryParams = {}
): Promise<AdSetsResponse> {
  return graphGet<AdSetsResponse>(`${actId}/adsets`, params);
}

export async function getAdSetsByCampaign(
  campaignId: string,
  params: AdSetQueryParams = {}
): Promise<AdSetsResponse> {
  return graphGet<AdSetsResponse>(`${campaignId}/adsets`, params);
}

export async function getAdSetById(
  adsetId: string,
  params: { fields?: string[] } = {}
): Promise<AdSet> {
  return graphGet<AdSet>(adsetId, params);
}
