import {
  gaqlSearch,
  listAccessibleCustomers as _listAccessibleCustomers,
} from "./googleAdsClient";
import type { GoogleAdsCustomer, GAQLResponse } from "./types";

// =============================================
// Google Ads API — Customer / Account Module
// =============================================

/**
 * List all accessible Google Ads customer resource names for the authenticated user.
 * Re-exported from googleAdsClient for convenience.
 */
export const listAccessibleCustomers = _listAccessibleCustomers;

/**
 * Get detailed information about a specific Google Ads customer account.
 */
export async function getCustomerDetails(
  customerId: string
): Promise<GoogleAdsCustomer | null> {
  
  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.manager,
      customer.test_account,
      customer.optimization_score,
      customer.resource_name
    FROM customer
    LIMIT 1`;

  const response = await gaqlSearch<Record<string, any>>(customerId, query);
  const row = response.results?.[0];
  if (!row) return null;

  return mapCustomerRow(row.customer || row);
}

/**
 * List all client accounts under a manager (MCC) account.
 * Only returns ENABLED clients by default.
 */
export async function getCustomerClients(
  managerId: string
): Promise<GoogleAdsCustomer[]> {
  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.time_zone,
      customer_client.manager,
      customer_client.test_account,
      customer_client.resource_name
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'`;

  const response = await gaqlSearch<Record<string, any>>(managerId, query);
  const results = response.results || [];

  return results.map((row) => mapCustomerRow(row.customerClient || row));
}

// --- Helpers ---

function mapCustomerRow(raw: Record<string, any>, overrideId?: string): GoogleAdsCustomer {
  const id = String(raw.id || overrideId || "");
  return {
    id,
    customerId: id,
    descriptiveName: raw.descriptiveName || "",
    currencyCode: raw.currencyCode || "",
    timeZone: raw.timeZone || "",
    manager: raw.manager === true,
    testAccount: raw.testAccount === true,
    resourceName: raw.resourceName || `customers/${id}`,
    optimizationScore: raw.optimizationScore != null
      ? Number(raw.optimizationScore)
      : undefined,
  };
}
