import { gaqlSearch, buildDateFilter } from "./googleAdsClient";
import type {
  GAQLResponse,
  CampaignStatus,
  AdvertisingChannelType,
  DateRange,
} from "./types";

// =============================================
// Google Ads API — Campaigns Module
// =============================================

const CAMPAIGN_BASE_FIELDS = `
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign.advertising_channel_sub_type,
  campaign.campaign_budget,
  campaign.bidding_strategy_type,
  campaign.start_date_time,
  campaign.end_date_time,
  campaign.serving_status,
  campaign.optimization_score,
  campaign.resource_name,
  campaign.network_settings.target_google_search,
  campaign.network_settings.target_search_network,
  campaign.network_settings.target_content_network`;

const CAMPAIGN_DETAIL_FIELDS = `${CAMPAIGN_BASE_FIELDS},
  campaign.manual_cpc.enhanced_cpc_enabled,
  campaign.maximize_conversions.target_cpa_micros,
  campaign.maximize_conversion_value.target_roas,
  campaign.target_cpa.target_cpa_micros,
  campaign.target_roas.target_roas,
  campaign.target_spend.cpc_bid_ceiling_micros,
  campaign.final_url_suffix,
  campaign.tracking_url_template`;

const METRICS_FIELDS = `
  metrics.impressions,
  metrics.clicks,
  metrics.ctr,
  metrics.average_cpc,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.cost_per_conversion`;

interface CampaignListParams {
  status?: CampaignStatus;
  channelType?: AdvertisingChannelType;
  limit?: number;
}

/**
 * List campaigns for a customer account with optional status and channel type filters.
 */
export async function getCampaignsByCustomer(
  customerId: string,
  params?: CampaignListParams
): Promise<GAQLResponse> {
  const conditions: string[] = [];

  if (params?.status && params.status !== "UNKNOWN") {
    conditions.push(`campaign.status = '${params.status}'`);
  }
  if (params?.channelType && params.channelType !== "UNKNOWN") {
    conditions.push(`campaign.advertising_channel_type = '${params.channelType}'`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const limit = params?.limit || 100;

  const query = `
    SELECT ${CAMPAIGN_BASE_FIELDS}
    FROM campaign
    ${where}
    ORDER BY campaign.name ASC
    LIMIT ${limit}`;

  return gaqlSearch(customerId, query);
}

/**
 * Get a single campaign by ID with full detail fields including bidding configuration.
 */
export async function getCampaignById(
  customerId: string,
  campaignId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${CAMPAIGN_DETAIL_FIELDS}
    FROM campaign
    WHERE campaign.id = ${campaignId}
    LIMIT 1`;

  return gaqlSearch(customerId, query);
}

/**
 * Get campaigns with performance metrics for a given date range.
 * Excludes REMOVED campaigns and orders by cost descending.
 */
export async function getCampaignsWithMetrics(
  customerId: string,
  dateRange?: DateRange | string
): Promise<GAQLResponse> {
  const dateFilter = buildDateFilter(dateRange || "LAST_30_DAYS");

  const query = `
    SELECT
      ${CAMPAIGN_BASE_FIELDS},
      ${METRICS_FIELDS}
    FROM campaign
    WHERE ${dateFilter}
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100`;

  return gaqlSearch(customerId, query);
}
