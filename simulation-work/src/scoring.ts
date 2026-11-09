
import type { MissionObjective } from "./mission-validation.js";

export interface ObjectiveScore {
  id: string;
  completionPercent: number;
  points: number;
}

export interface MissionScore {
  totalScore: number;
  objectiveScores: ObjectiveScore[];
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export function calculateMissionScore(
  objectives: MissionObjective[]
): MissionScore {
  if (!Array.isArray(objectives) || objectives.length === 0) {
    throw new Error("At least one objective is required");
  }

  let totalWeight = 0;
  let weightedScore = 0;

  const objectiveScores: ObjectiveScore[] = [];

  for (const objective of objectives) {
    if (
      !objective ||
      typeof objective.id !== "string" ||
      !Number.isFinite(objective.weight) ||
      objective.weight <= 0 ||
      !Number.isFinite(objective.target) ||
      objective.target <= 0 ||
      !Number.isFinite(objective.achieved) ||
      objective.achieved < 0
    ) {
      throw new Error("Invalid objective data");
    }

    const completionPercent = Math.min(
      100,
      (objective.achieved / objective.target) * 100
    );

    const points = completionPercent * objective.weight;

    totalWeight += objective.weight;
    weightedScore += points;

    objectiveScores.push({
      id: objective.id,
      completionPercent,
      points
    });
  }

  const totalScore = weightedScore / totalWeight;

  let grade: MissionScore["grade"];

  if (totalScore >= 95) grade = "S";
  else if (totalScore >= 85) grade = "A";
  else if (totalScore >= 70) grade = "B";
  else if (totalScore >= 55) grade = "C";
  else if (totalScore >= 40) grade = "D";
  else grade = "F";

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    objectiveScores,
    grade
  };
}

export interface FinalMissionScore extends MissionScore {
  missionStatus: "COMPLETED" | "FAILED";
}

export function calculateFinalMissionScore(
  missionStatus: "COMPLETED" | "FAILED",
  objectives: MissionObjective[]
): FinalMissionScore {
  if (
    missionStatus !== "COMPLETED" &&
    missionStatus !== "FAILED"
  ) {
    throw new Error("Invalid mission status");
  }

  const objectiveScore = calculateMissionScore(objectives);

  if (missionStatus === "FAILED") {
    return {
      ...objectiveScore,
      totalScore: Math.min(objectiveScore.totalScore, 39),
      grade: "F",
      missionStatus
    };
  }

  return {
    ...objectiveScore,
    missionStatus
  };
}
