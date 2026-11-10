
import { describe, it, expect } from "vitest";
import { createMissionConfig } from "../src/mission-config.js";
import { SimulationEngine } from "../src/engine.js";

describe("Custom Mission Configuration", () => {
  it("creates a valid custom mission", () => {
    const mission = createMissionConfig({
      name: "My Custom Mission",
      durationSeconds: 1200,
      altitudeKm: 500,
      batteryCapacityWh: 2000,
      panelAreaM2: 4,
      powerConsumedW: 250,
      dataRateMbps: 5
    });

    expect(mission.name).toBe("My Custom Mission");
    expect(mission.config.altitudeKm).toBe(500);
    expect(mission.durationSeconds).toBe(1200);

    expect(() => new SimulationEngine(mission.config))
      .not.toThrow();
  });

  it("rejects invalid duration", () => {
    expect(() =>
      createMissionConfig({
        name: "Invalid Mission",
        durationSeconds: -100,
        altitudeKm: 500,
        batteryCapacityWh: 2000,
        panelAreaM2: 4,
        powerConsumedW: 250,
        dataRateMbps: 5
      })
    ).toThrow();
  });
});
