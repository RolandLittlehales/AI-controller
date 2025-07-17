import { settingsFileService } from "~/server/services/settingsFiles";
import type { ApiResponse, SessionData } from "~/types";

export default defineEventHandler(async (): Promise<ApiResponse<SessionData>> => {
  try {
    const sessionData = await settingsFileService.loadSessionData();

    return {
      success: true,
      data: sessionData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load session data",
    };
  }
});