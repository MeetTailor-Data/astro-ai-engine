
export interface PowerInput {
  panelAreaM2: number;
  efficiency: number;
  performanceFactor: number;
  solarIrradianceWPerM2: number;
  powerConsumedW: number;
}

export interface PowerResult {
  powerGeneratedW: number;
  powerConsumedW: number;
  netPowerW: number;
  powerPass: boolean;
}

function validateInput(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite, non-negative number`);
  }
}

export function calculatePower(input: PowerInput): PowerResult {

  const {
    panelAreaM2,
    efficiency,
    performanceFactor,
    solarIrradianceWPerM2,
    powerConsumedW
  } = input;

  // Validate inputs
  validateInput(panelAreaM2, "Panel area");
  validateInput(solarIrradianceWPerM2, "Solar irradiance");
  validateInput(powerConsumedW, "Power consumption");

  if (efficiency < 0 || efficiency > 1 || !Number.isFinite(efficiency)) {
    throw new Error("Efficiency must be between 0 and 1");
  }

  if (
    performanceFactor < 0 ||
    performanceFactor > 1 ||
    !Number.isFinite(performanceFactor)
  ) {
    throw new Error("Performance factor must be between 0 and 1");
  }

  // Solar power generation
  const powerGeneratedW =
    solarIrradianceWPerM2 *
    panelAreaM2 *
    efficiency *
    performanceFactor;

  // Net power margin
  const netPowerW = powerGeneratedW - powerConsumedW;

  return {
    powerGeneratedW,
    powerConsumedW,
    netPowerW,
    powerPass: netPowerW >= 0
  };
}
