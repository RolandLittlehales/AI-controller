// readBody is available globally in Nitro context
import { settingsFileService } from "~/server/services/settingsFiles";
import { SettingsInitializer } from "~/server/services/settingsInit";
import type { ApiResponse, SettingsUpdatePayload, UISettings, TerminalConfig, SessionData, NitroEvent } from "~/types";

export default defineEventHandler(async (event: NitroEvent): Promise<ApiResponse<UISettings | TerminalConfig | SessionData>> => {
  try {
    // Ensure settings are initialized
    await SettingsInitializer.initialize();

    const payload = await readBody<SettingsUpdatePayload>(event);

    if (!payload.category || !payload.updates) {
      return {
        success: false,
        error: "Invalid payload: category and updates are required",
      };
    }

    const { category, updates } = payload;

    let updatedSettings: UISettings | TerminalConfig | SessionData;

    switch (category) {
      case "ui":
        updatedSettings = await settingsFileService.updateUISettings(updates as Partial<UISettings>);
        break;
      case "terminal":
        updatedSettings = await settingsFileService.updateTerminalConfig(updates as Partial<TerminalConfig>);
        break;
      case "session":
        updatedSettings = await settingsFileService.updateSessionData(updates as Partial<SessionData>);
        break;
      default:
        return {
          success: false,
          error: `Invalid category: ${category}`,
        };
    }

    return {
      success: true,
      data: updatedSettings,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
});