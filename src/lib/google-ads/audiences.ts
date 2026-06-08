// =============================================
// Google Ads API — Audiences & User Lists
// =============================================

import { gaqlSearch, buildDateFilter } from "./googleAdsClient";
import type { GAQLResponse, DateRange } from "./types";

// --- Types ---

export interface AudiencePerformanceParams {
  campaignId?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// --- Queries ---

export async function listAudiences<T = unknown>(
  customerId: string,
  limit?: number
): Promise<GAQLResponse<T>> {
  const query = `
    SELECT
      user_list.id,
      user_list.name,
      user_list.description,
      user_list.membership_status,
      user_list.membership_life_span,
      user_list.size_for_search,
      user_list.size_for_display,
      user_list.type,
      user_list.eligible_for_display,
      user_list.eligible_for_search,
      user_list.resource_name
    FROM user_list
    ORDER BY user_list.name ASC
    LIMIT ${limit || 100}`;

  return gaqlSearch<T>(customerId, query);
}

export async function getAudiencePerformance<T = unknown>(
  customerId: string,
  params?: AudiencePerformanceParams
): Promise<GAQLResponse<T>> {
  const conditions: string[] = [
    buildDateFilter(params?.dateRange, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }

  const query = `
    SELECT
      campaign_audience_view.resource_name,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_from_interactions_rate,
      metrics.cost_per_conversion
    FROM campaign_audience_view
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.impressions DESC
    LIMIT ${params?.limit || 100}`;

  return gaqlSearch<T>(customerId, query);
}

export async function listCombinedAudiences<T = unknown>(
  customerId: string
): Promise<GAQLResponse<T>> {
  const query = `
    SELECT
      combined_audience.id,
      combined_audience.name,
      combined_audience.description,
      combined_audience.status,
      combined_audience.resource_name
    FROM combined_audience
    ORDER BY combined_audience.name ASC`;

  return gaqlSearch<T>(customerId, query);
}
