import { graphPost, graphDelete } from "./graphClient";

export interface CreateCampaignData {
  name: string;
  objective: string;
  special_ad_categories: string[];
  status?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_strategy?: string;
  buying_type?: string;
  start_time?: string;
  stop_time?: string;
  spend_cap?: number;
}

export interface UpdateCampaignData {
  name?: string;
  status?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_strategy?: string;
  spend_cap?: number;
  start_time?: string;
  stop_time?: string;
}

export async function createCampaign(
  actId: string,
  data: CreateCampaignData
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/campaigns`, {
    ...data,
    status: data.status || "PAUSED",
  });
}

export async function updateCampaign(
  campaignId: string,
  data: UpdateCampaignData
): Promise<{ success: boolean }> {
  return graphPost<{ success: boolean }>(campaignId, data);
}

export async function deleteObject(
  objectId: string
): Promise<{ success: boolean }> {
  return graphDelete<{ success: boolean }>(objectId);
}

// ─── Ad Sets ────────────────────────────────────────────

export interface CreateAdSetData {
  name: string;
  campaign_id: string;
  optimization_goal: string;
  billing_event: string;
  targeting: Record<string, any>;
  status?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_amount?: number;
  bid_strategy?: string;
  bid_constraints?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  promoted_object?: Record<string, any>;
  destination_type?: string;
  attribution_spec?: Array<{ event_type: string; window_days: number }>;
  frequency_control_specs?: Array<{
    event: string;
    interval_days: number;
    max_frequency: number;
  }>;
}

export interface UpdateAdSetData {
  name?: string;
  status?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: Record<string, any>;
  bid_amount?: number;
  bid_strategy?: string;
  bid_constraints?: Record<string, any>;
  optimization_goal?: string;
  start_time?: string;
  end_time?: string;
}

export async function createAdSet(
  actId: string,
  data: CreateAdSetData
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/adsets`, {
    ...data,
    status: data.status || "PAUSED",
  });
}

export async function updateAdSet(
  adsetId: string,
  data: UpdateAdSetData
): Promise<{ success: boolean }> {
  return graphPost<{ success: boolean }>(adsetId, data);
}

// ─── Ads ────────────────────────────────────────────────

export interface CreateAdData {
  name: string;
  adset_id: string;
  creative: { creative_id: string };
  status?: string;
  tracking_specs?: Record<string, any>;
  conversion_domain?: string;
}

export interface UpdateAdData {
  name?: string;
  status?: string;
  creative?: { creative_id: string };
  tracking_specs?: Record<string, any>;
}

export interface CreateAdCreativeData {
  name: string;
  object_story_spec?: Record<string, any>;
  image_url?: string;
  image_hash?: string;
  video_id?: string;
  link_url?: string;
  title?: string;
  body?: string;
  call_to_action_type?: string;
  url_tags?: string;
}

export async function createAd(
  actId: string,
  data: CreateAdData
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/ads`, {
    ...data,
    status: data.status || "PAUSED",
  });
}

export async function updateAd(
  adId: string,
  data: UpdateAdData
): Promise<{ success: boolean }> {
  return graphPost<{ success: boolean }>(adId, data);
}

export async function createAdCreative(
  actId: string,
  data: CreateAdCreativeData
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/adcreatives`, data);
}

// ─── Bulk Operations ────────────────────────────────────

export async function bulkUpdateStatus(
  ids: string[],
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
): Promise<Array<{ id: string; success: boolean }>> {
  const results = await Promise.allSettled(
    ids.map((id) => graphPost<{ success: boolean }>(id, { status }).then(() => ({ id, success: true })))
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { id: ids[i], success: false }
  );
}

// ─── Creative Update ────────────────────────────────────

export interface UpdateAdCreativeData {
  name?: string;
  title?: string;
  body?: string;
  image_url?: string;
  image_hash?: string;
  call_to_action_type?: string;
  link_url?: string;
  url_tags?: string;
}

export async function updateAdCreative(
  creativeId: string,
  data: UpdateAdCreativeData
): Promise<{ success: boolean }> {
  return graphPost<{ success: boolean }>(creativeId, data);
}
