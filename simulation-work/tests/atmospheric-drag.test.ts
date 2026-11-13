import { describe, expect, it } from "vitest";
import { calculateAtmosphericDrag } from "../src/atmospheric-drag.js";

const EARTH_RADIUS_M = 6_371_000;

function positionAtAltitude(altitudeM: number) {
  return { x: EARTH_RADIUS_M + altitudeM, y: 0 };
}

describe("Atmospheric drag", () => {
  it("produces zero drag above 150 km", () => {
    const drag = calculateAtmosphericDrag(
      positionAtAltitude(150_001),
      { x: 100, y: 0 },
      1000,
      2,
      10,
    );

    expect(drag).toEqual({ x: 0, y: 0 });
  });

  it("acts opposite to velocity", () => {
    const velocity = { x: 100, y: 25 };
    const drag = calculateAtmosphericDrag(
      positionAtAltitude(100_000),
      velocity,
      1000,
      2,
      10,
    );

    expect(drag.x * velocity.x + drag.y * velocity.y)
      .toBeLessThan(0);
  });

  it("produces zero drag at zero velocity", () => {
    const drag = calculateAtmosphericDrag(
      positionAtAltitude(100_000),
      { x: 0, y: 0 },
      1000,
      2,
      10,
    );

    expect(drag).toEqual({ x: 0, y: 0 });
  });

  it("produces stronger drag at higher atmospheric density", () => {
    const velocity = { x: 100, y: 0 };
    const lowAltitudeDrag = calculateAtmosphericDrag(
      positionAtAltitude(100_000),
      velocity,
      1000,
      2,
      10,
    );
    const highAltitudeDrag = calculateAtmosphericDrag(
      positionAtAltitude(120_000),
      velocity,
      1000,
      2,
      10,
    );

    expect(Math.hypot(lowAltitudeDrag.x, lowAltitudeDrag.y))
      .toBeGreaterThan(
        Math.hypot(highAltitudeDrag.x, highAltitudeDrag.y),
      );
  });
});
