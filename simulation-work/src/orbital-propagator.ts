import { calculateAtmosphericDrag } from "./atmospheric-drag.js";

const EARTH_MU = 3.986004418e14;
const EARTH_RADIUS_M = 6_371_000;
const MAX_PROPAGATION_STEP_SECONDS = 5;

export interface Vector2D {
  x: number;
  y: number;
}

export interface DragConfig {
  massKg: number;
  coefficient: number;
  areaM2: number;
}

const DEFAULT_DRAG_CONFIG: DragConfig = {
  massKg: 500,
  coefficient: 2.2,
  areaM2: 2,
};

export interface OrbitalState2D {
  position: Vector2D;
  velocity: Vector2D;
  altitudeKm: number;
  speedMs: number;
  acceleration: Vector2D;
  impacted?: boolean;
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
  drag: DragConfig = DEFAULT_DRAG_CONFIG,
): OrbitalState2D {
  if (state.impacted) {
    return state;
  }

  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) {
    throw new Error("Time step must be finite and positive");
  }

  const stepCount = Math.ceil(
    dtSeconds / MAX_PROPAGATION_STEP_SECONDS,
  );
  const stepSeconds = dtSeconds / stepCount;
  let propagatedState = state;

  for (let i = 0; i < stepCount; i++) {
    propagatedState = propagateOrbitStep(
      propagatedState,
      stepSeconds,
      drag,
    );
    if (propagatedState.impacted) {
      return propagatedState;
    }
  }

  return propagatedState;
}

function propagateOrbitStep(
  state: OrbitalState2D,
  dtSeconds: number,
  drag: DragConfig,
): OrbitalState2D {
  const { position, velocity } = state;

  const a0 = calculateTotalAcceleration(
    position,
    velocity,
    drag,
  );

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

  const newRadius = Math.hypot(
    newPosition.x,
    newPosition.y,
  );

  if (newRadius <= EARTH_RADIUS_M) {
    let low = 0;
    let high = 1;

    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      const x =
        position.x +
        (newPosition.x - position.x) * mid;
      const y =
        position.y +
        (newPosition.y - position.y) * mid;

      if (Math.hypot(x, y) > EARTH_RADIUS_M) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Keep the approximate impact point just outside Earth's surface.
    const t = low;
    const impactPosition = {
      x: position.x + (newPosition.x - position.x) * t,
      y: position.y + (newPosition.y - position.y) * t,
    };

    return {
      position: impactPosition,
      velocity,
      altitudeKm: 0,
      speedMs: Math.hypot(velocity.x, velocity.y),
      acceleration: a0,
      impacted: true,
    };
  }

  const predictedVelocity = {
    x: velocity.x + a0.x * dtSeconds,
    y: velocity.y + a0.y * dtSeconds,
  };
  const a1 = calculateTotalAcceleration(
    newPosition,
    predictedVelocity,
    drag,
  );

  // Update velocity using average acceleration
  const newVelocity = {
    x: velocity.x + 0.5 * (a0.x + a1.x) * dtSeconds,
    y: velocity.y + 0.5 * (a0.y + a1.y) * dtSeconds,
  };
  const finalAcceleration = calculateTotalAcceleration(
    newPosition,
    newVelocity,
    drag,
  );

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
    acceleration: finalAcceleration,
  };
}

function calculateTotalAcceleration(
  position: Vector2D,
  velocity: Vector2D,
  drag: DragConfig,
): Vector2D {
  const gravity = calculateGravity(position);

  const dragAcceleration = calculateAtmosphericDrag(
    position,
    velocity,
    drag.massKg,
    drag.coefficient,
    drag.areaM2,
  );

  return {
    x: gravity.x + dragAcceleration.x,
    y: gravity.y + dragAcceleration.y,
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
