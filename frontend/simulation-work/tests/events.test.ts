import { describe, it, expect } from "vitest";
import { EventScheduler } from "../src/events.js";

describe("Mission Event Scheduler", () => {
  it("schedules events chronologically", () => {
    const scheduler = new EventScheduler();

    scheduler.schedule({
      id: "burn",
      type: "ENGINE_BURN",
      timeSeconds: 100,
    });

    scheduler.schedule({
      id: "deployment",
      type: "DEPLOYMENT",
      timeSeconds: 50,
    });

    const events = scheduler.getPendingEvents();

    expect(events[0]?.id).toBe("deployment");
    expect(events[1]?.id).toBe("burn");
  });

  it("returns only events due at current time", () => {
    const scheduler = new EventScheduler();

    scheduler.schedule({
      id: "burn",
      type: "ENGINE_BURN",
      timeSeconds: 100,
    });

    scheduler.schedule({
      id: "deployment",
      type: "DEPLOYMENT",
      timeSeconds: 200,
    });

    const due = scheduler.getDueEvents(100);

    expect(due.length).toBe(1);
    expect(due[0]?.id).toBe("burn");
    expect(scheduler.getPendingCount()).toBe(1);
  });

  it("rejects duplicate event IDs", () => {
    const scheduler = new EventScheduler();

    const event = {
      id: "burn",
      type: "ENGINE_BURN" as const,
      timeSeconds: 100,
    };

    scheduler.schedule(event);

    expect(() => scheduler.schedule(event)).toThrow();
  });

  it("rejects negative event time", () => {
    const scheduler = new EventScheduler();

    expect(() =>
      scheduler.schedule({
        id: "burn",
        type: "ENGINE_BURN",
        timeSeconds: -10,
      }),
    ).toThrow();
  });

  it("rejects invalid event types", () => {
    const scheduler = new EventScheduler();

    expect(() =>
      scheduler.schedule({
        id: "bad",
        type: "INVALID" as never,
        timeSeconds: 10,
      }),
    ).toThrow();
  });

  it("does not execute an event twice", () => {
    const scheduler = new EventScheduler();

    scheduler.schedule({
      id: "burn",
      type: "ENGINE_BURN",
      timeSeconds: 10,
    });

    expect(scheduler.getDueEvents(10).length).toBe(1);
    expect(scheduler.getDueEvents(20).length).toBe(0);
  });

  it("rejects scheduling an already executed ID", () => {
    const scheduler = new EventScheduler();

    scheduler.schedule({
      id: "burn",
      type: "ENGINE_BURN",
      timeSeconds: 10,
    });

    scheduler.getDueEvents(10);

    expect(() =>
      scheduler.schedule({
        id: "burn",
        type: "ENGINE_BURN",
        timeSeconds: 20,
      }),
    ).toThrow();
  });
});
