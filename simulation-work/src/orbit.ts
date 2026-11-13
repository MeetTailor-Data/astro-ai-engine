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

export interface OrbitalState {
  radiusM: number;
  velocityMs: number;
  specificEnergyJPerKg: number;
  semiMajorAxisM: number | null;
  eccentricity: number | null;
  perigeeAltitudeKm: number | null;
  apogeeAltitudeKm: number | null;
  escaped: boolean;
}

export function calculateOrbitalState(
  altitudeKm: number,
  velocityMs: number,
): OrbitalState {
  if (!Number.isFinite(altitudeKm) || altitudeKm <= 0) {
    throw new Error("Altitude must be finite and positive");
  }

  if (!Number.isFinite(velocityMs) || velocityMs < 0) {
    throw new Error("Velocity must be finite and non-negative");
  }

  const radiusM = EARTH_RADIUS_M + altitudeKm * 1000;

  const specificEnergyJPerKg =
    velocityMs ** 2 / 2 - EARTH_MU / radiusM;

  const escaped = specificEnergyJPerKg >= 0;

  if (escaped) {
    return {
      radiusM,
      velocityMs,
      specificEnergyJPerKg,
      semiMajorAxisM: null,
      eccentricity: null,
      perigeeAltitudeKm: null,
      apogeeAltitudeKm: null,
      escaped: true,
    };
  }

  const semiMajorAxisM =
    -EARTH_MU / (2 * specificEnergyJPerKg);

  const angularMomentum = radiusM * velocityMs;

  const eccentricity = Math.sqrt(
    Math.max(
      0,
      1 +
        (2 *
          specificEnergyJPerKg *
          angularMomentum ** 2) /
          EARTH_MU ** 2,
    ),
  );

  const perigeeAltitudeKm =
    (semiMajorAxisM * (1 - eccentricity) -
      EARTH_RADIUS_M) /
    1000;

  const apogeeAltitudeKm =
    (semiMajorAxisM * (1 + eccentricity) -
      EARTH_RADIUS_M) /
    1000;

  return {
    radiusM,
    velocityMs,
    specificEnergyJPerKg,
    semiMajorAxisM,
    eccentricity,
    perigeeAltitudeKm,
    apogeeAltitudeKm,
    escaped: false,
  };
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