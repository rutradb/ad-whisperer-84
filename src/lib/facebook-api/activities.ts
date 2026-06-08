import { graphGet } from "./graphClient";
import type { Paging } from "./types";

export interface Activity {
  actor_id: string;
  actor_name: string;
  event_time: string;
  event_type: string;
  object_id: string;
  object_name?: string;
  extra_data?: string;
  translated_event_type?: string;
}

export interface ActivitiesResponse {
  data: Activity[];
  paging?: Paging;
}

export async function getAccountActivities(
  actId: string,
  params: {
    limit?: number;
    after?: string;
    since?: string;
    until?: string;
    category?: string;
  } = {}
): Promise<ActivitiesResponse> {
  return graphGet<ActivitiesResponse>(`${actId}/activities`, {
    fields: [
      "actor_id", "actor_name", "event_time", "event_type",
      "object_id", "object_name", "extra_data", "translated_event_type",
    ],
    limit: params.limit || 50,
    ...(params.after ? { after: params.after } : {}),
    ...(params.since ? { since: params.since } : {}),
    ...(params.until ? { until: params.until } : {}),
    ...(params.category ? { category: params.category } : {}),
  });
}
