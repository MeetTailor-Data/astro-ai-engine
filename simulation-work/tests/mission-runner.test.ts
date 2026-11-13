
import { describe, it, expect } from "vitest";
import { SimulationEngine } from "../src/engine.js";
import { MissionRunner } from "../src/mission-runner.js";
import type { SimulationConfig } from "../src/engine.js";

const config: SimulationConfig = {
  altitudeKm: 400,
  timeStepSeconds: 60,

  panelAreaM2: 2,
  panelEfficiency: 0.3,
  panelPerformanceFactor: 0.9,
  solarIrradianceWPerM2: 1361,

  batteryCapacityWh: 1000,
  initialBatteryEnergyWh: 500,
  batteryEfficiency: 0.9,

  powerConsumedW: 100,

  dataRateMbps: 1,
  bufferCapacityGB: 10,
  initialBufferGB: 0,
  downlinkBandwidthMbps: 10,
  groundStationAvailable: true
};

describe("MissionRunner", () => {
  it("completes a mission after its duration", () => {
    const engine = new SimulationEngine(config);
    const runner = new MissionRunner(engine);

    const result = runner.run(120);

    expect(result.status).toBe("COMPLETED");
    expect(result.stepsExecuted).toBe(2);
    expect(result.endTimeSeconds).toBe(120);
    expect(result.progressPercent).toBe(100);
  });

  it("detects battery depletion", () => {
    const engine = new SimulationEngine({
      ...config,
      panelAreaM2: 0,
      initialBatteryEnergyWh: 1,
      powerConsumedW: 10000
    });

    const runner = new MissionRunner(engine);
    const result = runner.run(600);

    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("Battery depleted");
  });

  it("fails a mission after Earth impact", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 100,
      },
    });
    engine.burn(120, "RETROGRADE");

    const result = new MissionRunner(engine).run(6000);

    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("Earth impact");
    expect(result.finalTelemetry.impacted).toBe(true);
  });

  it("rejects invalid mission duration", () => {
    const runner = new MissionRunner(
      new SimulationEngine(config)
    );

    expect(() => runner.run(0)).toThrow();
    expect(() => runner.run(-10)).toThrow();
    expect(() => runner.run(Infinity)).toThrow();
  });

  it("returns final telemetry", () => {
    const engine = new SimulationEngine(config);
    const runner = new MissionRunner(engine);

    const result = runner.run(60);

    expect(result.finalTelemetry.simulationTimeSeconds)
      .toBe(60);
  });
});
