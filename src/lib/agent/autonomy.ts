// =============================================================================
// autonomy — auto-aprovação graduada de propostas (Fase 5)
// =============================================================================
//
// Permite que certos tiers de risco sejam auto-aprovados (e executados) sem
// passar pelo gate manual. SEMPRE com kill-switch global (`enabled`) e com
// risco ALTO nunca elegível, por segurança.
//
// Config guardada em localStorage (padrão do projeto p/ preferências de cliente).
// =============================================================================

export type RiskTier = "low" | "medium" | "high";

export interface AutonomyConfig {
  /** Kill-switch global: se false, nada é auto-aprovado. */
  enabled: boolean;
  /** Tiers elegíveis a auto-aprovação (high é ignorado por segurança). */
  tiers: RiskTier[];
}

const KEY = "ai_autonomy_config";

const DEFAULT_CONFIG: AutonomyConfig = { enabled: false, tiers: [] };

export function getAutonomyConfig(): AutonomyConfig {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        tiers: Array.isArray(parsed.tiers) ? parsed.tiers.filter((t: string) => t === "low" || t === "medium") : [],
      };
    }
  } catch {
    // ignora config corrompida
  }
  return { ...DEFAULT_CONFIG };
}

export function setAutonomyConfig(cfg: AutonomyConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      enabled: !!cfg.enabled,
      tiers: cfg.tiers.filter((t) => t === "low" || t === "medium"),
    }));
  } catch {
    // ignora falha de persistência
  }
}

/** Risco ALTO nunca é auto-aprovado, mesmo se configurado. */
export function shouldAutoApprove(riskTier: string): boolean {
  if (riskTier === "high") return false;
  const cfg = getAutonomyConfig();
  return cfg.enabled && cfg.tiers.includes(riskTier as RiskTier);
}
