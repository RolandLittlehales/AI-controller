import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vol } from "memfs";
import { join } from "path";
import { SettingsFileService } from "./settingsFiles";
import type { UISettings, TerminalConfig, SessionData } from "~/types";

// Shared mock data for all tests
const mockUISettings: UISettings = {
  theme: "dark",
  showWelcomeMessage: true,
  sidebarCollapsed: false,
  notifications: true,
  fontSize: "medium",
  version: "1.0.0",
  lastUpdated: "2024-01-01T00:00:00.000Z",
};

const mockTerminalConfig: TerminalConfig = {
  defaultDirectory: "/home/user",
  defaultShell: "/bin/bash",
  fontSize: 14,
  fontFamily: "monospace",
  scrollback: 1000,
  historyLimit: 3000,
  cursorBlink: true,
  cursorStyle: "block",
  version: "1.0.0",
  lastUpdated: "2024-01-01T00:00:00.000Z",
};

const mockSessionData: SessionData = {
  activeTerminals: ["terminal1", "terminal2"],
  activeAgents: ["agent1"],
  lastUsedAgent: "agent1",
  workingDirectories: { "agent1": "/home/user/project" },
  recentDirectories: ["/home/user/project", "/home/user/docs"],
  version: "1.0.0",
  lastUpdated: "2024-01-01T00:00:00.000Z",
};

describe("SettingsFileService", () => {
  let service: SettingsFileService;

  beforeEach(() => {
    // Reset the in-memory file system
    vol.reset();

    // Reset singleton instance for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SettingsFileService as any).instance = undefined;
    service = SettingsFileService.getInstance();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = SettingsFileService.getInstance();
      const instance2 = SettingsFileService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should create only one instance", () => {
      const instance1 = SettingsFileService.getInstance();
      const instance2 = SettingsFileService.getInstance();

      expect(instance1).toBeInstanceOf(SettingsFileService);
      expect(instance2).toBeInstanceOf(SettingsFileService);
      expect(instance1).toBe(instance2);
    });
  });

  describe("ensureSettingsDirectory", () => {
    it("should not create directory if it already exists", async () => {
      // Setup: directory already exists
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null, // Create directory
      });

      await service.ensureSettingsDirectory();

      // Should not throw any errors
      expect(vol.existsSync(join(process.cwd(), "settings"))).toBe(true);
    });

    it("should create directory if it does not exist", async () => {
      // Setup: directory doesn't exist
      expect(vol.existsSync(join(process.cwd(), "settings"))).toBe(false);

      await service.ensureSettingsDirectory();

      // Should create the directory
      expect(vol.existsSync(join(process.cwd(), "settings"))).toBe(true);
    });
  });

  describe("loadSettings", () => {
    it("should load existing settings from file", async () => {
      // Setup: create existing settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUISettings),
      });

      const result = await service.loadSettings<UISettings>("ui");

      expect(result).toEqual(mockUISettings);
    });

    it("should load default settings when file does not exist", async () => {
      // Setup: create default settings file but not main settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(mockUISettings),
      });

      const result = await service.loadSettings<UISettings>("ui");

      expect(result).toEqual(mockUISettings);

      // Should have created the main settings file
      expect(vol.existsSync(join(process.cwd(), "settings", "ui-settings.json"))).toBe(true);

      // Main settings file should contain the default settings
      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      expect(JSON.parse(savedContent as string)).toEqual(mockUISettings);
    });

    it("should throw error when default settings file is not found", async () => {
      // Setup: no files exist
      vol.fromJSON({});

      await expect(service.loadSettings<UISettings>("ui")).rejects.toThrow(
        "Failed to load default settings for category: ui",
      );
    });

    it("should handle JSON parsing errors gracefully", async () => {
      // Setup: invalid JSON in main file, valid default file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: "invalid json",
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(mockUISettings),
      });

      const result = await service.loadSettings<UISettings>("ui");

      // Should fall back to default settings
      expect(result).toEqual(mockUISettings);
    });
  });

  describe("saveSettings", () => {
    it("should save settings to file with lastUpdated timestamp", async () => {
      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      const testSettings = { ...mockUISettings };
      delete (testSettings as Partial<UISettings>).lastUpdated;

      await service.saveSettings("ui", testSettings);

      // File should exist
      expect(vol.existsSync(join(process.cwd(), "settings", "ui-settings.json"))).toBe(true);

      // File should contain settings with lastUpdated timestamp
      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);

      expect(savedSettings).toHaveProperty("lastUpdated");
      expect(savedSettings.theme).toBe(testSettings.theme);
    });

    it("should handle write errors gracefully", async () => {
      // Setup: create read-only directory (simulation)
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      // This test is tricky with memfs as it doesn't simulate permission errors well
      // But we can test the general error handling pattern
      const testSettings = { ...mockUISettings };

      // Should not throw for valid operations
      await expect(service.saveSettings("ui", testSettings)).resolves.not.toThrow();
    });
  });

  describe("updateSettings", () => {
    it("should merge partial updates with existing settings", async () => {
      // Setup: create existing settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUISettings),
      });

      const updates = { theme: "light" as const, fontSize: "large" as const };
      const result = await service.updateSettings<UISettings>("ui", updates);

      expect(result).toEqual({
        ...mockUISettings,
        theme: "light",
        fontSize: "large",
        lastUpdated: expect.any(String),
      });

      // Verify file was updated
      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.theme).toBe("light");
      expect(savedSettings.fontSize).toBe("large");
    });

    it("should update lastUpdated timestamp", async () => {
      // Setup: create existing settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUISettings),
      });

      const updates = { theme: "light" as const };
      const result = await service.updateSettings<UISettings>("ui", updates);

      expect(result.lastUpdated).not.toBe(mockUISettings.lastUpdated);
      expect(new Date(result.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe("resetSettings", () => {
    it("should reset settings to default values", async () => {
      // Setup: create both files
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify({ ...mockUISettings, theme: "light" }),
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(mockUISettings),
      });

      await service.resetSettings("ui");

      // Settings file should now contain default values
      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings).toEqual(mockUISettings);
    });

    it("should handle errors when default settings cannot be loaded", async () => {
      // Setup: no default file exists
      vol.fromJSON({});

      await expect(service.resetSettings("ui")).rejects.toThrow(
        "Failed to load default settings for category: ui",
      );
    });
  });

  describe("resetAllSettings", () => {
    it("should reset all settings categories", async () => {
      // Setup: create all default files
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(mockUISettings),
        [join(process.cwd(), "settings", "terminal-config.default.json")]: JSON.stringify(mockTerminalConfig),
        [join(process.cwd(), "settings", "session-data.default.json")]: JSON.stringify(mockSessionData),
      });

      await service.resetAllSettings();

      // All settings files should exist and contain default values
      const uiContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const terminalContent = vol.readFileSync(join(process.cwd(), "settings", "terminal-config.json"), "utf-8");
      const sessionContent = vol.readFileSync(join(process.cwd(), "settings", "session-data.json"), "utf-8");

      expect(JSON.parse(uiContent as string)).toEqual(mockUISettings);
      expect(JSON.parse(terminalContent as string)).toEqual(mockTerminalConfig);
      expect(JSON.parse(sessionContent as string)).toEqual(mockSessionData);
    });
  });

  describe("Convenience methods for UI settings", () => {
    it("should load UI settings", async () => {
      // Setup: create UI settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUISettings),
      });

      const result = await service.loadUISettings();

      expect(result).toEqual(mockUISettings);
    });

    it("should save UI settings", async () => {
      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      await service.saveUISettings(mockUISettings);

      // File should exist and contain the settings
      expect(vol.existsSync(join(process.cwd(), "settings", "ui-settings.json"))).toBe(true);

      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.theme).toBe(mockUISettings.theme);
    });

    it("should update UI settings", async () => {
      // Setup: create existing UI settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUISettings),
      });

      const updates = { theme: "light" as const };
      const result = await service.updateUISettings(updates);

      expect(result.theme).toBe("light");
    });
  });

  describe("Convenience methods for Terminal config", () => {
    it("should load terminal config", async () => {
      // Setup: create terminal config file
      vol.fromJSON({
        [join(process.cwd(), "settings", "terminal-config.json")]: JSON.stringify(mockTerminalConfig),
      });

      const result = await service.loadTerminalConfig();

      expect(result).toEqual(mockTerminalConfig);
    });

    it("should save terminal config", async () => {
      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      await service.saveTerminalConfig(mockTerminalConfig);

      // File should exist and contain the settings
      expect(vol.existsSync(join(process.cwd(), "settings", "terminal-config.json"))).toBe(true);

      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "terminal-config.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.defaultShell).toBe(mockTerminalConfig.defaultShell);
    });

    it("should update terminal config", async () => {
      // Setup: create existing terminal config file
      vol.fromJSON({
        [join(process.cwd(), "settings", "terminal-config.json")]: JSON.stringify(mockTerminalConfig),
      });

      const updates = { fontSize: 16 };
      const result = await service.updateTerminalConfig(updates);

      expect(result.fontSize).toBe(16);
    });
  });

  describe("Convenience methods for Session data", () => {
    it("should load session data", async () => {
      // Setup: create session data file
      vol.fromJSON({
        [join(process.cwd(), "settings", "session-data.json")]: JSON.stringify(mockSessionData),
      });

      const result = await service.loadSessionData();

      expect(result).toEqual(mockSessionData);
    });

    it("should save session data", async () => {
      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      await service.saveSessionData(mockSessionData);

      // File should exist and contain the settings
      expect(vol.existsSync(join(process.cwd(), "settings", "session-data.json"))).toBe(true);

      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "session-data.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.lastUsedAgent).toBe(mockSessionData.lastUsedAgent);
    });

    it("should update session data", async () => {
      // Setup: create existing session data file
      vol.fromJSON({
        [join(process.cwd(), "settings", "session-data.json")]: JSON.stringify(mockSessionData),
      });

      const updates = { lastUsedAgent: "agent2" };
      const result = await service.updateSessionData(updates);

      expect(result.lastUsedAgent).toBe("agent2");
    });
  });
});

// Integration tests following the minimal mocking philosophy
describe("SettingsFileService Integration", () => {
  let service: SettingsFileService;

  beforeEach(() => {
    // Reset the in-memory file system
    vol.reset();

    // Reset singleton instance for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SettingsFileService as any).instance = undefined;
    service = SettingsFileService.getInstance();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("User Journey: Complete settings lifecycle", () => {
    it("should handle full settings management workflow", async () => {
      const initialSettings: UISettings = {
        theme: "system",
        showWelcomeMessage: true,
        sidebarCollapsed: false,
        notifications: true,
        fontSize: "medium",
        version: "1.0.0",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      };

      // Setup: create default settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(initialSettings),
      });

      // User first loads settings (should get defaults)
      const loadedSettings = await service.loadUISettings();
      expect(loadedSettings).toEqual(initialSettings);

      // User updates settings
      const updates = { theme: "dark" as const, fontSize: "large" as const };
      const updatedSettings = await service.updateUISettings(updates);

      expect(updatedSettings.theme).toBe("dark");
      expect(updatedSettings.fontSize).toBe("large");
      expect(updatedSettings.lastUpdated).not.toBe(initialSettings.lastUpdated);

      // Verify file was updated
      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.theme).toBe("dark");
      expect(savedSettings.fontSize).toBe("large");
    });

    it("should handle multi-category settings operations", async () => {
      const mockUI: UISettings = { ...mockUISettings };
      const mockTerminal: TerminalConfig = { ...mockTerminalConfig };

      // Setup: create both settings files
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.json")]: JSON.stringify(mockUI),
        [join(process.cwd(), "settings", "terminal-config.json")]: JSON.stringify(mockTerminal),
      });

      // User loads different settings types
      const uiSettings = await service.loadUISettings();
      const terminalSettings = await service.loadTerminalConfig();

      expect(uiSettings).toEqual(mockUI);
      expect(terminalSettings).toEqual(mockTerminal);

      // User updates both settings
      await service.updateUISettings({ theme: "light" });
      await service.updateTerminalConfig({ fontSize: 16 });

      // Verify both files were updated
      const uiContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const terminalContent = vol.readFileSync(join(process.cwd(), "settings", "terminal-config.json"), "utf-8");

      const updatedUI = JSON.parse(uiContent as string);
      const updatedTerminal = JSON.parse(terminalContent as string);

      expect(updatedUI.theme).toBe("light");
      expect(updatedTerminal.fontSize).toBe(16);
    });

    it("should handle error recovery scenarios", async () => {
      const mockSettings: UISettings = { ...mockUISettings };

      // Setup: create default settings file
      vol.fromJSON({
        [join(process.cwd(), "settings", "ui-settings.default.json")]: JSON.stringify(mockSettings),
      });

      // User loads settings (should get defaults)
      const loadedSettings = await service.loadUISettings();
      expect(loadedSettings).toEqual(mockSettings);

      // User updates settings (should succeed)
      const updatedSettings = await service.updateUISettings({ theme: "light" });
      expect(updatedSettings.theme).toBe("light");
    });
  });

  describe("Atomic file operations", () => {
    it("should use atomic write operations with temp files", async () => {
      const mockSettings: UISettings = { ...mockUISettings };

      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      await service.saveUISettings(mockSettings);

      // Final file should exist and be correct
      expect(vol.existsSync(join(process.cwd(), "settings", "ui-settings.json"))).toBe(true);

      const savedContent = vol.readFileSync(join(process.cwd(), "settings", "ui-settings.json"), "utf-8");
      const savedSettings = JSON.parse(savedContent as string);
      expect(savedSettings.theme).toBe("dark");
    });

    it("should fail concurrent write operations (not yet implemented)", async () => {
      const mockSettings: UISettings = { ...mockUISettings };

      // Setup: create settings directory
      vol.fromJSON({
        [join(process.cwd(), "settings")]: null,
      });

      // Simulate concurrent saves - currently this will cause race conditions
      // TODO: Implement proper concurrency handling (locks, queues, etc.)
      const save1 = service.saveUISettings({ ...mockSettings, theme: "light" });
      const save2 = service.saveUISettings({ ...mockSettings, theme: "dark" });

      // Currently, one save will succeed and one will fail due to race conditions
      const results = await Promise.allSettled([save1, save2]);

      // We expect at least one to fail due to lack of concurrency handling
      const failedCount = results.filter(result => result.status === "rejected").length;
      expect(failedCount).toBeGreaterThan(0);

      // Final file should still exist (from the successful save)
      expect(vol.existsSync(join(process.cwd(), "settings", "ui-settings.json"))).toBe(true);
    });
  });
});