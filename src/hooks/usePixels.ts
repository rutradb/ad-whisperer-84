/**
 * @deprecated Use useConversions hook instead. Pixels are now "Conversion Actions" in Google Ads.
 */
export {
  useConversionActions as usePixels,
  useCreateConversionAction as useCreateCustomConversion,
  useRemoveConversionAction as useDeleteCustomConversion,
} from "./useConversions";
