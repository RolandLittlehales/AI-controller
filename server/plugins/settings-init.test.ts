import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import settingsInitPlugin from "./settings-init";
import { initializeSettings } from "../services/settingsInit";

// Mock logger to prevent output pollution
vi.mock("~/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the settings initialization service
vi.mock("../services/settingsInit", () => ({
  initializeSettings: vi.fn(),
}));

describe("settings-init plugin", () => {
  const mockInitializeSettings = vi.mocked(initializeSettings);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize settings successfully on server startup", async () => {
    mockInitializeSettings.mockResolvedValue(undefined);

    await settingsInitPlugin();

    expect(mockInitializeSettings).toHaveBeenCalledOnce();
    expect(mockInitializeSettings).toHaveBeenCalledWith();
  });

  it("should handle initialization errors gracefully", async () => {
    const initError = new Error("Failed to initialize settings");
    mockInitializeSettings.mockRejectedValue(initError);

    // The plugin should propagate the error for proper server startup handling
    await expect(settingsInitPlugin()).rejects.toThrow("Failed to initialize settings");
    expect(mockInitializeSettings).toHaveBeenCalledOnce();
  });

  it("should handle async initialization completion", async () => {
    // Simulate async initialization taking some time
    let resolveInit: () => void;
    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    mockInitializeSettings.mockReturnValue(initPromise);

    const pluginPromise = settingsInitPlugin();

    // Verify it's waiting for initialization
    expect(mockInitializeSettings).toHaveBeenCalledOnce();

    // Complete the initialization
    resolveInit!();
    await expect(pluginPromise).resolves.toBeUndefined();
  });

  it("should maintain proper async execution flow", async () => {
    const executionOrder: string[] = [];

    mockInitializeSettings.mockImplementation(async () => {
      executionOrder.push("initializeSettings-start");
      await new Promise(resolve => setTimeout(resolve, 10));
      executionOrder.push("initializeSettings-end");
    });

    executionOrder.push("plugin-start");
    await settingsInitPlugin();
    executionOrder.push("plugin-end");

    expect(executionOrder).toEqual([
      "plugin-start",
      "initializeSettings-start",
      "initializeSettings-end",
      "plugin-end",
    ]);
  });

  it("should handle service initialization with different error types", async () => {
    // Test with string error
    mockInitializeSettings.mockRejectedValue("String error");
    await expect(settingsInitPlugin()).rejects.toBe("String error");

    vi.clearAllMocks();

    // Test with object error
    const objectError = { message: "Object error", code: 500 };
    mockInitializeSettings.mockRejectedValue(objectError);
    await expect(settingsInitPlugin()).rejects.toBe(objectError);

    vi.clearAllMocks();

    // Test with null/undefined rejection
    mockInitializeSettings.mockRejectedValue(null);
    await expect(settingsInitPlugin()).rejects.toBeNull();
  });

  it("should verify plugin is a proper async function", () => {
    expect(settingsInitPlugin).toBeInstanceOf(Function);
    expect(settingsInitPlugin.constructor.name).toBe("AsyncFunction");
  });

  it("should complete initialization without side effects", async () => {
    mockInitializeSettings.mockResolvedValue(undefined);

    const result = await settingsInitPlugin();

    expect(result).toBeUndefined();
    expect(mockInitializeSettings).toHaveBeenCalledTimes(1);
    
    // Verify no additional calls were made
    vi.clearAllMocks();
    expect(mockInitializeSettings).not.toHaveBeenCalled();
  });

  describe("plugin integration scenarios", () => {
    it("should handle settings initialization during server startup", async () => {
      mockInitializeSettings.mockResolvedValue(undefined);

      // Simulate server startup with plugin initialization
      const startupTasks = [
        settingsInitPlugin(),
        Promise.resolve("other-startup-task"),
      ];

      const results = await Promise.all(startupTasks);

      expect(results).toEqual([undefined, "other-startup-task"]);
      expect(mockInitializeSettings).toHaveBeenCalledOnce();
    });

    it("should fail server startup if settings initialization fails", async () => {
      const criticalError = new Error("Critical settings initialization failure");
      mockInitializeSettings.mockRejectedValue(criticalError);

      // Simulate server startup that should fail if settings can't initialize
      const startupPromise = Promise.all([
        settingsInitPlugin(),
        Promise.resolve("other-startup-task"),
      ]);

      await expect(startupPromise).rejects.toThrow("Critical settings initialization failure");
    });

    it("should handle concurrent plugin execution safely", async () => {
      mockInitializeSettings.mockResolvedValue(undefined);

      // Test that multiple concurrent calls to the plugin work correctly
      const concurrentCalls = [
        settingsInitPlugin(),
        settingsInitPlugin(),
        settingsInitPlugin(),
      ];

      await Promise.all(concurrentCalls);

      // Each call should invoke initialization
      expect(mockInitializeSettings).toHaveBeenCalledTimes(3);
    });
  });
});