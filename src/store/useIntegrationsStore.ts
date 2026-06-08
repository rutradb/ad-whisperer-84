import { create } from "zustand";

// ─── Pipedrive config ─────────────────────────────────────────────────────────

export interface PipedriveFieldMapping {
  utmCampaignFieldKey: string;   // custom deal field key (hash) for utm_campaign
  utmSourceFieldKey: string;     // custom deal field key for utm_source
  utmMediumFieldKey: string;     // custom deal field key for utm_medium
  defaultPipelineId: number | null; // which pipeline to use for CPA/correlation
}

export interface PipedriveConfig {
  apiToken: string;
  isConnected: boolean;
  fieldMapping: PipedriveFieldMapping;
}

// ─── Shopify config ───────────────────────────────────────────────────────────

export interface ShopifyFieldMapping {
  utmCampaignAttribute: string;  // note_attribute name that stores utm_campaign (default: "utm_campaign")
  utmSourceAttribute: string;    // note_attribute name that stores utm_source (default: "utm_source")
  utmMediumAttribute: string;    // note_attribute name that stores utm_medium (default: "utm_medium")
}

export interface ShopifyConfig {
  storeUrl: string;              // e.g., "mystore.myshopify.com"
  accessToken: string;
  isConnected: boolean;
  fieldMapping: ShopifyFieldMapping;
}

// ─── HubSpot config ───────────────────────────────────────────────────────────

export interface HubSpotConfig {
  accessToken: string;
  isConnected: boolean;
}

// ─── Full integrations state ──────────────────────────────────────────────────

export interface IntegrationsState {
  pipedrive: PipedriveConfig;
  shopify: ShopifyConfig;
  hubspot: HubSpotConfig;

  // Pipedrive setters
  setPipedriveApiToken: (token: string) => void;
  setPipedriveConnected: (v: boolean) => void;
  setPipedriveFieldMapping: (mapping: Partial<PipedriveFieldMapping>) => void;

  // Shopify setters
  setShopifyStoreUrl: (url: string) => void;
  setShopifyAccessToken: (token: string) => void;
  setShopifyConnected: (v: boolean) => void;
  setShopifyFieldMapping: (mapping: Partial<ShopifyFieldMapping>) => void;

  // HubSpot setters
  setHubSpotAccessToken: (token: string) => void;
  setHubSpotConnected: (v: boolean) => void;

  // Reset
  resetPipedrive: () => void;
  resetShopify: () => void;
  resetHubSpot: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PIPEDRIVE: PipedriveConfig = {
  apiToken: import.meta.env.VITE_PIPEDRIVE_API_TOKEN ?? "",
  isConnected: !!import.meta.env.VITE_PIPEDRIVE_API_TOKEN,
  fieldMapping: {
    utmCampaignFieldKey: "",
    utmSourceFieldKey: "",
    utmMediumFieldKey: "",
    defaultPipelineId: null,
  },
};

const DEFAULT_SHOPIFY: ShopifyConfig = {
  storeUrl: import.meta.env.VITE_SHOPIFY_STORE ?? "",
  accessToken: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? "",
  isConnected: !!(import.meta.env.VITE_SHOPIFY_STORE && import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN),
  fieldMapping: {
    utmCampaignAttribute: "utm_campaign",
    utmSourceAttribute: "utm_source",
    utmMediumAttribute: "utm_medium",
  },
};

const DEFAULT_HUBSPOT: HubSpotConfig = {
  accessToken: import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN ?? "",
  isConnected: !!import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN,
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const KEY = "integrations_config";

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { pipedrive?: Partial<PipedriveConfig>; shopify?: Partial<ShopifyConfig>; hubspot?: Partial<HubSpotConfig> };
  } catch {
    return null;
  }
};

const saveConfig = (state: { pipedrive: PipedriveConfig; shopify: ShopifyConfig; hubspot: HubSpotConfig }) => {
  localStorage.setItem(KEY, JSON.stringify({ pipedrive: state.pipedrive, shopify: state.shopify, hubspot: state.hubspot }));
};

const saved = loadConfig();

// ─── Store ────────────────────────────────────────────────────────────────────

const ENV_TOKEN = import.meta.env.VITE_PIPEDRIVE_API_TOKEN ?? "";
const ENV_SHOPIFY_STORE = import.meta.env.VITE_SHOPIFY_STORE ?? "";
const ENV_SHOPIFY_TOKEN = import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? "";
const ENV_HUBSPOT_TOKEN = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN ?? "";

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  pipedrive: saved?.pipedrive
    ? {
        ...DEFAULT_PIPEDRIVE,
        ...saved.pipedrive,
        apiToken: saved.pipedrive.apiToken || ENV_TOKEN,
        isConnected: !!(saved.pipedrive.apiToken || ENV_TOKEN),
        fieldMapping: { ...DEFAULT_PIPEDRIVE.fieldMapping, ...saved.pipedrive.fieldMapping },
      }
    : DEFAULT_PIPEDRIVE,

  shopify: saved?.shopify
    ? {
        ...DEFAULT_SHOPIFY,
        ...saved.shopify,
        storeUrl: saved.shopify.storeUrl || ENV_SHOPIFY_STORE,
        accessToken: saved.shopify.accessToken || ENV_SHOPIFY_TOKEN,
        isConnected: !!(saved.shopify.storeUrl || ENV_SHOPIFY_STORE) && !!(saved.shopify.accessToken || ENV_SHOPIFY_TOKEN),
        fieldMapping: { ...DEFAULT_SHOPIFY.fieldMapping, ...saved.shopify.fieldMapping },
      }
    : DEFAULT_SHOPIFY,

  hubspot: saved?.hubspot
    ? {
        ...DEFAULT_HUBSPOT,
        ...saved.hubspot,
        accessToken: saved.hubspot.accessToken || ENV_HUBSPOT_TOKEN,
        isConnected: !!(saved.hubspot.accessToken || ENV_HUBSPOT_TOKEN),
      }
    : DEFAULT_HUBSPOT,

  setPipedriveApiToken: (token) => {
    set((s) => {
      const next = { ...s, pipedrive: { ...s.pipedrive, apiToken: token, isConnected: false } };
      saveConfig(next);
      return next;
    });
  },
  setPipedriveConnected: (v) => {
    set((s) => {
      const next = { ...s, pipedrive: { ...s.pipedrive, isConnected: v } };
      saveConfig(next);
      return next;
    });
  },
  setPipedriveFieldMapping: (mapping) => {
    set((s) => {
      const next = {
        ...s,
        pipedrive: { ...s.pipedrive, fieldMapping: { ...s.pipedrive.fieldMapping, ...mapping } },
      };
      saveConfig(next);
      return next;
    });
  },

  setShopifyStoreUrl: (url) => {
    set((s) => {
      const next = { ...s, shopify: { ...s.shopify, storeUrl: url, isConnected: false } };
      saveConfig(next);
      return next;
    });
  },
  setShopifyAccessToken: (token) => {
    set((s) => {
      const next = { ...s, shopify: { ...s.shopify, accessToken: token, isConnected: false } };
      saveConfig(next);
      return next;
    });
  },
  setShopifyConnected: (v) => {
    set((s) => {
      const next = { ...s, shopify: { ...s.shopify, isConnected: v } };
      saveConfig(next);
      return next;
    });
  },
  setShopifyFieldMapping: (mapping) => {
    set((s) => {
      const next = {
        ...s,
        shopify: { ...s.shopify, fieldMapping: { ...s.shopify.fieldMapping, ...mapping } },
      };
      saveConfig(next);
      return next;
    });
  },

  resetPipedrive: () => {
    set((s) => { const next = { ...s, pipedrive: DEFAULT_PIPEDRIVE }; saveConfig(next); return next; });
  },
  resetShopify: () => {
    set((s) => { const next = { ...s, shopify: DEFAULT_SHOPIFY }; saveConfig(next); return next; });
  },

  setHubSpotAccessToken: (token) => {
    set((s) => {
      const next = { ...s, hubspot: { ...s.hubspot, accessToken: token, isConnected: false } };
      saveConfig(next);
      return next;
    });
  },
  setHubSpotConnected: (v) => {
    set((s) => {
      const next = { ...s, hubspot: { ...s.hubspot, isConnected: v } };
      saveConfig(next);
      return next;
    });
  },
  resetHubSpot: () => {
    set((s) => { const next = { ...s, hubspot: DEFAULT_HUBSPOT }; saveConfig(next); return next; });
  },
}));
