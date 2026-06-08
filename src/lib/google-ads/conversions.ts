import { gaqlSearch, mutate, buildFieldMask, buildDateFilter } from "./googleAdsClient";
import type {
  GAQLResponse,
  MutateResponse,
  ConversionActionType,
  ConversionActionCategory,
  DateRange,
} from "./types";

// =============================================
// Google Ads API — Conversions Module
// =============================================

const CONVERSION_ACTION_FIELDS = `
  conversion_action.id,
  conversion_action.name,
  conversion_action.type,
  conversion_action.category,
  conversion_action.status,
  conversion_action.resource_name,
  conversion_action.counting_type,
  conversion_action.attribution_model_settings.attribution_model,
  conversion_action.attribution_model_settings.data_driven_model_status,
  conversion_action.value_settings.default_value,
  conversion_action.value_settings.default_currency_code,
  conversion_action.value_settings.always_use_default_value,
  conversion_action.click_through_lookback_window_days,
  conversion_action.view_through_lookback_window_days,
  conversion_action.include_in_conversions_metric,
  conversion_action.tag_snippets`;

/**
 * List all conversion actions for a customer account.
 */
export async function listConversionActions(
  customerId: string,
  limit?: number
): Promise<GAQLResponse> {
  const query = `
    SELECT ${CONVERSION_ACTION_FIELDS}
    FROM conversion_action
    WHERE conversion_action.status != 'REMOVED'
    ORDER BY conversion_action.name ASC
    LIMIT ${limit || 100}`;

  return gaqlSearch(customerId, query);
}

/**
 * Get a single conversion action by ID.
 */
export async function getConversionActionById(
  customerId: string,
  conversionActionId: string
): Promise<GAQLResponse> {
  const query = `
    SELECT ${CONVERSION_ACTION_FIELDS}
    FROM conversion_action
    WHERE conversion_action.id = ${conversionActionId}
    LIMIT 1`;

  return gaqlSearch(customerId, query);
}

interface CreateConversionActionData {
  name: string;
  type: ConversionActionType;
  category: ConversionActionCategory;
  status?: "ENABLED" | "HIDDEN";
  countingType?: "ONE_PER_CLICK" | "MANY_PER_CLICK";
  defaultValue?: number;
  attributionModel?: string;
  clickThroughLookbackWindowDays?: number;
  viewThroughLookbackWindowDays?: number;
}

/**
 * Create a new conversion action.
 */
export async function createConversionAction(
  customerId: string,
  data: CreateConversionActionData
): Promise<MutateResponse> {
  const action: Record<string, unknown> = {
    name: data.name,
    type: data.type,
    category: data.category,
    status: data.status || "ENABLED",
    countingType: data.countingType || "ONE_PER_CLICK",
  };

  if (data.defaultValue !== undefined) {
    action.valueSettings = {
      defaultValue: data.defaultValue,
      alwaysUseDefaultValue: false,
    };
  }

  if (data.attributionModel) {
    action.attributionModelSettings = {
      attributionModel: data.attributionModel,
    };
  }

  if (data.clickThroughLookbackWindowDays !== undefined) {
    action.clickThroughLookbackWindowDays = data.clickThroughLookbackWindowDays;
  }

  if (data.viewThroughLookbackWindowDays !== undefined) {
    action.viewThroughLookbackWindowDays = data.viewThroughLookbackWindowDays;
  }

  return mutate(customerId, "conversionActions", [{ create: action }]);
}

/**
 * Update an existing conversion action.
 */
export async function updateConversionAction(
  customerId: string,
  resourceName: string,
  data: Partial<Omit<CreateConversionActionData, "type">>
): Promise<MutateResponse> {
  const update: Record<string, unknown> = { resourceName };

  if (data.name) update.name = data.name;
  if (data.status) update.status = data.status;
  if (data.category) update.category = data.category;
  if (data.countingType) update.countingType = data.countingType;

  if (data.defaultValue !== undefined) {
    update.valueSettings = { defaultValue: data.defaultValue };
  }

  if (data.attributionModel) {
    update.attributionModelSettings = {
      attributionModel: data.attributionModel,
    };
  }

  if (data.clickThroughLookbackWindowDays !== undefined) {
    update.clickThroughLookbackWindowDays = data.clickThroughLookbackWindowDays;
  }

  if (data.viewThroughLookbackWindowDays !== undefined) {
    update.viewThroughLookbackWindowDays = data.viewThroughLookbackWindowDays;
  }

  const updateMask = buildFieldMask(update).join(",");

  return mutate(customerId, "conversionActions", [
    { update: update as any, updateMask },
  ]);
}

/**
 * Remove a conversion action.
 */
export async function removeConversionAction(
  customerId: string,
  resourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "conversionActions", [{ remove: resourceName }]);
}

interface ConversionPerformanceParams {
  campaignId?: string;
  dateRange?: DateRange | string;
  startDate?: string;
  endDate?: string;
  groupBy?: "campaign" | "ad_group" | "conversion_action";
  limit?: number;
}

/**
 * Get conversion performance data grouped by campaign, ad group, or conversion action.
 */
export async function getConversionPerformance(
  customerId: string,
  params?: ConversionPerformanceParams
): Promise<GAQLResponse> {
  const conditions: string[] = [
    buildDateFilter(params?.dateRange as string, params?.startDate, params?.endDate),
  ];

  if (params?.campaignId) {
    conditions.push(`campaign.id = ${params.campaignId}`);
  }

  let selectFields = "";
  let fromResource = "campaign";

  switch (params?.groupBy) {
    case "ad_group":
      selectFields = `ad_group.id, ad_group.name, campaign.id, campaign.name,`;
      fromResource = "ad_group";
      break;
    case "conversion_action":
      selectFields = `segments.conversion_action, segments.conversion_action_name, segments.conversion_action_category, campaign.id, campaign.name,`;
      break;
    default:
      selectFields = `campaign.id, campaign.name,`;
  }

  const query = `
    SELECT
      ${selectFields}
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion,
      metrics.conversions_from_interactions_rate,
      metrics.all_conversions,
      metrics.all_conversions_value,
      metrics.all_conversions_from_interactions_rate,
      metrics.view_through_conversions,
      metrics.cost_micros
    FROM ${fromResource}
    WHERE ${conditions.join(" AND ")}
    ORDER BY metrics.conversions DESC
    LIMIT ${params?.limit || 100}`;

  return gaqlSearch(customerId, query);
}
