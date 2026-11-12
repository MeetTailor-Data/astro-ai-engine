
import { describe, it, expect } from "vitest";
import { TelemetryStore } from "../src/telemetry.js";
import type { Telemetry } from "../src/engine.js";

const sample: Telemetry = {
  simulationTimeSeconds: 60,
  orbitalPhase: 0.1,
  inEclipse: false,
  generatedPowerW: 500,
  netPowerW: 100,
  batteryEnergyWh: 400,
  dataGeneratedGB: 0.06,
  dataTransmittedGB: 0,
  dataBufferGB: 0.06,
  executedEvents: ["deployment"]
};

describe("Telemetry Store", () => {
  it("records snapshots", () => {
    const store = new TelemetryStore();

    store.record(sample);

    expect(store.getCount()).toBe(1);
    expect(store.getLatest()?.simulationTimeSeconds).toBe(60);
  });

  it("rejects duplicate timestamps", () => {
    const store = new TelemetryStore();

    store.record(sample);

    expect(() => store.record(sample)).toThrow();
  });

  it("rejects negative battery energy", () => {
    const store = new TelemetryStore();

    expect(() =>
      store.record({
        ...sample,
        batteryEnergyWh: -1
      })
    ).toThrow();
  });

  it("protects stored snapshots from external mutation", () => {
    const store = new TelemetryStore();

    const input = {
      ...sample,
      executedEvents: ["deployment"]
    };

    store.record(input);

    input.executedEvents.push("modified");

    expect(store.getLatest()?.executedEvents)
      .toEqual(["deployment"]);
  });

  it("protects stored data when reading", () => {
    const store = new TelemetryStore();

    store.record(sample);

    const latest = store.getLatest();
    latest?.executedEvents.push("modified");

    expect(store.getLatest()?.executedEvents)
      .toEqual(["deployment"]);
  });

  it("exports valid JSON", () => {
    const store = new TelemetryStore();

    store.record(sample);

    const exported = JSON.parse(store.exportJSON());

    expect(exported).toHaveLength(1);
    expect(exported[0].batteryEnergyWh).toBe(400);
  });

  it("clears telemetry", () => {
    const store = new TelemetryStore();

    store.record(sample);
    store.clear();

    expect(store.getCount()).toBe(0);
    expect(store.getLatest()).toBeUndefined();
  });
});
