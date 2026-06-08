// =============================================
// Google Ads API — Mutations (Create / Update / Remove)
// =============================================

import { mutate, buildFieldMask } from "./googleAdsClient";
import type { MutateOperation, MutateResponse, CampaignStatus, AdvertisingChannelType, BiddingStrategyType, AdGroupAdStatus, AdGroupType } from "./types";

// --- Campaign Budgets ---

export interface CreateCampaignBudgetData {
  name: string;
  amountMicros: number;
  deliveryMethod?: "STANDARD" | "ACCELERATED";
  explicitlyShared?: boolean;
}

export async function createCampaignBudget(
  customerId: string,
  data: CreateCampaignBudgetData
): Promise<MutateResponse> {
  return mutate(customerId, "campaignBudgets", [
    {
      create: {
        name: data.name,
        amountMicros: data.amountMicros,
        deliveryMethod: data.deliveryMethod || "STANDARD",
        period: "DAILY",
        explicitlyShared: data.explicitlyShared ?? false,
      },
    },
  ]);
}

export async function updateBudgetAmount(
  customerId: string,
  resourceName: string,
  amountMicros: number
): Promise<MutateResponse> {
  return mutate(customerId, "campaignBudgets", [
    {
      update: {
        resourceName,
        amountMicros: String(amountMicros),
      },
      updateMask: "amount_micros",
    } as MutateOperation<Record<string, unknown>>,
  ]);
}

// --- Campaigns ---

export interface CreateCampaignData {
  name: string;
  advertisingChannelType: AdvertisingChannelType;
  campaignBudget: string;
  status?: CampaignStatus;
  biddingStrategyType?: BiddingStrategyType;
  targetCpa?: { targetCpaMicros?: number };
  targetRoas?: { targetRoas?: number };
  startDate?: string;
  endDate?: string;
  networkSettings?: {
    targetGoogleSearch?: boolean;
    targetSearchNetwork?: boolean;
    targetContentNetwork?: boolean;
    targetPartnerSearchNetwork?: boolean;
  };
}

export async function createCampaign(
  customerId: string,
  data: CreateCampaignData
): Promise<MutateResponse> {
  const campaign: Record<string, unknown> = {
    name: data.name,
    advertisingChannelType: data.advertisingChannelType,
    status: data.status || "PAUSED",
    campaignBudget: data.campaignBudget,
  };

  if (data.biddingStrategyType) campaign.biddingStrategyType = data.biddingStrategyType;
  if (data.targetCpa) campaign.targetCpa = data.targetCpa;
  if (data.targetRoas) campaign.targetRoas = data.targetRoas;
  if (data.startDate) campaign.startDate = data.startDate;
  if (data.endDate) campaign.endDate = data.endDate;
  if (data.networkSettings) campaign.networkSettings = data.networkSettings;

  return mutate(customerId, "campaigns", [{ create: campaign }]);
}

export async function updateCampaign(
  customerId: string,
  resourceName: string,
  data: Record<string, unknown>
): Promise<MutateResponse> {
  const updateMask = buildFieldMask(data).join(",");
  return mutate(customerId, "campaigns", [
    {
      update: { resourceName, ...data },
      updateMask,
    } as MutateOperation<Record<string, unknown>>,
  ]);
}

// --- Ad Groups ---

export interface CreateAdGroupData {
  name: string;
  campaign: string; // resource name
  status?: AdGroupAdStatus;
  type?: AdGroupType;
  cpcBidMicros?: number;
  targetCpaMicros?: number;
}

export async function createAdGroup(
  customerId: string,
  data: CreateAdGroupData
): Promise<MutateResponse> {
  const adGroup: Record<string, unknown> = {
    name: data.name,
    campaign: data.campaign,
    status: data.status || "PAUSED",
    type: data.type || "SEARCH_STANDARD",
  };

  if (data.cpcBidMicros) adGroup.cpcBidMicros = data.cpcBidMicros;
  if (data.targetCpaMicros) adGroup.targetCpaMicros = data.targetCpaMicros;

  return mutate(customerId, "adGroups", [{ create: adGroup }]);
}

export async function updateAdGroup(
  customerId: string,
  resourceName: string,
  data: Record<string, unknown>
): Promise<MutateResponse> {
  const updateMask = buildFieldMask(data).join(",");
  return mutate(customerId, "adGroups", [
    {
      update: { resourceName, ...data },
      updateMask,
    } as MutateOperation<Record<string, unknown>>,
  ]);
}

// --- Ads ---

export interface AdTextAsset {
  text: string;
  pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | "DESCRIPTION_1" | "DESCRIPTION_2";
}

export interface CreateResponsiveSearchAdData {
  adGroup: string; // resource name
  finalUrls: string[];
  headlines: AdTextAsset[];
  descriptions: AdTextAsset[];
  path1?: string;
  path2?: string;
  status?: AdGroupAdStatus;
}

export async function createResponsiveSearchAd(
  customerId: string,
  data: CreateResponsiveSearchAdData
): Promise<MutateResponse> {
  const adGroupAd: Record<string, unknown> = {
    adGroup: data.adGroup,
    status: data.status || "ENABLED",
    ad: {
      finalUrls: data.finalUrls,
      responsiveSearchAd: {
        headlines: data.headlines.map((h) => ({
          text: h.text,
          ...(h.pinnedField ? { pinnedField: h.pinnedField } : {}),
        })),
        descriptions: data.descriptions.map((d) => ({
          text: d.text,
          ...(d.pinnedField ? { pinnedField: d.pinnedField } : {}),
        })),
        ...(data.path1 ? { path1: data.path1 } : {}),
        ...(data.path2 ? { path2: data.path2 } : {}),
      },
    },
  };

  return mutate(customerId, "adGroupAds", [{ create: adGroupAd }]);
}

export async function updateAdStatus(
  customerId: string,
  resourceName: string,
  status: AdGroupAdStatus
): Promise<MutateResponse> {
  return mutate(customerId, "adGroupAds", [
    {
      update: { resourceName, status },
      updateMask: "status",
    } as MutateOperation<Record<string, unknown>>,
  ]);
}

// --- Generic Resource Operations ---

export async function removeResource(
  customerId: string,
  resource: string,
  resourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, resource, [{ remove: resourceName }]);
}

export async function bulkUpdateStatus(
  customerId: string,
  resource: string,
  resourceNames: string[],
  status: string
): Promise<MutateResponse> {
  const operations = resourceNames.map((rn) => ({
    update: { resourceName: rn, status },
    updateMask: "status",
  })) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, resource, operations);
}
