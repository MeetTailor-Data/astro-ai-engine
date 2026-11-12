
import { describe, it, expect } from "vitest";
import { calculateCommunications } from "../src/communications.js";

describe("Communications Calculator", () => {

  it("calculates generated scientific data", () => {
    const result = calculateCommunications({
      dataRateMbps: 8,
      durationSeconds: 3600,
      bufferCapacityGB: 10,
      currentBufferGB: 0,
      groundStationAvailable: false,
      downlinkBandwidthMbps: 100,
      contactDurationSeconds: 0
    });

    expect(result.dataGeneratedGB).toBe(3.6);
    expect(result.dataTransmittedGB).toBe(0);
    expect(result.remainingBufferGB).toBe(3.6);
  });

  it("transmits data during ground station contact", () => {
    const result = calculateCommunications({
      dataRateMbps: 8,
      durationSeconds: 3600,
      bufferCapacityGB: 10,
      currentBufferGB: 0,
      groundStationAvailable: true,
      downlinkBandwidthMbps: 10,
      contactDurationSeconds: 3600
    });

    expect(result.dataGeneratedGB).toBe(3.6);
    expect(result.downlinkCapacityGB).toBe(4.5);
    expect(result.dataTransmittedGB).toBe(3.6);
    expect(result.remainingBufferGB).toBe(0);
  });

  it("does not transmit without ground station contact", () => {
    const result = calculateCommunications({
      dataRateMbps: 8,
      durationSeconds: 3600,
      bufferCapacityGB: 10,
      currentBufferGB: 2,
      groundStationAvailable: false,
      downlinkBandwidthMbps: 100,
      contactDurationSeconds: 3600
    });

    expect(result.dataTransmittedGB).toBe(0);
    expect(result.remainingBufferGB).toBe(5.6);
  });

  it("detects buffer overflow", () => {
    const result = calculateCommunications({
      dataRateMbps: 8,
      durationSeconds: 3600,
      bufferCapacityGB: 4,
      currentBufferGB: 2,
      groundStationAvailable: false,
      downlinkBandwidthMbps: 100,
      contactDurationSeconds: 0
    });

    expect(result.remainingBufferGB).toBe(4);
    expect(result.bufferOverflowGB).toBeCloseTo(1.6);
  });

  it("rejects negative data rate", () => {
    expect(() => calculateCommunications({
      dataRateMbps: -8,
      durationSeconds: 3600,
      bufferCapacityGB: 10,
      currentBufferGB: 0,
      groundStationAvailable: false,
      downlinkBandwidthMbps: 100,
      contactDurationSeconds: 0
    })).toThrow();
  });

});
