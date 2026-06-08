/**
 * Modelos de atribuicao validos no Google Ads.
 */
export const VALID_ATTRIBUTION_MODELS = [
  "LAST_CLICK",
  "FIRST_CLICK",
  "LINEAR",
  "TIME_DECAY",
  "POSITION_BASED",
  "DATA_DRIVEN",
] as const;

export type AttributionModel = (typeof VALID_ATTRIBUTION_MODELS)[number];

const DEFAULT_ATTRIBUTION: AttributionModel = "LAST_CLICK";

const ATTRIBUTION_OPTIONS: { value: AttributionModel; label: string }[] = [
  { value: "LAST_CLICK", label: "Ultimo Clique" },
  { value: "FIRST_CLICK", label: "Primeiro Clique" },
  { value: "LINEAR", label: "Linear" },
  { value: "TIME_DECAY", label: "Reducao de Tempo" },
  { value: "POSITION_BASED", label: "Baseado em Posicao" },
  { value: "DATA_DRIVEN", label: "Baseado em Dados" },
];

interface AttributionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function normalizeAttributionValue(value: string): AttributionModel {
  if (VALID_ATTRIBUTION_MODELS.includes(value as AttributionModel)) {
    return value as AttributionModel;
  }
  return DEFAULT_ATTRIBUTION;
}

export function AttributionSelector({ value, onChange }: AttributionSelectorProps) {
  const safeValue = normalizeAttributionValue(value);

  return (
    <select
      value={safeValue}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-[220px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Modelo de Atribuicao"
    >
      {ATTRIBUTION_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
