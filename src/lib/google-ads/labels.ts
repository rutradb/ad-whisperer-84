import { gaqlSearch, mutate } from "./googleAdsClient";
import type { GAQLResponse, MutateResponse } from "./types";

// =============================================
// Google Ads API — Labels Module
// =============================================

/**
 * List all labels in the customer account.
 */
export async function listLabels(
  customerId: string,
  limit?: number
): Promise<GAQLResponse> {
  const query = `
    SELECT
      label.id,
      label.name,
      label.resource_name,
      label.text_label.description,
      label.text_label.background_color
    FROM label
    ORDER BY label.name ASC
    LIMIT ${limit || 100}`;

  return gaqlSearch(customerId, query);
}

interface CreateLabelData {
  name: string;
  description?: string;
  backgroundColor?: string;
}

/**
 * Create a new label for organizing campaigns, ad groups, etc.
 */
export async function createLabel(
  customerId: string,
  data: CreateLabelData
): Promise<MutateResponse> {
  const label: Record<string, unknown> = {
    name: data.name,
    textLabel: {
      ...(data.description ? { description: data.description } : {}),
      ...(data.backgroundColor ? { backgroundColor: data.backgroundColor } : {}),
    },
  };

  return mutate(customerId, "labels", [{ create: label }]);
}

/**
 * Remove a label from the account.
 */
export async function removeLabel(
  customerId: string,
  resourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "labels", [{ remove: resourceName }]);
}

/**
 * Apply a label to a campaign.
 */
export async function applyLabelToCampaign(
  customerId: string,
  campaignResourceName: string,
  labelResourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "campaignLabels", [
    {
      create: {
        campaign: campaignResourceName,
        label: labelResourceName,
      },
    },
  ]);
}

/**
 * Apply a label to an ad group.
 */
export async function applyLabelToAdGroup(
  customerId: string,
  adGroupResourceName: string,
  labelResourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "adGroupLabels", [
    {
      create: {
        adGroup: adGroupResourceName,
        label: labelResourceName,
      },
    },
  ]);
}

/**
 * Remove a label from a campaign (by campaign-label resource name).
 */
export async function removeCampaignLabel(
  customerId: string,
  resourceName: string
): Promise<MutateResponse> {
  return mutate(customerId, "campaignLabels", [{ remove: resourceName }]);
}
