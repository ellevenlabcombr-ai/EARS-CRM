
export interface DecayedMetrics {
  weightedPain: number;
  weightedSleep: number;
  weightedLoad: number;
  weightedReadiness: number;
}

function calculateWeightedValue(values: number[], lambda: number = 0.5): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let totalWeight = 0;
    let weightedSum = 0;

    // We assume the last element is the most recent (Today)
    const reversed = [...values].reverse(); // Today, Yesterday, Day Before...

    reversed.forEach((val, index) => {
      const weight = Math.exp(-lambda * index);
      weightedSum += val * weight;
      totalWeight += weight;
    });

    return weightedSum / totalWeight;
}

function processHistory(history: any[]): DecayedMetrics {
    const sortedHistory = [...history].sort((a, b) => {
        const dateA = new Date(a.date || a.record_date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.record_date || b.created_at || 0).getTime();
        return dateA - dateB;
    });

    const painValues = sortedHistory.map(h => {
        if (h.pain_map && Array.isArray(h.pain_map)) {
            return Math.max(...h.pain_map.map((p: any) => p.level), 0);
        }
        return h.muscle_soreness || 0;
    });
    const sleepValues = sortedHistory.map(h => h.sleep_hours || 8);
    const loadValues = sortedHistory.map(h => h.session_load || 0);
    const readinessValues = sortedHistory.map(h => h.readiness_score || 100);

    return {
      weightedPain: calculateWeightedValue(painValues),
      weightedSleep: calculateWeightedValue(sleepValues),
      weightedLoad: calculateWeightedValue(loadValues),
      weightedReadiness: calculateWeightedValue(readinessValues)
    };
}

export const DecayEngine = {
  /**
   * Applies exponential-like decay to a series of values.
   * Higher index = more recent.
   * Formula: weight = e^(-lambda * days_ago)
   */
  calculateWeightedValue,

  /**
   * Processes a history of records to provide weighted averages for core metrics.
   */
  processHistory
};
