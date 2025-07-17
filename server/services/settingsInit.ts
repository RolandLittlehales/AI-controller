import { settingsFileService } from "./settingsFiles";
import { logger } from "~/utils/logger";
import type { SettingsCategory } from "~/types";

let initialized = false;

export const SettingsInitializer = {
  async initialize(): Promise<void> {
    if (initialized) {
      return;
    }

    try {
      await settingsFileService.ensureSettingsDirectory();

      const categories: SettingsCategory[] = ["ui", "terminal", "session"];

      for (const category of categories) {
        // This will create the file from defaults if it doesn't exist
        await settingsFileService.loadSettings(category);
      }

      initialized = true;
      logger.info("Settings system initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize settings system", error);
      throw error;
    }
  },

  isInitialized(): boolean {
    return initialized;
  },

  // For testing purposes only
  _resetForTesting(): void {
    initialized = false;
  },
};

// Auto-initialize on server startup
export async function initializeSettings(): Promise<void> {
  await SettingsInitializer.initialize();
}