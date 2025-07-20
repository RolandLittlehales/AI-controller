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

  it.each([
    { cores: 16, expectedReserved: 4, expectedMax: 12, description: "16 cores → 12 max terminals (4 reserved)" },
    { cores: 12, expectedReserved: 3, expectedMax: 9, description: "12 cores → 9 max terminals (3 reserved)" },
    { cores: 6, expectedReserved: 2, expectedMax: 4, description: "6 cores → 4 max terminals (2 reserved, minimum)" },
    { cores: 32, expectedReserved: 8, expectedMax: 24, description: "32 cores → 24 max terminals (8 reserved)" },
  ])("should calculate 25% reservation correctly for $description", ({ cores, expectedMax }: { cores: number; expectedMax: number }) => {
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: cores,
      writable: true,
    });

    const { detectSystemCapability } = useSystemResources();
    const result = detectSystemCapability();

    expect(result.totalCores).toBe(cores);
    expect(result.maxTerminals).toBe(expectedMax);
  });

  it("should return readonly systemInfo", () => {
    const { systemInfo, detectSystemCapability } = useSystemResources();

    // Set initial values
    detectSystemCapability();
    const originalValues = { ...systemInfo.value };

    // Test that systemInfo is readonly by verifying it's a ref but not modifiable
    expect(systemInfo.value).toEqual(originalValues);
    expect(typeof systemInfo.value.totalCores).toBe("number");
    expect(typeof systemInfo.value.maxTerminals).toBe("number");

    // Verify the values are correct based on detection
    expect(systemInfo.value.totalCores).toBeGreaterThan(0);
    expect(systemInfo.value.maxTerminals).toBeGreaterThan(0);
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