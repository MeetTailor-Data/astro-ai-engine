
import { describe, it, expect } from "vitest";
import {
  getMissionProfile,
  getAllMissionProfiles
} from "../src/mission-profiles.js";

describe("Mission Profiles", () => {
  it("provides all four profiles", () => {
    expect(getAllMissionProfiles()).toHaveLength(4);
  });

  it("returns beginner profile", () => {
    const profile = getMissionProfile("beginner");

    expect(profile.name).toBe("Beginner Orbit");
    expect(profile.difficulty).toBe("Easy");
    expect(profile.durationSeconds).toBe(600);
  });

  it("returns deep-space profile", () => {
    const profile = getMissionProfile("deep-space");

    expect(profile.difficulty).toBe("Hard");
    expect(profile.config.powerConsumedW).toBe(600);
  });

  it("rejects unknown profile IDs", () => {
    expect(() =>
      getMissionProfile("unknown" as never)
    ).toThrow();
  });

  it("protects stored profiles from mutation", () => {
    const profile = getMissionProfile("beginner");

    profile.config.batteryCapacityWh = 999999;

    const freshProfile = getMissionProfile("beginner");

    expect(freshProfile.config.batteryCapacityWh).toBe(1000);
  });
});
