import { useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { useBusinessContextStore } from "@/store/useBusinessContextStore";

export interface OnboardingStep {
  id: string;
  label: string;
  isComplete: boolean;
  required: boolean;
}

export function useOnboardingProgress() {
  const { accessToken, selectedCustomer, anthropicApiKey } = useAuthStore();
  const { pipedrive, shopify, hubspot } = useIntegrationsStore();
  const { businessObjective, businessSegment } = useBusinessContextStore();

  const steps = useMemo<OnboardingStep[]>(() => [
    {
      id: "google-ads",
      label: "Google Ads",
      isComplete: !!accessToken && !!selectedCustomer,
      required: true,
    },
    {
      id: "ai",
      label: "Claude AI",
      isComplete: !!anthropicApiKey,
      required: false,
    },
    {
      id: "pipedrive",
      label: "Pipedrive",
      isComplete: pipedrive.isConnected,
      required: false,
    },
    {
      id: "shopify",
      label: "Shopify",
      isComplete: shopify.isConnected,
      required: false,
    },
    {
      id: "hubspot",
      label: "HubSpot",
      isComplete: hubspot.isConnected,
      required: false,
    },
    {
      id: "context",
      label: "Contexto",
      isComplete: !!businessObjective && !!businessSegment,
      required: false,
    },
  ], [accessToken, selectedCustomer, anthropicApiKey, pipedrive.isConnected, shopify.isConnected, hubspot.isConnected, businessObjective, businessSegment]);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);
  const isComplete = completedCount === steps.length;

  return { steps, completedCount, completionPercentage, isComplete };
}
