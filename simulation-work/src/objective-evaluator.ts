
import type { Telemetry } from "./engine.js";
import type { MissionResult } from "./mission-runner.js";
import type { MissionObjective } from "./mission-validation.js";

export interface ObjectiveEvaluation {
  objectives: MissionObjective[];
  completedCount: number;
  totalCount: number;
  completionPercent: number;
}

export interface ObjectiveTargets {
  minimumBatteryEnergyWh: number;
  targetDataTransmittedGB: number;
}

export function evaluateObjectives(
  mission: MissionResult,
  telemetryHistory: Telemetry[],
  targets: ObjectiveTargets
): ObjectiveEvaluation {
  if (!mission || !Array.isArray(telemetryHistory)) {
    throw new Error("Invalid mission data");
  }

  if (
    !Number.isFinite(targets.minimumBatteryEnergyWh) ||
    targets.minimumBatteryEnergyWh < 0 ||
    !Number.isFinite(targets.targetDataTransmittedGB) ||
    targets.targetDataTransmittedGB <= 0
  ) {
    throw new Error("Invalid objective targets");
  }

  const finalTelemetry = mission.finalTelemetry;

  const validOrbit =
    telemetryHistory.length > 0 &&
    telemetryHistory.every(
      telemetry =>
        Number.isFinite(telemetry.orbitalPhase) &&
        telemetry.orbitalPhase >= 0 &&
        telemetry.orbitalPhase < 1
    );

  const batteryAchieved = Math.max(
    0,
    finalTelemetry.batteryEnergyWh
  );

  const dataAchieved = telemetryHistory.reduce(
    (sum, telemetry) => sum + telemetry.dataTransmittedGB,
    0
  );

  const objectives: MissionObjective[] = [
    {
      id: "orbit-maintenance",
      description: "Maintain valid orbital telemetry",
      weight: 2,
      target: 1,
      achieved: validOrbit ? 1 : 0
    },
    {
      id: "battery-survival",
      description: "Maintain minimum battery energy",
      weight: 2,
      target: targets.minimumBatteryEnergyWh,
      achieved: batteryAchieved
    },
    {
      id: "data-transmission",
      description: "Transmit target scientific data",
      weight: 3,
      target: targets.targetDataTransmittedGB,
      achieved: dataAchieved
    }
  ];

  const completedCount = objectives.filter(
    objective => objective.achieved >= objective.target
  ).length;

  return {
    objectives,
    completedCount,
    totalCount: objectives.length,
    completionPercent:
      (completedCount / objectives.length) * 100
  };
}
