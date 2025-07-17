import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSettings, useThemeSettings, useTerminalSettings, useSessionSettings } from "./useSettings";
import { useSettingsStore } from "~/stores/settings";

// Mock the settings store
vi.mock("~/stores/settings", () => ({
  useSettingsStore: vi.fn(),
}));

const mockStore = {
  ui: {
    theme: "dark",
    welcomeMessageDismissed: false,
    sidebarCollapsed: false,
    notifications: true,
    fontSize: "medium",
    version: "1.0.0",
    lastUpdated: "2024-01-01T00:00:00Z",
  },
  terminal: {
    defaultDirectory: "/home/user",
    defaultShell: "/bin/bash",
    fontSize: 14,
    fontFamily: "Monaco",
    scrollback: 1000,
    cursorBlink: true,
    cursorStyle: "block",
    version: "1.0.0",
    lastUpdated: "2024-01-01T00:00:00Z",
  },
  session: {
    activeTerminals: ["term1"],
    activeAgents: ["agent1"],
    lastUsedAgent: "agent1",
    workingDirectories: { term1: "/home/user" },
    recentDirectories: ["/home/user"],
    version: "1.0.0",
    lastUpdated: "2024-01-01T00:00:00Z",
  },
  isLoading: false,
  error: null,
  isDarkMode: true,
  hasActiveTerminals: true,
  hasActiveAgents: true,
  getWorkingDirectory: vi.fn((_terminalId: string) => "/home/user"),
  loadAllSettings: vi.fn(),
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
  updateUISettings: vi.fn(),
  setTheme: vi.fn(),
  dismissWelcomeMessage: vi.fn(),
  updateTerminalConfig: vi.fn(),
  setDefaultDirectory: vi.fn(),
  updateSessionData: vi.fn(),
  addActiveTerminal: vi.fn(),
  removeActiveTerminal: vi.fn(),
  setTerminalWorkingDirectory: vi.fn(),
  addActiveAgent: vi.fn(),
  removeActiveAgent: vi.fn(),
};

const mockUseSettingsStore = vi.mocked(useSettingsStore);

describe("useSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(mockStore as unknown as ReturnType<typeof useSettingsStore>);

    // Mock window object
    Object.defineProperty(window, "window", {
      value: global,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return settings state and methods", () => {
    const settings = useSettings();

    expect(settings).toHaveProperty("ui");
    expect(settings).toHaveProperty("terminal");
    expect(settings).toHaveProperty("session");
    expect(settings).toHaveProperty("isLoading");
    expect(settings).toHaveProperty("error");
    expect(settings).toHaveProperty("isDarkMode");
    expect(settings).toHaveProperty("hasActiveTerminals");
    expect(settings).toHaveProperty("hasActiveAgents");
    expect(settings).toHaveProperty("loadAllSettings");
    expect(settings).toHaveProperty("updateSettings");
    expect(settings).toHaveProperty("resetSettings");
  });

  it("should initialize settings when used", async () => {
    const settings = useSettings();

    // Simulate initialization
    await settings.init();

    expect(mockStore.loadAllSettings).toHaveBeenCalled();
  });

  it("should handle initialization errors gracefully", async () => {
    mockStore.loadAllSettings.mockRejectedValue(new Error("Init failed"));

    const settings = useSettings();

    // Should not throw
    await settings.init();

    expect(mockStore.loadAllSettings).toHaveBeenCalled();
  });
});

describe("useThemeSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(mockStore as unknown as ReturnType<typeof useSettingsStore>);

    // Mock document
    Object.defineProperty(global, "document", {
      value: {
        documentElement: {
          classList: {
            remove: vi.fn(),
            add: vi.fn(),
          },
        },
      },
      writable: true,
    });
  });

  it("should return theme-related functionality", () => {
    const themeSettings = useThemeSettings();

    expect(themeSettings).toHaveProperty("theme");
    expect(themeSettings).toHaveProperty("isDarkMode");
    expect(themeSettings).toHaveProperty("setTheme");
    expect(themeSettings).toHaveProperty("toggleTheme");
  });

  it("should set theme and update DOM classes", async () => {
    const themeSettings = useThemeSettings();

    await themeSettings.setTheme("light");

    expect(mockStore.setTheme).toHaveBeenCalledWith("light");
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith("light-theme", "dark-theme");
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("light-theme");
  });

  it("should toggle theme correctly", async () => {
    // Mock current theme as light
    mockStore.ui.theme = "light";
    const themeSettings = useThemeSettings();

    await themeSettings.toggleTheme();

    expect(mockStore.setTheme).toHaveBeenCalledWith("dark");
  });
});

describe("useTerminalSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(mockStore as unknown as ReturnType<typeof useSettingsStore>);
  });

  it("should return terminal-related functionality", () => {
    const terminalSettings = useTerminalSettings();

    expect(terminalSettings).toHaveProperty("config");
    expect(terminalSettings).toHaveProperty("getTerminalWorkingDirectory");
    expect(terminalSettings).toHaveProperty("setTerminalDirectory");
    expect(terminalSettings).toHaveProperty("getTerminalConfig");
    expect(terminalSettings).toHaveProperty("setDefaultDirectory");
    expect(terminalSettings).toHaveProperty("updateTerminalConfig");
  });

  it("should get terminal working directory", () => {
    const terminalSettings = useTerminalSettings();

    const directory = terminalSettings.getTerminalWorkingDirectory("term1");

    expect(directory).toBe("/home/user");
    expect(mockStore.getWorkingDirectory).toHaveBeenCalledWith("term1");
  });

  it("should set terminal directory", async () => {
    const terminalSettings = useTerminalSettings();

    await terminalSettings.setTerminalDirectory("term1", "/new/path");

    expect(mockStore.setTerminalWorkingDirectory).toHaveBeenCalledWith("term1", "/new/path");
  });
});

describe("useSessionSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(mockStore as unknown as ReturnType<typeof useSettingsStore>);
  });

  it("should return session-related functionality", () => {
    const sessionSettings = useSessionSettings();

    expect(sessionSettings).toHaveProperty("session");
    expect(sessionSettings).toHaveProperty("activeTerminals");
    expect(sessionSettings).toHaveProperty("activeAgents");
    expect(sessionSettings).toHaveProperty("recentDirectories");
    expect(sessionSettings).toHaveProperty("lastUsedAgent");
    expect(sessionSettings).toHaveProperty("registerTerminal");
    expect(sessionSettings).toHaveProperty("unregisterTerminal");
    expect(sessionSettings).toHaveProperty("registerAgent");
    expect(sessionSettings).toHaveProperty("unregisterAgent");
  });

  it("should register terminal", async () => {
    const sessionSettings = useSessionSettings();

    await sessionSettings.registerTerminal("term2", "/home/user");

    expect(mockStore.addActiveTerminal).toHaveBeenCalledWith("term2");
    expect(mockStore.setTerminalWorkingDirectory).toHaveBeenCalledWith("term2", "/home/user");
  });

  it("should register terminal without working directory", async () => {
    const sessionSettings = useSessionSettings();

    await sessionSettings.registerTerminal("term2");

    expect(mockStore.addActiveTerminal).toHaveBeenCalledWith("term2");
    expect(mockStore.setTerminalWorkingDirectory).not.toHaveBeenCalled();
  });

  it("should unregister terminal", async () => {
    const sessionSettings = useSessionSettings();

    await sessionSettings.unregisterTerminal("term1");

    expect(mockStore.removeActiveTerminal).toHaveBeenCalledWith("term1");
  });

  it("should register agent", async () => {
    const sessionSettings = useSessionSettings();

    await sessionSettings.registerAgent("agent2");

    expect(mockStore.addActiveAgent).toHaveBeenCalledWith("agent2");
  });

  it("should unregister agent", async () => {
    const sessionSettings = useSessionSettings();

    await sessionSettings.unregisterAgent("agent1");

    expect(mockStore.removeActiveAgent).toHaveBeenCalledWith("agent1");
  });
});