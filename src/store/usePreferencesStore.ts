import { create } from "zustand";

export type DatePreset = "today" | "yesterday" | "last_7d" | "last_14d" | "last_30d" | "last_90d" | "this_month" | "last_month";
export type Currency = "BRL" | "USD" | "EUR";
export type NumberFormat = "pt-BR" | "en-US";

interface PreferencesState {
  defaultDatePreset: DatePreset;
  currency: Currency;
  numberFormat: NumberFormat;
  compactNumbers: boolean;
  setDefaultDatePreset: (v: DatePreset) => void;
  setCurrency: (v: Currency) => void;
  setNumberFormat: (v: NumberFormat) => void;
  setCompactNumbers: (v: boolean) => void;
}

const load = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  defaultDatePreset: load<DatePreset>("pref_date_preset", "last_30d"),
  currency: load<Currency>("pref_currency", "BRL"),
  numberFormat: load<NumberFormat>("pref_number_format", "pt-BR"),
  compactNumbers: load<boolean>("pref_compact_numbers", false),

  setDefaultDatePreset: (v) => { localStorage.setItem("pref_date_preset", JSON.stringify(v)); set({ defaultDatePreset: v }); },
  setCurrency: (v) => { localStorage.setItem("pref_currency", JSON.stringify(v)); set({ currency: v }); },
  setNumberFormat: (v) => { localStorage.setItem("pref_number_format", JSON.stringify(v)); set({ numberFormat: v }); },
  setCompactNumbers: (v) => { localStorage.setItem("pref_compact_numbers", JSON.stringify(v)); set({ compactNumbers: v }); },
}));
