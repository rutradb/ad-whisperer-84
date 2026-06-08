import { graphGet, graphPost, graphDelete } from "./graphClient";
import type { Paging } from "./types";

export interface AdPixel {
  id: string;
  name: string;
  creation_time: string;
  last_fired_time?: string;
  is_unavailable: boolean;
  data_use_setting?: string;
}

export interface PixelStatsRow {
  aggregation: string;
  timestamp: string;
  value: number;
  count: number;
}

export interface CustomConversion {
  id: string;
  name: string;
  rule: string;
  default_conversion_value?: number;
  creation_time: string;
  is_archived: boolean;
  custom_event_type?: string;
}

export interface CreateCustomConversionData {
  name: string;
  rule: string;
  custom_event_type?: string;
  default_conversion_value?: number;
}

const PIXEL_FIELDS = ["id", "name", "creation_time", "last_fired_time", "is_unavailable", "data_use_setting"];
const CC_FIELDS = ["id", "name", "rule", "default_conversion_value", "creation_time", "is_archived", "custom_event_type"];

export async function listPixels(actId: string): Promise<{ data: AdPixel[]; paging?: Paging }> {
  return graphGet(`${actId}/adspixels`, { fields: PIXEL_FIELDS });
}

export async function getPixelStats(
  pixelId: string,
  params: { aggregation?: string; start_time?: string; end_time?: string } = {}
): Promise<{ data: PixelStatsRow[]; paging?: Paging }> {
  return graphGet(`${pixelId}/stats`, { aggregation: "event", ...params });
}

export async function listCustomConversions(actId: string): Promise<{ data: CustomConversion[]; paging?: Paging }> {
  return graphGet(`${actId}/customconversions`, { fields: CC_FIELDS });
}

export async function createCustomConversion(
  actId: string,
  data: CreateCustomConversionData
): Promise<{ id: string }> {
  return graphPost(`${actId}/customconversions`, data);
}

export async function deleteCustomConversion(conversionId: string): Promise<{ success: boolean }> {
  return graphDelete(conversionId);
}
