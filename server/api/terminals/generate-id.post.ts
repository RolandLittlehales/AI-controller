import { randomUUID } from "crypto";
import type { ApiResponse } from "~/types";

interface GenerateTerminalIdResponse {
  terminalId: string;
}

/**
 * Generate a unique terminal ID server-side
 *
 * This endpoint generates a secure UUID for terminal creation,
 * avoiding crypto.randomUUID() HTTPS requirements on the client-side.
 *
 * @returns {ApiResponse<GenerateTerminalIdResponse>} Response with generated terminal ID
 */
export default defineEventHandler(async (): Promise<ApiResponse<GenerateTerminalIdResponse>> => {
  try {
    const terminalId = randomUUID();

    return {
      success: true,
      data: {
        terminalId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to generate terminal ID",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
});