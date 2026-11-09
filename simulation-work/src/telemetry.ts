import type { Telemetry } from "./engine.js";

const MAX_SNAPSHOTS = 100_000;

function validateTelemetry(snapshot: Telemetry): void {
  const nonNegativeFields: [number, string][] = [
    [snapshot.simulationTimeSeconds, "simulationTimeSeconds"],
    [snapshot.orbitalPhase, "orbitalPhase"],
    [snapshot.generatedPowerW, "generatedPowerW"],
    [snapshot.batteryEnergyWh, "batteryEnergyWh"],
    [snapshot.dataGeneratedGB, "dataGeneratedGB"],
    [snapshot.dataTransmittedGB, "dataTransmittedGB"],
    [snapshot.dataBufferGB, "dataBufferGB"],
  ];

  for (const [value, field] of nonNegativeFields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be finite and non-negative`);
    }
  }

  // Net power can legitimately be negative.
  if (!Number.isFinite(snapshot.netPowerW)) {
    throw new Error("netPowerW must be finite");
  }

  if (snapshot.orbitalPhase >= 1) {
    throw new Error("orbitalPhase must be less than 1");
  }

  if (typeof snapshot.inEclipse !== "boolean") {
    throw new Error("inEclipse must be a boolean");
  }

  if (
    !Array.isArray(snapshot.executedEvents) ||
    snapshot.executedEvents.length > 100 ||
    snapshot.executedEvents.some(
      (event) => typeof event !== "string" || event.length === 0,
    )
  ) {
    throw new Error("executedEvents must contain valid event IDs");
  }
}

function copySnapshot(snapshot: Telemetry): Telemetry {
  return {
    ...snapshot,
    executedEvents: [...snapshot.executedEvents],
  };
}

export class TelemetryStore {
  private snapshots: Telemetry[] = [];

  record(snapshot: Telemetry): void {
    validateTelemetry(snapshot);

    if (this.snapshots.length >= MAX_SNAPSHOTS) {
      throw new Error("Telemetry storage limit reached");
    }

    const previous = this.snapshots.at(-1);

    if (
      previous &&
      snapshot.simulationTimeSeconds <= previous.simulationTimeSeconds
    ) {
      throw new Error("Telemetry timestamps must increase");
    }

    this.snapshots.push(copySnapshot(snapshot));
  }

  getLatest(): Telemetry | undefined {
    const latest = this.snapshots.at(-1);
    return latest ? copySnapshot(latest) : undefined;
  }

  getAll(): Telemetry[] {
    return this.snapshots.map(copySnapshot);
  }

  getCount(): number {
    return this.snapshots.length;
  }

  clear(): void {
    this.snapshots = [];
  }

  exportJSON(): string {
    return JSON.stringify(this.snapshots);
  }
}
