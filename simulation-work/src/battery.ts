
export interface BatteryInput {
  capacityWh: number;
  currentEnergyWh: number;
  powerGeneratedW: number;
  powerConsumedW: number;
  durationSeconds: number;
  efficiency: number;
  inEclipse: boolean;
}

export interface BatteryResult {
  remainingEnergyWh: number;
  energyChargedWh: number;
  energyDischargedWh: number;
  depthOfDischargePct: number;
  batteryPass: boolean;
}

function validateInput(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be finite and non-negative`);
  }
}

export function calculateBattery(input: BatteryInput): BatteryResult {
  const {
    capacityWh,
    currentEnergyWh,
    powerGeneratedW,
    powerConsumedW,
    durationSeconds,
    efficiency,
    inEclipse
  } = input;

  validateInput(capacityWh, "Battery capacity");
  validateInput(currentEnergyWh, "Current energy");
  validateInput(powerGeneratedW, "Power generated");
  validateInput(powerConsumedW, "Power consumed");
  validateInput(durationSeconds, "Duration");

  if (capacityWh <= 0) {
    throw new Error("Battery capacity must be greater than zero");
  }

  if (currentEnergyWh > capacityWh) {
    throw new Error("Current energy cannot exceed battery capacity");
  }

  if (!Number.isFinite(efficiency) || efficiency <= 0 || efficiency > 1) {
    throw new Error("Efficiency must be greater than 0 and at most 1");
  }

  // During eclipse, solar generation is zero.
  const actualGenerationW = inEclipse ? 0 : powerGeneratedW;

  const netPowerW = actualGenerationW - powerConsumedW;
  const durationHours = durationSeconds / 3600;

  let remainingEnergyWh = currentEnergyWh;
  let energyChargedWh = 0;
  let energyDischargedWh = 0;

  if (netPowerW > 0) {
    // Charge battery using excess solar power.
    const availableChargeWh = netPowerW * durationHours * efficiency;

    energyChargedWh = Math.min(
      availableChargeWh,
      capacityWh - currentEnergyWh
    );

    remainingEnergyWh += energyChargedWh;
  } else if (netPowerW < 0) {
    // Discharge battery to cover the power deficit.
    const requiredEnergyWh =
      (-netPowerW * durationHours) / efficiency;

    energyDischargedWh = Math.min(
      requiredEnergyWh,
      currentEnergyWh
    );

    remainingEnergyWh -= energyDischargedWh;
  }

  const depthOfDischargePct =
    ((capacityWh - remainingEnergyWh) / capacityWh) * 100;

  return {
    remainingEnergyWh,
    energyChargedWh,
    energyDischargedWh,
    depthOfDischargePct,
    batteryPass: remainingEnergyWh > 0
  };
}
