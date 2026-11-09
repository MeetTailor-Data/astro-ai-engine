
export type MissionEventType =
  | "ENGINE_BURN"
  | "ENGINE_SHUTDOWN"
  | "ECLIPSE_ENTRY"
  | "ECLIPSE_EXIT"
  | "GROUND_CONTACT_START"
  | "GROUND_CONTACT_END"
  | "DEPLOYMENT";

export interface MissionEvent {
  id: string;
  type: MissionEventType;
  timeSeconds: number;
  payload?: Readonly<Record<string, unknown>>;
}

const MAX_EVENTS = 10_000;
const MAX_TIME_SECONDS = 10_000_000_000;

function validateEvent(event: MissionEvent): void {
  if (!event || typeof event !== "object") {
    throw new Error("Event must be an object");
  }

  if (
    typeof event.id !== "string" ||
    event.id.trim().length === 0 ||
    event.id.length > 100
  ) {
    throw new Error("Event ID must be 1–100 characters");
  }

  const allowedTypes: MissionEventType[] = [
    "ENGINE_BURN",
    "ENGINE_SHUTDOWN",
    "ECLIPSE_ENTRY",
    "ECLIPSE_EXIT",
    "GROUND_CONTACT_START",
    "GROUND_CONTACT_END",
    "DEPLOYMENT"
  ];

  if (!allowedTypes.includes(event.type)) {
    throw new Error("Invalid event type");
  }

  if (
    !Number.isFinite(event.timeSeconds) ||
    event.timeSeconds < 0 ||
    event.timeSeconds > MAX_TIME_SECONDS
  ) {
    throw new Error("Event time is invalid");
  }

  if (
    event.payload !== undefined &&
    (
      event.payload === null ||
      typeof event.payload !== "object" ||
      Array.isArray(event.payload)
    )
  ) {
    throw new Error("Event payload must be an object");
  }
}

export class EventScheduler {
  private events: MissionEvent[] = [];
  private executedIds = new Set<string>();

  schedule(event: MissionEvent): void {
    validateEvent(event);

    if (this.events.length >= MAX_EVENTS) {
      throw new Error("Maximum event limit reached");
    }

    if (
      this.events.some(e => e.id === event.id) ||
      this.executedIds.has(event.id)
    ) {
      throw new Error("Duplicate event ID");
    }

    // Defensive copy prevents external mutation.
    const copiedEvent: MissionEvent = {
      id: event.id,
      type: event.type,
      timeSeconds: event.timeSeconds,
      ...(event.payload !== undefined
        ? { payload: Object.freeze({ ...event.payload }) }
        : {})
    };

    this.events.push(copiedEvent);

    // Sort chronologically; stable ID ordering for equal times.
    this.events.sort(
      (a, b) =>
        a.timeSeconds - b.timeSeconds ||
        a.id.localeCompare(b.id)
    );
  }

  getDueEvents(currentTimeSeconds: number): MissionEvent[] {
    if (
      !Number.isFinite(currentTimeSeconds) ||
      currentTimeSeconds < 0 ||
      currentTimeSeconds > MAX_TIME_SECONDS
    ) {
      throw new Error("Current simulation time is invalid");
    }

    const due = this.events.filter(
      event => event.timeSeconds <= currentTimeSeconds
    );

    this.events = this.events.filter(
      event => event.timeSeconds > currentTimeSeconds
    );

    for (const event of due) {
      this.executedIds.add(event.id);
    }

    return due;
  }

  getPendingEvents(): readonly MissionEvent[] {
    return this.events.map(event => ({ ...event }));
  }

  getPendingCount(): number {
    return this.events.length;
  }
}
