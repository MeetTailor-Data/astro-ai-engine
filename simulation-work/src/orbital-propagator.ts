const EARTH_MU = 3.986004418e14;
const EARTH_RADIUS_M = 6_371_000;

export interface Vector2D {
  x: number;
  y: number;
}

export interface OrbitalState2D {
  position: Vector2D;
  velocity: Vector2D;
  altitudeKm: number;
  speedMs: number;
  acceleration: Vector2D;
}

export function calculateGravity(
  position: Vector2D,
): Vector2D {
  const r = Math.hypot(position.x, position.y);

  if (!Number.isFinite(r) || r <= EARTH_RADIUS_M) {
    throw new Error("Spacecraft position is inside Earth");
  }

  const factor = -EARTH_MU / r ** 3;

  return {
    x: position.x === 0 ? 0 : factor * position.x,
    y: position.y === 0 ? 0 : factor * position.y,
  };
}

export function propagateOrbit(
  state: OrbitalState2D,
  dtSeconds: number,
): OrbitalState2D {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) {
    throw new Error("Time step must be finite and positive");
  }

  const { position, velocity } = state;

  const a0 = calculateGravity(position);

  // Velocity Verlet: update position
  const newPosition = {
    x:
      position.x +
      velocity.x * dtSeconds +
      0.5 * a0.x * dtSeconds ** 2,
    y:
      position.y +
      velocity.y * dtSeconds +
      0.5 * a0.y * dtSeconds ** 2,
  };

  // Calculate gravity at the new position
  const a1 = calculateGravity(newPosition);

  // Update velocity using average acceleration
  const newVelocity = {
    x: velocity.x + 0.5 * (a0.x + a1.x) * dtSeconds,
    y: velocity.y + 0.5 * (a0.y + a1.y) * dtSeconds,
  };

  const radius = Math.hypot(
    newPosition.x,
    newPosition.y,
  );

  const speed = Math.hypot(
    newVelocity.x,
    newVelocity.y,
  );

  return {
    position: newPosition,
    velocity: newVelocity,
    altitudeKm: (radius - EARTH_RADIUS_M) / 1000,
    speedMs: speed,
    acceleration: a1,
  };
}

export function createCircularOrbitalState(
  altitudeKm: number,
): OrbitalState2D {
  const radiusM = EARTH_RADIUS_M + altitudeKm * 1000;

  const velocityMs = Math.sqrt(EARTH_MU / radiusM);

  return {
    position: { x: radiusM, y: 0 },
    velocity: { x: 0, y: velocityMs },
    altitudeKm,
    speedMs: velocityMs,
    acceleration: calculateGravity({
      x: radiusM,
      y: 0,
    }),
  };
}
