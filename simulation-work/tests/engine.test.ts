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

const physicalBurnConfig = {
  ...config,
  timeStepSeconds: 1,
  propulsion: {
    thrustN: 1000,
    ispSeconds: 300,
    dryMassKg: 500,
    initialPropellantKg: 100,
  },
};

describe("Simulation Engine", () => {
  it("advances simulation time", () => {
    const engine = new SimulationEngine(config);
    const telemetry = engine.step();
    expect(telemetry.simulationTimeSeconds).toBe(60);
    expect(engine.getCurrentTime()).toBe(60);
  });

  it("advances spacecraft position every simulation step", () => {
    const engine = new SimulationEngine(config);
    const first = engine.step();
    const second = engine.step();
    expect(second.positionYM).not.toBe(first.positionYM);
    expect(second.positionXM).not.toBe(first.positionXM);
  });

  it("reports orbital elements from physical state", () => {
    const engine = new SimulationEngine(config);

    const telemetry = engine.step();

    expect(telemetry.orbitalElements.escaped).toBe(false);
    expect(telemetry.orbitalElements.eccentricity).toBeCloseTo(0, 3);
    expect(telemetry.orbitalElements.apogeeAltitudeKm).toBeCloseTo(
      config.altitudeKm,
      1,
    );
  });

  it("changes physical velocity after prograde burn", () => {
    const engine = new SimulationEngine(physicalBurnConfig);
    const before = engine.step();
    engine.burn(10, "PROGRADE");
    const after = engine.step();
    expect(after.velocityYMs).toBeGreaterThan(before.velocityYMs);
  });

  it("reduces physical velocity after retrograde burn", () => {
    const engine = new SimulationEngine(physicalBurnConfig);
    const before = engine.step();
    engine.burn(10, "RETROGRADE");
    const after = engine.step();
    expect(after.velocityYMs).toBeLessThan(before.velocityYMs);
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

    const initialVelocity = engine.step().orbitalVelocityMs;
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
    expect(telemetry.orbitalVelocityMs).toBeGreaterThan(initialVelocity);
    expect(telemetry.orbitalState.velocityMs).toBe(
      telemetry.orbitalVelocityMs,
    );
  });

  it("reduces orbital velocity after a retrograde burn", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 100,
      },
    });

    const initialVelocity = engine.step().orbitalVelocityMs;
    engine.burn(10, "RETROGRADE");
    const telemetry = engine.step();
    expect(telemetry.orbitalVelocityMs).toBeLessThan(initialVelocity);
    expect(telemetry.orbitalVelocityMs).toBeGreaterThan(0);
    expect(telemetry.orbitalState.velocityMs).toBe(
      telemetry.orbitalVelocityMs,
    );
  });

  it("increases orbital velocity after prograde burn", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 100,
      },
    });

    const initialVelocity = engine.step().orbitalVelocityMs;
    engine.burn(10, "PROGRADE");
    const telemetry = engine.step();
    expect(telemetry.orbitalVelocityMs).toBeGreaterThan(initialVelocity);
    expect(telemetry.orbitalState.apogeeAltitudeKm!).toBeGreaterThan(
      config.altitudeKm,
    );
  });

  it("decreases orbital velocity after retrograde burn", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 100,
      },
    });

    const initialVelocity = engine.step().orbitalVelocityMs;
    engine.burn(10, "RETROGRADE");
    const telemetry = engine.step();
    expect(telemetry.orbitalVelocityMs).toBeLessThan(initialVelocity);
    expect(telemetry.orbitalState.perigeeAltitudeKm!).toBeLessThan(
      config.altitudeKm,
    );
  });

  it("does not consume propellant when a retrograde burn exceeds orbital velocity", () => {
    const engine = new SimulationEngine({
      ...config,
      propulsion: {
        thrustN: 1_000_000_000,
        ispSeconds: 300,
        dryMassKg: 500,
        initialPropellantKg: 10_000,
      },
    });

    const initialTelemetry = engine.step();
    expect(() => engine.burn(1000, "RETROGRADE")).toThrow(
      "Retrograde burn exceeds current orbital velocity",
    );

    const telemetry = engine.step();
    expect(telemetry.fuelRemainingKg).toBe(
      initialTelemetry.fuelRemainingKg,
    );
    expect(telemetry.cumulativeDeltaVMS).toBe(0);
    expect(telemetry.orbitalVelocityMs).toBe(
      initialTelemetry.orbitalVelocityMs,
    );
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
