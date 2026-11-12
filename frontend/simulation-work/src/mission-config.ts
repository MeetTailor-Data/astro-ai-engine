
import type { SimulationConfig } from "./engine.js";
import type { ObjectiveTargets } from "./objective-evaluator.js";

export interface CustomMissionConfig {
  name: string;
  durationSeconds: number;

  altitudeKm: number;
  batteryCapacityWh: number;
  panelAreaM2: number;
  powerConsumedW: number;
  dataRateMbps: number;
}

export interface ConfiguredMission {
  name: string;
  durationSeconds: number;
  config: SimulationConfig;
  objectiveTargets: ObjectiveTargets;
}

export function createMissionConfig(
  input: CustomMissionConfig
): ConfiguredMission {
  if (!input.name.trim()) {
    throw new Error("Mission name is required");
  }

  if (
    !Number.isFinite(input.durationSeconds) ||
    input.durationSeconds <= 0
  ) {
    throw new Error("Mission duration must be positive");
  }

  const config: SimulationConfig = {
    altitudeKm: input.altitudeKm,
    timeStepSeconds: 60,

    panelAreaM2: input.panelAreaM2,
    panelEfficiency: 0.3,
    panelPerformanceFactor: 0.9,
    solarIrradianceWPerM2: 1361,

    batteryCapacityWh: input.batteryCapacityWh,
    initialBatteryEnergyWh: input.batteryCapacityWh * 0.5,
    batteryEfficiency: 0.9,

    powerConsumedW: input.powerConsumedW,

    dataRateMbps: input.dataRateMbps,
    bufferCapacityGB: 20,
    initialBufferGB: 0,
    downlinkBandwidthMbps: 20,
    groundStationAvailable: true
  };

  return {
    name: input.name,
    durationSeconds: input.durationSeconds,
    config,
    objectiveTargets: {
      minimumBatteryEnergyWh: input.batteryCapacityWh * 0.2,
      targetDataTransmittedGB: 0.5
    }
  };
}
