import { SafeModeInput, SafeModeResult, SafeModeLevel } from "./safe-mode-types";
import { SAFE_MODE_THRESHOLDS, SAFE_MODE_MESSAGES, SAFE_MODE_RECOMMENDATIONS, LEVEL_COLORS } from "./safe-mode-config";

export function evaluateSafeMode(input: SafeModeInput): SafeModeResult {
  const reasons: string[] = [];
  const { masterScore, recentWellness, clinicalAssessments, injuryStatus } = input;
  
  let triggersCountLow = 0;
  let triggersCountModerate = 0;
  let triggersCountHigh = 0;

  // Ensure we have sorted wellness data by date descending
  const recent = [...(recentWellness || [])].sort((a, b) => {
    const timeA = new Date(a.record_date || a.date).getTime();
    const timeB = new Date(b.record_date || b.date).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
  
  // A) Pain Trend & Level
  let painTrendActive = false;
  let extremePainActive = false;
  const getPain = (w: any) => Math.max(
    w?.pain_level ? Number(w.pain_level) : 0,
    w?.muscle_soreness ? Number(w.muscle_soreness) : 0,
    w?.soreness ? Number(w.soreness) : 0,
    w?.pain ? Number(w.pain) : 0,
    w?.dor ? Number(w.dor) : 0
  );

  if (recent.length >= 1) {
    const latestPain = getPain(recent[0]);
    if (latestPain >= SAFE_MODE_THRESHOLDS.PAIN_HIGH) {
      reasons.push(SAFE_MODE_MESSAGES.PAIN_HIGH + ` (Nível ${latestPain})`);
      triggersCountHigh++;
      extremePainActive = true;
    }

    if (recent.length >= 2) {
      const prevPain = getPain(recent[1]);
      if (latestPain - prevPain >= SAFE_MODE_THRESHOLDS.PAIN_INCREASE) {
        reasons.push(SAFE_MODE_MESSAGES.PAIN_TREND + ` (Aumento de ${latestPain - prevPain} pontos)`);
        triggersCountModerate++;
        painTrendActive = true;
      }
    }
  }
  
  if (recent.length >= SAFE_MODE_THRESHOLDS.PAIN_CONSECUTIVE_DAYS && !painTrendActive) {
    // Check same region
    const latestRegions = recent[0]?.pain_regions || [];
    if (latestRegions.length > 0) {
      const allHaveRegion = recent.slice(0, SAFE_MODE_THRESHOLDS.PAIN_CONSECUTIVE_DAYS).every((w) => {
        const regions = w.pain_regions || [];
        return latestRegions.some((r: string) => regions.includes(r));
      });
      if (allHaveRegion) {
        reasons.push(SAFE_MODE_MESSAGES.PAIN_TREND + " (Mesma região persistente)");
        triggersCountModerate++;
        painTrendActive = true;
      }
    }
  }

  // B) Sleep / Recovery drop
  let recoveryDropActive = false;
  if (recent.length >= 2) {
    const latestSleep = recent[0]?.sleep_quality || 10;
    const prevSleep = recent[1]?.sleep_quality || 10;
    if (latestSleep < 5 && prevSleep < 5) {
      reasons.push(SAFE_MODE_MESSAGES.RECOVERY_DROP + " (Sono ruim contínuo)");
      triggersCountModerate++;
      recoveryDropActive = true;
    } else {
      const fatigue = recent[0]?.fatigue_level || recent[0]?.fatigue || 0;
      if (latestSleep >= 5 && fatigue > 7) {
        reasons.push(SAFE_MODE_MESSAGES.RECOVERY_DROP + " (Fadiga alta persistente)");
        triggersCountModerate++;
        recoveryDropActive = true;
      }
    }
  }

  // C) Asymmetry / Structural Risk
  let structuralRiskActive = false;
  if (clinicalAssessments && clinicalAssessments.length > 0) {
    // Look for recent dynamometry or asymmetry markers
    const latestAssessment = clinicalAssessments[0];
    if (latestAssessment) {
      // Very basic structural risk check logic here - will adapt if missing
      // We look at tags or specific test results if available
      const tags = latestAssessment.tags || [];
      const hasStructuralRisk = tags.some((t: string) => t.toLowerCase().includes('assimetria') || t.toLowerCase().includes('déficit'));
      if (hasStructuralRisk) {
        reasons.push(SAFE_MODE_MESSAGES.STRUCTURAL_RISK);
        triggersCountHigh++;
        structuralRiskActive = true;
      }
    }
  }

  // D) High score but contradictory signs
  if (masterScore > SAFE_MODE_THRESHOLDS.SCORE_WARNING) {
    const latestWellness = recent[0];
    if (latestWellness) {
      const getPainInner = (w: any) => Math.max(
        w?.pain_level ? Number(w.pain_level) : 0,
        w?.muscle_soreness ? Number(w.muscle_soreness) : 0,
        w?.soreness ? Number(w.soreness) : 0,
        w?.pain ? Number(w.pain) : 0,
        w?.dor ? Number(w.dor) : 0
      );
      const pain = getPainInner(latestWellness);
      const stress = latestWellness.stress_level || latestWellness.stress || 0;
      const sleep = latestWellness.sleep_quality || 10;
      if (pain >= 5 || stress >= 7 || sleep <= 4) {
        reasons.push(SAFE_MODE_MESSAGES.CONTRADICTORY_SIGNS);
        triggersCountModerate++;
      }
    }
  }

  // E) Outdated Data
  if (!recent || recent.length === 0) {
    reasons.push(SAFE_MODE_MESSAGES.OUTDATED_DATA);
    triggersCountLow++;
  } else {
    // Check if latest wellness is more than 3 days old
    const latestDate = new Date(recent[0].record_date || recent[0].date);
    const now = new Date();
    const daysDiff = (now.getTime() - latestDate.getTime()) / (1000 * 3600 * 24);
    if (daysDiff > 3) {
      reasons.push(SAFE_MODE_MESSAGES.OUTDATED_DATA + ` (${Math.floor(daysDiff)} dias sem registro)`);
      triggersCountLow++;
    }
  }

  // F) Recent return / injury
  let returnPhaseActive = false;
  if (injuryStatus === "return_to_play" || injuryStatus === "injured") {
    reasons.push(SAFE_MODE_MESSAGES.RETURN_PHASE);
    triggersCountModerate++;
    returnPhaseActive = true;
  }

  // G) Critical Readiness
  if (recent.length >= 1) {
    const latestWellness = recent[0];
    const readiness = Number(latestWellness.readiness_score || latestWellness.readiness || 0);
    if (readiness <= SAFE_MODE_THRESHOLDS.READINESS_LOW && readiness > 0) {
      reasons.push(SAFE_MODE_MESSAGES.CRITICAL_READINESS + ` (${readiness}%)`);
      triggersCountHigh++;
    }
  }

  // Determine Level
  let level: SafeModeLevel = "low";
  let active = false;

  if (triggersCountHigh > 0 || (painTrendActive && structuralRiskActive) || (returnPhaseActive && recoveryDropActive)) {
    level = "high";
    active = true;
  } else if (triggersCountModerate >= 2 || triggersCountHigh === 1 || structuralRiskActive || returnPhaseActive) {
    level = "moderate";
    active = true;
  } else if (triggersCountModerate === 1 || triggersCountLow >= 1) {
    level = "low";
    active = true;
  }

  if (!active) {
    return {
      active: false,
      level: "low",
      confidenceImpact: "none",
      title: "Safe Mode Inativo",
      summary: "Sem riscos aparentes",
      reasons: [],
      recommendations: [],
      color: "yellow"
    };
  }

  return {
    active: true,
    level,
    confidenceImpact: level === "high" ? "high" : level === "moderate" ? "medium" : "low",
    title: `SAFE MODE ${level === 'high' ? '🔴' : level === 'moderate' ? '⚠️' : '🟡'}`,
    summary: level === 'high' ? 'Risco oculto relevante detectado.' : level === 'moderate' ? 'Número aceitável, contexto pede cautela.' : 'Leves alertas presentes, sem gravidade estrutural.',
    reasons,
    recommendations: [SAFE_MODE_RECOMMENDATIONS[level]],
    color: LEVEL_COLORS[level]
  };
}
