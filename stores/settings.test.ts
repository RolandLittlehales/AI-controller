import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "./settings";

// Mock $fetch
const mockFetch = vi.fn();
global.$fetch = mockFetch;

describe("useSettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should have initial state", () => {
    const store = useSettingsStore();

    expect(store.ui.theme).toBe("system");
    expect(store.ui.welcomeMessageDismissed).toBe(false);
    expect(store.terminal.defaultDirectory).toBe(null);
    expect(store.terminal.defaultShell).toBe("/bin/bash");
    expect(store.session.activeTerminals).toEqual([]);
    expect(store.session.activeAgents).toEqual([]);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBe(null);
  });

  describe("getters", () => {
    it("should detect dark mode when theme is dark", () => {
      const store = useSettingsStore();
      store.ui.theme = "dark";

      expect(store.isDarkMode).toBe(true);
    });

    it("should detect light mode when theme is light", () => {
      const store = useSettingsStore();
      store.ui.theme = "light";

      expect(store.isDarkMode).toBe(false);
    });

    it("should detect system preference when theme is system", () => {
      const store = useSettingsStore();
      store.ui.theme = "system";

      // Mock window.matchMedia
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
      }));
      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      expect(store.isDarkMode).toBe(true);
    });

    it("should have active terminals", () => {
      const store = useSettingsStore();
      store.session.activeTerminals = ["term1", "term2"];

      expect(store.hasActiveTerminals).toBe(true);
    });

    it("should have active agents", () => {
      const store = useSettingsStore();
      store.session.activeAgents = ["agent1"];

      expect(store.hasActiveAgents).toBe(true);
    });

    it("should get working directory for terminal", () => {
      const store = useSettingsStore();
      store.session.workingDirectories = { term1: "/home/user" };
      store.terminal.defaultDirectory = "/default";

      expect(store.getWorkingDirectory("term1")).toBe("/home/user");
      expect(store.getWorkingDirectory("term2")).toBe("/default");
    });
  });

  describe("actions", () => {
    describe("loadAllSettings", () => {
      it("should load all settings successfully", async () => {
        const mockResponse = {
          success: true,
          data: {
            ui: { theme: "dark", welcomeMessageDismissed: true },
            terminal: { defaultDirectory: "/home/user" },
            session: { activeTerminals: ["term1"] },
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.loadAllSettings();

        expect(mockFetch).toHaveBeenCalledWith("/api/settings");
        expect(store.ui.theme).toBe("dark");
        expect(store.ui.welcomeMessageDismissed).toBe(true);
        expect(store.terminal.defaultDirectory).toBe("/home/user");
        expect(store.session.activeTerminals).toEqual(["term1"]);
        expect(store.isLoading).toBe(false);
        expect(store.error).toBe(null);
      });

      it("should handle API errors", async () => {
        const mockResponse = {
          success: false,
          error: "Settings load failed",
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();

        await expect(store.loadAllSettings()).rejects.toThrow("Settings load failed");
        expect(store.error).toBe("Settings load failed");
        expect(store.isLoading).toBe(false);
      });

      it("should handle network errors", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));

        const store = useSettingsStore();

        await expect(store.loadAllSettings()).rejects.toThrow("Network error");
        expect(store.error).toBe("Network error");
        expect(store.isLoading).toBe(false);
      });
    });

    describe("updateSettings", () => {
      it("should update UI settings", async () => {
        const mockResponse = {
          success: true,
          data: { theme: "dark", welcomeMessageDismissed: true },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateSettings("ui", { theme: "dark" });

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "ui", updates: { theme: "dark" } },
        });
        expect(store.ui.theme).toBe("dark");
        expect(store.ui.welcomeMessageDismissed).toBe(true);
      });

      it("should update terminal settings", async () => {
        const mockResponse = {
          success: true,
          data: { defaultDirectory: "/home/user" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateSettings("terminal", { defaultDirectory: "/home/user" });

        expect(store.terminal.defaultDirectory).toBe("/home/user");
      });

      it("should update session settings", async () => {
        const mockResponse = {
          success: true,
          data: { activeTerminals: ["term1", "term2"] },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateSettings("session", { activeTerminals: ["term1", "term2"] });

        expect(store.session.activeTerminals).toEqual(["term1", "term2"]);
      });
    });

    describe("resetSettings", () => {
      it("should reset specific category", async () => {
        const resetResponse = { success: true, data: { message: "Reset successful" } };
        const loadResponse = {
          success: true,
          data: {
            ui: { theme: "system" },
            terminal: { defaultDirectory: null },
            session: { activeTerminals: [] },
          },
        };

        mockFetch
          .mockResolvedValueOnce(resetResponse)
          .mockResolvedValueOnce(loadResponse);

        const store = useSettingsStore();
        await store.resetSettings("ui");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings/reset", {
          method: "POST",
          body: { category: "ui" },
        });
        expect(mockFetch).toHaveBeenCalledWith("/api/settings");
      });

      it("should reset all settings", async () => {
        const resetResponse = { success: true, data: { message: "Reset successful" } };
        const loadResponse = {
          success: true,
          data: {
            ui: { theme: "system" },
            terminal: { defaultDirectory: null },
            session: { activeTerminals: [] },
          },
        };

        mockFetch
          .mockResolvedValueOnce(resetResponse)
          .mockResolvedValueOnce(loadResponse);

        const store = useSettingsStore();
        await store.resetSettings();

        expect(mockFetch).toHaveBeenCalledWith("/api/settings/reset", {
          method: "POST",
          body: {},
        });
      });
    });

    describe("convenience methods", () => {
      it("should set theme", async () => {
        const mockResponse = {
          success: true,
          data: { theme: "dark" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.setTheme("dark");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "ui", updates: { theme: "dark" } },
        });
      });

      it("should add active terminal", async () => {
        const mockResponse = {
          success: true,
          data: { activeTerminals: ["term1", "term2"] },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.activeTerminals = ["term1"];
        await store.addActiveTerminal("term2");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "session", updates: { activeTerminals: ["term1", "term2"] } },
        });
      });

      it("should not add duplicate terminal", async () => {
        const store = useSettingsStore();
        store.session.activeTerminals = ["term1"];
        await store.addActiveTerminal("term1");

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("should remove active terminal", async () => {
        const mockResponse = {
          success: true,
          data: { activeTerminals: [], workingDirectories: {} },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.activeTerminals = ["term1"];
        store.session.workingDirectories = { term1: "/home/user" };
        await store.removeActiveTerminal("term1");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              activeTerminals: [],
              workingDirectories: {},
            },
          },
        });
      });

      it("should set terminal working directory", async () => {
        const mockResponse = {
          success: true,
          data: {
            workingDirectories: { term1: "/new/path" },
            recentDirectories: ["/new/path"],
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.setTerminalWorkingDirectory("term1", "/new/path");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              workingDirectories: { term1: "/new/path" },
              recentDirectories: ["/new/path"],
            },
          },
        });
      });
    });
  });
});