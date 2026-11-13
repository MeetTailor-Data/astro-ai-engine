import type { Vector2D } from "./orbital-propagator.js";

const EARTH_RADIUS_M = 6_371_000;
const ATMOSPHERE_SCALE_HEIGHT_M = 8_500;
const SEA_LEVEL_DENSITY = 1.225;

export function calculateAtmosphericDrag(
  position: Vector2D,
  velocity: Vector2D,
  massKg: number,
  dragCoefficient: number,
  areaM2: number,
): Vector2D {
  const altitudeM =
    Math.hypot(position.x, position.y) - EARTH_RADIUS_M;

  if (altitudeM >= 150_000) {
    return { x: 0, y: 0 };
  }

  if (altitudeM <= 0 || massKg <= 0) {
    throw new Error("Invalid drag calculation inputs");
  }

  const density =
    SEA_LEVEL_DENSITY *
    Math.exp(-altitudeM / ATMOSPHERE_SCALE_HEIGHT_M);

  const speed = Math.hypot(velocity.x, velocity.y);

  if (speed === 0) {
    return { x: 0, y: 0 };
  }

  const factor =
    (-0.5 * density * dragCoefficient * areaM2 * speed) /
    massKg;

  return {
    x: factor * velocity.x,
    y: factor * velocity.y,
  };
}
