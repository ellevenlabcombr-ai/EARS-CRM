export type SafeModeLevel = "low" | "moderate" | "high";
export type ConfidenceImpact = "none" | "low" | "medium" | "high";
export type SafeModeColor = "yellow" | "orange" | "red";

export interface SafeModeResult {
  active: boolean;
  level: SafeModeLevel;
  confidenceImpact: ConfidenceImpact;
  title: string;
  summary: string;
  reasons: string[];
  recommendations: string[];
  color: SafeModeColor;
  overrideActive?: boolean;
}

export interface SafeModeInput {
  masterScore: number;
  recentWellness: any[];
  clinicalAssessments: any[];
  injuryStatus?: "healthy" | "return_to_play" | "injured";
  confidenceScore?: number;
}
