import { settingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse, UISettings } from "~/types";

export default defineEventHandler(async (): Promise<ApiResponse<UISettings>> => {
  try {
    const uiSettings = await settingsFileService.loadUISettings();

    return {
      success: true,
      data: uiSettings,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load UI settings",
    };
  }
});