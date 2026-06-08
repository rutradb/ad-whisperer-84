import { graphSearch, graphGet } from "./graphClient";

export interface InterestResult {
  id: string;
  name: string;
  audience_size: number;
  path: string[];
  topic?: string;
}

export interface GeoLocationResult {
  key: string;
  name: string;
  type: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  supports_city?: boolean;
  supports_region?: boolean;
}

export interface ReachEstimate {
  users_lower_bound: number;
  users_upper_bound: number;
}

export interface BehaviorResult {
  id: string;
  name: string;
  audience_size: number;
  path: string[];
  description?: string;
}

export interface DeliveryEstimate {
  daily_outcomes_curve?: Array<{ spend: number; reach: number; impressions: number; actions: number }>;
  estimate_dau?: number;
  estimate_mau?: number;
  estimate_ready?: boolean;
}

export async function searchInterests(
  query: string,
  limit: number = 25
): Promise<{ data: InterestResult[] }> {
  return graphSearch<{ data: InterestResult[] }>("adinterest", {
    q: query,
    limit,
    locale: "pt_BR",
  });
}

export async function searchInterestSuggestions(
  interestList: string[],
  limit: number = 25
): Promise<{ data: InterestResult[] }> {
  return graphSearch<{ data: InterestResult[] }>("adinterestsuggestion", {
    interest_list: JSON.stringify(interestList),
    limit,
    locale: "pt_BR",
  });
}

export async function searchGeolocations(
  query: string,
  locationTypes: string[] = ["country", "region", "city"],
  countryCode?: string
): Promise<{ data: GeoLocationResult[] }> {
  const params: Record<string, any> = {
    q: query,
    location_types: locationTypes,
    limit: 25,
    locale: "pt_BR",
  };
  if (countryCode) params.country_code = countryCode;
  return graphSearch<{ data: GeoLocationResult[] }>("adgeolocation", params);
}

export async function searchBehaviors(
  locale: string = "pt_BR"
): Promise<{ data: BehaviorResult[] }> {
  return graphSearch<{ data: BehaviorResult[] }>("adTargetingCategory", {
    class: "behaviors",
    locale,
  });
}

export async function searchDemographics(
  locale: string = "pt_BR"
): Promise<{ data: BehaviorResult[] }> {
  return graphSearch<{ data: BehaviorResult[] }>("adTargetingCategory", {
    class: "demographics",
    locale,
  });
}

export async function getReachEstimate(
  actId: string,
  targetingSpec: Record<string, any>
): Promise<{ data: ReachEstimate[] }> {
  return graphGet<{ data: ReachEstimate[] }>(`${actId}/reachestimate`, {
    targeting_spec: JSON.stringify(targetingSpec),
  });
}

export async function validateTargeting(
  actId: string,
  targetingSpec: Record<string, any>
): Promise<any> {
  return graphGet(`${actId}/targetingvalidation`, {
    targeting_spec: JSON.stringify(targetingSpec),
  });
}

export async function getDeliveryEstimate(
  actId: string,
  targetingSpec: Record<string, any>,
  optimizationGoal: string,
  dailyBudget?: number
): Promise<{ data: DeliveryEstimate[] }> {
  const params: Record<string, any> = {
    targeting_spec: JSON.stringify(targetingSpec),
    optimization_goal: optimizationGoal,
  };
  if (dailyBudget) params.daily_budget = dailyBudget;
  return graphGet<{ data: DeliveryEstimate[] }>(`${actId}/delivery_estimate`, params);
}
