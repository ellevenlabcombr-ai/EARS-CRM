import { SafeModeLevel, SafeModeColor } from "./safe-mode-types";

export const SAFE_MODE_THRESHOLDS = {
  PAIN_INCREASE: 2, // 2+ points
  PAIN_HIGH: 7, // 7+ absolute pain points
  PAIN_CONSECUTIVE_DAYS: 3, // 3+ checkins with pain in same region
  SLEEP_DROP: 2, // days of bad sleep
  SCORE_WARNING: 75,
  READINESS_LOW: 40, // Below 40% readiness is critical
};

export const SAFE_MODE_MESSAGES = {
  PAIN_TREND: "Dor em progressão detectada.",
  PAIN_HIGH: "Nível de dor absoluto elevado.",
  CRITICAL_READINESS: "Prontidão em nível crítico.",
  RECOVERY_DROP: "Recuperação incompatível com demanda atual.",
  STRUCTURAL_RISK: "Risco estrutural oculto identificado.",
  CONTRADICTORY_SIGNS: "Score aparentemente bom com sinais contraditórios.",
  OUTDATED_DATA: "Confiabilidade reduzida por dados antigos.",
  RETURN_PHASE: "Fase de retorno requer cautela adicional.",
};

export const SAFE_MODE_RECOMMENDATIONS = {
  low: "Monitorar e reavaliar amanhã.",
  moderate: "Ajustar carga / priorizar recovery.",
  high: "Reavaliar antes de estímulo intenso.",
};

export const LEVEL_COLORS: Record<SafeModeLevel, SafeModeColor> = {
  low: "yellow",
  moderate: "orange",
  high: "red",
};
