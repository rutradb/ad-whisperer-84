import { gaqlSearch, buildDateFilter } from "./googleAdsClient";
import type { GAQLResponse, DateRange } from "./types";

// =============================================
// Google Ads API — Reporting Module
// =============================================

const CORE_METRICS = `
  metrics.impressions,
  metrics.clicks,
  metrics.ctr,
  metrics.average_cpc,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.cost_per_conversion,
  metrics.conversions_from_interactions_rate,
  metrics.all_conversions`;

const EXTENDED_METRICS = `${CORE_METRICS},
  metrics.search_impression_share,
  metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share`;

// --- Account-level ---

/**
 * Get overall customer-level metrics for a date range.
 */
export async function getCustomerMetrics(
  customerId: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");

  const query = `
    SELECT ${CORE_METRICS}
    FROM customer
    WHERE ${dateFilter}`;

  return gaqlSearch(customerId, query);
}

// --- Campaign-level ---

/**
 * Get campaign-level metrics. Optionally filter by campaignId and segment by date.
 */
export async function getCampaignMetrics(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string,
  segmentByDate?: boolean
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const segments = segmentByDate ? ", segments.date" : "";
  const orderBy = segmentByDate
    ? "ORDER BY segments.date ASC"
    : "ORDER BY metrics.cost_micros DESC";

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      ${CORE_METRICS}
      ${segments}
    FROM campaign
    WHERE ${conditions.join(" AND ")}
    ${orderBy}
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}

// --- Ad Group-level ---

/**
 * Get ad group-level metrics. Optionally filter by adGroupId and/or campaignId.
 */
export async function getAdGroupMetrics(
  customerId: string,
  adGroupId?: string,
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (adGroupId) {
    conditions.push(`ad_group.id = ${adGroupId}`);
  }
  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      campaign.id,
      campaign.name,
      ${CORE_METRICS}
    FROM ad_group
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}

// --- Ad-level ---

/**
 * Get ad-level metrics. Optionally filter by adId and/or adGroupId.
 */
export async function getAdMetrics(
  customerId: string,
  adId?: string,
  adGroupId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (adId) {
    conditions.push(`ad_group_ad.ad.id = ${adId}`);
  }
  if (adGroupId) {
    conditions.push(`ad_group.id = ${adGroupId}`);
  }

  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.status,
      ad_group_ad.ad_strength,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      ${CORE_METRICS}
    FROM ad_group_ad
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}

// --- Segmentation Reports ---

/**
 * Get performance metrics broken down by device type.
 */
export async function getPerformanceByDevice(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      segments.device,
      campaign.name,
      ${CORE_METRICS}
    FROM campaign
    WHERE ${conditions.join(" AND ")}
    ORDER BY segments.device ASC`;

  return gaqlSearch(customerId, query);
}

/**
 * Get performance metrics broken down by ad network type.
 */
export async function getPerformanceByNetwork(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      segments.ad_network_type,
      ${CORE_METRICS}
    FROM campaign
    WHERE ${conditions.join(" AND ")}
    ORDER BY segments.ad_network_type ASC`;

  return gaqlSearch(customerId, query);
}

/**
 * Get performance metrics broken down by hour of day.
 */
export async function getPerformanceByHour(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      segments.hour,
      ${CORE_METRICS}
    FROM campaign
    WHERE ${conditions.join(" AND ")}
    ORDER BY segments.hour ASC`;

  return gaqlSearch(customerId, query);
}

/**
 * Get performance metrics broken down by day of week.
 */
export async function getPerformanceByDayOfWeek(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      segments.day_of_week,
      ${CORE_METRICS}
    FROM campaign
    WHERE ${conditions.join(" AND ")}
    ORDER BY segments.day_of_week ASC`;

  return gaqlSearch(customerId, query);
}

/**
 * Get performance metrics broken down by geographic location.
 */
export async function getGeographicPerformance(
  customerId: string,
  campaignId?: string,
  dateRange?: DateRange | string,
  limit?: number
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      geographic_view.country_criterion_id,
      geographic_view.location_type,
      campaign.id,
      campaign.name,
      ${CORE_METRICS}
    FROM geographic_view
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC
    LIMIT ${limit || 50}`;

  return gaqlSearch(customerId, query);
}

/**
 * Get performance metrics broken down by demographics (age range or gender).
 */
export async function getDemographicsPerformance(
  customerId: string,
  demographic: "age" | "gender",
  campaignId?: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const isAge = demographic === "age";
  const resource = isAge ? "age_range_view" : "gender_view";
  const segmentField = isAge
    ? "ad_group_criterion.age_range.type"
    : "ad_group_criterion.gender.type";

  const query = `
    SELECT
      ${segmentField},
      campaign.id,
      campaign.name,
      ${CORE_METRICS}
    FROM ${resource}
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC`;

  return gaqlSearch(customerId, query);
}

/**
 * Generic function to get performance by a given segment (device, adNetworkType, dayOfWeek, hour).
 */
export async function getPerformanceBySegment(
  entityId: string,
  entityType: string,
  segment: string,
  dateRange?: string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_7_DAYS");
  const resource = entityType === "campaign" ? "campaign" : entityType === "adGroup" ? "ad_group" : "campaign";
  const idField = entityType === "campaign" ? "campaign.id" : entityType === "adGroup" ? "ad_group.id" : "campaign.id";

  const query = `
    SELECT
      segments.${segment},
      ${CORE_METRICS}
    FROM ${resource}
    WHERE ${dateFilter} AND ${idField} = ${entityId}
    ORDER BY segments.${segment} ASC`;

  return gaqlSearch(entityId, query);
}

/**
 * Get account-level performance by a given segment.
 */
export async function getAccountPerformanceBySegment(
  customerId: string,
  segment: string,
  dateParams?: Record<string, any>
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateParams?.dateRange || "LAST_30_DAYS", dateParams?.startDate, dateParams?.endDate);

  const query = `
    SELECT
      segments.${segment},
      ${CORE_METRICS}
    FROM customer
    WHERE ${dateFilter}
    ORDER BY segments.${segment} ASC`;

  return gaqlSearch(customerId, query);
}
