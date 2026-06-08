import { gaqlSearch, buildResourceName } from "./googleAdsClient";
import type { GAQLResponse } from "./types";

// =============================================
// Google Ads API — Recommendations Module
// =============================================

// Headers and tokens now handled by Cloud Run proxy

// --- Recommendations ---

interface ListRecommendationsParams {
  type?: string;
  campaignId?: string;
  limit?: number;
}

/**
 * List Google Ads recommendations (optimization suggestions) for a customer account.
 */
export async function listRecommendations(
  customerId: string,
  params?: ListRecommendationsParams
): Promise<GAQLResponse> {
  const conditions: string[] = [];

  if (params?.type) {
    conditions.push(`recommendation.type = '${params.type}'`);
  }
  if (params?.campaignId) {
    const campaignResource = buildResourceName(customerId, "campaigns", params.campaignId);
    conditions.push(`recommendation.campaign = '${campaignResource}'`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT
      recommendation.resource_name,
      recommendation.type,
      recommendation.impact.base_metrics.impressions,
      recommendation.impact.base_metrics.clicks,
      recommendation.impact.base_metrics.cost_micros,
      recommendation.impact.base_metrics.conversions,
      recommendation.impact.potential_metrics.impressions,
      recommendation.impact.potential_metrics.clicks,
      recommendation.impact.potential_metrics.cost_micros,
      recommendation.impact.potential_metrics.conversions,
      recommendation.campaign_budget_recommendation,
      recommendation.keyword_recommendation,
      recommendation.responsive_search_ad_recommendation,
      recommendation.campaign,
      recommendation.ad_group
    FROM recommendation
    ${where}
    LIMIT ${params?.limit || 100}`;

  return gaqlSearch(customerId, query);
}

/**
 * Apply (accept) a Google Ads recommendation. This will make changes to the account.
 */
export async function applyRecommendation(
  customerId: string,
  recommendationResourceName: string
): Promise<Record<string, unknown>> {
  const proxyUrl = localStorage.getItem("cloud_run_url");
  if (!proxyUrl) throw new Error("Cloud Run URL não configurada.");

  const token = localStorage.getItem("gads_access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const lcid = localStorage.getItem("gads_login_customer_id");
  if (lcid) headers["x-login-customer-id"] = lcid.replace(/-/g, "");

  const response = await fetch(`${proxyUrl}/api/recommendations/apply`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: customerId.replace(/-/g, ""),
      resourceName: recommendationResourceName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apply recommendation failed (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Dismiss (ignore) a Google Ads recommendation.
 */
export async function dismissRecommendation(
  customerId: string,
  recommendationResourceName: string
): Promise<Record<string, unknown>> {
  const proxyUrl = localStorage.getItem("cloud_run_url");
  if (!proxyUrl) throw new Error("Cloud Run URL não configurada.");

  const token = localStorage.getItem("gads_access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const lcid = localStorage.getItem("gads_login_customer_id");
  if (lcid) headers["x-login-customer-id"] = lcid.replace(/-/g, "");

  const response = await fetch(`${proxyUrl}/api/recommendations/dismiss`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: customerId.replace(/-/g, ""),
      resourceName: recommendationResourceName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dismiss recommendation failed (${response.status}): ${error}`);
  }

  return response.json();
}

interface OptimizationScoreResult {
  accountScore: Record<string, unknown> | null;
  campaignScores: Record<string, unknown>[];
}

/**
 * Get the optimization score for the account and per-campaign breakdown.
 */
export async function getOptimizationScore(
  customerId: string
): Promise<OptimizationScoreResult> {
  const [accountResult, campaignResult] = await Promise.all([
    gaqlSearch(customerId, `
      SELECT
        customer.optimization_score,
        customer.optimization_score_weight
      FROM customer
      LIMIT 1
    `),
    gaqlSearch(customerId, `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.optimization_score
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      ORDER BY campaign.optimization_score ASC
      LIMIT 50
    `),
  ]);

  return {
    accountScore: (accountResult.results?.[0] as Record<string, unknown>) || null,
    campaignScores: (campaignResult.results as Record<string, unknown>[]) || [],
  };
}
