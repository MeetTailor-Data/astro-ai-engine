
import { describe, it, expect } from "vitest";
import { SimulationEngine } from "../src/engine.js";
import { MissionRunner } from "../src/mission-runner.js";
import { evaluateObjectives } from "../src/objective-evaluator.js";
import { calculateFinalMissionScore } from "../src/scoring.js";
import {
  getAllMissionProfiles
} from "../src/mission-profiles.js";

describe("Mission Profile Integration", () => {
  const profiles = getAllMissionProfiles();

  for (const profile of profiles) {
    it(`${profile.name} runs end-to-end`, () => {
      const engine = new SimulationEngine(profile.config);
      const runner = new MissionRunner(engine);

      const mission = runner.run(profile.durationSeconds);

      const evaluation = evaluateObjectives(
        mission,
        engine.getTelemetryHistory(),
        profile.objectiveTargets
      );

      const score = calculateFinalMissionScore(
        mission.status,
        evaluation.objectives
      );

      expect(mission.stepsExecuted).toBeGreaterThan(0);
      expect(evaluation.totalCount).toBe(3);
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
      expect(score.totalScore).toBeLessThanOrEqual(100);
      expect(score.missionStatus).toBe(mission.status);
    });
  }
});
