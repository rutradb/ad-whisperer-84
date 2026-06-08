// =============================================
// Google Ads API v23 — Shared Types
// =============================================

// --- Enums ---

export type CampaignStatus = "ENABLED" | "PAUSED" | "REMOVED" | "UNKNOWN";

export type AdvertisingChannelType =
  | "SEARCH"
  | "DISPLAY"
  | "SHOPPING"
  | "VIDEO"
  | "PERFORMANCE_MAX"
  | "DEMAND_GEN"
  | "TRAVEL"
  | "LOCAL_SERVICES"
  | "SMART"
  | "MULTI_CHANNEL"
  | "UNKNOWN";

export type BiddingStrategyType =
  | "MANUAL_CPC"
  | "MANUAL_CPM"
  | "MAXIMIZE_CONVERSIONS"
  | "MAXIMIZE_CONVERSION_VALUE"
  | "TARGET_CPA"
  | "TARGET_ROAS"
  | "TARGET_SPEND"
  | "TARGET_IMPRESSION_SHARE"
  | "UNKNOWN";

export type AdGroupType =
  | "SEARCH_STANDARD"
  | "DISPLAY_STANDARD"
  | "SHOPPING_PRODUCT_ADS"
  | "VIDEO_BUMPER"
  | "VIDEO_TRUE_VIEW_IN_STREAM"
  | "UNKNOWN";

export type AdGroupAdStatus = "ENABLED" | "PAUSED" | "REMOVED" | "UNKNOWN";

export type KeywordMatchType = "EXACT" | "PHRASE" | "BROAD" | "UNKNOWN";

export type AssetType =
  | "TEXT"
  | "IMAGE"
  | "YOUTUBE_VIDEO"
  | "LEAD_FORM"
  | "CALL"
  | "CALLOUT"
  | "SITELINK"
  | "STRUCTURED_SNIPPET"
  | "PRICE"
  | "PROMOTION"
  | "UNKNOWN";

export type ConversionActionType =
  | "WEBPAGE"
  | "PHONE_CALL_TRACKING"
  | "IMPORT_FROM_GOOGLE_ANALYTICS"
  | "CLICK_TO_CALL"
  | "STORE_VISIT"
  | "STORE_SALE"
  | "UPLOAD"
  | "UNKNOWN";

export type ConversionActionCategory =
  | "DEFAULT"
  | "PAGE_VIEW"
  | "PURCHASE"
  | "SIGNUP"
  | "LEAD"
  | "DOWNLOAD"
  | "ADD_TO_CART"
  | "BEGIN_CHECKOUT"
  | "SUBSCRIBE_PAID"
  | "PHONE_CALL_LEAD"
  | "IMPORTED_LEAD"
  | "SUBMIT_LEAD_FORM"
  | "BOOK_APPOINTMENT"
  | "REQUEST_QUOTE"
  | "GET_DIRECTIONS"
  | "OUTBOUND_CLICK"
  | "CONTACT"
  | "ENGAGEMENT"
  | "STORE_VISIT"
  | "STORE_SALE"
  | "UNKNOWN";

export type AttributionModel =
  | "LAST_CLICK"
  | "FIRST_CLICK"
  | "LINEAR"
  | "TIME_DECAY"
  | "POSITION_BASED"
  | "DATA_DRIVEN"
  | "UNKNOWN";

export type PolicyApprovalStatus =
  | "APPROVED"
  | "APPROVED_LIMITED"
  | "AREA_OF_INTEREST_ONLY"
  | "DISAPPROVED"
  | "UNKNOWN";

export type DateRange =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_14_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "THIS_QUARTER"
  | "LAST_QUARTER";

export type AdStrength = "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "UNSPECIFIED" | "UNKNOWN";

export type RecommendationType =
  | "KEYWORD"
  | "CAMPAIGN_BUDGET"
  | "TEXT_AD"
  | "TARGET_CPA_OPT_IN"
  | "MAXIMIZE_CONVERSIONS_OPT_IN"
  | "ENHANCED_CPC_OPT_IN"
  | "SEARCH_PARTNERS_OPT_IN"
  | "MAXIMIZE_CLICKS_OPT_IN"
  | "OPTIMIZE_AD_ROTATION"
  | "SITELINK_EXTENSION"
  | "CALLOUT_EXTENSION"
  | "CALL_EXTENSION"
  | "KEYWORD_MATCH_TYPE"
  | "MOVE_UNUSED_BUDGET"
  | "RESPONSIVE_SEARCH_AD"
  | "UNKNOWN";

// --- Core Entities ---

export interface GoogleAdsCustomer {
  id: string;
  customerId?: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  manager: boolean;
  testAccount: boolean;
  resourceName: string;
  optimizationScore?: number;
  optimizationScoreWeight?: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  advertisingChannelType: AdvertisingChannelType;
  advertisingChannelSubType?: string;
  biddingStrategyType: BiddingStrategyType;
  campaignBudget: string; // resource name
  startDate?: string;
  endDate?: string;
  servingStatus?: string;
  optimizationScore?: number;
  resourceName: string;
  // Bidding details
  manualCpc?: { enhancedCpcEnabled?: boolean };
  maximizeConversions?: { targetCpaMicros?: string };
  maximizeConversionValue?: { targetRoas?: number };
  targetCpa?: { targetCpaMicros?: string };
  targetRoas?: { targetRoas?: number };
  targetSpend?: { cpcBidCeilingMicros?: string };
  // Network settings
  networkSettings?: {
    targetGoogleSearch?: boolean;
    targetSearchNetwork?: boolean;
    targetContentNetwork?: boolean;
    targetPartnerSearchNetwork?: boolean;
  };
  // URL settings
  finalUrlSuffix?: string;
  trackingUrlTemplate?: string;
}

export interface CampaignBudget {
  id: string;
  name: string;
  amountMicros: string;
  deliveryMethod: "STANDARD" | "ACCELERATED";
  period: "DAILY" | "CUSTOM_PERIOD";
  totalAmountMicros?: string;
  explicitlyShared: boolean;
  resourceName: string;
  status?: string;
  recommendedBudgetAmountMicros?: string;
}

export interface AdGroup {
  id: string;
  name: string;
  status: AdGroupAdStatus;
  campaignId?: string;
  campaign?: string; // resource name
  type: AdGroupType;
  cpcBidMicros?: string;
  cpmBidMicros?: string;
  targetCpaMicros?: string;
  targetRoasMicros?: number;
  adRotationMode?: "OPTIMIZE" | "ROTATE_FOREVER";
  resourceName: string;
}

export interface ResponsiveSearchAd {
  headlines: Array<{ text: string; pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" }>;
  descriptions: Array<{ text: string; pinnedField?: "DESCRIPTION_1" | "DESCRIPTION_2" }>;
  path1?: string;
  path2?: string;
}

export interface Ad {
  id: string;
  name?: string;
  resourceName: string;
  type: string;
  finalUrls: string[];
  finalMobileUrls?: string[];
  trackingUrlTemplate?: string;
  responsiveSearchAd?: ResponsiveSearchAd;
  adStrength?: AdStrength;
  policySummary?: {
    approvalStatus: PolicyApprovalStatus;
    reviewStatus: string;
    policyTopicEntries?: Array<{
      topic: string;
      type: string;
    }>;
  };
}

export interface AdGroupAd {
  resourceName: string;
  status: AdGroupAdStatus;
  adGroup: string; // resource name
  ad: Ad;
  policySummary?: Ad["policySummary"];
}

export interface Keyword {
  resourceName: string;
  criterionId: string;
  adGroup: string; // resource name
  keyword: {
    text: string;
    matchType: KeywordMatchType;
  };
  status: AdGroupAdStatus;
  cpcBidMicros?: string;
  finalUrls?: string[];
  qualityInfo?: {
    qualityScore?: number;
    creativityScore?: "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE";
    postClickQualityScore?: "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE";
    searchPredictedCtr?: "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE";
  };
  negative?: boolean;
}

export interface Asset {
  id: string;
  name?: string;
  type: AssetType;
  resourceName: string;
  textAsset?: { text: string };
  imageAsset?: { fileSize?: string; fullSize?: { url: string; widthPixels?: number; heightPixels?: number } };
  youtubeVideoAsset?: { youtubeVideoId: string; youtubeVideoTitle?: string };
  callAsset?: { phoneNumber: string; countryCode: string };
  sitelinkAsset?: { linkText: string; description1?: string; description2?: string; finalUrls: string[] };
  calloutAsset?: { calloutText: string };
  structuredSnippetAsset?: { header: string; values: string[] };
  priceAsset?: { type: string; priceQualifier?: string; priceOfferings: Array<{ header: string; description: string; price: { amountMicros: string; currencyCode: string }; unit?: string; finalUrl: string }> };
  promotionAsset?: { promotionTarget: string; discountModifier?: string; percentOff?: number; moneyAmountOff?: { amountMicros: string; currencyCode: string }; occasion?: string; finalUrls: string[] };
  leadFormAsset?: { businessName: string; callToActionType: string; headline: string; description: string };
}

export interface ConversionAction {
  id: string;
  name: string;
  type: ConversionActionType;
  category: ConversionActionCategory;
  status: "ENABLED" | "REMOVED" | "HIDDEN";
  resourceName: string;
  countingType?: "ONE_PER_CLICK" | "MANY_PER_CLICK";
  attributionModelSettings?: {
    attributionModel: AttributionModel;
    dataDrivenModelStatus?: string;
  };
  valueSettings?: {
    defaultValue?: number;
    defaultCurrencyCode?: string;
    alwaysUseDefaultValue?: boolean;
  };
  clickThroughLookbackWindowDays?: number;
  viewThroughLookbackWindowDays?: number;
  includeInConversionsMetric?: boolean;
  tagSnippets?: Array<{ type: string; pageHeader: string; eventSnippet: string }>;
}

export interface Audience {
  id: string;
  name: string;
  resourceName: string;
  description?: string;
  membershipStatus?: "OPEN" | "CLOSED";
  membershipLifeSpan?: number;
  sizeForSearch?: number;
  sizeForDisplay?: number;
  type?: string;
}

export interface Label {
  id: string;
  name: string;
  resourceName: string;
  textLabel?: {
    description?: string;
    backgroundColor?: string;
  };
}

export interface Recommendation {
  resourceName: string;
  type: RecommendationType;
  impact?: {
    baseMetrics?: Record<string, number>;
    potentialMetrics?: Record<string, number>;
  };
  campaignBudgetRecommendation?: {
    currentBudgetAmountMicros: string;
    recommendedBudgetAmountMicros: string;
  };
  keywordRecommendation?: {
    keyword: { text: string; matchType: KeywordMatchType };
    recommendedCpcBidMicros?: string;
  };
  responsiveSearchAdRecommendation?: {
    ad: ResponsiveSearchAd;
  };
  campaign?: string;
  adGroup?: string;
}

export interface ChangeEvent {
  changeDateTime: string;
  changeResourceName: string;
  changeResourceType: string;
  userEmail?: string;
  clientType?: string;
  oldResource?: Record<string, unknown>;
  newResource?: Record<string, unknown>;
  changedFields?: string;
}

export interface BiddingStrategy {
  id: string;
  name: string;
  type: BiddingStrategyType;
  resourceName: string;
  targetCpa?: { targetCpaMicros?: string };
  targetRoas?: { targetRoas?: number };
  maximizeConversions?: { targetCpaMicros?: string };
  maximizeConversionValue?: { targetRoas?: number };
  targetSpend?: { cpcBidCeilingMicros?: string };
  targetImpressionShare?: { location: string; locationFractionMicros?: string; cpcBidCeilingMicros?: string };
  campaignCount?: number;
  status?: string;
}

export interface GeoTargetConstant {
  resourceName: string;
  id: string;
  name: string;
  countryCode: string;
  targetType: string;
  canonicalName: string;
  parentGeoTarget?: string;
  status: string;
}

// --- Metrics ---

export interface MetricsRow {
  impressions: number;
  clicks: number;
  costMicros: number;
  ctr: number;
  averageCpc: number;
  averageCpm?: number;
  conversions: number;
  conversionsValue: number;
  costPerConversion: number;
  conversionRate: number;
  allConversions?: number;
  allConversionsValue?: number;
  searchImpressionShare?: number;
  searchBudgetLostImpressionShare?: number;
  searchRankLostImpressionShare?: number;
  interactionRate?: number;
  interactions?: number;
  // Segmentation
  date?: string;
  campaignId?: string;
  campaignName?: string;
  adGroupId?: string;
  adGroupName?: string;
  adId?: string;
  device?: string;
  adNetworkType?: string;
  dayOfWeek?: string;
  hour?: number;
  // Extended segmentations
  ageRange?: string;
  gender?: string;
  geoTargetRegion?: string;
  geoTargetCountry?: string;
}

// --- API Response Types ---

export interface GAQLResponse<T = unknown> {
  results?: T[];
  nextPageToken?: string;
  totalResultsCount?: string;
  fieldMask?: string;
  requestId?: string;
}

export interface MutateOperation<T = Record<string, unknown>> {
  create?: T;
  update?: T & { resourceName: string };
  remove?: string;
  updateMask?: string;
}

export interface MutateResponse {
  results?: Array<{
    resourceName: string;
    [key: string]: unknown;
  }>;
  partialFailureError?: {
    code: number;
    message: string;
    details: unknown[];
  };
  requestId?: string;
}

// --- Pagination ---

export interface PaginatedParams {
  pageSize?: number;
  pageToken?: string;
}

// --- Utility Functions for Metrics ---

export function parseNumeric(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

export function microsToUnits(micros: string | number | undefined | null): number {
  return parseNumeric(micros) / 1_000_000;
}

export function unitsToMicros(units: number): number {
  return Math.round(units * 1_000_000);
}

export function computeRoas(row: MetricsRow): number {
  if (row.costMicros === 0) return 0;
  return row.conversionsValue / microsToUnits(row.costMicros);
}

export function computeCpa(row: MetricsRow): number {
  if (row.conversions === 0) return 0;
  return microsToUnits(row.costMicros) / row.conversions;
}

/**
 * Normalizes raw GAQL row results into a typed MetricsRow.
 * Google Ads returns nested objects: { metrics: { impressions: "1000" }, campaign: { id: "1" }, segments: { date: "2024-01-01" } }
 */
export function normalizeMetricsRow(raw: Record<string, any>): MetricsRow {
  const m = raw.metrics || {};
  const seg = raw.segments || {};
  const camp = raw.campaign || {};
  const ag = raw.adGroup || {};
  const adGroupAd = raw.adGroupAd || {};

  return {
    impressions: parseNumeric(m.impressions),
    clicks: parseNumeric(m.clicks),
    costMicros: parseNumeric(m.costMicros),
    ctr: parseNumeric(m.ctr),
    averageCpc: parseNumeric(m.averageCpc),
    averageCpm: parseNumeric(m.averageCpm),
    conversions: parseNumeric(m.conversions),
    conversionsValue: parseNumeric(m.conversionsValue),
    costPerConversion: parseNumeric(m.costPerConversion),
    conversionRate: parseNumeric(m.conversionsFromInteractionsRate ?? m.conversionRate),
    allConversions: parseNumeric(m.allConversions),
    allConversionsValue: parseNumeric(m.allConversionsValue),
    searchImpressionShare: parseNumeric(m.searchImpressionShare),
    searchBudgetLostImpressionShare: parseNumeric(m.searchBudgetLostImpressionShare),
    searchRankLostImpressionShare: parseNumeric(m.searchRankLostImpressionShare),
    interactionRate: parseNumeric(m.interactionRate),
    interactions: parseNumeric(m.interactions),
    date: seg.date,
    campaignId: camp.id,
    campaignName: camp.name,
    adGroupId: ag.id,
    adGroupName: ag.name,
    adId: adGroupAd?.ad?.id,
    device: seg.device,
    adNetworkType: seg.adNetworkType,
    dayOfWeek: seg.dayOfWeek,
    hour: seg.hour != null ? parseNumeric(seg.hour) : undefined,
    ageRange: seg.ageRangeType,
    gender: seg.genderType,
    geoTargetRegion: seg.geoTargetRegion,
    geoTargetCountry: seg.geoTargetCountry,
  };
}
