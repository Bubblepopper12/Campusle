import { afterEach, describe, expect, it, vi } from "vitest";
import { load, save } from "../src/lib/storage";

describe("storage", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("never throws when storage is blocked", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    expect(load("k", 42)).toBe(42);
    expect(() => save("k", 1)).not.toThrow();
  });
  it("falls back on corrupt JSON", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "{nope", setItem: () => {} } });
    expect(load("k", "fallback")).toBe("fallback");
  });
});
