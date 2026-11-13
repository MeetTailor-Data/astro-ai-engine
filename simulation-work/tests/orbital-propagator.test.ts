import { describe, it, expect } from "vitest";

import {
  calculateGravity,
  propagateOrbit,
  type OrbitalState2D,
} from "../src/orbital-propagator.js";

const EARTH_RADIUS_M = 6_371_000;
const EARTH_MU = 3.986004418e14;

function createCircularOrbit(
  altitudeKm: number,
): OrbitalState2D {
  const radius =
    EARTH_RADIUS_M + altitudeKm * 1000;

  const velocity = Math.sqrt(EARTH_MU / radius);

  return {
    position: { x: radius, y: 0 },
    velocity: { x: 0, y: velocity },
    altitudeKm,
    speedMs: velocity,
    acceleration: {
      x: -EARTH_MU / radius ** 2,
      y: 0,
    },
  };
}

describe("Orbital Propagator", () => {
  it("calculates Earth's gravity correctly", () => {
    const radius = EARTH_RADIUS_M + 400_000;

    const gravity = calculateGravity({
      x: radius,
      y: 0,
    });

    expect(gravity.x).toBeCloseTo(-8.69, 1);
    expect(gravity.y).toBe(0);
  });

  it("propagates spacecraft position", () => {
    const initial = createCircularOrbit(400);

    const next = propagateOrbit(initial, 10);

    expect(next.position.x).not.toBe(initial.position.x);
    expect(next.position.y).not.toBe(initial.position.y);
    expect(next.altitudeKm).toBeCloseTo(400, 1);
  });

  it("maintains approximately circular altitude", () => {
    let state = createCircularOrbit(400);

    for (let i = 0; i < 1000; i++) {
      state = propagateOrbit(state, 1);
    }

    expect(state.altitudeKm).toBeCloseTo(400, 1);
  });

  it("rejects spacecraft inside Earth", () => {
    expect(() =>
      calculateGravity({ x: 1000, y: 0 }),
    ).toThrow();
  });

  it("rejects invalid time steps", () => {
    const state = createCircularOrbit(400);

    expect(() => propagateOrbit(state, 0)).toThrow();
    expect(() => propagateOrbit(state, -1)).toThrow();
  });
});
