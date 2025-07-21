import { defineEventHandler, readBody } from "h3";
import { SettingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse, NitroEvent } from "~/types";
import type { TerminalStatesData } from "~/composables/useTerminalPersistence";
import { logger } from "~/utils/logger";

export default defineEventHandler(async (event: NitroEvent): Promise<ApiResponse<TerminalStatesData>> => {
  try {
    const body = await readBody<TerminalStatesData>(event);

    if (!body || typeof body !== "object") {
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    const service = SettingsFileService.getInstance();

    // Save terminal states to custom file
    await service.writeCustomFile("terminal-states.json", body);

    logger.info("Terminal states updated", {
      terminalCount: Object.keys(body.terminals || {}).length,
    });

    return {
      success: true,
      data: body,
    };
  } catch (error) {
    logger.error("Failed to save terminal states", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save terminal states",
    };
  }
});