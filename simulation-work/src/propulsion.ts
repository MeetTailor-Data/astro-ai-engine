
const G0 = 9.80665;
const MAX_VALUE = Number.MAX_SAFE_INTEGER;

export interface PropulsionInput {
  thrustN: number;
  ispSeconds: number;
  burnDurationSeconds: number;
  dryMassKg: number;
  initialPropellantKg: number;
}

export interface PropulsionResult {
  massFlowRateKgPerSecond: number;
  requestedPropellantKg: number;
  consumedPropellantKg: number;
  remainingPropellantKg: number;
  actualBurnDurationSeconds: number;
  deltaVMS: number;
  burnPass: boolean;
}

function validate(
  value: number,
  field: string,
  allowZero = true
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    (!allowZero && value === 0) ||
    value > MAX_VALUE
  ) {
    throw new Error(`${field} is invalid`);
  }
}

export function calculatePropulsion(
  input: PropulsionInput
): PropulsionResult {
  const {
    thrustN,
    ispSeconds,
    burnDurationSeconds,
    dryMassKg,
    initialPropellantKg
  } = input;

  validate(thrustN, "Thrust");
  validate(ispSeconds, "Specific impulse", false);
  validate(burnDurationSeconds, "Burn duration");
  validate(dryMassKg, "Dry mass", false);
  validate(initialPropellantKg, "Propellant");

  const massFlowRateKgPerSecond =
    thrustN / (ispSeconds * G0);

  if (!Number.isFinite(massFlowRateKgPerSecond)) {
    throw new Error("Mass flow calculation overflow");
  }

  const requestedPropellantKg =
    massFlowRateKgPerSecond * burnDurationSeconds;

  if (!Number.isFinite(requestedPropellantKg)) {
    throw new Error("Propellant calculation overflow");
  }

  const consumedPropellantKg = Math.min(
    requestedPropellantKg,
    initialPropellantKg
  );

  const remainingPropellantKg =
    initialPropellantKg - consumedPropellantKg;

  const actualBurnDurationSeconds =
    massFlowRateKgPerSecond > 0
      ? consumedPropellantKg / massFlowRateKgPerSecond
      : 0;

  const initialMassKg =
    dryMassKg + initialPropellantKg;

  const finalMassKg =
    dryMassKg + remainingPropellantKg;

  const deltaVMS =
    consumedPropellantKg > 0
      ? ispSeconds *
        G0 *
        Math.log(initialMassKg / finalMassKg)
      : 0;

  if (
    !Number.isFinite(deltaVMS) ||
    !Number.isFinite(initialMassKg) ||
    !Number.isFinite(finalMassKg)
  ) {
    throw new Error("Propulsion calculation overflow");
  }

  return {
    massFlowRateKgPerSecond,
    requestedPropellantKg,
    consumedPropellantKg,
    remainingPropellantKg,
    actualBurnDurationSeconds,
    deltaVMS,
    burnPass:
      requestedPropellantKg <= initialPropellantKg
  };
}
