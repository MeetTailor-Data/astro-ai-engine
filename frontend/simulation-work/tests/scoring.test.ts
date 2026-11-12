
import { describe, it, expect } from "vitest";
import {
  calculateMissionScore,
  calculateFinalMissionScore
} from "../src/scoring.js";
import type { MissionObjective } from "../src/mission-validation.js";

describe("Mission Scoring", () => {
  it("awards 100 for completed objectives", () => {
    const objectives: MissionObjective[] = [
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 1,
        target: 100,
        achieved: 100
      }
    ];

    const result = calculateMissionScore(objectives);

    expect(result.totalScore).toBe(100);
    expect(result.grade).toBe("S");
  });

  it("calculates weighted objective score", () => {
    const objectives: MissionObjective[] = [
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 2,
        target: 100,
        achieved: 100
      },
      {
        id: "data",
        description: "Transmit data",
        weight: 1,
        target: 100,
        achieved: 0
      }
    ];

    const result = calculateMissionScore(objectives);

    expect(result.totalScore).toBeCloseTo(66.67, 2);
    expect(result.grade).toBe("C");
  });

  it("caps objective completion at 100%", () => {
    const result = calculateMissionScore([
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 1,
        target: 100,
        achieved: 200
      }
    ]);

    expect(result.totalScore).toBe(100);
  });

  it("rejects empty objectives", () => {
    expect(() => calculateMissionScore([])).toThrow();
  });

  it("caps failed mission score at 39 and assigns F", () => {
    const result = calculateFinalMissionScore("FAILED", [
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 1,
        target: 100,
        achieved: 100
      }
    ]);

    expect(result.totalScore).toBe(39);
    expect(result.grade).toBe("F");
    expect(result.missionStatus).toBe("FAILED");
  });

  it("preserves normal score for completed mission", () => {
    const result = calculateFinalMissionScore("COMPLETED", [
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 1,
        target: 100,
        achieved: 100
      }
    ]);

    expect(result.totalScore).toBe(100);
    expect(result.grade).toBe("S");
    expect(result.missionStatus).toBe("COMPLETED");
  });

  it("does not increase low failed mission scores", () => {
    const result = calculateFinalMissionScore("FAILED", [
      {
        id: "orbit",
        description: "Reach orbit",
        weight: 1,
        target: 100,
        achieved: 20
      }
    ]);

    expect(result.totalScore).toBe(20);
    expect(result.grade).toBe("F");
  });
});
