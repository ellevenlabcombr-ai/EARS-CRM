import { PriorityEngine } from './lib/priority-engine';
console.log("PriorityEngine...");
PriorityEngine.process({
  decision: "recovery" as any,
  confidence: "low",
  riskScore: 50,
  trendScore: 0,
  factors: ["factor 1"],
  actions: ["action 1"],
  tags: []
});
console.log("SUCCESS");
