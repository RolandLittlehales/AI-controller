import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { UISettings, TerminalConfig, SessionData } from "../../types";

// Mock the entire module
vi.mock("./settingsFiles", async () => {
  const actual = await vi.importActual<typeof import("./settingsFiles")>("./settingsFiles");
  
  return {
    ...actual,
    settingsFileService: {
      ensureSettingsDirectory: vi.fn(),
      loadSettings: vi.fn(),
      saveSettings: vi.fn(),
      updateSettings: vi.fn(),
      resetSettings: vi.fn(),
      resetAllSettings: vi.fn(),
      loadUISettings: vi.fn(),
      saveUISettings: vi.fn(),
      updateUISettings: vi.fn(),
      loadTerminalConfig: vi.fn(),
      saveTerminalConfig: vi.fn(),
      updateTerminalConfig: vi.fn(),
      loadSessionData: vi.fn(),
      saveSessionData: vi.fn(),
      updateSessionData: vi.fn(),
    },
  };
});

// Import after mocking
import { settingsFileService } from "./settingsFiles";

// Get mocked service
const mockService = vi.mocked(settingsFileService);

describe("SettingsFileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureSettingsDirectory", () => {
    it("should create settings directory", async () => {
      mockService.ensureSettingsDirectory.mockResolvedValue(undefined);

      await settingsFileService.ensureSettingsDirectory();

      expect(mockService.ensureSettingsDirectory).toHaveBeenCalled();
    });
  });

  describe("loadSettings", () => {
    it("should load existing settings file", async () => {
      const mockSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.loadSettings.mockResolvedValue(mockSettings);

      const result = await settingsFileService.loadSettings<UISettings>("ui");

      expect(result).toEqual(mockSettings);
      expect(mockService.loadSettings).toHaveBeenCalledWith("ui");
    });

    it("should handle errors when loading settings", async () => {
      mockService.loadSettings.mockRejectedValue(new Error("Failed to load"));

      await expect(settingsFileService.loadSettings("ui")).rejects.toThrow("Failed to load");
    });
  });

  describe("saveSettings", () => {
    it("should save settings with updated timestamp", async () => {
      const mockSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.saveSettings.mockResolvedValue(undefined);

      await settingsFileService.saveSettings("ui", mockSettings);

      expect(mockService.saveSettings).toHaveBeenCalledWith("ui", mockSettings);
    });

    it("should handle write errors gracefully", async () => {
      const mockSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.saveSettings.mockRejectedValue(new Error("Write failed"));

      await expect(settingsFileService.saveSettings("ui", mockSettings)).rejects.toThrow("Write failed");
    });
  });

  describe("updateSettings", () => {
    it("should merge updates with existing settings", async () => {
      const mergedSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
      };

      mockService.updateSettings.mockResolvedValue(mergedSettings);

      const updates = { theme: "dark" as const, welcomeMessageDismissed: true };
      const result = await settingsFileService.updateSettings<UISettings>("ui", updates);

      expect(result.theme).toBe("dark");
      expect(result.welcomeMessageDismissed).toBe(true);
      expect(result.sidebarCollapsed).toBe(false); // unchanged
      expect(mockService.updateSettings).toHaveBeenCalledWith("ui", updates);
    });
  });

  describe("resetSettings", () => {
    it("should reset settings to defaults", async () => {
      mockService.resetSettings.mockResolvedValue(undefined);

      await settingsFileService.resetSettings("ui");

      expect(mockService.resetSettings).toHaveBeenCalledWith("ui");
    });
  });

  describe("convenience methods", () => {
    it("should call loadUISettings", async () => {
      const mockSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.loadUISettings.mockResolvedValue(mockSettings);

      const result = await settingsFileService.loadUISettings();

      expect(result).toEqual(mockSettings);
      expect(mockService.loadUISettings).toHaveBeenCalled();
    });

    it("should call loadTerminalConfig", async () => {
      const mockSettings: TerminalConfig = {
        defaultDirectory: "/home/user",
        defaultShell: "/bin/bash",
        fontSize: 14,
        fontFamily: "Monaco",
        scrollback: 1000,
        cursorBlink: true,
        cursorStyle: "block",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.loadTerminalConfig.mockResolvedValue(mockSettings);

      const result = await settingsFileService.loadTerminalConfig();

      expect(result).toEqual(mockSettings);
      expect(mockService.loadTerminalConfig).toHaveBeenCalled();
    });

    it("should call loadSessionData", async () => {
      const mockSettings: SessionData = {
        activeTerminals: ["term1", "term2"],
        activeAgents: ["agent1"],
        lastUsedAgent: "agent1",
        workingDirectories: { term1: "/home/user" },
        recentDirectories: ["/home/user"],
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.loadSessionData.mockResolvedValue(mockSettings);

      const result = await settingsFileService.loadSessionData();

      expect(result).toEqual(mockSettings);
      expect(mockService.loadSessionData).toHaveBeenCalled();
    });

    it("should call saveUISettings", async () => {
      const mockSettings: UISettings = {
        theme: "dark",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00Z",
      };

      mockService.saveUISettings.mockResolvedValue(undefined);

      await settingsFileService.saveUISettings(mockSettings);

      expect(mockService.saveUISettings).toHaveBeenCalledWith(mockSettings);
    });

    it("should call updateUISettings", async () => {
      const updatedSettings: UISettings = {
        theme: "light",
        welcomeMessageDismissed: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
      };

      mockService.updateUISettings.mockResolvedValue(updatedSettings);

      const updates = { theme: "light" as const };
      const result = await settingsFileService.updateUISettings(updates);

      expect(result).toEqual(updatedSettings);
      expect(mockService.updateUISettings).toHaveBeenCalledWith(updates);
    });

    it("should reset all settings", async () => {
      mockService.resetAllSettings.mockResolvedValue(undefined);

      await settingsFileService.resetAllSettings();

      expect(mockService.resetAllSettings).toHaveBeenCalled();
    });
  });
});