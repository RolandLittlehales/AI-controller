// readBody is available globally in Nitro context
import { settingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse, SettingsCategory, NitroEvent } from "~/types";

export default defineEventHandler(async (event: NitroEvent): Promise<ApiResponse<{ message: string }>> => {
  try {
    const body = await readBody<{ category?: SettingsCategory }>(event);
    const category = body?.category as SettingsCategory | undefined;

    if (category && !["ui", "terminal", "session"].includes(category)) {
      return {
        success: false,
        error: `Invalid category: ${category}`,
      };
    }

    if (category) {
      await settingsFileService.resetSettings(category);
      return {
        success: true,
        data: { message: `Settings for ${category} reset to defaults` },
      };
    } else {
      await settingsFileService.resetAllSettings();
      return {
        success: true,
        data: { message: "All settings reset to defaults" },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset settings",
    };
  }
});