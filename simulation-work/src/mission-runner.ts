
import type { Telemetry } from "./engine.js";
import { SimulationEngine } from "./engine.js";

export type MissionStatus = "COMPLETED" | "FAILED";

export interface MissionResult {
  status: MissionStatus;
  reason: string;
  stepsExecuted: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  progressPercent: number;
  finalTelemetry: Telemetry;
}

const MAX_MISSION_DURATION_SECONDS = 10_000_000;
const MAX_STEPS = 1_000_000;

export class MissionRunner {
  private readonly engine: SimulationEngine;

  constructor(engine: SimulationEngine) {
    if (!(engine instanceof SimulationEngine)) {
      throw new Error("A valid SimulationEngine is required");
    }

    this.engine = engine;
  }

  run(missionDurationSeconds: number): MissionResult {
    if (
      !Number.isFinite(missionDurationSeconds) ||
      missionDurationSeconds <= 0 ||
      missionDurationSeconds > MAX_MISSION_DURATION_SECONDS
    ) {
      throw new Error("Mission duration must be between 0 and 10,000,000 seconds");
    }

    const startTimeSeconds = this.engine.getCurrentTime();
    const targetTimeSeconds =
      startTimeSeconds + missionDurationSeconds;

    if (targetTimeSeconds > MAX_MISSION_DURATION_SECONDS) {
      throw new Error("Mission exceeds maximum simulation time");
    }

    let stepsExecuted = 0;
    let status: MissionStatus = "COMPLETED";
    let reason = "Mission duration reached";
    let finalTelemetry: Telemetry | undefined;

    while (this.engine.getCurrentTime() < targetTimeSeconds) {
      if (stepsExecuted >= MAX_STEPS) {
        throw new Error("Maximum mission step limit exceeded");
      }

      finalTelemetry = this.engine.step();
      stepsExecuted++;

      if (finalTelemetry.impacted) {
        status = "FAILED";
        reason = "Earth impact";
        break;
      }

      if (finalTelemetry.batteryEnergyWh <= 0) {
        status = "FAILED";
        reason = "Battery depleted";
        break;
      }
    }

    if (!finalTelemetry) {
      throw new Error("Mission executed no simulation steps");
    }

    const endTimeSeconds = this.engine.getCurrentTime();

    const progressPercent = Math.min(
      100,
      ((endTimeSeconds - startTimeSeconds) /
        missionDurationSeconds) * 100
    );

    return {
      status,
      reason,
      stepsExecuted,
      startTimeSeconds,
      endTimeSeconds,
      progressPercent,
      finalTelemetry
    };
  }
}
