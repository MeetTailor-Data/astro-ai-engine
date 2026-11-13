
import { describe, it, expect } from "vitest";
import { calculatePower } from "../src/power.js";

describe("Power Calculator", () => {

  it("calculates solar power generation correctly", () => {

    const result = calculatePower({
      panelAreaM2: 2,
      efficiency: 0.25,
      performanceFactor: 1,
      solarIrradianceWPerM2: 1361,
      powerConsumedW: 500
    });

    expect(result.powerGeneratedW).toBe(680.5);
    expect(result.powerConsumedW).toBe(500);
    expect(result.netPowerW).toBe(180.5);
    expect(result.powerPass).toBe(true);
  });

  it("detects insufficient power generation", () => {

    const result = calculatePower({
      panelAreaM2: 1,
      efficiency: 0.2,
      performanceFactor: 1,
      solarIrradianceWPerM2: 1361,
      powerConsumedW: 500
    });

    expect(result.netPowerW).toBe(-227.8);
    expect(result.powerPass).toBe(false);
  });

  it("generates no solar power when irradiance is zero", () => {
    const result = calculatePower({
      panelAreaM2: 2,
      efficiency: 0.25,
      performanceFactor: 1,
      solarIrradianceWPerM2: 0,
      powerConsumedW: 500,
    });

    expect(result.powerGeneratedW).toBe(0);
  });

  it("rejects negative panel area", () => {

    expect(() => calculatePower({
      panelAreaM2: -2,
      efficiency: 0.25,
      performanceFactor: 1,
      solarIrradianceWPerM2: 1361,
      powerConsumedW: 500
    })).toThrow();
  });

  it("rejects efficiency greater than 1", () => {

    expect(() => calculatePower({
      panelAreaM2: 2,
      efficiency: 1.5,
      performanceFactor: 1,
      solarIrradianceWPerM2: 1361,
      powerConsumedW: 500
    })).toThrow();
  });

});
