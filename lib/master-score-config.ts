
import { DomainId } from './master-score-types';

export const BASE_WEIGHTS: Record<DomainId, number> = {
  daily_readiness: 0.35,
  structural_risk: 0.25,
  internal_health: 0.15,
  mental_readiness: 0.15,
  performance_capacity: 0.10
};

export interface WeightProfile {
  daily_readiness?: number;
  structural_risk?: number;
  internal_health?: number;
  mental_readiness?: number;
  performance_capacity?: number;
}

export const SPORT_WEIGHT_ADJUSTMENTS: Record<string, WeightProfile> = {
  volleyball: {
    structural_risk: 0.35,
    daily_readiness: 0.40,
    internal_health: 0.10,
    mental_readiness: 0.10,
    performance_capacity: 0.05
  },
  football: {
    daily_readiness: 0.45,
    structural_risk: 0.30,
    internal_health: 0.10,
    mental_readiness: 0.10,
    performance_capacity: 0.05
  },
  basketball: {
    daily_readiness: 0.40,
    structural_risk: 0.30,
    internal_health: 0.10,
    mental_readiness: 0.10,
    performance_capacity: 0.10
  }
};

export const SEASON_WEIGHT_ADJUSTMENTS: Record<string, WeightProfile> = {
  preseason: {
    performance_capacity: 0.25,
    structural_risk: 0.30
  },
  inseason: {
    daily_readiness: 0.50,
    mental_readiness: 0.20
  },
  return_to_play: {
    structural_risk: 0.70,
    daily_readiness: 0.15,
    internal_health: 0.05,
    mental_readiness: 0.05,
    performance_capacity: 0.05
  },
  offseason: {
    internal_health: 0.30,
    performance_capacity: 0.30
  }
};
