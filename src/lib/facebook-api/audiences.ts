import { graphGet, graphPost, graphDelete } from "./graphClient";
import type { Paging } from "./types";

export interface CustomAudience {
  id: string;
  name: string;
  subtype: string;
  description?: string;
  approximate_count_lower_bound?: number;
  approximate_count_upper_bound?: number;
  lookalike_spec?: { country: string; ratio: number; type: string; origin: any[] };
  permission_for_actions?: Record<string, boolean>;
  time_created?: string;
}

export interface CustomAudiencesResponse {
  data: CustomAudience[];
  paging?: Paging;
}

const AUDIENCE_FIELDS = [
  "id", "name", "subtype", "description",
  "approximate_count_lower_bound", "approximate_count_upper_bound",
  "time_created", "lookalike_spec", "permission_for_actions",
];

export async function listCustomAudiences(
  actId: string,
  params: { limit?: number; after?: string } = {}
): Promise<CustomAudiencesResponse> {
  return graphGet<CustomAudiencesResponse>(`${actId}/customaudiences`, {
    fields: AUDIENCE_FIELDS,
    limit: params.limit || 50,
    ...(params.after ? { after: params.after } : {}),
  });
}

export async function createCustomAudience(
  actId: string,
  data: { name: string; subtype?: string; description?: string; customer_file_source?: string }
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/customaudiences`, {
    ...data,
    subtype: data.subtype || "CUSTOM",
  });
}

export async function createLookalikeAudience(
  actId: string,
  data: { name: string; origin_audience_id: string; lookalike_spec: { country: string; ratio: number; type: string } }
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/customaudiences`, {
    name: data.name,
    subtype: "LOOKALIKE",
    origin_audience_id: data.origin_audience_id,
    lookalike_spec: data.lookalike_spec,
  });
}

export async function deleteAudience(
  audienceId: string
): Promise<{ success: boolean }> {
  return graphDelete<{ success: boolean }>(audienceId);
}
