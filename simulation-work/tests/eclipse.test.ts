import { describe, expect, it } from "vitest";
import { isInEclipse } from "../src/orbit.js";

describe("isInEclipse", () => {
  it("detects eclipse behind Earth", () => {
    expect(
      isInEclipse({
        position: { x: -7_000_000, y: 0 },
        sunDirection: { x: 1, y: 0 },
      }),
    ).toBe(true);
  });

  it("detects sunlight in front of Earth", () => {
    expect(
      isInEclipse({
        position: { x: 7_000_000, y: 0 },
        sunDirection: { x: 1, y: 0 },
      }),
    ).toBe(false);
  });

  it("detects sunlight outside Earth's shadow", () => {
    expect(
      isInEclipse({
        position: { x: -7_000_000, y: 7_000_000 },
        sunDirection: { x: 1, y: 0 },
      }),
    ).toBe(false);
  });
});
