
import { describe, it, expect } from "vitest";
import { evaluateObjectives } from "../src/objective-evaluator.js";
import type { MissionResult } from "../src/mission-runner.js";
import type { Telemetry } from "../src/engine.js";

const telemetry: Telemetry = {
  simulationTimeSeconds: 60,
  orbitalPhase: 0.2,
  inEclipse: false,
  generatedPowerW: 700,
  netPowerW: 100,
  batteryEnergyWh: 400,
  dataGeneratedGB: 0.01,
  dataTransmittedGB: 0.01,
  dataBufferGB: 0,
  executedEvents: []
};

const mission: MissionResult = {
  status: "COMPLETED",
  reason: "Mission duration reached",
  stepsExecuted: 1,
  startTimeSeconds: 0,
  endTimeSeconds: 60,
  progressPercent: 100,
  finalTelemetry: telemetry
};

const targets = {
  minimumBatteryEnergyWh: 100,
  targetDataTransmittedGB: 0.01
};

describe("Objective Evaluator", () => {
  it("evaluates successful mission objectives", () => {
    const result = evaluateObjectives(
      mission,
      [telemetry],
      targets
    );

    expect(result.totalCount).toBe(3);
    expect(result.completedCount).toBe(3);
    expect(result.completionPercent).toBe(100);
  });

  it("detects insufficient battery energy", () => {
    const result = evaluateObjectives(
      {
        ...mission,
        finalTelemetry: {
          ...telemetry,
          batteryEnergyWh: 50
        }
      },
      [telemetry],
      targets
    );

    expect(result.objectives[1]?.achieved).toBe(50);
    expect(result.completedCount).toBe(2);
  });

  it("detects insufficient data transmission", () => {
    const result = evaluateObjectives(
      mission,
      [{
        ...telemetry,
        dataTransmittedGB: 0
      }],
      targets
    );

    expect(result.completedCount).toBe(2);
  });

  it("rejects invalid targets", () => {
    expect(() =>
      evaluateObjectives(mission, [telemetry], {
        minimumBatteryEnergyWh: -1,
        targetDataTransmittedGB: 1
      })
    ).toThrow();
  });
});
