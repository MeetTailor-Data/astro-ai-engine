
export interface Component {
  id: string;
  name: string;
  massKg: number;
}

export interface MassResult {
  dryMassKg: number;
  propellantMassKg: number;
  wetMassKg: number;
  launcherCapacityKg: number;
  capacityMarginKg: number;
  launchMassPass: boolean;
}

function validateMass(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite, non-negative number`);
  }
}

export function calculateMass(
  components: Component[],
  propellantMassKg: number,
  launcherCapacityKg: number
): MassResult {

  if (!Array.isArray(components)) {
    throw new Error("Components must be an array");
  }

  validateMass(propellantMassKg, "Propellant mass");
  validateMass(launcherCapacityKg, "Launcher capacity");

  const ids = new Set<string>();

  let dryMassKg = 0;

  for (const component of components) {
    if (!component.id || !component.name) {
      throw new Error("Component ID and name are required");
    }

    if (ids.has(component.id)) {
      throw new Error(`Duplicate component ID: ${component.id}`);
    }

    ids.add(component.id);
    validateMass(component.massKg, `${component.name} mass`);

    dryMassKg += component.massKg;
  }

  const wetMassKg = dryMassKg + propellantMassKg;
  const capacityMarginKg = launcherCapacityKg - wetMassKg;

  return {
    dryMassKg,
    propellantMassKg,
    wetMassKg,
    launcherCapacityKg,
    capacityMarginKg,
    launchMassPass: wetMassKg <= launcherCapacityKg
  };
}
