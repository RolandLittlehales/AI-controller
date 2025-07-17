import { settingsFileService } from "~/server/services/settingsFiles";
import { SettingsInitializer } from "~/server/services/settingsInit";
import type { ApiResponse, SettingsStore } from "~/types";

export default defineEventHandler(async (): Promise<ApiResponse<SettingsStore>> => {
  try {
    // Ensure settings are initialized
    await SettingsInitializer.initialize();

    const [ui, terminal, session] = await Promise.all([
      settingsFileService.loadUISettings(),
      settingsFileService.loadTerminalConfig(),
      settingsFileService.loadSessionData(),
    ]);

    return {
      success: true,
      data: {
        ui,
        terminal,
        session,
        isLoading: false,
        error: null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load settings",
    };
  }
});