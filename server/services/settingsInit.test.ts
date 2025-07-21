import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SettingsInitializer, initializeSettings } from "./settingsInit";
import { settingsFileService } from "./settingsFiles";
import { mockLogger } from "~/test/setup";

// Mock the settingsFileService
vi.mock("./settingsFiles", () => ({
  settingsFileService: {
    ensureSettingsDirectory: vi.fn(),
    loadSettings: vi.fn(),
  },
}));

const mockSettingsFileService = vi.mocked(settingsFileService);

describe("SettingsInitializer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.error.mockClear();
    // Reset the initialized state
    SettingsInitializer._resetForTesting();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialize", () => {
    it("should initialize settings directory and load all categories", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockResolvedValue();
      mockSettingsFileService.loadSettings.mockResolvedValue({});

      await SettingsInitializer.initialize();

      expect(mockSettingsFileService.ensureSettingsDirectory).toHaveBeenCalledTimes(1);
      expect(mockSettingsFileService.loadSettings).toHaveBeenCalledTimes(3);
      expect(mockSettingsFileService.loadSettings).toHaveBeenCalledWith("ui");
      expect(mockSettingsFileService.loadSettings).toHaveBeenCalledWith("terminal");
      expect(mockSettingsFileService.loadSettings).toHaveBeenCalledWith("session");
    });

    it("should not initialize twice", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockResolvedValue();
      mockSettingsFileService.loadSettings.mockResolvedValue({});

      await SettingsInitializer.initialize();
      await SettingsInitializer.initialize();

      expect(mockSettingsFileService.ensureSettingsDirectory).toHaveBeenCalledTimes(1);
      expect(mockSettingsFileService.loadSettings).toHaveBeenCalledTimes(3);
    });

    it("should handle initialization errors", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockRejectedValue(new Error("Directory creation failed"));

      await expect(SettingsInitializer.initialize()).rejects.toThrow("Directory creation failed");
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to initialize settings system", new Error("Directory creation failed"));
    });

    it("should handle load settings errors", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockResolvedValue();
      mockSettingsFileService.loadSettings.mockRejectedValue(new Error("Load failed"));

      await expect(SettingsInitializer.initialize()).rejects.toThrow("Load failed");
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to initialize settings system", new Error("Load failed"));
    });
  });

  describe("isInitialized", () => {
    it("should return false before initialization", () => {
      expect(SettingsInitializer.isInitialized()).toBe(false);
    });

    it("should return true after successful initialization", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockResolvedValue();
      mockSettingsFileService.loadSettings.mockResolvedValue({});

      await SettingsInitializer.initialize();

      expect(SettingsInitializer.isInitialized()).toBe(true);
    });

    it("should return false after failed initialization", async () => {
      mockSettingsFileService.ensureSettingsDirectory.mockRejectedValue(new Error("Init failed"));

      try {
        await SettingsInitializer.initialize();
      } catch {
        // Expected to fail
      }

      expect(SettingsInitializer.isInitialized()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to initialize settings system", new Error("Init failed"));
    });
  });
});

describe("initializeSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.error.mockClear();
    // Reset the initialized state
    SettingsInitializer._resetForTesting();
  });

  it("should call SettingsInitializer.initialize", async () => {
    mockSettingsFileService.ensureSettingsDirectory.mockResolvedValue();
    mockSettingsFileService.loadSettings.mockResolvedValue({});

    await initializeSettings();

    expect(mockSettingsFileService.ensureSettingsDirectory).toHaveBeenCalledTimes(1);
    expect(mockSettingsFileService.loadSettings).toHaveBeenCalledTimes(3);
  });
});