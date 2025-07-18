import { ref, computed, toRef, readonly } from "vue";
import type { UISettings } from "~/types";
import { useSettingsStore } from "~/stores/settings";
import { logger } from "~/utils/logger";

export const useSettings = () => {
  const store = useSettingsStore();

  // Initialize settings on first use
  const initialized = ref(false);

  const init = async () => {
    if (!initialized.value) {
      try {
        await store.loadAllSettings();
        initialized.value = true;
      } catch (error) {
        logger.error("Failed to initialize settings", { error });
      }
    }
  };

  // Auto-initialize on client-side
  if (typeof window !== "undefined") {
    init();
  }

  return {
    // State
    ui: readonly(toRef(store, "ui")),
    terminal: readonly(toRef(store, "terminal")),
    session: readonly(toRef(store, "session")),
    isLoading: readonly(toRef(store, "isLoading")),
    error: readonly(toRef(store, "error")),

    // Getters
    isDarkMode: computed(() => store.isDarkMode),
    hasActiveTerminals: computed(() => store.hasActiveTerminals),
    hasActiveAgents: computed(() => store.hasActiveAgents),
    getWorkingDirectory: store.getWorkingDirectory,

    // Actions
    loadAllSettings: store.loadAllSettings,
    updateSettings: store.updateSettings,
    resetSettings: store.resetSettings,

    // UI Settings
    updateUISettings: store.updateUISettings,
    setTheme: store.setTheme,
    hideWelcomeMessage: store.hideWelcomeMessage,

    // Terminal Config
    updateTerminalConfig: store.updateTerminalConfig,
    setDefaultDirectory: store.setDefaultDirectory,

    // Session Data
    updateSessionData: store.updateSessionData,
    addActiveTerminal: store.addActiveTerminal,
    removeActiveTerminal: store.removeActiveTerminal,
    setTerminalWorkingDirectory: store.setTerminalWorkingDirectory,
    addActiveAgent: store.addActiveAgent,
    removeActiveAgent: store.removeActiveAgent,

    // Initialization
    init,
    initialized: readonly(initialized),
  };
};

// Theme-specific composable for easier migration
export const useThemeSettings = () => {
  const settings = useSettings();

  const setTheme = async (theme: UISettings["theme"]) => {
    await settings.setTheme(theme);

    // Update DOM classes for immediate effect
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      html.classList.remove("light-theme", "dark-theme");

      if (theme === "light") {
        html.classList.add("light-theme");
      } else if (theme === "dark") {
        html.classList.add("dark-theme");
      }
      // For 'system', let CSS media queries handle it
    }
  };

  const toggleTheme = async () => {
    const currentTheme = settings.ui.value.theme;
    let newTheme: UISettings["theme"];

    if (currentTheme === "system") {
      // If system, toggle to opposite of current system preference
      newTheme = settings.isDarkMode.value ? "light" : "dark";
    } else {
      // If manual, toggle to opposite
      newTheme = currentTheme === "light" ? "dark" : "light";
    }

    await setTheme(newTheme);
  };

  const systemPreference = computed(() => {
    if (typeof window === "undefined") return "Unknown";
    if (!window.matchMedia) return "Unknown";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";
  });

  return {
    theme: computed(() => settings.ui.value.theme),
    isDarkMode: settings.isDarkMode,
    systemPreference,
    setTheme,
    toggleTheme,
  };
};

// Terminal-specific composable
export const useTerminalSettings = () => {
  const settings = useSettings();

  const getTerminalWorkingDirectory = (terminalId: string) => {
    return settings.getWorkingDirectory(terminalId) || settings.terminal.value.defaultDirectory;
  };

  const setTerminalDirectory = async (terminalId: string, directory: string) => {
    await settings.setTerminalWorkingDirectory(terminalId, directory);
  };

  const getTerminalConfig = () => {
    return settings.terminal.value;
  };

  return {
    config: computed(() => settings.terminal.value),
    getTerminalWorkingDirectory,
    setTerminalDirectory,
    getTerminalConfig,
    setDefaultDirectory: settings.setDefaultDirectory,
    updateTerminalConfig: settings.updateTerminalConfig,
  };
};

// Session management composable
export const useSessionSettings = () => {
  const settings = useSettings();

  const registerTerminal = async (terminalId: string, workingDirectory?: string) => {
    await settings.addActiveTerminal(terminalId);

    if (workingDirectory) {
      await settings.setTerminalWorkingDirectory(terminalId, workingDirectory);
    }
  };

  const unregisterTerminal = async (terminalId: string) => {
    await settings.removeActiveTerminal(terminalId);
  };

  const registerAgent = async (agentId: string) => {
    await settings.addActiveAgent(agentId);
  };

  const unregisterAgent = async (agentId: string) => {
    await settings.removeActiveAgent(agentId);
  };

  return {
    session: computed(() => settings.session.value),
    activeTerminals: computed(() => settings.session.value.activeTerminals),
    activeAgents: computed(() => settings.session.value.activeAgents),
    recentDirectories: computed(() => settings.session.value.recentDirectories),
    lastUsedAgent: computed(() => settings.session.value.lastUsedAgent),

    registerTerminal,
    unregisterTerminal,
    registerAgent,
    unregisterAgent,

    updateSessionData: settings.updateSessionData,
  };
};