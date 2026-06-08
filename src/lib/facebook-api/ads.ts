import { graphGet } from "./graphClient";
import type { Paging } from "./types";

export interface Ad {
  id: string;
  name: string;
  adset_id?: string;
  campaign_id?: string;
  effective_status: string;
  creative?: { id: string };
  created_time?: string;
  updated_time?: string;
  ad_review_feedback?: Record<string, { status: string; reason?: string }>;
}

export interface AdsResponse {
  data: Ad[];
  paging?: Paging;
}

export interface AdQueryParams {
  fields?: string[];
  effective_status?: string[];
  limit?: number;
  after?: string;
  before?: string;
}

export async function getAdsByAccount(
  actId: string,
  params: AdQueryParams = {}
): Promise<AdsResponse> {
  return graphGet<AdsResponse>(`${actId}/ads`, params);
}

export async function getAdsByAdSet(
  adsetId: string,
  params: AdQueryParams = {}
): Promise<AdsResponse> {
  return graphGet<AdsResponse>(`${adsetId}/ads`, params);
}

export async function getAdsByCampaign(
  campaignId: string,
  params: AdQueryParams = {}
): Promise<AdsResponse> {
  return graphGet<AdsResponse>(`${campaignId}/ads`, params);
}

export async function getAdById(
  adId: string,
  params: { fields?: string[] } = {}
): Promise<Ad> {
  return graphGet<Ad>(adId, params);
}

export interface AdPreviewResponse {
  data: Array<{ body: string }>;
}

export type AdFormat =
  | "DESKTOP_FEED_STANDARD"
  | "MOBILE_FEED_STANDARD"
  | "INSTAGRAM_STANDARD"
  | "INSTAGRAM_STORY"
  | "INSTAGRAM_REELS"
  | "RIGHT_COLUMN_STANDARD";

export async function getAdPreview(
  adId: string,
  adFormat: AdFormat
): Promise<AdPreviewResponse> {
  return graphGet<AdPreviewResponse>(`${adId}/previews`, { ad_format: adFormat });
}
