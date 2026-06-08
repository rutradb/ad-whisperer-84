import { graphGet } from "./graphClient";
import type { CampaignsResponse, Campaign } from "./types";

export interface CampaignQueryParams {
  fields?: string[];
  effective_status?: string[];
  limit?: number;
  after?: string;
  before?: string;
}

export async function getCampaignsByAccount(
  actId: string,
  params: CampaignQueryParams = {}
): Promise<CampaignsResponse> {
  return graphGet<CampaignsResponse>(`${actId}/campaigns`, params);
}

export async function getCampaignById(
  campaignId: string,
  params: { fields?: string[] } = {}
): Promise<Campaign> {
  return graphGet<Campaign>(campaignId, params);
}
