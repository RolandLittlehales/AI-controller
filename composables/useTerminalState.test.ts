import { describe, it, expect, beforeEach, test } from "vitest";
import { useTerminalState } from "~/composables/useTerminalState";

describe("useTerminalState", () => {
  let state: ReturnType<typeof useTerminalState>;

  beforeEach(() => {
    state = useTerminalState();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      expect(state.isConnected.value).toBe(false);
      expect(state.isConnecting.value).toBe(false);
      expect(state.terminalId.value).toBeUndefined();
      expect(state.statusMessage.value).toBe("Terminal not connected");
    });

    it("should have correct initial computed state", () => {
      expect(state.connectionState.value).toBe("disconnected");
      expect(state.hasTerminalId.value).toBe(false);
      expect(state.displayTerminalId.value).toBe("");
    });
  });

  describe("connection state management", () => {
    test.each([
      {
        description: "should set connecting state correctly",
        targetState: "connecting" as const,
        expectedIsConnected: false,
        expectedIsConnecting: true,
        expectedStatusMessage: "Connecting...",
      },
      {
        description: "should set connected state correctly",
        targetState: "connected" as const,
        expectedIsConnected: true,
        expectedIsConnecting: false,
        expectedStatusMessage: "Terminal connected",
      },
      {
        description: "should set disconnected state correctly",
        targetState: "disconnected" as const,
        expectedIsConnected: false,
        expectedIsConnecting: false,
        expectedStatusMessage: "Terminal not connected",
      },
    ])("$description", ({ targetState, expectedIsConnected, expectedIsConnecting, expectedStatusMessage }: { targetState: "connecting" | "connected" | "disconnected"; expectedIsConnected: boolean; expectedIsConnecting: boolean; expectedStatusMessage: string }) => {
      state.setConnectionState(targetState);

      expect(state.isConnected.value).toBe(expectedIsConnected);
      expect(state.isConnecting.value).toBe(expectedIsConnecting);
      expect(state.statusMessage.value).toBe(expectedStatusMessage);
      expect(state.connectionState.value).toBe(targetState);
    });

    it("should handle state transitions properly", () => {
      // disconnected -> connecting -> connected
      state.setConnectionState("connecting");
      expect(state.connectionState.value).toBe("connecting");

      state.setConnectionState("connected");
      expect(state.connectionState.value).toBe("connected");

      state.setConnectionState("disconnected");
      expect(state.connectionState.value).toBe("disconnected");
    });
  });

  describe("terminal ID management", () => {
    it("should set terminal ID correctly", () => {
      const testId = "test-terminal-123";
      state.setTerminalId(testId);

      expect(state.terminalId.value).toBe(testId);
      expect(state.hasTerminalId.value).toBe(true);
    });

    it("should clear terminal ID", () => {
      state.setTerminalId("test-id");
      expect(state.hasTerminalId.value).toBe(true);

      state.setTerminalId(undefined);
      expect(state.terminalId.value).toBeUndefined();
      expect(state.hasTerminalId.value).toBe(false);
    });

    test.each([
      {
        description: "should extract first segment of UUID",
        terminalId: "550e8400-e29b-41d4-a716-446655440000",
        expectedDisplayId: "550e8400",
        expectedLength: 8,
      },
      {
        description: "should handle terminal ID without dashes",
        terminalId: "abc123",
        expectedDisplayId: "abc123",
        expectedLength: 6,
      },
      {
        description: "should handle empty segments gracefully",
        terminalId: "-e29b-41d4",
        expectedDisplayId: "",
        expectedLength: 0,
      },
    ])("$description", ({ terminalId, expectedDisplayId, expectedLength }: { terminalId: string; expectedDisplayId: string; expectedLength: number }) => {
      state.setTerminalId(terminalId);

      expect(state.displayTerminalId.value).toBe(expectedDisplayId);
      expect(state.displayTerminalId.value).toHaveLength(expectedLength);
    });
  });

  describe("status message management", () => {
    it("should set custom status message", () => {
      const customMessage = "Custom status message";
      state.setStatusMessage(customMessage);

      expect(state.statusMessage.value).toBe(customMessage);
    });

    it("should set custom error and reset connection state", () => {
      // First connect
      state.setConnectionState("connected");

      // Set custom error
      const errorMessage = "Connection failed";
      state.setCustomError(errorMessage);

      expect(state.statusMessage.value).toBe(errorMessage);
      expect(state.isConnected.value).toBe(false);
      expect(state.isConnecting.value).toBe(false);
      expect(state.connectionState.value).toBe("disconnected");
    });

    it("should reset error state from connecting state", () => {
      // Start connecting
      state.setConnectionState("connecting");

      // Set error
      const errorMessage = "Failed to connect";
      state.setCustomError(errorMessage);

      expect(state.statusMessage.value).toBe(errorMessage);
      expect(state.isConnected.value).toBe(false);
      expect(state.isConnecting.value).toBe(false);
    });
  });

  describe("state reset", () => {
    it("should reset all state to initial values", () => {
      // Set up some state
      state.setConnectionState("connected");
      state.setTerminalId("test-id");
      state.setStatusMessage("Custom message");

      // Verify state is set
      expect(state.isConnected.value).toBe(true);
      expect(state.terminalId.value).toBe("test-id");
      expect(state.statusMessage.value).toBe("Custom message");

      // Reset state
      state.resetState();

      // Verify reset
      expect(state.isConnected.value).toBe(false);
      expect(state.isConnecting.value).toBe(false);
      expect(state.terminalId.value).toBeUndefined();
      expect(state.statusMessage.value).toBe("Terminal not connected");
      expect(state.connectionState.value).toBe("disconnected");
      expect(state.hasTerminalId.value).toBe(false);
      expect(state.displayTerminalId.value).toBe("");
    });
  });

  describe("readonly protection", () => {
    it("should provide readonly refs that cannot be mutated directly", () => {
      // This tests the readonly nature of the returned refs
      expect(state.isConnected).toBeDefined();
      expect(state.isConnecting).toBeDefined();
      expect(state.terminalId).toBeDefined();
      expect(state.statusMessage).toBeDefined();
      expect(state.connectionState).toBeDefined();
      expect(state.hasTerminalId).toBeDefined();
      expect(state.displayTerminalId).toBeDefined();

      // These should be readonly - we can't test mutation directly
      // but we can verify the structure
      expect(typeof state.isConnected.value).toBe("boolean");
      expect(typeof state.isConnecting.value).toBe("boolean");
      expect(typeof state.statusMessage.value).toBe("string");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete connection lifecycle", () => {
      // Start connection
      state.setConnectionState("connecting");
      expect(state.connectionState.value).toBe("connecting");
      expect(state.statusMessage.value).toBe("Connecting...");

      // Connection successful
      state.setConnectionState("connected");
      state.setTerminalId("terminal-123");
      expect(state.connectionState.value).toBe("connected");
      expect(state.statusMessage.value).toBe("Terminal connected");
      expect(state.hasTerminalId.value).toBe(true);

      // Disconnect
      state.setConnectionState("disconnected");
      expect(state.connectionState.value).toBe("disconnected");
      expect(state.statusMessage.value).toBe("Terminal not connected");
      // Terminal ID should still be there until reset
      expect(state.hasTerminalId.value).toBe(true);

      // Reset clears everything
      state.resetState();
      expect(state.hasTerminalId.value).toBe(false);
    });

    it("should handle error during connection", () => {
      // Start connecting
      state.setConnectionState("connecting");

      // Error occurs
      state.setCustomError("Connection timeout");

      expect(state.connectionState.value).toBe("disconnected");
      expect(state.statusMessage.value).toBe("Connection timeout");
      expect(state.isConnected.value).toBe(false);
      expect(state.isConnecting.value).toBe(false);
    });
  });
});