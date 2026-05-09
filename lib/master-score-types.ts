
export type DomainId = 'daily_readiness' | 'structural_risk' | 'internal_health' | 'mental_readiness' | 'performance_capacity';

export interface ScoreDomain {
  id: DomainId;
  label: string;
  score: number;
  weight: number;
  confidence: number;
  factors: string[];
}

export interface MasterScoreResult {
  finalScore: number;
  domains: ScoreDomain[];
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  insights: string[];
  dynamicAdjustments: string[];
}

export interface MasterScoreProfile {
  sport?: string;
  age?: number;
  sex?: 'M' | 'F';
  seasonPhase?: 'preseason' | 'inseason' | 'return_to_play' | 'offseason';
}
