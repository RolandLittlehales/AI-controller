import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "./settings";

// Mock $fetch
const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

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
    expect(store.ui.showWelcomeMessage).toBe(false);
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
            ui: { theme: "dark", showWelcomeMessage: false },
            terminal: { defaultDirectory: "/home/user" },
            session: { activeTerminals: ["term1"] },
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.loadAllSettings();

        expect(mockFetch).toHaveBeenCalledWith("/api/settings");
        expect(store.ui.theme).toBe("dark");
        expect(store.ui.showWelcomeMessage).toBe(false);
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
          data: { theme: "dark", showWelcomeMessage: false },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateSettings("ui", { theme: "dark" });

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "ui", updates: { theme: "dark" } },
        });
        expect(store.ui.theme).toBe("dark");
        expect(store.ui.showWelcomeMessage).toBe(false);
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

      it("should manage recent directories correctly", async () => {
        const mockResponse = {
          success: true,
          data: {
            workingDirectories: { term1: "/new/path" },
            recentDirectories: ["/new/path", "/existing/path"],
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.recentDirectories = ["/existing/path"];
        await store.setTerminalWorkingDirectory("term1", "/new/path");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              workingDirectories: { term1: "/new/path" },
              recentDirectories: ["/new/path", "/existing/path"],
            },
          },
        });
      });

      it("should not duplicate directory in recent directories", async () => {
        const mockResponse = {
          success: true,
          data: {
            workingDirectories: { term1: "/existing/path" },
            recentDirectories: ["/existing/path"],
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.recentDirectories = ["/existing/path"];
        await store.setTerminalWorkingDirectory("term1", "/existing/path");

        // Should not duplicate the existing directory
        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              workingDirectories: { term1: "/existing/path" },
              recentDirectories: ["/existing/path"],
            },
          },
        });
      });

      it("should hide welcome message", async () => {
        const mockResponse = {
          success: true,
          data: { showWelcomeMessage: false },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.hideWelcomeMessage();

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "ui", updates: { showWelcomeMessage: false } },
        });
      });

      it("should set default directory", async () => {
        const mockResponse = {
          success: true,
          data: { defaultDirectory: "/home/user" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.setDefaultDirectory("/home/user");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "terminal", updates: { defaultDirectory: "/home/user" } },
        });
      });

      it("should update UI settings directly", async () => {
        const mockResponse = {
          success: true,
          data: { theme: "dark", fontSize: "large" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateUISettings({ theme: "dark", fontSize: "large" });

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "ui", updates: { theme: "dark", fontSize: "large" } },
        });
      });

      it("should update terminal config directly", async () => {
        const mockResponse = {
          success: true,
          data: { fontSize: 16, fontFamily: "JetBrains Mono" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateTerminalConfig({ fontSize: 16, fontFamily: "JetBrains Mono" });

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "terminal", updates: { fontSize: 16, fontFamily: "JetBrains Mono" } },
        });
      });

      it("should update session data directly", async () => {
        const mockResponse = {
          success: true,
          data: { activeTerminals: ["term1"], lastUsedAgent: "agent1" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        await store.updateSessionData({ activeTerminals: ["term1"], lastUsedAgent: "agent1" });

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: { category: "session", updates: { activeTerminals: ["term1"], lastUsedAgent: "agent1" } },
        });
      });

      it("should add active agent", async () => {
        const mockResponse = {
          success: true,
          data: { activeAgents: ["agent1"], lastUsedAgent: "agent1" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.activeAgents = [];
        await store.addActiveAgent("agent1");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              activeAgents: ["agent1"],
              lastUsedAgent: "agent1",
            },
          },
        });
      });

      it("should not add duplicate agent", async () => {
        const store = useSettingsStore();
        store.session.activeAgents = ["agent1"];
        await store.addActiveAgent("agent1");

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("should remove active agent", async () => {
        const mockResponse = {
          success: true,
          data: { activeAgents: [], lastUsedAgent: null },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.activeAgents = ["agent1"];
        store.session.lastUsedAgent = "agent1";
        await store.removeActiveAgent("agent1");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              activeAgents: [],
              lastUsedAgent: null,
            },
          },
        });
      });

      it("should preserve lastUsedAgent when removing different agent", async () => {
        const mockResponse = {
          success: true,
          data: { activeAgents: ["agent1"], lastUsedAgent: "agent1" },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        store.session.activeAgents = ["agent1", "agent2"];
        store.session.lastUsedAgent = "agent1";
        await store.removeActiveAgent("agent2");

        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              activeAgents: ["agent1"],
              lastUsedAgent: "agent1",
            },
          },
        });
      });

      it("should limit recent directories to 10 items", async () => {
        const mockResponse = {
          success: true,
          data: {
            workingDirectories: { term1: "/new/path" },
            recentDirectories: ["/new/path", "/path1", "/path2", "/path3", "/path4", "/path5", "/path6", "/path7", "/path8", "/path9"],
          },
        };

        mockFetch.mockResolvedValue(mockResponse);

        const store = useSettingsStore();
        // Set up 10 existing recent directories
        store.session.recentDirectories = ["/path1", "/path2", "/path3", "/path4", "/path5", "/path6", "/path7", "/path8", "/path9", "/path10"];
        await store.setTerminalWorkingDirectory("term1", "/new/path");

        // Should limit to 10 items, removing the oldest
        expect(mockFetch).toHaveBeenCalledWith("/api/settings", {
          method: "PATCH",
          body: {
            category: "session",
            updates: {
              workingDirectories: { term1: "/new/path" },
              recentDirectories: ["/new/path", "/path1", "/path2", "/path3", "/path4", "/path5", "/path6", "/path7", "/path8", "/path9"],
            },
          },
        });
      });
    });
  });
});