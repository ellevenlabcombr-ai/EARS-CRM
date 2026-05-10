
import { DomainId, MasterScoreResult, ScoreDomain, MasterScoreProfile } from './master-score-types';
import { BASE_WEIGHTS, SPORT_WEIGHT_ADJUSTMENTS, SEASON_WEIGHT_ADJUSTMENTS } from './master-score-config';

export const MasterScoreEngine = {
  calculate: (data: any, profile: MasterScoreProfile): MasterScoreResult => {
    const weights = MasterScoreEngine.getDynamicWeights(profile);
    
    // 1. Daily Readiness (0-100)
    // wellness, sono, fadiga, dor, energia, recovery
    const dr = MasterScoreEngine.calcDailyReadiness(data.wellness, data.lastCheckIn, data.ears);
    
    // 2. Structural Risk (0-100)
    // ortho, biomech, FMS, postural, dynamometry, history
    const sr = MasterScoreEngine.calcStructuralRisk(data.assessments, data.painHistory, data.tags);
    
    // 3. Internal Health (0-100)
    // nutrition, hydration, RED-S, menstrual, sleep chronic
    const ih = MasterScoreEngine.calcInternalHealth(data.assessments, data.wellnessRecords);
    
    // 4. Mental Readiness (0-100)
    // psychological, stress, confidence, motivation
    const mr = MasterScoreEngine.calcMentalReadiness(data.assessments, data.wellness);
    
    // 5. Performance Capacity (0-100)
    // physical, strength, power, anthropometry
    const pc = MasterScoreEngine.calcPerformanceCapacity(data.assessments);

    const domains: ScoreDomain[] = [
      { id: 'daily_readiness', label: 'Prontidão Diária', score: dr.score, weight: weights.daily_readiness, confidence: dr.confidence, factors: dr.factors },
      { id: 'structural_risk', label: 'Risco Estrutural', score: sr.score, weight: weights.structural_risk, confidence: sr.confidence, factors: sr.factors },
      { id: 'internal_health', label: 'Saúde Interna', score: ih.score, weight: weights.internal_health, confidence: ih.confidence, factors: ih.factors },
      { id: 'mental_readiness', label: 'Prontidão Mental', score: mr.score, weight: weights.mental_readiness, confidence: mr.confidence, factors: mr.factors },
      { id: 'performance_capacity', label: 'Capacidade de Performance', score: pc.score, weight: weights.performance_capacity, confidence: pc.confidence, factors: pc.factors }
    ];

    // Redistribution if domain has 0 confidence (no data)
    let totalWeightUsed = 0;
    const availableDomains = domains.filter(d => d.confidence > 0);
    availableDomains.forEach(d => totalWeightUsed += d.weight);

    let finalScore = 0;
    let totalConfidence = 0;

    if (totalWeightUsed > 0) {
      availableDomains.forEach(d => {
        const adjustedWeight = d.weight / totalWeightUsed;
        finalScore += d.score * adjustedWeight;
        totalConfidence += d.confidence * adjustedWeight;
      });
    }

    const insights = MasterScoreEngine.generateInsights(domains, profile);

    return {
      finalScore: Math.round(finalScore),
      domains,
      confidence: totalConfidence > 75 ? 'high' : totalConfidence > 40 ? 'medium' : 'low',
      confidenceScore: Math.round(totalConfidence),
      insights,
      dynamicAdjustments: MasterScoreEngine.getAdjustmentLog(profile)
    };
  },

  getDynamicWeights: (profile: MasterScoreProfile): Record<DomainId, number> => {
    let weights = { ...BASE_WEIGHTS };
    const sport = profile.sport?.toLowerCase() || '';

    // Apply Sport Adjustments
    if (sport.includes('volley') || sport.includes('vôlei')) {
      weights = { ...weights, ...SPORT_WEIGHT_ADJUSTMENTS.volleyball };
    } else if (sport.includes('foot') || sport.includes('futebol')) {
      weights = { ...weights, ...SPORT_WEIGHT_ADJUSTMENTS.football };
    } else if (sport.includes('basket')) {
      weights = { ...weights, ...SPORT_WEIGHT_ADJUSTMENTS.basketball };
    }

    // Apply Season Adjustments
    if (profile.seasonPhase && SEASON_WEIGHT_ADJUSTMENTS[profile.seasonPhase]) {
      weights = { ...weights, ...SEASON_WEIGHT_ADJUSTMENTS[profile.seasonPhase] };
    }

    // Age Adjustments
    if (profile.age) {
      if (profile.age < 18) {
        weights.structural_risk *= 1.2;
      } else if (profile.age > 35) {
        weights.daily_readiness *= 1.2; // Recovery focus
        weights.structural_risk *= 1.1;
      }
    }

    // Normalize weights to sum 1
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    (Object.keys(weights) as DomainId[]).forEach(k => weights[k] /= sum);

    return weights;
  },

  calcDailyReadiness: (wellness: any, lastCheckIn: any, ears: any) => {
    const score = ears?.score || wellness?.readiness_score || 70;
    const factors = [];
    if (wellness?.fatigue_level > 3) factors.push('Fadiga elevada');
    if (wellness?.sleep_quality < 3) factors.push('Sono não restaurador');
    
    return {
      score,
      confidence: wellness ? 100 : 20,
      factors
    };
  },

  calcStructuralRisk: (assessments: any[], painHistory: any[], tags: any[]) => {
    const safeAssessments = assessments || [];
    const safePainHistory = painHistory || [];
    const safeTags = tags || [];

    const ortho = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('ortho'))?.score || 100;
    const biomech = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('biomech'))?.score || 100;
    const dynamometry = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('dynamo'))?.score || 100;
    
    const factors = [];
    if (ortho < 70) factors.push('Fração Ortopédica crítica');
    if (safePainHistory.length > 3) factors.push('Histórico de dor recorrente');
    if (safeTags.some((t: any) => t && (t?.tag || t?.tag_name || typeof t === 'string' ? t : '')?.toString().toLowerCase().includes('risk'))) factors.push('Tags de risco estrutural');

    const score = (ortho * 0.4) + (biomech * 0.3) + (dynamometry * 0.3);
    
    return {
      score,
      confidence: safeAssessments.some((a: any) => ['ortho', 'biomech', 'dynamo'].some(t => String(a?.type || a?.assessment_type || '').toLowerCase().includes(t))) ? 90 : 30,
      factors
    };
  },

  calcInternalHealth: (assessments: any[], wellnessRecords: any[]) => {
    const safeAssessments = assessments || [];
    const nutrition = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('nutri'))?.score || 80;
    const reds = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('reds'))?.score || 100;
    const hydration = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('hydra'))?.score || 80;
    
    const factors = [];
    if (hydration < 50) factors.push('Déficit de hidratação detectado');

    return {
      score: (nutrition * 0.4) + (reds * 0.4) + (hydration * 0.2),
      confidence: safeAssessments.some((a: any) => ['nutri', 'reds', 'hydra'].some(t => String(a?.type || a?.assessment_type || '').toLowerCase().includes(t))) ? 85 : 10,
      factors
    };
  },

  calcMentalReadiness: (assessments: any[], wellness: any) => {
    const safeAssessments = assessments || [];
    const psycho = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('psycho'))?.score || 80;
    const stress = wellness?.stress_level ? (6 - wellness.stress_level) * 20 : 70;
    const motivation = wellness?.mood ? wellness.mood * 20 : 70;

    return {
      score: (psycho * 0.5) + (stress * 0.25) + (motivation * 0.25),
      confidence: psycho < 100 ? 90 : 40,
      factors: psycho < 60 ? ['Indicadores psicológicos em atenção'] : []
    };
  },

  calcPerformanceCapacity: (assessments: any[]) => {
    const safeAssessments = assessments || [];
    const physical = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('physic'))?.score || 70;
    const strength = safeAssessments.find((a: any) => String(a?.type || a?.assessment_type || '').toLowerCase().includes('strength'))?.score || 70;

    return {
      score: (physical * 0.6) + (strength * 0.4),
      confidence: safeAssessments.some((a: any) => ['physic', 'strength'].some(t => String(a?.type || a?.assessment_type || '').toLowerCase().includes(t))) ? 80 : 20,
      factors: []
    };
  },

  generateInsights: (domains: ScoreDomain[], profile: MasterScoreProfile) => {
    const insights = [];
    const readiness = domains.find(d => d.id === 'daily_readiness');
    const structural = domains.find(d => d.id === 'structural_risk');
    
    if (readiness && readiness.score < 60) insights.push('Fadiga elevada impactando prontidão');
    if (structural && structural.score < 70) insights.push('Risco estrutural moderado detectado');
    if (readiness && readiness.score > 85) insights.push('Sono adequado elevando prontidão diária');
    
    return insights.slice(0, 3);
  },

  getAdjustmentLog: (profile: MasterScoreProfile) => {
    const logs = [];
    if (profile.sport) logs.push(`Ajuste dinâmico para: ${profile.sport}`);
    if (profile.seasonPhase) logs.push(`Fase da temporada: ${profile.seasonPhase}`);
    if (profile.age && profile.age < 18) logs.push('Sensibilidade aumentada p/ desenvolvimento jovem');
    return logs;
  }
};
