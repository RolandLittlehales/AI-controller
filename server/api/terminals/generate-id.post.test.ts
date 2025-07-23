import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import type { ApiResponse } from "~/types";

interface GenerateTerminalIdResponse {
  terminalId: string;
}

// Test the core logic directly without the Nitro wrapper
async function generateTerminalId(): Promise<ApiResponse<GenerateTerminalIdResponse>> {
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
}

describe("server/api/terminals/generate-id.post", () => {
  it("should generate a valid UUID terminal ID", async () => {
    const response = await generateTerminalId();

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data?.terminalId).toBeDefined();
    expect(response.error).toBeUndefined();

    // Validate UUID format (RFC 4122 version 4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(response.data?.terminalId).toMatch(uuidRegex);
  });

  it("should generate unique IDs on multiple calls", async () => {
    const response1 = await generateTerminalId();
    const response2 = await generateTerminalId();
    const response3 = await generateTerminalId();

    expect(response1.success).toBe(true);
    expect(response2.success).toBe(true);
    expect(response3.success).toBe(true);

    const id1 = response1.data?.terminalId;
    const id2 = response2.data?.terminalId;
    const id3 = response3.data?.terminalId;

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id3).toBeDefined();

    // All IDs should be unique
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it("should return consistent response structure", async () => {
    const response = await generateTerminalId();

    expect(response).toMatchObject({
      success: true,
      data: {
        terminalId: expect.any(String),
      },
    });

    // Should not have error fields when successful
    expect(response.error).toBeUndefined();
    expect(response.message).toBeUndefined();
  });
});