// =============================================
// Google Ads API — Keywords & Search Terms
// =============================================

import { gaqlSearch, mutate, buildFieldMask, buildDateFilter } from "./googleAdsClient";
import type { MutateOperation, MutateResponse, GAQLResponse, KeywordMatchType, DateRange } from "./types";

// --- Types ---

export interface KeywordParams {
  status?: string;
  limit?: number;
}

export interface KeywordsWithMetricsParams {
  adGroupId?: string;
  campaignId?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface SearchTermsParams {
  campaignId?: string;
  adGroupId?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AddKeywordInput {
  text: string;
  matchType: KeywordMatchType;
  cpcBidMicros?: number;
  status?: "ENABLED" | "PAUSED";
}

export interface NegativeKeywordInput {
  text: string;
  matchType: KeywordMatchType;
}

// --- Queries ---

export async function getKeywordsByAdGroup<T = unknown>(
  customerId: string,
  adGroupId: string,
  params?: KeywordParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    "ad_group_criterion.type = 'KEYWORD'",
    `ad_group.id = ${adGroupId}`,
    "ad_group_criterion.negative = false",
  ];

  if (params?.status && params.status !== "ALL") {
    conditions.push(`ad_group_criterion.status = '${params.status}'`);
  }

  const query = `
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros,
      ad_group_criterion.final_urls,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      ad_group_criterion.resource_name,
      ad_group.resource_name
    FROM ad_group_criterion
    WHERE ${conditions.join(" AND ")}
    ORDER BY ad_group_criterion.keyword.text ASC
    LIMIT ${params?.limit || 500}`;

  return gaqlSearch<T>(customerId, query);
}

export async function getKeywordsByCustomer<T = unknown>(
  customerId: string,
  params?: { campaignId?: string; status?: string; limit?: number }
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    "ad_group_criterion.type = 'KEYWORD'",
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }
  if (params?.status && params.status !== "ALL") {
    conditions.push(`ad_group_criterion.status = '${params.status}'`);
  }

  const query = `
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros,
      ad_group_criterion.effective_cpc_bid_micros,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      ad_group_criterion.final_urls,
      ad_group_criterion.approval_status,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      ad_group_criterion.resource_name
    FROM ad_group_criterion
    WHERE ${conditions.join(" AND ")}
    ORDER BY ad_group_criterion.keyword.text ASC
    LIMIT ${params?.limit || 500}`;

  return gaqlSearch<T>(customerId, query);
}

export async function getKeywordsWithMetrics<T = unknown>(
  customerId: string,
  params?: KeywordsWithMetricsParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    buildDateFilter(params?.dateRange, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }
  if (params?.adGroupId) {
    conditions.push(`ad_group.id = ${params.adGroupId}`);
  }

  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_from_interactions_rate,
      metrics.cost_per_conversion,
      metrics.top_impression_percentage,
      metrics.absolute_top_impression_percentage,
      metrics.search_impression_share
    FROM keyword_view
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC
    LIMIT ${params?.limit || 200}`;

  return gaqlSearch<T>(customerId, query);
}

// --- Mutations ---

export async function addKeywords(
  customerId: string,
  adGroupResourceName: string,
  keywords: AddKeywordInput[]
): Promise<MutateResponse> {
  const operations = keywords.map((kw) => {
    const criterion: Record<string, unknown> = {
      adGroup: adGroupResourceName,
      status: kw.status || "ENABLED",
      keyword: {
        text: kw.text,
        matchType: kw.matchType,
      },
    };
    if (kw.cpcBidMicros) criterion.cpcBidMicros = kw.cpcBidMicros;
    return { create: criterion };
  }) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, "adGroupCriteria", operations);
}

export async function updateKeyword(
  customerId: string,
  resourceName: string,
  data: { status?: string; cpcBidMicros?: number; finalUrls?: string[] }
): Promise<MutateResponse> {
  const update: Record<string, unknown> = { resourceName };
  if (data.status) update.status = data.status;
  if (data.cpcBidMicros) update.cpcBidMicros = data.cpcBidMicros;
  if (data.finalUrls) update.finalUrls = data.finalUrls;

  const updateMask = buildFieldMask(update).join(",");
  return mutate(customerId, "adGroupCriteria", [
    { update, updateMask } as MutateOperation<Record<string, unknown>>,
  ]);
}

export async function removeKeyword(
  customerId: string,
  resourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "adGroupCriteria", [{ remove: resourceName }]);
}

// --- Negative Keywords ---

export async function getNegativeKeywords<T = unknown>(
  customerId: string,
  campaignId?: string
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    "campaign_criterion.type = 'KEYWORD'",
    "campaign_criterion.negative = true",
  ];

  if (campaignId) {
    conditions.push(`campaign.id = ${campaignId}`);
  }

  const query = `
    SELECT
      campaign_criterion.criterion_id,
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type,
      campaign_criterion.resource_name,
      campaign.id,
      campaign.name
    FROM campaign_criterion
    WHERE ${conditions.join(" AND ")}
    ORDER BY campaign_criterion.keyword.text ASC`;

  return gaqlSearch<T>(customerId, query);
}

export async function addNegativeKeywords(
  customerId: string,
  campaignResourceName: string,
  keywords: NegativeKeywordInput[]
): Promise<MutateResponse> {
  const operations = keywords.map((kw) => ({
    create: {
      campaign: campaignResourceName,
      keyword: {
        text: kw.text,
        matchType: kw.matchType,
      },
      negative: true,
    },
  })) as MutateOperation<Record<string, unknown>>[];

  return mutate(customerId, "campaignCriteria", operations);
}

// --- Search Terms ---

export async function getSearchTerms<T = unknown>(
  customerId: string,
  params?: SearchTermsParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    buildDateFilter(params?.dateRange, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }
  if (params?.adGroupId) {
    conditions.push(`ad_group.id = ${params.adGroupId}`);
  }

  const query = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      search_term_view.resource_name,
      segments.search_term_match_type,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_from_interactions_rate
    FROM search_term_view
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC
    LIMIT ${params?.limit || 200}`;

  return gaqlSearch<T>(customerId, query);
}
