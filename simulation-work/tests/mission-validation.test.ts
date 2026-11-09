
import { describe, it, expect } from "vitest";
import { validateMission } from "../src/mission-validation.js";
import type { SimulationConfig } from "../src/engine.js";
import type { MissionObjective } from "../src/mission-validation.js";

const config: SimulationConfig = {
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
};

const objectives: MissionObjective[] = [
  {
    id: "orbit",
    description: "Reach target orbit",
    weight: 2,
    target: 100,
    achieved: 100
  }
];

describe("Mission Validation", () => {
  it("accepts valid mission", () => {
    expect(validateMission(config, objectives).valid).toBe(true);
  });

  it("rejects empty objectives", () => {
    expect(validateMission(config, []).valid).toBe(false);
  });

  it("rejects duplicate objective IDs", () => {
    const result = validateMission(config, [
      objectives[0]!,
      { ...objectives[0]!, description: "Second objective" }
    ]);

    expect(result.errors.some(error => error.includes("Duplicate")))
      .toBe(true);
  });

  it("rejects invalid objective weight", () => {
    const result = validateMission(config, [
      { ...objectives[0]!, weight: -1 }
    ]);

    expect(result.valid).toBe(false);
  });
});
