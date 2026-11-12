
import type { SimulationConfig } from "./engine.js";
import type { ObjectiveTargets } from "./objective-evaluator.js";

export type MissionProfileId =
  | "beginner"
  | "earth-observation"
  | "communications"
  | "deep-space";

export interface MissionProfile {
  id: MissionProfileId;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  durationSeconds: number;
  config: SimulationConfig;
  objectiveTargets: ObjectiveTargets;
}

const profiles: Record<MissionProfileId, MissionProfile> = {
  beginner: {
    id: "beginner",
    name: "Beginner Orbit",
    difficulty: "Easy",
    description: "A short mission to test basic spacecraft systems.",
    durationSeconds: 600,
    config: {
      altitudeKm: 400,
      timeStepSeconds: 60,
      panelAreaM2: 2,
      panelEfficiency: 0.3,
      panelPerformanceFactor: 0.9,
      solarIrradianceWPerM2: 1361,
      batteryCapacityWh: 1000,
      initialBatteryEnergyWh: 500,
      batteryEfficiency: 0.9,
      powerConsumedW: 100,
      dataRateMbps: 1,
      bufferCapacityGB: 10,
      initialBufferGB: 0,
      downlinkBandwidthMbps: 10,
      groundStationAvailable: true
    },
    objectiveTargets: {
      minimumBatteryEnergyWh: 100,
      targetDataTransmittedGB: 0.05
    }
  },

  "earth-observation": {
    id: "earth-observation",
    name: "Earth Observation",
    difficulty: "Medium",
    description: "Collect and transmit Earth observation data.",
    durationSeconds: 1800,
    config: {
      altitudeKm: 500,
      timeStepSeconds: 60,
      panelAreaM2: 3,
      panelEfficiency: 0.28,
      panelPerformanceFactor: 0.85,
      solarIrradianceWPerM2: 1361,
      batteryCapacityWh: 1500,
      initialBatteryEnergyWh: 900,
      batteryEfficiency: 0.9,
      powerConsumedW: 250,
      dataRateMbps: 5,
      bufferCapacityGB: 20,
      initialBufferGB: 0,
      downlinkBandwidthMbps: 20,
      groundStationAvailable: true
    },
    objectiveTargets: {
      minimumBatteryEnergyWh: 200,
      targetDataTransmittedGB: 0.5
    }
  },

  communications: {
    id: "communications",
    name: "Communications Satellite",
    difficulty: "Medium",
    description: "Maintain spacecraft power and transmit communications data.",
    durationSeconds: 3600,
    config: {
      altitudeKm: 600,
      timeStepSeconds: 60,
      panelAreaM2: 4,
      panelEfficiency: 0.3,
      panelPerformanceFactor: 0.9,
      solarIrradianceWPerM2: 1361,
      batteryCapacityWh: 2000,
      initialBatteryEnergyWh: 1200,
      batteryEfficiency: 0.9,
      powerConsumedW: 400,
      dataRateMbps: 8,
      bufferCapacityGB: 30,
      initialBufferGB: 0,
      downlinkBandwidthMbps: 30,
      groundStationAvailable: true
    },
    objectiveTargets: {
      minimumBatteryEnergyWh: 300,
      targetDataTransmittedGB: 1
    }
  },

  "deep-space": {
    id: "deep-space",
    name: "Deep Space Mission",
    difficulty: "Hard",
    description: "A demanding mission with high power requirements.",
    durationSeconds: 7200,
    config: {
      altitudeKm: 10000,
      timeStepSeconds: 60,
      panelAreaM2: 5,
      panelEfficiency: 0.25,
      panelPerformanceFactor: 0.8,
      solarIrradianceWPerM2: 1361,
      batteryCapacityWh: 3000,
      initialBatteryEnergyWh: 2000,
      batteryEfficiency: 0.85,
      powerConsumedW: 600,
      dataRateMbps: 10,
      bufferCapacityGB: 50,
      initialBufferGB: 0,
      downlinkBandwidthMbps: 40,
      groundStationAvailable: true
    },
    objectiveTargets: {
      minimumBatteryEnergyWh: 500,
      targetDataTransmittedGB: 2
    }
  }
};

export function getMissionProfile(
  id: MissionProfileId
): MissionProfile {
  const profile = profiles[id];

  if (!profile) {
    throw new Error(`Unknown mission profile: ${id}`);
  }

  // Return defensive copies so callers cannot mutate stored profiles.
  return {
    ...profile,
    config: { ...profile.config },
    objectiveTargets: { ...profile.objectiveTargets }
  };
}

export function getAllMissionProfiles(): MissionProfile[] {
  return Object.keys(profiles).map(id =>
    getMissionProfile(id as MissionProfileId)
  );
}
