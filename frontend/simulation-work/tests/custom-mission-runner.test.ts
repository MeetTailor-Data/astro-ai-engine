
import { describe, it, expect } from "vitest";
import { runCustomMission } from "../src/custom-mission-runner.js";

describe("Custom Mission Runner", () => {
  it("executes a custom mission end-to-end", () => {
    const result = runCustomMission({
      name: "Test Custom Mission",
      durationSeconds: 600,
      altitudeKm: 500,
      batteryCapacityWh: 2000,
      panelAreaM2: 4,
      powerConsumedW: 250,
      dataRateMbps: 5
    });

    expect(result.name).toBe("Test Custom Mission");
    expect(result.mission.stepsExecuted).toBeGreaterThan(0);
    expect(result.evaluation.totalCount).toBe(3);
    expect(result.score.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.score.totalScore).toBeLessThanOrEqual(100);
    expect(result.score.missionStatus).toBe(result.mission.status);
  });

  it("rejects invalid custom mission configuration", () => {
    expect(() =>
      runCustomMission({
        name: "Invalid Mission",
        durationSeconds: -600,
        altitudeKm: 500,
        batteryCapacityWh: 2000,
        panelAreaM2: 4,
        powerConsumedW: 250,
        dataRateMbps: 5
      })
    ).toThrow();
  });
});
