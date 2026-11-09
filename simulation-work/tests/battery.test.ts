
import { describe, it, expect } from "vitest";
import { calculateBattery } from "../src/battery.js";

describe("Battery Calculator", () => {

  it("discharges battery during eclipse", () => {
    const result = calculateBattery({
      capacityWh: 1200,
      currentEnergyWh: 1000,
      powerGeneratedW: 680,
      powerConsumedW: 200,
      durationSeconds: 1800,
      efficiency: 1,
      inEclipse: true
    });

    expect(result.remainingEnergyWh).toBe(900);
    expect(result.energyDischargedWh).toBe(100);
    expect(result.energyChargedWh).toBe(0);
    expect(result.depthOfDischargePct).toBe(25);
  });

  it("charges battery using excess solar power", () => {
    const result = calculateBattery({
      capacityWh: 1000,
      currentEnergyWh: 500,
      powerGeneratedW: 600,
      powerConsumedW: 400,
      durationSeconds: 3600,
      efficiency: 0.9,
      inEclipse: false
    });

    expect(result.energyChargedWh).toBe(180);
    expect(result.remainingEnergyWh).toBe(680);
  });

  it("does not exceed battery capacity", () => {
    const result = calculateBattery({
      capacityWh: 1000,
      currentEnergyWh: 950,
      powerGeneratedW: 500,
      powerConsumedW: 100,
      durationSeconds: 3600,
      efficiency: 1,
      inEclipse: false
    });

    expect(result.remainingEnergyWh).toBe(1000);
  });

  it("does not discharge below zero", () => {
    const result = calculateBattery({
      capacityWh: 500,
      currentEnergyWh: 50,
      powerGeneratedW: 0,
      powerConsumedW: 200,
      durationSeconds: 3600,
      efficiency: 1,
      inEclipse: true
    });

    expect(result.remainingEnergyWh).toBe(0);
    expect(result.batteryPass).toBe(false);
  });

  it("rejects invalid battery capacity", () => {
    expect(() => calculateBattery({
      capacityWh: 0,
      currentEnergyWh: 0,
      powerGeneratedW: 0,
      powerConsumedW: 100,
      durationSeconds: 3600,
      efficiency: 1,
      inEclipse: true
    })).toThrow();
  });

});
