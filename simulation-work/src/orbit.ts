const EARTH_RADIUS_M = 6_371_000;
const EARTH_MU = 3.986004418e14;

export function calculateCircularVelocity(
  altitudeKm: number
): number {
  if (!Number.isFinite(altitudeKm) || altitudeKm <= 0) {
    throw new Error("Altitude must be greater than zero");
  }

  const radiusM = EARTH_RADIUS_M + altitudeKm * 1000;

  return Math.sqrt(EARTH_MU / radiusM);
}

export interface OrbitInput {
  altitudeKm: number;
  elapsedSeconds: number;
  initialPhase: number;
}

export interface OrbitResult {
  orbitalRadiusM: number;
  orbitalPeriodSeconds: number;
  currentPhase: number;
  eclipseFraction: number;
  inEclipse: boolean;
}

export function calculateOrbit(input: OrbitInput): OrbitResult {
  const { altitudeKm, elapsedSeconds, initialPhase } = input;

  if (!Number.isFinite(altitudeKm) || altitudeKm <= 0) {
    throw new Error("Altitude must be greater than zero");
  }

  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new Error("Elapsed time must be non-negative");
  }

  if (
    !Number.isFinite(initialPhase) ||
    initialPhase < 0 ||
    initialPhase >= 1
  ) {
    throw new Error("Initial phase must be between 0 and 1");
  }

  const altitudeM = altitudeKm * 1000;
  const orbitalRadiusM = EARTH_RADIUS_M + altitudeM;

  // Kepler's third law
  const orbitalPeriodSeconds =
    2 * Math.PI *
    Math.sqrt(
      Math.pow(orbitalRadiusM, 3) / EARTH_MU
    );

  // Orbital phase: 0 to 1
  const currentPhase =
    (initialPhase + elapsedSeconds / orbitalPeriodSeconds) % 1;

  // Simplified eclipse model: circular orbit, beta angle = 0
  const eclipseAngle = Math.asin(
    EARTH_RADIUS_M / orbitalRadiusM
  );

  const eclipseFraction = eclipseAngle / Math.PI;

  // Eclipse centered around phase 0.5
  const eclipseStart = (1 - eclipseFraction) / 2;
  const eclipseEnd = (1 + eclipseFraction) / 2;

  const inEclipse =
    currentPhase >= eclipseStart &&
    currentPhase <= eclipseEnd;

  return {
    orbitalRadiusM,
    orbitalPeriodSeconds,
    currentPhase,
    eclipseFraction,
    inEclipse
  };
}