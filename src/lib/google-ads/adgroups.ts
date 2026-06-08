import { gaqlSearch, buildDateFilter } from "./googleAdsClient";
import type {
  GAQLResponse,
  AdGroupAdStatus,
  DateRange,
} from "./types";

// =============================================
// Google Ads API — Ad Groups Module
// =============================================

const AD_GROUP_BASE_FIELDS = `
  ad_group.id,
  ad_group.name,
  ad_group.status,
  ad_group.campaign,
  ad_group.type,
  ad_group.cpc_bid_micros,
  ad_group.cpm_bid_micros,
  ad_group.target_cpa_micros,
  ad_group.ad_rotation_mode,
  ad_group.resource_name`;

const METRICS_FIELDS = `
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

interface AdGroupListParams {
  campaignId?: string;
  status?: AdGroupAdStatus;
  limit?: number;
}

/**
 * List ad groups for a customer account with optional campaign and status filters.
 */
export async function getAdGroupsByCustomer(
  customerId: string,
  params?: AdGroupListParams
): Promise<GAQLResponse> {
  const conditions: string[] = [];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }
  if (params?.status && params.status !== "UNKNOWN") {
    conditions.push(`ad_group.status = '${params.status}'`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const limit = params?.limit || 100;

  const query = `
    SELECT ${AD_GROUP_BASE_FIELDS}
    FROM ad_group
    ${where}
    ORDER BY ad_group.name ASC
    LIMIT ${limit}`;

  return gaqlSearch(customerId, query);
}

/**
 * List all ad groups belonging to a specific campaign.
 */
export async function getAdGroupsByCampaign(
  customerId: string,
  campaignId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${AD_GROUP_BASE_FIELDS}
    FROM ad_group
    WHERE campaign.id = ${campaignId}
    ORDER BY ad_group.name ASC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}

/**
 * Get a single ad group by its ID.
 */
export async function getAdGroupById(
  customerId: string,
  adGroupId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${AD_GROUP_BASE_FIELDS}
    FROM ad_group
    WHERE ad_group.id = ${adGroupId}
    LIMIT 1`;

  return gaqlSearch(customerId, query);
}

/**
 * Get ad groups with performance metrics. Optionally filter by campaign and date range.
 */
export async function getAdGroupsWithMetrics(
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
      ${AD_GROUP_BASE_FIELDS},
      campaign.id,
      campaign.name,
      ${METRICS_FIELDS}
    FROM ad_group
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}
