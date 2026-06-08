import { gaqlSearch, buildDateFilter } from "./googleAdsClient";
import type {
  GAQLResponse,
  AdGroupAdStatus,
  DateRange,
} from "./types";

// =============================================
// Google Ads API — Ads Module
// =============================================

const AD_BASE_FIELDS = `
  ad_group_ad.ad.id,
  ad_group_ad.ad.name,
  ad_group_ad.ad.type,
  ad_group_ad.ad.final_urls,
  ad_group_ad.ad.responsive_search_ad.headlines,
  ad_group_ad.ad.responsive_search_ad.descriptions,
  ad_group_ad.ad.responsive_search_ad.path1,
  ad_group_ad.ad.responsive_search_ad.path2,
  ad_group_ad.status,
  ad_group_ad.ad_group,
  ad_group_ad.ad.resource_name,
  ad_group_ad.policy_summary.approval_status,
  ad_group_ad.policy_summary.review_status,
  ad_group_ad.resource_name`;

const AD_METRICS_FIELDS = `
  ad_group_ad.ad.ad_strength,
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

interface AdListParams {
  campaignId?: string;
  adGroupId?: string;
  status?: AdGroupAdStatus;
  limit?: number;
}

/**
 * List ads for a customer account with optional campaign, ad group, and status filters.
 */
export async function getAdsByCustomer(
  customerId: string,
  params?: AdListParams
): Promise<GAQLResponse> {
  const conditions: string[] = [];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }
  if (params?.adGroupId) {
    conditions.push(`ad_group.id = ${params.adGroupId}`);
  }
  if (params?.status && params.status !== "UNKNOWN") {
    conditions.push(`ad_group_ad.status = '${params.status}'`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const limit = params?.limit || 100;

  const query = `
    SELECT ${AD_BASE_FIELDS}
    FROM ad_group_ad
    ${where}
    ORDER BY ad_group_ad.ad.id DESC
    LIMIT ${limit}`;

  return gaqlSearch(customerId, query);
}

/**
 * List all ads belonging to a specific ad group.
 */
export async function getAdsByAdGroup(
  customerId: string,
  adGroupId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${AD_BASE_FIELDS}
    FROM ad_group_ad
    WHERE ad_group.id = ${adGroupId}
    ORDER BY ad_group_ad.ad.id DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}

/**
 * Get a single ad by its ID within an ad group.
 */
export async function getAdById(
  customerId: string,
  adGroupId: string,
  adId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${AD_BASE_FIELDS}
    FROM ad_group_ad
    WHERE ad_group.id = ${adGroupId}
      AND ad_group_ad.ad.id = ${adId}
    LIMIT 1`;

  return gaqlSearch(customerId, query);
}

/**
 * Get ads with performance metrics. Optionally filter by ad group and date range.
 * Includes ad_strength in addition to standard metrics.
 */
export async function getAdsWithMetrics(
  customerId: string,
  dateRange?: DateRange | string,
  adGroupId?: string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");
  const conditions: string[] = [dateFilter];

  if (adGroupId) {
    conditions.push(`ad_group.id = ${adGroupId}`);
  }

  const query = `
    SELECT
      ${AD_BASE_FIELDS},
      ${AD_METRICS_FIELDS}
    FROM ad_group_ad
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}
