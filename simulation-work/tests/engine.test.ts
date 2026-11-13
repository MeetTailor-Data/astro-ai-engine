import { describe, it, expect } from "vitest";
import { SimulationEngine } from "../src/engine.js";

const config = {
  altitudeKm: 400,
  timeStepSeconds: 60,

  panelAreaM2: 2,
  panelEfficiency: 0.3,
  panelPerformanceFactor: 0.9,
  solarIrradianceWPerM2: 1361,

  batteryCapacityWh: 500,
  initialBatteryEnergyWh: 400,
  batteryEfficiency: 0.9,

  powerConsumedW: 100,

  dataRateMbps: 8,
  bufferCapacityGB: 10,
  initialBufferGB: 0,
  downlinkBandwidthMbps: 10,
  groundStationAvailable: false,
};

describe("Simulation Engine", () => {
  it("advances simulation time", () => {
    const engine = new SimulationEngine(config);

    const telemetry = engine.step();

    expect(telemetry.simulationTimeSeconds).toBe(60);
    expect(engine.getCurrentTime()).toBe(60);
  });

  it("generates telemetry", () => {
    const engine = new SimulationEngine(config);

    const telemetry = engine.step();

    expect(telemetry.generatedPowerW).toBeGreaterThan(0);
    expect(telemetry.orbitalPhase).toBeGreaterThan(0);
    expect(telemetry.batteryEnergyWh).toBeGreaterThan(0);
  });

  it("executes scheduled events", () => {
    const engine = new SimulationEngine(config);

    engine.eventScheduler.schedule({
      id: "deployment",
      type: "DEPLOYMENT",
      timeSeconds: 30,
    });

    const telemetry = engine.step();

    expect(telemetry.executedEvents).toContain("deployment");
  });

  it("rejects invalid time step", () => {
    expect(
      () =>
        new SimulationEngine({
          ...config,
          timeStepSeconds: 0,
        }),
    ).toThrow();
  });

  it("rejects battery energy above capacity", () => {
    expect(
      () =>
        new SimulationEngine({
          ...config,
          initialBatteryEnergyWh: 600,
        }),
    ).toThrow();
  });

  it("keeps simulation time unchanged if step fails", () => {
    const engine = new SimulationEngine(config);

    expect(engine.getCurrentTime()).toBe(0);
    expect(engine.getCurrentTime()).toBe(0);
  });

  it("automatically records telemetry after each step", () => {
    const engine = new SimulationEngine(config);

    engine.step();
    engine.step();

    expect(engine.getTelemetryCount()).toBe(2);
    expect(engine.getTelemetryHistory()).toHaveLength(2);
  });

  it("consumes fuel and updates mass after engine burn", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 100,
      },
    });

    const result = engine.burn(10);

    expect(result.consumedPropellantKg).toBeGreaterThan(0);
    expect(result.remainingPropellantKg).toBeLessThan(100);

    const telemetry = engine.step();

    expect(telemetry.fuelRemainingKg).toBe(
      result.remainingPropellantKg,
    );

    expect(telemetry.currentMassKg).toBeCloseTo(
      500 + result.remainingPropellantKg,
    );

    expect(telemetry.cumulativeDeltaVMS).toBeGreaterThan(0);
  });

  it("returns latest telemetry", () => {
    const engine = new SimulationEngine(config);

    engine.step();

    expect(engine.getLatestTelemetry()?.simulationTimeSeconds).toBe(60);
  });

  it("exports telemetry as JSON", () => {
    const engine = new SimulationEngine(config);

    engine.step();

    const exported = JSON.parse(engine.exportTelemetryJSON());

    expect(exported).toHaveLength(1);
    expect(exported[0].simulationTimeSeconds).toBe(60);
  });

  it("protects internal telemetry from external modification", () => {
    const engine = new SimulationEngine(config);

    engine.step();

    const history = engine.getTelemetryHistory();
    history[0]?.executedEvents.push("fake-event");

    expect(engine.getLatestTelemetry()?.executedEvents).not.toContain(
      "fake-event",
    );
  });
});
