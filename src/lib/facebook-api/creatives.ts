import { graphGet } from "./graphClient";
import type { Paging } from "./types";

export interface AdCreative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  image_url?: string;
  image_hash?: string;
  thumbnail_url?: string;
  object_story_spec?: Record<string, any>;
  call_to_action_type?: string;
  url_tags?: string;
  link_url?: string;
  status?: string;
  created_time?: string;
}

export interface AdCreativesResponse {
  data: AdCreative[];
  paging?: Paging;
}

export interface CreativeQueryParams {
  fields?: string[];
  limit?: number;
  after?: string;
  before?: string;
}

const DEFAULT_FIELDS = [
  "name", "title", "body", "image_url", "image_hash",
  "thumbnail_url", "object_story_spec", "call_to_action_type",
  "url_tags", "status", "created_time",
];

export async function getCreativesByAccount(
  actId: string,
  params: CreativeQueryParams = {}
): Promise<AdCreativesResponse> {
  return graphGet<AdCreativesResponse>(`${actId}/adcreatives`, {
    ...params,
    fields: params.fields || DEFAULT_FIELDS,
    limit: params.limit || 25,
  });
}

export async function getCreativeById(
  creativeId: string,
  params: { fields?: string[] } = {}
): Promise<AdCreative> {
  return graphGet<AdCreative>(creativeId, {
    fields: params.fields || DEFAULT_FIELDS,
  });
}
