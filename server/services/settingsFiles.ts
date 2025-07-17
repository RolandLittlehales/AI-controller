import { promises as fs } from "fs";
import { join } from "path";
import type { UISettings, TerminalConfig, SessionData, SettingsCategory } from "~/types";
import { logger } from "~/utils/logger";

const SETTINGS_DIR = join(process.cwd(), "settings");

const DEFAULT_FILES = {
  ui: join(SETTINGS_DIR, "ui-settings.default.json"),
  terminal: join(SETTINGS_DIR, "terminal-config.default.json"),
  session: join(SETTINGS_DIR, "session-data.default.json"),
} as const;

const SETTINGS_FILES = {
  ui: join(SETTINGS_DIR, "ui-settings.json"),
  terminal: join(SETTINGS_DIR, "terminal-config.json"),
  session: join(SETTINGS_DIR, "session-data.json"),
} as const;

export class SettingsFileService {
  private static instance: SettingsFileService;

  static getInstance(): SettingsFileService {
    if (!SettingsFileService.instance) {
      SettingsFileService.instance = new SettingsFileService();
    }
    return SettingsFileService.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  async ensureSettingsDirectory(): Promise<void> {
    try {
      await fs.access(SETTINGS_DIR);
    } catch {
      await fs.mkdir(SETTINGS_DIR, { recursive: true });
      logger.info("Created settings directory", { path: SETTINGS_DIR });
    }
  }

  private async readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as T;
    } catch (error) {
      logger.warn(`Failed to read settings file: ${filePath}`, {
        file: filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    const tempFile = `${filePath}.tmp`;
    try {
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
      await fs.rename(tempFile, filePath);
      logger.info("Settings file updated", { file: filePath });
    } catch (error) {
      logger.error("Failed to write settings file", error, { file: filePath });
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  private async loadDefaultSettings<T>(category: SettingsCategory): Promise<T> {
    const defaultFile = DEFAULT_FILES[category];
    const defaultData = await this.readJsonFile<T>(defaultFile);

    if (!defaultData) {
      throw new Error(`Failed to load default settings for category: ${category}`);
    }

    return defaultData;
  }

  async loadSettings<T>(category: SettingsCategory): Promise<T> {
    await this.ensureSettingsDirectory();

    const settingsFile = SETTINGS_FILES[category];
    let settings = await this.readJsonFile<T>(settingsFile);

    if (!settings) {
      logger.info("Loading default settings", { category });
      settings = await this.loadDefaultSettings<T>(category);

      // Save default settings as initial user settings
      await this.writeJsonFile(settingsFile, settings);
    }

    return settings;
  }

  async saveSettings<T>(category: SettingsCategory, settings: T): Promise<void> {
    await this.ensureSettingsDirectory();

    const settingsFile = SETTINGS_FILES[category];
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    };

    await this.writeJsonFile(settingsFile, updatedSettings);
  }

  async updateSettings<T>(category: SettingsCategory, updates: Partial<T>): Promise<T> {
    const currentSettings = await this.loadSettings<T>(category);
    const mergedSettings = {
      ...currentSettings,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    await this.saveSettings(category, mergedSettings);
    return mergedSettings;
  }

  async resetSettings(category: SettingsCategory): Promise<void> {
    await this.ensureSettingsDirectory();

    const defaultSettings = await this.loadDefaultSettings(category);
    const settingsFile = SETTINGS_FILES[category];

    await this.writeJsonFile(settingsFile, defaultSettings);
    logger.info("Settings reset to defaults", { category });
  }

  async resetAllSettings(): Promise<void> {
    const categories: SettingsCategory[] = ["ui", "terminal", "session"];

    for (const category of categories) {
      await this.resetSettings(category);
    }

    logger.info("All settings reset to defaults");
  }

  // Convenience methods for specific settings types
  async loadUISettings(): Promise<UISettings> {
    return this.loadSettings<UISettings>("ui");
  }

  async saveUISettings(settings: UISettings): Promise<void> {
    return this.saveSettings("ui", settings);
  }

  async updateUISettings(updates: Partial<UISettings>): Promise<UISettings> {
    return this.updateSettings<UISettings>("ui", updates);
  }

  async loadTerminalConfig(): Promise<TerminalConfig> {
    return this.loadSettings<TerminalConfig>("terminal");
  }

  async saveTerminalConfig(config: TerminalConfig): Promise<void> {
    return this.saveSettings("terminal", config);
  }

  async updateTerminalConfig(updates: Partial<TerminalConfig>): Promise<TerminalConfig> {
    return this.updateSettings<TerminalConfig>("terminal", updates);
  }

  async loadSessionData(): Promise<SessionData> {
    return this.loadSettings<SessionData>("session");
  }

  async saveSessionData(data: SessionData): Promise<void> {
    return this.saveSettings("session", data);
  }

  async updateSessionData(updates: Partial<SessionData>): Promise<SessionData> {
    return this.updateSettings<SessionData>("session", updates);
  }
}

export const settingsFileService = SettingsFileService.getInstance();