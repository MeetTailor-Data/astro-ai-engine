
import { describe, it, expect } from "vitest";
import { calculateMass } from "../src/mass.js";

describe("Mass Calculator", () => {

  it("calculates dry and wet mass correctly", () => {

    const components = [
      { id: "bus", name: "Bus", massKg: 100 },
      { id: "payload", name: "Payload", massKg: 30 },
      { id: "battery", name: "Battery", massKg: 15 }
    ];

    const result = calculateMass(
      components,
      25,
      250
    );

    expect(result.dryMassKg).toBe(145);
    expect(result.wetMassKg).toBe(170);
    expect(result.capacityMarginKg).toBe(80);
    expect(result.launchMassPass).toBe(true);
  });

  it("rejects a spacecraft that exceeds launcher capacity", () => {

    const result = calculateMass(
      [{ id: "bus", name: "Bus", massKg: 200 }],
      60,
      250
    );

    expect(result.launchMassPass).toBe(false);
    expect(result.capacityMarginKg).toBe(-10);
  });

  it("rejects negative component mass", () => {

    expect(() => calculateMass(
      [{ id: "bus", name: "Bus", massKg: -10 }],
      0,
      250
    )).toThrow();
  });

});
