import { create } from "zustand";

export type BusinessObjective = "conversions" | "traffic" | "leads" | "awareness";

export interface BusinessContext {
  // Critérios de escala
  minDaysBeforeScale: number;
  minRoasToScale: number;
  minSpendToEvaluate: number; // R$
  maxFrequency: number;

  // Metas de custo (null = não configurado)
  targetRoas: number | null;
  maxCpa: number | null;        // R$
  maxCpc: number | null;        // R$
  averageTicket: number | null; // R$

  // Contexto do negócio
  businessObjective: BusinessObjective;
  businessSegment: string;

  // Regras livres
  customRules: string[];
}

export const BUSINESS_CONTEXT_DEFAULTS: BusinessContext = {
  minDaysBeforeScale: 2,
  minRoasToScale: 2.0,
  minSpendToEvaluate: 50,
  maxFrequency: 3.5,
  targetRoas: null,
  maxCpa: null,
  maxCpc: null,
  averageTicket: null,
  businessObjective: "conversions",
  businessSegment: "",
  customRules: [],
};

interface BusinessContextState extends BusinessContext {
  setMinDaysBeforeScale: (v: number) => void;
  setMinRoasToScale: (v: number) => void;
  setMinSpendToEvaluate: (v: number) => void;
  setMaxFrequency: (v: number) => void;
  setTargetRoas: (v: number | null) => void;
  setMaxCpa: (v: number | null) => void;
  setMaxCpc: (v: number | null) => void;
  setAverageTicket: (v: number | null) => void;
  setBusinessObjective: (v: BusinessObjective) => void;
  setBusinessSegment: (v: string) => void;
  addCustomRule: (rule: string) => void;
  removeCustomRule: (index: number) => void;
  updateCustomRule: (index: number, rule: string) => void;
  reset: () => void;
}

const PREFIX = "biz_ctx_";

const load = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) =>
  localStorage.setItem(PREFIX + key, JSON.stringify(value));

export const useBusinessContextStore = create<BusinessContextState>((set, get) => ({
  minDaysBeforeScale:  load("minDaysBeforeScale",  BUSINESS_CONTEXT_DEFAULTS.minDaysBeforeScale),
  minRoasToScale:      load("minRoasToScale",      BUSINESS_CONTEXT_DEFAULTS.minRoasToScale),
  minSpendToEvaluate:  load("minSpendToEvaluate",  BUSINESS_CONTEXT_DEFAULTS.minSpendToEvaluate),
  maxFrequency:        load("maxFrequency",         BUSINESS_CONTEXT_DEFAULTS.maxFrequency),
  targetRoas:          load("targetRoas",           BUSINESS_CONTEXT_DEFAULTS.targetRoas),
  maxCpa:              load("maxCpa",               BUSINESS_CONTEXT_DEFAULTS.maxCpa),
  maxCpc:              load("maxCpc",               BUSINESS_CONTEXT_DEFAULTS.maxCpc),
  averageTicket:       load("averageTicket",        BUSINESS_CONTEXT_DEFAULTS.averageTicket),
  businessObjective:   load("businessObjective",    BUSINESS_CONTEXT_DEFAULTS.businessObjective),
  businessSegment:     load("businessSegment",      BUSINESS_CONTEXT_DEFAULTS.businessSegment),
  customRules:         load("customRules",          BUSINESS_CONTEXT_DEFAULTS.customRules),

  setMinDaysBeforeScale: (v) => { save("minDaysBeforeScale", v); set({ minDaysBeforeScale: v }); },
  setMinRoasToScale:     (v) => { save("minRoasToScale", v);     set({ minRoasToScale: v }); },
  setMinSpendToEvaluate: (v) => { save("minSpendToEvaluate", v); set({ minSpendToEvaluate: v }); },
  setMaxFrequency:       (v) => { save("maxFrequency", v);       set({ maxFrequency: v }); },
  setTargetRoas:         (v) => { save("targetRoas", v);         set({ targetRoas: v }); },
  setMaxCpa:             (v) => { save("maxCpa", v);             set({ maxCpa: v }); },
  setMaxCpc:             (v) => { save("maxCpc", v);             set({ maxCpc: v }); },
  setAverageTicket:      (v) => { save("averageTicket", v);      set({ averageTicket: v }); },
  setBusinessObjective:  (v) => { save("businessObjective", v);  set({ businessObjective: v }); },
  setBusinessSegment:    (v) => { save("businessSegment", v);    set({ businessSegment: v }); },

  addCustomRule: (rule) => {
    const trimmed = rule.trim();
    if (!trimmed) return;
    const rules = [...get().customRules, trimmed];
    save("customRules", rules);
    set({ customRules: rules });
  },
  removeCustomRule: (index) => {
    const rules = get().customRules.filter((_, i) => i !== index);
    save("customRules", rules);
    set({ customRules: rules });
  },
  updateCustomRule: (index, rule) => {
    const rules = get().customRules.map((r, i) => (i === index ? rule : r));
    save("customRules", rules);
    set({ customRules: rules });
  },
  reset: () => {
    Object.keys(BUSINESS_CONTEXT_DEFAULTS).forEach((k) =>
      save(k, (BUSINESS_CONTEXT_DEFAULTS as unknown as Record<string, unknown>)[k])
    );
    set({ ...BUSINESS_CONTEXT_DEFAULTS });
  },
}));
