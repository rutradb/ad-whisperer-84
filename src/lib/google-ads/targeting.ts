// =============================================
// Google Ads API — Targeting (Location, Language, Schedule, Demographics)
// =============================================

import { gaqlSearch, mutate, buildDateFilter } from "./googleAdsClient";
import type { MutateOperation, MutateResponse, GAQLResponse, DateRange } from "./types";

// --- Types ---

export interface LocationTargetingInput {
  geoTargetConstant: string; // e.g. "geoTargetConstants/2076"
  negative?: boolean;
  bidModifier?: number;
}

export interface AdScheduleInput {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startHour: number;
  endHour: number;
  startMinute?: "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";
  endMinute?: "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";
  bidModifier?: number;
}

export type DemographicDimension = "age" | "gender" | "income" | "parental_status";

export interface DemographicsParams {
  campaignId?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
}

// --- Queries ---

export async function getCampaignTargeting<T = unknown>(
  customerId: string,
  campaignId: string
): Promise<GAQLResponse<T>> {
  const query = `
    SELECT
      campaign_criterion.criterion_id,
      campaign_criterion.type,
      campaign_criterion.status,
      campaign_criterion.negative,
      campaign_criterion.bid_modifier,
      campaign_criterion.location.geo_target_constant,
      campaign_criterion.language.language_constant,
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type,
      campaign_criterion.device.type,
      campaign_criterion.ad_schedule.day_of_week,
      campaign_criterion.ad_schedule.start_hour,
      campaign_criterion.ad_schedule.end_hour,
      campaign_criterion.age_range.type,
      campaign_criterion.gender.type,
      campaign_criterion.income_range.type,
      campaign_criterion.parental_status.type,
      campaign_criterion.resource_name
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
    ORDER BY campaign_criterion.type ASC`;

  return gaqlSearch<T>(customerId, query);
}

// --- Location Targeting ---

export async function addLocationTargeting(
  customerId: string,
  campaignResourceName: string,
  locations: LocationTargetingInput[]
): Promise<MutateResponse> {
  const operations = locations.map((loc) => ({
    create: {
      campaign: campaignResourceName,
      location: { geoTargetConstant: loc.geoTargetConstant },
      negative: loc.negative || false,
      ...(loc.bidModifier != null ? { bidModifier: loc.bidModifier } : {}),
    },
  })) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, "campaignCriteria", operations);
}

// --- Language Targeting ---

export async function addLanguageTargeting(
  customerId: string,
  campaignResourceName: string,
  languageConstants: string[]
): Promise<MutateResponse> {
  const operations = languageConstants.map((lang) => ({
    create: {
      campaign: campaignResourceName,
      language: { languageConstant: lang },
    },
  })) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, "campaignCriteria", operations);
}

// --- Ad Schedule ---

export async function addAdSchedule(
  customerId: string,
  campaignResourceName: string,
  schedules: AdScheduleInput[]
): Promise<MutateResponse> {
  const operations = schedules.map((sched) => ({
    create: {
      campaign: campaignResourceName,
      adSchedule: {
        dayOfWeek: sched.dayOfWeek,
        startHour: sched.startHour,
        endHour: sched.endHour,
        startMinute: sched.startMinute || "ZERO",
        endMinute: sched.endMinute || "ZERO",
      },
      ...(sched.bidModifier != null ? { bidModifier: sched.bidModifier } : {}),
    },
  })) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, "campaignCriteria", operations);
}

// --- Remove Criterion ---

export async function removeCampaignCriterion(
  customerId: string,
  criterionResourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "campaignCriteria", [
    { remove: criterionResourceName },
  ]);
}

// --- Geo Target Constants Search ---

export async function searchGeoTargetConstants<T = unknown>(
  customerId: string,
  query: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const gaqlQuery = `
    SELECT
      geo_target_constant.id,
      geo_target_constant.name,
      geo_target_constant.country_code,
      geo_target_constant.target_type,
      geo_target_constant.canonical_name,
      geo_target_constant.status,
      geo_target_constant.resource_name
    FROM geo_target_constant
    WHERE geo_target_constant.canonical_name CONTAINS '${query}'
      AND geo_target_constant.status = 'ENABLED'
    LIMIT ${limit || 20}`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}

// --- Demographics Performance ---

const DEMOGRAPHIC_VIEW_MAP: Record<DemographicDimension, string> = {
  age: "age_range_view",
  gender: "gender_view",
  income: "income_range_view",
  parental_status: "parental_status_view",
};

export async function getDemographicsPerformance<T = unknown>(
  customerId: string,
  demographic: DemographicDimension,
  params?: DemographicsParams
): Promise<GAQLResponse<T>> {
  const view = DEMOGRAPHIC_VIEW_MAP[demographic];
  const conditions: string[] = [
    buildDateFilter(params?.dateRange, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_from_interactions_rate,
      metrics.cost_per_conversion
    FROM ${view}
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC`;

  return gaqlSearch<T>(customerId, query);
}

// --- Topic Constants Search ---

export async function searchTopicConstants<T = unknown>(
  customerId: string,
  query: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const gaqlQuery = `
    SELECT
      topic_constant.id,
      topic_constant.topic_constant_parent,
      topic_constant.path,
      topic_constant.resource_name
    FROM topic_constant
    WHERE topic_constant.path CONTAINS '${query}'
    LIMIT ${limit || 20}`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}

// --- Placement / Channel Search (Display) ---

export async function searchGroupPlacementView<T = unknown>(
  customerId: string,
  dateRange?: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const gaqlQuery = `
    SELECT
      group_placement_view.display_name,
      group_placement_view.placement,
      group_placement_view.placement_type,
      group_placement_view.target_url,
      group_placement_view.resource_name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM group_placement_view
    WHERE ${dateFilter}
    ORDER BY metrics.impressions DESC
    LIMIT ${limit || 20}`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}

// --- Keyword Ideas (volume, competicao, CPC) ---

export async function generateKeywordIdeas(
  customerId: string,
  keywords: string[],
  options?: { language?: string; geoTargets?: string[]; pageSize?: number }
): Promise<any> {
  const proxyUrl = localStorage.getItem("cloud_run_url");
  if (!proxyUrl) throw new Error("Cloud Run URL nao configurada.");

  const token = localStorage.getItem("gads_access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const lcid = localStorage.getItem("gads_login_customer_id");
  if (lcid) headers["x-login-customer-id"] = lcid.replace(/-/g, "");

  const res = await fetch(`${proxyUrl}/api/keyword-ideas`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: customerId.replace(/-/g, ""),
      keywords,
      language: options?.language || "languageConstants/1014",
      geoTargets: options?.geoTargets || ["geoTargetConstants/2076"],
      pageSize: options?.pageSize || 30,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Keyword ideas failed (${res.status})`);
  }

  return res.json();
}

// --- List All User Interests (Affinity, In-Market, etc.) ---

export async function listUserInterests<T = unknown>(
  customerId: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const gaqlQuery = `
    SELECT
      user_interest.taxonomy_type,
      user_interest.name,
      user_interest.user_interest_id,
      user_interest.resource_name
    FROM user_interest
    LIMIT ${limit || 1000}`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}

// --- List All Language Constants ---

export async function listLanguageConstants<T = unknown>(
  customerId: string
): Promise<GAQLResponse<T>> {
  const gaqlQuery = `
    SELECT
      language_constant.id,
      language_constant.name,
      language_constant.code,
      language_constant.targetable,
      language_constant.resource_name
    FROM language_constant
    WHERE language_constant.targetable = TRUE
    LIMIT 100`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}

// --- List All Topic Constants ---

export async function listTopicConstants<T = unknown>(
  customerId: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const gaqlQuery = `
    SELECT
      topic_constant.id,
      topic_constant.topic_constant_parent,
      topic_constant.path,
      topic_constant.resource_name
    FROM topic_constant
    LIMIT ${limit || 500}`;

  return gaqlSearch<T>(customerId, gaqlQuery);
}
