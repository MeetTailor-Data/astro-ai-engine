import { calculateOrbit } from "./orbit.js";
import { calculatePower } from "./power.js";
import { calculateBattery } from "./battery.js";
import { calculateCommunications } from "./communications.js";
import { EventScheduler } from "./events.js";
import { TelemetryStore } from "./telemetry.js";

export interface SimulationConfig {
  altitudeKm: number;
  timeStepSeconds: number;

  panelAreaM2: number;
  panelEfficiency: number;
  panelPerformanceFactor: number;
  solarIrradianceWPerM2: number;

  batteryCapacityWh: number;
  initialBatteryEnergyWh: number;
  batteryEfficiency: number;

  powerConsumedW: number;

  dataRateMbps: number;
  bufferCapacityGB: number;
  initialBufferGB: number;
  downlinkBandwidthMbps: number;
  groundStationAvailable: boolean;
}

export interface Telemetry {
  simulationTimeSeconds: number;
  orbitalPhase: number;
  inEclipse: boolean;

  generatedPowerW: number;
  netPowerW: number;
  batteryEnergyWh: number;

  dataGeneratedGB: number;
  dataTransmittedGB: number;
  dataBufferGB: number;

  executedEvents: string[];
}

const MAX_TIME_STEP_SECONDS = 3600;
const MAX_SIMULATION_TIME_SECONDS = 10_000_000;

function validateConfig(config: SimulationConfig): void {
  if (!config || typeof config !== "object") {
    throw new Error("Simulation configuration is required");
  }

  const numericFields: Array<[number, string]> = [
    [config.altitudeKm, "Altitude"],
    [config.timeStepSeconds, "Time step"],
    [config.panelAreaM2, "Panel area"],
    [config.panelEfficiency, "Panel efficiency"],
    [config.panelPerformanceFactor, "Panel performance"],
    [config.solarIrradianceWPerM2, "Solar irradiance"],
    [config.batteryCapacityWh, "Battery capacity"],
    [config.initialBatteryEnergyWh, "Initial battery energy"],
    [config.batteryEfficiency, "Battery efficiency"],
    [config.powerConsumedW, "Power consumption"],
    [config.dataRateMbps, "Data rate"],
    [config.bufferCapacityGB, "Buffer capacity"],
    [config.initialBufferGB, "Initial buffer"],
    [config.downlinkBandwidthMbps, "Downlink bandwidth"],
  ];

  for (const [value, field] of numericFields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be finite and non-negative`);
    }
  }

  if (config.altitudeKm <= 0) {
    throw new Error("Altitude must be greater than zero");
  }

  if (
    config.timeStepSeconds <= 0 ||
    config.timeStepSeconds > MAX_TIME_STEP_SECONDS
  ) {
    throw new Error("Time step must be between 0 and 3600 seconds");
  }

  if (
    config.panelEfficiency > 1 ||
    config.panelPerformanceFactor > 1 ||
    config.batteryEfficiency <= 0 ||
    config.batteryEfficiency > 1
  ) {
    throw new Error("Efficiency values must be in valid ranges");
  }

  if (config.batteryCapacityWh <= 0) {
    throw new Error("Battery capacity must be greater than zero");
  }

  if (config.initialBatteryEnergyWh > config.batteryCapacityWh) {
    throw new Error("Initial battery energy exceeds capacity");
  }

  if (config.bufferCapacityGB <= 0) {
    throw new Error("Buffer capacity must be greater than zero");
  }

  if (config.initialBufferGB > config.bufferCapacityGB) {
    throw new Error("Initial buffer exceeds capacity");
  }

  if (typeof config.groundStationAvailable !== "boolean") {
    throw new Error("Ground station availability must be boolean");
  }
}

export class SimulationEngine {
  private readonly config: SimulationConfig;
  private readonly scheduler = new EventScheduler();
  private readonly telemetry = new TelemetryStore();

  private simulationTimeSeconds = 0;
  private batteryEnergyWh: number;
  private dataBufferGB: number;

  constructor(config: SimulationConfig) {
    validateConfig(config);

    // Defensive copy so external changes don't affect the engine.
    this.config = Object.freeze({ ...config });

    this.batteryEnergyWh = config.initialBatteryEnergyWh;
    this.dataBufferGB = config.initialBufferGB;
  }

  get eventScheduler(): EventScheduler {
    return this.scheduler;
  }

  step(): Telemetry {
    if (
      this.simulationTimeSeconds + this.config.timeStepSeconds >
      MAX_SIMULATION_TIME_SECONDS
    ) {
      throw new Error("Maximum simulation time reached");
    }

    const nextTime = this.simulationTimeSeconds + this.config.timeStepSeconds;

    const orbit = calculateOrbit({
      altitudeKm: this.config.altitudeKm,
      elapsedSeconds: nextTime,
      initialPhase: 0,
    });

    const power = calculatePower({
      panelAreaM2: this.config.panelAreaM2,
      efficiency: this.config.panelEfficiency,
      performanceFactor: this.config.panelPerformanceFactor,
      solarIrradianceWPerM2: this.config.solarIrradianceWPerM2,
      powerConsumedW: this.config.powerConsumedW,
    });

    const battery = calculateBattery({
      capacityWh: this.config.batteryCapacityWh,
      currentEnergyWh: this.batteryEnergyWh,
      powerGeneratedW: power.powerGeneratedW,
      powerConsumedW: this.config.powerConsumedW,
      durationSeconds: this.config.timeStepSeconds,
      efficiency: this.config.batteryEfficiency,
      inEclipse: orbit.inEclipse,
    });

    const communications = calculateCommunications({
      dataRateMbps: this.config.dataRateMbps,
      durationSeconds: this.config.timeStepSeconds,
      bufferCapacityGB: this.config.bufferCapacityGB,
      currentBufferGB: this.dataBufferGB,
      groundStationAvailable: this.config.groundStationAvailable,
      downlinkBandwidthMbps: this.config.downlinkBandwidthMbps,
      contactDurationSeconds: this.config.groundStationAvailable
        ? this.config.timeStepSeconds
        : 0,
    });

    const dueEvents = this.scheduler.getDueEvents(nextTime);

    this.simulationTimeSeconds = nextTime;
    this.batteryEnergyWh = battery.remainingEnergyWh;
    this.dataBufferGB = communications.remainingBufferGB;

    const telemetry: Telemetry = {
      simulationTimeSeconds: nextTime,
      orbitalPhase: orbit.currentPhase,
      inEclipse: orbit.inEclipse,

      generatedPowerW: power.powerGeneratedW,
      netPowerW: power.netPowerW,
      batteryEnergyWh: battery.remainingEnergyWh,

      dataGeneratedGB: communications.dataGeneratedGB,
      dataTransmittedGB: communications.dataTransmittedGB,
      dataBufferGB: communications.remainingBufferGB,

      executedEvents: dueEvents.map((event) => event.id),
    };

    this.telemetry.record(telemetry);

    this.simulationTimeSeconds = nextTime;
    this.batteryEnergyWh = battery.remainingEnergyWh;
    this.dataBufferGB = communications.remainingBufferGB;

    return telemetry;
  }

  getCurrentTime(): number {
    return this.simulationTimeSeconds;
  }
  getLatestTelemetry(): Telemetry | undefined {
    return this.telemetry.getLatest();
  }

  getTelemetryHistory(): Telemetry[] {
    return this.telemetry.getAll();
  }

  getTelemetryCount(): number {
    return this.telemetry.getCount();
  }

  exportTelemetryJSON(): string {
    return this.telemetry.exportJSON();
  }
}
