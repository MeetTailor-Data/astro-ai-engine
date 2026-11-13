import { describe, it, expect } from "vitest";
import { calculateOrbit } from "../src/orbit.js";
import { calculateCircularVelocity } from "../src/orbit.js";
import { calculateOrbitalState } from "../src/orbit.js";

describe("Orbit Calculator", () => {
  it("calculates a circular orbit correctly", () => {
    const velocity = calculateCircularVelocity(400);

    const state = calculateOrbitalState(400, velocity);

    expect(state.escaped).toBe(false);
    expect(state.eccentricity).toBeCloseTo(0, 5);
    expect(state.perigeeAltitudeKm).toBeCloseTo(400, 3);
    expect(state.apogeeAltitudeKm).toBeCloseTo(400, 3);
  });

  it("calculates higher apogee after a prograde velocity increase", () => {
    const velocity = calculateCircularVelocity(400);

    const state = calculateOrbitalState(400, velocity + 100);

    expect(state.escaped).toBe(false);
    expect(state.apogeeAltitudeKm!).toBeGreaterThan(400);
    expect(state.perigeeAltitudeKm!).toBeLessThan(400);
  });

  it("detects escape velocity", () => {
    const velocity = calculateCircularVelocity(400);

    const state = calculateOrbitalState(400, velocity * 2);

    expect(state.escaped).toBe(true);
    expect(state.apogeeAltitudeKm).toBeNull();
  });

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
