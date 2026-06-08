import { gaqlSearch } from "./googleAdsClient";
import type { GAQLResponse } from "./types";

// =============================================
// Google Ads API — Change History Module
// =============================================

export interface ChangeEventsParams {
  startDate?: string;
  endDate?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get change events (audit log) for a customer account within a date range.
 * Returns details about what changed, who made the change, and the before/after state.
 */
export async function getChangeEvents(
  customerId: string,
  params?: ChangeEventsParams
): Promise<GAQLResponse> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const startDate = params?.startDate || thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = params?.endDate || now.toISOString().split("T")[0];

  const conditions: string[] = [
    `change_event.change_date_time >= '${startDate}'`,
    `change_event.change_date_time <= '${endDate}'`,
  ];

  if (params?.resourceType) {
    conditions.push(`change_event.change_resource_type = '${params.resourceType}'`);
  }

  const query = `
    SELECT
      change_event.change_date_time,
      change_event.change_resource_name,
      change_event.change_resource_type,
      change_event.user_email,
      change_event.client_type,
      change_event.old_resource,
      change_event.new_resource,
      change_event.changed_fields
    FROM change_event
    WHERE ${conditions.join(" AND ")}
    ORDER BY change_event.change_date_time DESC
    LIMIT ${params?.limit || 50}`;

  return gaqlSearch(customerId, query);
}

interface ChangeStatusParams {
  resourceType?: string;
  limit?: number;
}

/**
 * Get the change status of resources, showing the most recently modified resources.
 */
export async function getChangeStatus(
  customerId: string,
  params?: ChangeStatusParams
): Promise<GAQLResponse> {
  const conditions: string[] = [];

  if (params?.resourceType) {
    conditions.push(`change_status.resource_type = '${params.resourceType}'`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT
      change_status.resource_name,
      change_status.resource_type,
      change_status.resource_status,
      change_status.last_change_date_time
    FROM change_status
    ${where}
    ORDER BY change_status.last_change_date_time DESC
    LIMIT ${params?.limit || 50}`;

  return gaqlSearch(customerId, query);
}
