import { SimulationEngine } from "./engine.js";
import { MissionRunner } from "./mission-runner.js";
import { evaluateObjectives } from "./objective-evaluator.js";
import {
  calculateFinalMissionScore,
  calculateMissionScore,
} from "./scoring.js";
import type { SimulationConfig } from "./engine.js";
import { getMissionProfile } from "./mission-profiles.js";

const profile = getMissionProfile("deep-space");
const config = profile.config;

try {
  const engine = new SimulationEngine(config);
  const runner = new MissionRunner(engine);

  // Run simulation for 600 seconds
  const missionResult = runner.run(profile.durationSeconds);

  // Evaluate mission objectives
  const evaluation = evaluateObjectives(
    missionResult,
    engine.getTelemetryHistory(),
    profile.objectiveTargets,
  );

  // Calculate mission score
  const score = calculateFinalMissionScore(
    missionResult.status,
    evaluation.objectives,
  );

  // Display results
  console.log("\n===== MISSION RESULTS =====");
  console.log("Mission status:", missionResult.status);
  console.log("Mission reason:", missionResult.reason);
  console.log("Steps executed:", missionResult.stepsExecuted);

  console.log("\n===== OBJECTIVES =====");
  console.log(
    `Completed: ${evaluation.completedCount}/${evaluation.totalCount}`,
  );
  console.log(`Completion: ${evaluation.completionPercent.toFixed(2)}%`);

  for (const objective of score.objectiveScores) {
    console.log(`${objective.id}: ${objective.completionPercent.toFixed(2)}%`);
  }

  console.log("\n===== SCORE =====");
  console.log("Score:", score.totalScore);
  console.log("Grade:", score.grade);
} catch (error) {
  console.error(
    "Mission configuration failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
}
