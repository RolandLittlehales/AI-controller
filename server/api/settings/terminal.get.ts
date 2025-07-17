import { settingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse, TerminalConfig } from "~/types";

export default defineEventHandler(async (): Promise<ApiResponse<TerminalConfig>> => {
  try {
    const terminalConfig = await settingsFileService.loadTerminalConfig();

    return {
      success: true,
      data: terminalConfig,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load terminal config",
    };
  }
});