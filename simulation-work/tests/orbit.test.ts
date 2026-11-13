import { describe, it, expect } from "vitest";
import { calculateOrbit } from "../src/orbit.js";
import { calculateCircularVelocity } from "../src/orbit.js";

describe("Orbit Calculator", () => {
  it("calculates circular velocity for 400 km orbit", () => {
    const velocity = calculateCircularVelocity(400);
    expect(velocity).toBeCloseTo(7672.6, 1);
  });

  it("calculates orbital period for 400 km orbit", () => {
    const result = calculateOrbit({
      altitudeKm: 400,
      elapsedSeconds: 0,
      initialPhase: 0,
    });

    expect(result.orbitalPeriodSeconds).toBeCloseTo(5544.855, 2);
  });

  it("advances orbital phase", () => {
    const result = calculateOrbit({
      altitudeKm: 400,
      elapsedSeconds: 1000,
      initialPhase: 0,
    });

    expect(result.currentPhase).toBeGreaterThan(0);
  });

  it("wraps phase after one complete orbit", () => {
    const first = calculateOrbit({
      altitudeKm: 400,
      elapsedSeconds: 0,
      initialPhase: 0.2,
    });

    const second = calculateOrbit({
      altitudeKm: 400,
      elapsedSeconds: first.orbitalPeriodSeconds,
      initialPhase: 0.2,
    });

    expect(second.currentPhase).toBeCloseTo(0.2);
  });

  it("detects eclipse at phase 0.5", () => {
    const result = calculateOrbit({
      altitudeKm: 400,
      elapsedSeconds: 0,
      initialPhase: 0.5,
    });

    expect(result.inEclipse).toBe(true);
  });

  it("rejects negative altitude", () => {
    expect(() =>
      calculateOrbit({
        altitudeKm: -400,
        elapsedSeconds: 0,
        initialPhase: 0,
      }),
    ).toThrow();
  });
});
