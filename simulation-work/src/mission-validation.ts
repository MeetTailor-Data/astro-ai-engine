
import type { SimulationConfig } from "./engine.js";

export interface MissionObjective {
  id: string;
  description: string;
  weight: number;
  target: number;
  achieved: number;
}

export interface MissionValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMission(
  config: SimulationConfig,
  objectives: MissionObjective[]
): MissionValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Invalid mission configuration"] };
  }

  if (!Array.isArray(objectives) || objectives.length === 0) {
    errors.push("At least one objective is required");
  }

  if (objectives.length > 100) {
    errors.push("Maximum 100 objectives allowed");
  }

  const ids = new Set<string>();

  for (const objective of objectives) {
    if (!objective || typeof objective !== "object") {
      errors.push("Invalid objective");
      continue;
    }

    if (
      typeof objective.id !== "string" ||
      objective.id.trim().length === 0 ||
      objective.id.length > 100
    ) {
      errors.push("Objective ID must be 1-100 characters");
    } else if (ids.has(objective.id)) {
      errors.push(`Duplicate objective ID: ${objective.id}`);
    } else {
      ids.add(objective.id);
    }

    if (
      typeof objective.description !== "string" ||
      objective.description.trim().length === 0 ||
      objective.description.length > 500
    ) {
      errors.push("Objective description must be 1-500 characters");
    }

    if (!Number.isFinite(objective.weight) || objective.weight <= 0) {
      errors.push("Objective weight must be positive and finite");
    }

    if (!Number.isFinite(objective.target) || objective.target <= 0) {
      errors.push("Objective target must be positive and finite");
    }

    if (!Number.isFinite(objective.achieved) || objective.achieved < 0) {
      errors.push("Objective achieved must be finite and non-negative");
    }
  }

  const totalWeight = objectives.reduce(
    (sum, objective) =>
      objective && Number.isFinite(objective.weight)
        ? sum + objective.weight
        : sum,
    0
  );

  if (totalWeight <= 0 || !Number.isFinite(totalWeight)) {
    errors.push("Total objective weight must be positive and finite");
  }

  return { valid: errors.length === 0, errors };
}
