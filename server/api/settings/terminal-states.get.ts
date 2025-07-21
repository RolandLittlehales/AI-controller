import { defineEventHandler } from "h3";
import { SettingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse } from "~/types";
import type { TerminalStatesData } from "~/composables/useTerminalPersistence";
import { logger } from "~/utils/logger";

export default defineEventHandler(async (): Promise<ApiResponse<TerminalStatesData>> => {
  try {
    const service = SettingsFileService.getInstance();

    // Read terminal states from custom file
    const terminalStates = await service.readCustomFile<TerminalStatesData>("terminal-states.json");

    if (!terminalStates) {
      // Return empty states if file doesn't exist
      return {
        success: true,
        data: {
          terminals: {},
          lastUpdate: new Date().toISOString(),
          version: "1.0.0",
        },
      };
    }

    return {
      success: true,
      data: terminalStates,
    };
  } catch (error) {
    logger.error("Failed to read terminal states", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read terminal states",
    };
  }
});