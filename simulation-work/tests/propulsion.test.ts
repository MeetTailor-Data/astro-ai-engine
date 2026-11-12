
import { describe, it, expect } from "vitest";
import { calculatePropulsion } from "../src/propulsion.js";

describe("Propulsion Calculator", () => {
  it("calculates mass flow rate", () => {
    const result = calculatePropulsion({
      thrustN: 1000,
      ispSeconds: 300,
      burnDurationSeconds: 10,
      dryMassKg: 1000,
      initialPropellantKg: 100
    });

    expect(result.massFlowRateKgPerSecond)
      .toBeCloseTo(0.3399, 3);
  });

  it("calculates propellant consumption", () => {
    const result = calculatePropulsion({
      thrustN: 1000,
      ispSeconds: 300,
      burnDurationSeconds: 10,
      dryMassKg: 1000,
      initialPropellantKg: 100
    });

    expect(result.consumedPropellantKg)
      .toBeCloseTo(3.399, 2);

    expect(result.burnPass).toBe(true);
  });

  it("calculates positive delta-v", () => {
    const result = calculatePropulsion({
      thrustN: 1000,
      ispSeconds: 300,
      burnDurationSeconds: 10,
      dryMassKg: 1000,
      initialPropellantKg: 100
    });

    expect(result.deltaVMS).toBeGreaterThan(0);
  });

  it("limits burn when propellant is insufficient", () => {
    const result = calculatePropulsion({
      thrustN: 1000,
      ispSeconds: 300,
      burnDurationSeconds: 1000,
      dryMassKg: 1000,
      initialPropellantKg: 1
    });

    expect(result.consumedPropellantKg).toBe(1);
    expect(result.remainingPropellantKg).toBe(0);
    expect(result.burnPass).toBe(false);
  });

  it("rejects zero specific impulse", () => {
    expect(() =>
      calculatePropulsion({
        thrustN: 1000,
        ispSeconds: 0,
        burnDurationSeconds: 10,
        dryMassKg: 1000,
        initialPropellantKg: 100
      })
    ).toThrow();
  });

  it("rejects negative thrust", () => {
    expect(() =>
      calculatePropulsion({
        thrustN: -1000,
        ispSeconds: 300,
        burnDurationSeconds: 10,
        dryMassKg: 1000,
        initialPropellantKg: 100
      })
    ).toThrow();
  });
});
