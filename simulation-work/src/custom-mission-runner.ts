import { createMissionConfig } from "./mission-config.js";
import type { CustomMissionConfig } from "./mission-config.js";
import { SimulationEngine } from "./engine.js";
import { MissionRunner } from "./mission-runner.js";
import { evaluateObjectives } from "./objective-evaluator.js";
import { calculateFinalMissionScore } from "./scoring.js";

export interface CustomMissionResult {
  name: string;
  mission: ReturnType<MissionRunner["run"]>;
  evaluation: ReturnType<typeof evaluateObjectives>;
  score: ReturnType<typeof calculateFinalMissionScore>;
  telemetryHistory: ReturnType<SimulationEngine["getTelemetryHistory"]>;
}

export function runCustomMission(
  input: CustomMissionConfig,
): CustomMissionResult {
  // Create and validate mission configuration
  const configuredMission = createMissionConfig(input);

  // Initialize spacecraft simulation
  const engine = new SimulationEngine(configuredMission.config);
  const runner = new MissionRunner(engine);

  // Execute mission
  const mission = runner.run(configuredMission.durationSeconds);

  // Evaluate objectives
  const evaluation = evaluateObjectives(
    mission,
    engine.getTelemetryHistory(),
    configuredMission.objectiveTargets,
  );

  // Calculate final score
  const score = calculateFinalMissionScore(
    mission.status,
    evaluation.objectives,
  );

  return {
    name: configuredMission.name,
    mission,
    evaluation,
    score,
    telemetryHistory: engine.getTelemetryHistory(),
  };
}
