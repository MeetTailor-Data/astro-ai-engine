
export interface CommunicationsInput {
  dataRateMbps: number;
  durationSeconds: number;
  bufferCapacityGB: number;
  currentBufferGB: number;
  groundStationAvailable: boolean;
  downlinkBandwidthMbps: number;
  contactDurationSeconds: number;
}

export interface CommunicationsResult {
  dataGeneratedGB: number;
  downlinkCapacityGB: number;
  dataTransmittedGB: number;
  remainingBufferGB: number;
  bufferOverflowGB: number;
}

function validate(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be finite and non-negative`);
  }
}

export function calculateCommunications(
  input: CommunicationsInput
): CommunicationsResult {
  const {
    dataRateMbps,
    durationSeconds,
    bufferCapacityGB,
    currentBufferGB,
    groundStationAvailable,
    downlinkBandwidthMbps,
    contactDurationSeconds
  } = input;

  validate(dataRateMbps, "Data rate");
  validate(durationSeconds, "Duration");
  validate(bufferCapacityGB, "Buffer capacity");
  validate(currentBufferGB, "Current buffer");
  validate(downlinkBandwidthMbps, "Downlink bandwidth");
  validate(contactDurationSeconds, "Contact duration");

  if (bufferCapacityGB <= 0) {
    throw new Error("Buffer capacity must be greater than zero");
  }

  if (currentBufferGB > bufferCapacityGB) {
    throw new Error("Current buffer cannot exceed buffer capacity");
  }

  // Mbps × seconds / 8000 = decimal GB
  const dataGeneratedGB =
    (dataRateMbps * durationSeconds) / 8000;

  const downlinkCapacityGB = groundStationAvailable
    ? (downlinkBandwidthMbps * contactDurationSeconds) / 8000
    : 0;

  // Data available before transmission
  const totalBufferGB = currentBufferGB + dataGeneratedGB;

  // Transmit only what is available in the buffer
  const dataTransmittedGB = Math.min(
    totalBufferGB,
    downlinkCapacityGB
  );

  const bufferAfterTransmission =
    totalBufferGB - dataTransmittedGB;

  // Prevent buffer from exceeding its physical capacity
  const remainingBufferGB = Math.min(
    bufferAfterTransmission,
    bufferCapacityGB
  );

  const bufferOverflowGB =
    Math.max(0, bufferAfterTransmission - bufferCapacityGB);

  return {
    dataGeneratedGB,
    downlinkCapacityGB,
    dataTransmittedGB,
    remainingBufferGB,
    bufferOverflowGB
  };
}
