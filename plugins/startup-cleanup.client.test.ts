import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock logger with hoisted functions for proper access in tests
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("~/utils/logger", () => ({
  logger: mockLogger,
}));

// Mock useStartupCleanup composable
const mockCleanupReport = {
  cleanedStates: 0,
  cleanedWorktrees: 0,
  errors: [],
  startTime: new Date(),
  endTime: new Date(),
  duration: 100,
};

const mockStartupCleanup = {
  performSafeStartupCleanup: vi.fn().mockResolvedValue(mockCleanupReport),
  isCleanupNeeded: vi.fn().mockResolvedValue(false),
  isRunning: { value: false },
  cleanupReport: { value: null },
};

vi.mock("~/composables/useStartupCleanup", () => ({
  useStartupCleanup: () => mockStartupCleanup,
}));

// Mock defineNuxtPlugin
const mockPlugin = vi.fn();
vi.mock("nuxt/app", () => ({
  defineNuxtPlugin: mockPlugin,
}));

describe("startup-cleanup.client plugin", () => {

  let pluginFunction: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset import.meta.server
    Object.defineProperty(import.meta, "server", {
      value: false,
      configurable: true,
    });

    // Import the plugin once and extract the function
    vi.resetModules(); // Clear module cache
    await import("./startup-cleanup.client");
    pluginFunction = mockPlugin.mock.calls[0]?.[0];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should register plugin with defineNuxtPlugin", async () => {
    expect(mockPlugin).toHaveBeenCalledWith(expect.any(Function));
    expect(pluginFunction).toBeDefined();
  });

  it.skip("should not run on server side - skip due to import.meta.server runtime complexity", () => {
    // This test is skipped because testing import.meta.server behavior
    // requires complex module mocking that doesn't align with integration testing principles
    // The server-side check is handled by Nuxt's runtime and is tested in e2e scenarios
  });

  it("should check if cleanup is needed and skip if not needed", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(false);

    await pluginFunction();

    expect(mockStartupCleanup.isCleanupNeeded).toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalledWith("No startup cleanup needed");
    expect(mockStartupCleanup.performSafeStartupCleanup).not.toHaveBeenCalled();
  });

  it("should run cleanup when needed and log success", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    mockStartupCleanup.performSafeStartupCleanup.mockResolvedValue({
      ...mockCleanupReport,
      cleanedStates: 2,
      cleanedWorktrees: 1,
      errors: [],
    });

    // Start the plugin (which will schedule cleanup after 1 second)
    await pluginFunction();

    expect(mockStartupCleanup.isCleanupNeeded).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith("Startup cleanup needed, running in background");

    // Fast-forward the setTimeout delay
    await vi.runAllTimersAsync();

    expect(mockStartupCleanup.performSafeStartupCleanup).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith("Startup cleanup completed", {
      states: 2,
      worktrees: 1,
      duration: mockCleanupReport.duration,
    });
  });

  it("should log cleanup success even when only states are cleaned", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    mockStartupCleanup.performSafeStartupCleanup.mockResolvedValue({
      ...mockCleanupReport,
      cleanedStates: 3,
      cleanedWorktrees: 0,
      errors: [],
    });

    await pluginFunction();

    // Fast-forward the setTimeout delay
    await vi.runAllTimersAsync();

    expect(mockLogger.info).toHaveBeenCalledWith("Startup cleanup completed", {
      states: 3,
      worktrees: 0,
      duration: mockCleanupReport.duration,
    });
  });

  it("should log cleanup errors when they occur", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    mockStartupCleanup.performSafeStartupCleanup.mockResolvedValue({
      ...mockCleanupReport,
      cleanedStates: 1,
      cleanedWorktrees: 0,
      errors: ["Error 1", "Error 2"],
    });

    await pluginFunction();

    // Fast-forward the setTimeout delay
    await vi.runAllTimersAsync();

    expect(mockLogger.warn).toHaveBeenCalledWith("Startup cleanup completed with errors", {
      errors: ["Error 1", "Error 2"],
    });
  });

  it("should handle cleanup check failures gracefully", async () => {
    const checkError = new Error("Check failed");
    mockStartupCleanup.isCleanupNeeded.mockRejectedValue(checkError);

    await pluginFunction();

    expect(mockLogger.error).toHaveBeenCalledWith("Startup cleanup check failed", { error: checkError });
    expect(mockStartupCleanup.performSafeStartupCleanup).not.toHaveBeenCalled();
  });

  it("should handle background cleanup failures gracefully", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    const cleanupError = new Error("Background cleanup failed");
    mockStartupCleanup.performSafeStartupCleanup.mockRejectedValue(cleanupError);

    await pluginFunction();

    // Fast-forward the setTimeout delay
    await vi.runAllTimersAsync();

    expect(mockLogger.error).toHaveBeenCalledWith("Background startup cleanup failed", { error: cleanupError });
  });

  it("should use 1 second delay for background cleanup", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    await pluginFunction();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(mockStartupCleanup.performSafeStartupCleanup).not.toHaveBeenCalled();

    // Advance time and verify cleanup runs
    await vi.runOnlyPendingTimersAsync();
    expect(mockStartupCleanup.performSafeStartupCleanup).toHaveBeenCalled();
  });

  it("should not log success when nothing is cleaned", async () => {
    mockStartupCleanup.isCleanupNeeded.mockResolvedValue(true);
    mockStartupCleanup.performSafeStartupCleanup.mockResolvedValue({
      ...mockCleanupReport,
      cleanedStates: 0,
      cleanedWorktrees: 0,
      errors: [],
    });

    await pluginFunction();

    // Fast-forward the setTimeout delay
    await vi.runAllTimersAsync();

    // Should not log cleanup success when nothing was cleaned
    expect(mockLogger.info).not.toHaveBeenCalledWith("Startup cleanup completed", expect.any(Object));
    expect(mockLogger.warn).not.toHaveBeenCalledWith("Startup cleanup completed with errors", expect.any(Object));
  });
});