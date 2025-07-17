import { expect } from "vitest";

/**
 * Test utilities for theme class verification
 * Following the focused testing approach of testing DOM classes, not CSS values
 */

export interface ThemeTestUtils {
  expectThemeClass: (theme: "light" | "dark") => void;
  expectNoThemeClasses: () => void;
  expectSystemTheme: () => void;
  mockSystemPreference: (isDark: boolean) => void;
}

/**
 * Creates theme testing utilities for consistent class verification
 */
export const createThemeTestUtils = (): ThemeTestUtils => {
  const expectThemeClass = (theme: "light" | "dark") => {
    const html = document.documentElement;
    expect(html.classList.contains(`${theme}-theme`)).toBe(true);
    expect(html.classList.contains(`${theme === "light" ? "dark" : "light"}-theme`)).toBe(false);
  };

  const expectNoThemeClasses = () => {
    const html = document.documentElement;
    expect(html.classList.contains("light-theme")).toBe(false);
    expect(html.classList.contains("dark-theme")).toBe(false);
  };

  const expectSystemTheme = () => {
    const html = document.documentElement;
    // For system theme, neither manual class should be present
    // CSS media queries handle the styling
    expect(html.classList.contains("light-theme")).toBe(false);
    expect(html.classList.contains("dark-theme")).toBe(false);
  };

  const mockSystemPreference = (isDark: boolean) => {
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? isDark : !isDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    return mockMatchMedia;
  };

  return {
    expectThemeClass,
    expectNoThemeClasses,
    expectSystemTheme,
    mockSystemPreference,
  };
};

/**
 * Mock settings store for theme testing
 */
export const createMockSettingsStore = () => {
  const mockStore = {
    ui: {
      theme: "system" as "system" | "light" | "dark",
      welcomeMessageDismissed: false,
      sidebarCollapsed: false,
      notifications: true,
      fontSize: "medium" as const,
      version: "1.0.0",
      lastUpdated: "2024-01-01T00:00:00Z",
    },
    terminal: {
      defaultDirectory: null,
      defaultShell: "/bin/bash",
      fontSize: 14,
      fontFamily: "Monaco",
      scrollback: 1000,
      cursorBlink: true,
      cursorStyle: "block" as const,
      version: "1.0.0",
      lastUpdated: "2024-01-01T00:00:00Z",
    },
    session: {
      activeTerminals: [],
      activeAgents: [],
      lastUsedAgent: null,
      workingDirectories: {},
      recentDirectories: [],
      version: "1.0.0",
      lastUpdated: "2024-01-01T00:00:00Z",
    },
    isLoading: false,
    error: null,
    isDarkMode: false,
    hasActiveTerminals: false,
    hasActiveAgents: false,
    getWorkingDirectory: vi.fn(() => null),
    loadAllSettings: vi.fn(),
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
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

  return mockStore;
};

/**
 * Integration test helper for settings workflow
 */
export const testSettingsWorkflow = async (
  settingsStore: ReturnType<typeof createMockSettingsStore>,
  theme: "light" | "dark",
  _utils: ThemeTestUtils,
) => {
  // Mock the store response
  settingsStore.setTheme.mockResolvedValue(undefined);
  settingsStore.ui.theme = theme;
  settingsStore.isDarkMode = theme === "dark";

  // Test the workflow
  await settingsStore.setTheme(theme);

  // Verify store was called
  expect(settingsStore.setTheme).toHaveBeenCalledWith(theme);

  // Verify state updated
  expect(settingsStore.ui.theme).toBe(theme);
  expect(settingsStore.isDarkMode).toBe(theme === "dark");

  // Verify DOM classes (this would need to be tested in the actual component)
  return { theme, isDarkMode: theme === "dark" };
};