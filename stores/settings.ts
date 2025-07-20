import { defineStore } from "pinia";
import type { SettingsStore, UISettings, TerminalConfig, SessionData, SettingsCategory, SettingsUpdatePayload, ApiResponse } from "~/types";

export const useSettingsStore = defineStore("settings", {
  state: (): SettingsStore => ({
    ui: {
      theme: "system",
      showWelcomeMessage: false,
      sidebarCollapsed: false,
      notifications: true,
      fontSize: "medium",
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    },
    terminal: {
      defaultDirectory: null,
      defaultShell: "/bin/bash",
      fontSize: 14,
      fontFamily: "Monaco, Consolas, 'Liberation Mono', monospace",
      scrollback: 1000,
      historyLimit: 3000,
      cursorBlink: true,
      cursorStyle: "block",
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    },
    session: {
      activeTerminals: [],
      activeAgents: [],
      lastUsedAgent: null,
      workingDirectories: {},
      recentDirectories: [],
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    },
    isLoading: false,
    error: null,
  }),

  getters: {
    isDarkMode: (state) => {
      if (state.ui.theme === "system") {
        // Check system preference
        if (typeof window !== "undefined" && window.matchMedia) {
          return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
      }
      return state.ui.theme === "dark";
    },

    hasActiveTerminals: (state) => state.session.activeTerminals.length > 0,
    hasActiveAgents: (state) => state.session.activeAgents.length > 0,

    getWorkingDirectory: (state) => (terminalId: string) => {
      return state.session.workingDirectories[terminalId] || state.terminal.defaultDirectory;
    },
  },

  actions: {
    async loadAllSettings() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch("/api/settings") as ApiResponse<SettingsStore>;

        if (response.success && response.data) {
          this.ui = response.data.ui;
          this.terminal = response.data.terminal;
          this.session = response.data.session;
        } else {
          throw new Error(response.error || "Failed to load settings");
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to load settings";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(category: SettingsCategory, updates: Partial<UISettings> | Partial<TerminalConfig> | Partial<SessionData>) {
      this.isLoading = true;
      this.error = null;

      try {
        const payload: SettingsUpdatePayload = { category, updates };
        const response = await $fetch("/api/settings", {
          method: "PATCH",
          body: payload,
        }) as ApiResponse<UISettings | TerminalConfig | SessionData>;

        if (response.success && response.data) {
          // Update local state
          if (category === "ui") {
            this.ui = response.data as UISettings;
          } else if (category === "terminal") {
            this.terminal = response.data as TerminalConfig;
          } else if (category === "session") {
            this.session = response.data as SessionData;
          }
        } else {
          throw new Error(response.error || "Failed to update settings");
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to update settings";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async resetSettings(category?: SettingsCategory) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch("/api/settings/reset", {
          method: "POST",
          body: category ? { category } : {},
        }) as ApiResponse<{ message: string }>;

        if (response.success) {
          // Reload all settings after reset
          await this.loadAllSettings();
        } else {
          throw new Error(response.error || "Failed to reset settings");
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to reset settings";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Convenience methods for specific settings
    async updateUISettings(updates: Partial<UISettings>) {
      return this.updateSettings("ui", updates);
    },

    async updateTerminalConfig(updates: Partial<TerminalConfig>) {
      return this.updateSettings("terminal", updates);
    },

    async updateSessionData(updates: Partial<SessionData>) {
      return this.updateSettings("session", updates);
    },

    async setTheme(theme: UISettings["theme"]) {
      await this.updateUISettings({ theme });
    },

    async hideWelcomeMessage() {
      await this.updateUISettings({ showWelcomeMessage: false });
    },

    async setDefaultDirectory(directory: string) {
      await this.updateTerminalConfig({ defaultDirectory: directory });
    },

    async addActiveTerminal(terminalId: string) {
      const activeTerminals = [...this.session.activeTerminals];
      if (!activeTerminals.includes(terminalId)) {
        activeTerminals.push(terminalId);
        await this.updateSessionData({ activeTerminals });
      }
    },

    async removeActiveTerminal(terminalId: string) {
      const activeTerminals = this.session.activeTerminals.filter(id => id !== terminalId);

      const { [terminalId]: _removed, ...workingDirectories } = this.session.workingDirectories;

      await this.updateSessionData({
        activeTerminals,
        workingDirectories,
      });
    },

    async setTerminalWorkingDirectory(terminalId: string, directory: string) {
      const workingDirectories = {
        ...this.session.workingDirectories,
        [terminalId]: directory,
      };

      // Also add to recent directories
      const recentDirectories = [...this.session.recentDirectories];
      if (!recentDirectories.includes(directory)) {
        recentDirectories.unshift(directory);
        // Keep only last 10 recent directories
        recentDirectories.splice(10);
      }

      await this.updateSessionData({
        workingDirectories,
        recentDirectories,
      });
    },

    async addActiveAgent(agentId: string) {
      const activeAgents = [...this.session.activeAgents];
      if (!activeAgents.includes(agentId)) {
        activeAgents.push(agentId);
        await this.updateSessionData({
          activeAgents,
          lastUsedAgent: agentId,
        });
      }
    },

    async removeActiveAgent(agentId: string) {
      const activeAgents = this.session.activeAgents.filter(id => id !== agentId);
      const lastUsedAgent = this.session.lastUsedAgent === agentId ? null : this.session.lastUsedAgent;

      await this.updateSessionData({
        activeAgents,
        lastUsedAgent,
      });
    },
  },
});