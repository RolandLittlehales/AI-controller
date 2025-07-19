import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSystemResources } from "./useSystemResources";

describe("useSystemResources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect system capabilities correctly with available hardwareConcurrency", () => {
    // Mock navigator.hardwareConcurrency for 20 cores (like user's i5-14600KF)
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 20,
      writable: true,
    });

    const { systemInfo, detectSystemCapability } = useSystemResources();
    const result = detectSystemCapability();

    expect(result.totalCores).toBe(20);
    expect(result.maxTerminals).toBe(15); // 20 - 5 reserved (25% of 20)
    expect(systemInfo.value.totalCores).toBe(20);
    expect(systemInfo.value.maxTerminals).toBe(15);
  });

  it("should handle 8-core MacBook Pro correctly", () => {
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 8,
      writable: true,
    });

    const { systemInfo, detectSystemCapability } = useSystemResources();
    const result = detectSystemCapability();

    expect(result.totalCores).toBe(8);
    expect(result.maxTerminals).toBe(6); // 8 - 2 reserved (25% of 8 = 2, meets minimum)
    expect(systemInfo.value.totalCores).toBe(8);
    expect(systemInfo.value.maxTerminals).toBe(6);
  });

  it("should fall back to 4 cores when hardwareConcurrency is undefined", () => {
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: undefined,
      writable: true,
    });

    const { systemInfo, detectSystemCapability } = useSystemResources();
    const result = detectSystemCapability();

    expect(result.totalCores).toBe(4);
    expect(result.maxTerminals).toBe(2); // 4 - 2 reserved (minimum 2)
    expect(systemInfo.value.totalCores).toBe(4);
    expect(systemInfo.value.maxTerminals).toBe(2);
  });

  it("should enforce minimum 2 reserved cores", () => {
    // Test with very low core count
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 4,
      writable: true,
    });

    const { detectSystemCapability } = useSystemResources();
    const result = detectSystemCapability();

    expect(result.totalCores).toBe(4);
    // 25% of 4 = 1, but minimum is 2, so 2 reserved
    expect(result.maxTerminals).toBe(2); // 4 - 2 reserved
  });

  it("should calculate 25% reservation correctly for various core counts", () => {
    const testCases = [
      { cores: 16, expectedReserved: 4, expectedMax: 12 }, // 25% of 16 = 4
      { cores: 12, expectedReserved: 3, expectedMax: 9 },  // 25% of 12 = 3
      { cores: 6, expectedReserved: 2, expectedMax: 4 },   // 25% of 6 = 1.5 → 2 (minimum)
      { cores: 32, expectedReserved: 8, expectedMax: 24 },  // 25% of 32 = 8
    ];

    testCases.forEach(({ cores, expectedMax }) => {
      Object.defineProperty(global.navigator, "hardwareConcurrency", {
        value: cores,
        writable: true,
      });

      const { detectSystemCapability } = useSystemResources();
      const result = detectSystemCapability();

      expect(result.totalCores).toBe(cores);
      expect(result.maxTerminals).toBe(expectedMax);
    });
  });

  it("should return readonly systemInfo", () => {
    const { systemInfo, detectSystemCapability } = useSystemResources();

    // Set initial values
    detectSystemCapability();
    const originalValues = { ...systemInfo.value };

    // Attempt to modify should not work (readonly prevents modification)
    try {
      // @ts-expect-error - Testing readonly behavior
      systemInfo.value = { totalCores: 999, maxTerminals: 999 };
    } catch {
      // Silently handle - readonly may warn but not throw
    }

    // Values should remain unchanged
    expect(systemInfo.value).toEqual(originalValues);
  });

  it("should maintain reactive state updates", () => {
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 8,
      writable: true,
    });

    const { systemInfo, detectSystemCapability } = useSystemResources();

    // Initial state should be zero
    expect(systemInfo.value.totalCores).toBe(0);
    expect(systemInfo.value.maxTerminals).toBe(0);

    // After detection, state should update
    detectSystemCapability();
    expect(systemInfo.value.totalCores).toBe(8);
    expect(systemInfo.value.maxTerminals).toBe(6);
  });
});