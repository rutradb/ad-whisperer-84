// =============================================
// Google Ads API — Barrel Exports
// =============================================

export * from "./types";
export * from "./googleAdsClient";
export { getCustomerDetails, getCustomerClients } from "./customers";
export * from "./campaigns";
export * from "./adgroups";
export * from "./ads";
export { getCampaignMetrics, getAdGroupMetrics, getAdMetrics, getCustomerMetrics, getPerformanceByDevice, getPerformanceByNetwork, getPerformanceByHour, getPerformanceByDayOfWeek, getGeographicPerformance } from "./reporting";
export * from "./mutations";
export * from "./keywords";
export * from "./assets";
export * from "./targeting";
export { listAudiences, getAudiencePerformance } from "./audiences";
export * from "./conversions";
export * from "./change-history";
export * from "./recommendations";
export * from "./labels";

