import express from "express";
import { getAllMissionProfiles } from "../mission-profiles.js";
import { runCustomMission } from "../custom-mission-runner.js";
import { getMissionProfile } from "../mission-profiles.js";
import { SimulationEngine } from "../engine.js";
import { MissionRunner } from "../mission-runner.js";
import { evaluateObjectives } from "../objective-evaluator.js";
import { calculateFinalMissionScore } from "../scoring.js";
import { customMissionSchema } from "./schemas/mission.schema.js";
import { setTimeout as delay } from "node:timers/promises";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "Mission Forge Simulation API",
  });
});

// Get predefined mission profiles
app.get("/api/missions/profiles", (_req, res) => {
  const missions = getAllMissionProfiles();

  res.json({
    count: missions.length,
    missions,
  });
});

// Run a custom mission
app.post("/api/missions/custom", (req, res) => {
  try {
    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      res.status(400).json({ error: "Request body must be a JSON object" });
      return;
    }

    const validation = customMissionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid mission configuration",
        details: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const result = runCustomMission(validation.data);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to run custom mission",
    });
  }
});

// Run a predefined mission
app.post("/api/missions/:id/run", (req, res) => {
  try {
    const profile = getMissionProfile(
      req.params.id as Parameters<typeof getMissionProfile>[0],
    );

    const engine = new SimulationEngine(profile.config);
    const runner = new MissionRunner(engine);

    const mission = runner.run(profile.durationSeconds);

    const evaluation = evaluateObjectives(
      mission,
      engine.getTelemetryHistory(),
      profile.objectiveTargets,
    );

    const score = calculateFinalMissionScore(
      mission.status,
      evaluation.objectives,
    );

    res.json({
      success: true,
      result: {
        name: profile.name,
        mission,
        evaluation,
        score,
        telemetryHistory: engine.getTelemetryHistory(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to run predefined mission",
    });
  }
});

// Stream a predefined mission using Server-Sent Events
app.get("/api/missions/:id/stream", async (req, res) => {
  let profile;

  try {
    profile = getMissionProfile(
      req.params.id as Parameters<typeof getMissionProfile>[0],
    );
  } catch {
    res.status(404).json({ error: "Mission profile not found" });
    return;
  }

  const engine = new SimulationEngine(profile.config);

  const duration = profile.durationSeconds;
  const startTime = engine.getCurrentTime();
  const targetTime = startTime + duration;

  let stepsExecuted = 0;
  let status: "COMPLETED" | "FAILED" = "COMPLETED";
  let reason = "Mission duration reached";
  let finalTelemetry = undefined;

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("start", {
    mission: profile.name,
    durationSeconds: duration,
  });

  try {
    while (engine.getCurrentTime() < targetTime) {
      if (stepsExecuted >= 1_000_000) {
        throw new Error("Maximum mission step limit exceeded");
      }

      if (res.destroyed) return;

      finalTelemetry = engine.step();
      stepsExecuted++;

      if (finalTelemetry.batteryEnergyWh <= 0) {
        status = "FAILED";
        reason = "Battery depleted";
      }

      sendEvent("telemetry", {
        step: stepsExecuted,
        progressPercent: Math.min(
          100,
          ((engine.getCurrentTime() - startTime) / duration) * 100,
        ),
        telemetry: finalTelemetry,
      });

      if (status === "FAILED") break;

      // Yield to Node's event loop so SSE data can be transmitted.
      await delay(10);
    }

    if (!finalTelemetry) {
      throw new Error("Mission executed no simulation steps");
    }

    const mission = {
      status,
      reason,
      stepsExecuted,
      startTimeSeconds: startTime,
      endTimeSeconds: engine.getCurrentTime(),
      progressPercent: Math.min(
        100,
        ((engine.getCurrentTime() - startTime) / duration) * 100,
      ),
      finalTelemetry,
    };

    const evaluation = evaluateObjectives(
      mission,
      engine.getTelemetryHistory(),
      profile.objectiveTargets,
    );

    const score = calculateFinalMissionScore(
      mission.status,
      evaluation.objectives,
    );

    sendEvent("complete", {
      mission,
      evaluation,
      score,
    });
  } catch (error) {
    sendEvent("error", {
      message: error instanceof Error ? error.message : "Simulation failed",
    });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Mission Forge API running at http://localhost:${PORT}`);
});
