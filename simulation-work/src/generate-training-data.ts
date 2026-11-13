import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { runCustomMission } from "./custom-mission-runner.js";
import type { CustomMissionConfig } from "./mission-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output CSV path relative to this file: simulation-work/src/ -> ../../data/raw/
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../data/raw/simulation_training_data.csv",
);

const TOTAL_MISSIONS = 5000;

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface TrainingRow {
  altitude_km: number;
  battery_capacity_wh: number;
  panel_area_m2: number;
  power_consumed_w: number;
  data_rate_mbps: number;
  duration_seconds: number;
  mission_success: number;
  total_score: number;
  grade: string;
}

function generateMissionConfig(index: number): CustomMissionConfig {
  return {
    name: `training-mission-${index}`,
    altitudeKm: randomInt(300, 10000),
    batteryCapacityWh: randomFloat(500, 5000),
    panelAreaM2: randomFloat(1, 10),
    powerConsumedW: randomFloat(50, 800),
    dataRateMbps: randomFloat(1, 15),
    durationSeconds: randomInt(300, 7200),
  };
}

function runGenerator(): TrainingRow[] {
  const rows: TrainingRow[] = [];

  for (let i = 0; i < TOTAL_MISSIONS; i++) {
    const config = generateMissionConfig(i);

    try {
      const result = runCustomMission(config);

      const missionSuccess = result.mission.status === "COMPLETED" ? 1 : 0;
      const totalScore = result.score.totalScore;
      const grade = result.score.grade;

      rows.push({
        altitude_km: config.altitudeKm,
        battery_capacity_wh: config.batteryCapacityWh,
        panel_area_m2: config.panelAreaM2,
        power_consumed_w: config.powerConsumedW,
        data_rate_mbps: config.dataRateMbps,
        duration_seconds: config.durationSeconds,
        mission_success: missionSuccess,
        total_score: totalScore,
        grade: grade,
      });
    } catch {
      // Skip failures silently
    }

    if ((i + 1) % 500 === 0) {
      console.log(
        `Progress: ${i + 1}/${TOTAL_MISSIONS} missions processed (${rows.length} successful)`,
      );
    }
  }

  return rows;
}

function writeCSV(rows: TrainingRow[], outputPath: string): void {
  const header =
    "altitude_km,battery_capacity_wh,panel_area_m2,power_consumed_w,data_rate_mbps,duration_seconds,mission_success,total_score,grade";

  const lines = rows.map(
    (r) =>
      `${r.altitude_km},${r.battery_capacity_wh.toFixed(4)},${r.panel_area_m2.toFixed(4)},${r.power_consumed_w.toFixed(4)},${r.data_rate_mbps.toFixed(4)},${r.duration_seconds},${r.mission_success},${r.total_score},${r.grade}`,
  );

  const csv = [header, ...lines].join("\n");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, csv, "utf-8");
}

function main(): void {
  console.log(
    `🚀 Starting training data generation (${TOTAL_MISSIONS} missions)...`,
  );
  console.log(`   Output: ${OUTPUT_PATH}`);
  console.log();

  const startTime = Date.now();
  const rows = runGenerator();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log();
  console.log(`✅ Generated ${rows.length} data rows in ${elapsed}s`);
  console.log(`   Writing CSV to: ${OUTPUT_PATH}`);

  writeCSV(rows, OUTPUT_PATH);

  console.log(`✅ Done! CSV saved with ${rows.length} rows.`);
  console.log(
    `   Success rate: ${((rows.filter((r) => r.mission_success === 1).length / rows.length) * 100).toFixed(1)}%`,
  );
}

main();
