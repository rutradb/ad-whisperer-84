// =============================================
// Google Ads API — Assets (Extensions)
// =============================================

import { gaqlSearch, mutate, buildDateFilter } from "./googleAdsClient";
import type { MutateOperation, MutateResponse, GAQLResponse, AssetType, DateRange } from "./types";

// --- Types ---

export interface ListAssetsParams {
  type?: AssetType;
  limit?: number;
}

export interface CreateSitelinkAssetData {
  linkText: string;
  finalUrls: string[];
  description1?: string;
  description2?: string;
}

export interface AssetPerformanceParams {
  campaignId?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// --- Queries ---

export async function listAssets<T = unknown>(
  customerId: string,
  params?: ListAssetsParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [];
  if (params?.type) {
    conditions.push(`asset.type = '${params.type}'`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      asset.id,
      asset.name,
      asset.type,
      asset.resource_name,
      asset.text_asset.text,
      asset.image_asset.full_size.url,
      asset.image_asset.full_size.width_pixels,
      asset.image_asset.full_size.height_pixels,
      asset.image_asset.file_size,
      asset.youtube_video_asset.youtube_video_id,
      asset.youtube_video_asset.youtube_video_title,
      asset.sitelink_asset.link_text,
      asset.sitelink_asset.description1,
      asset.sitelink_asset.description2,
      asset.callout_asset.callout_text,
      asset.final_urls
    FROM asset
    ${where}
    ORDER BY asset.type ASC
    LIMIT ${params?.limit || 500}`;

  return gaqlSearch<T>(customerId, query);
}

export async function getCampaignAssets<T = unknown>(
  customerId: string,
  campaignId: string
): Promise<GAQLResponse<T>> {
  const query = `
    SELECT
      campaign_asset.resource_name,
      campaign_asset.field_type,
      campaign_asset.status,
      campaign_asset.asset,
      campaign_asset.campaign,
      asset.id,
      asset.name,
      asset.type,
      asset.resource_name
    FROM campaign_asset
    WHERE campaign.id = ${campaignId}
    ORDER BY campaign_asset.field_type ASC`;

  return gaqlSearch<T>(customerId, query);
}

export async function getAssetPerformance<T = unknown>(
  customerId: string,
  params?: AssetPerformanceParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    buildDateFilter(params?.dateRange, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }

  const query = `
    SELECT
      asset.id,
      asset.name,
      asset.type,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_ad_asset_view
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC
    LIMIT ${params?.limit || 100}`;

  return gaqlSearch<T>(customerId, query);
}

// --- Mutations ---

export async function createTextAsset(
  customerId: string,
  text: string,
  name?: string
): Promise<MutateResponse> {
  const asset: Record<string, unknown> = {
    textAsset: { text },
  };
  if (name) asset.name = name;

  return mutate(customerId, "assets", [{ create: asset }]);
}

export async function createSitelinkAsset(
  customerId: string,
  data: CreateSitelinkAssetData
): Promise<MutateResponse> {
  const asset: Record<string, unknown> = {
    sitelinkAsset: {
      linkText: data.linkText,
      ...(data.description1 ? { description1: data.description1 } : {}),
      ...(data.description2 ? { description2: data.description2 } : {}),
    },
    finalUrls: data.finalUrls,
  };

  return mutate(customerId, "assets", [{ create: asset }]);
}

export async function createCalloutAsset(
  customerId: string,
  calloutText: string
): Promise<MutateResponse> {
  return mutate(customerId, "assets", [
    { create: { calloutAsset: { calloutText } } },
  ]);
}

export async function linkAssetToCampaign(
  customerId: string,
  campaignResourceName: string,
  assetResourceName: string,
  fieldType: string
): Promise<MutateResponse> {
  return mutate(customerId, "campaignAssets", [
    {
      create: {
        campaign: campaignResourceName,
        asset: assetResourceName,
        fieldType,
      },
    },
  ]);
}

export async function linkAssetToAdGroup(
  customerId: string,
  adGroupResourceName: string,
  assetResourceName: string,
  fieldType: string
): Promise<MutateResponse> {
  return mutate(customerId, "adGroupAssets", [
    {
      create: {
        adGroup: adGroupResourceName,
        asset: assetResourceName,
        fieldType,
      },
    },
  ]);
}

export async function removeAsset(
  customerId: string,
  assetResourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "assets", [{ remove: assetResourceName }]);
}
