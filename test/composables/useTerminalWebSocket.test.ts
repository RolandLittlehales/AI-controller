import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ref } from "vue";
import type { Ref } from "vue";
import { useTerminalWebSocket } from "~/composables/useTerminalWebSocket";
import { useTerminalState } from "~/composables/useTerminalState";
import { useTerminalXterm } from "~/composables/useTerminalXterm";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  send = vi.fn();
  close = vi.fn();

  // Helper methods for testing
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }
}

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    protocol: "http:",
    host: "localhost:3000",
  },
  writable: true,
});

// Mock process for server-side checks
global.process = {
  cwd: vi.fn(() => "/mock/cwd"),
} as unknown as typeof process;

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe("useTerminalWebSocket", () => {
  let state: ReturnType<typeof useTerminalState>;
  let xterm: ReturnType<typeof useTerminalXterm>;
  let websocket: ReturnType<typeof useTerminalWebSocket>;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockWebSocket: MockWebSocket;

  const mockProps = {
    cwd: "/test/path",
    rows: 30,
    cols: 100,
    autoConnect: true,
  };

  beforeEach(() => {
    state = useTerminalState();
    xterm = useTerminalXterm();
    mockEmit = vi.fn();
    // Create a ref wrapper for xterm to match the expected type - initially undefined like in real code
    const xtermRef = ref<ReturnType<typeof useTerminalXterm> | undefined>(undefined);
    // Set the xterm value to simulate the real pattern
    xtermRef.value = xterm;
    websocket = useTerminalWebSocket(state, xtermRef as Ref<ReturnType<typeof useTerminalXterm> | undefined>, mockProps, mockEmit);

    vi.clearAllMocks();
  });

  afterEach(() => {
    websocket.cleanup();
  });

  describe("initialization", () => {
    it("should initialize with empty WebSocket state", () => {
      expect(websocket.ws.value).toBeUndefined();
    });

    it("should provide all required methods", () => {
      expect(typeof websocket.connect).toBe("function");
      expect(typeof websocket.disconnect).toBe("function");
      expect(typeof websocket.sendMessage).toBe("function");
      expect(typeof websocket.sendTerminalData).toBe("function");
      expect(typeof websocket.sendTerminalResize).toBe("function");
      expect(typeof websocket.setupTerminalEventHandlers).toBe("function");
      expect(typeof websocket.cleanup).toBe("function");
    });
  });

  describe("connection management", () => {
    it("should connect to WebSocket successfully", async () => {
      await websocket.connect();

      expect(websocket.ws.value).toBeInstanceOf(MockWebSocket);
      expect(state.isConnecting.value).toBe(true);
      expect(state.connectionState.value).toBe("connecting");
    });

    it("should prevent multiple simultaneous connections", async () => {
      await websocket.connect();
      await websocket.connect(); // Second connect should be ignored

      expect(MockWebSocket).toHaveBeenCalledTimes(1);
    });

    it("should prevent connection when already connected", async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      mockWebSocket.simulateOpen();

      state.setConnectionState("connected");
      await websocket.connect(); // Should be ignored

      expect(MockWebSocket).toHaveBeenCalledTimes(1);
    });

    it("should construct correct WebSocket URL", async () => {
      await websocket.connect();

      expect(MockWebSocket).toHaveBeenCalledWith("ws://localhost:3000/api/ws/terminal");
    });

    it("should use secure WebSocket for HTTPS", async () => {
      Object.defineProperty(window, "location", {
        value: { protocol: "https:", host: "example.com" },
        writable: true,
      });

      await websocket.connect();

      expect(MockWebSocket).toHaveBeenCalledWith("wss://example.com/api/ws/terminal");
    });
  });

  describe("WebSocket event handlers", () => {
    beforeEach(async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
    });

    it("should handle WebSocket open event", () => {
      mockWebSocket.simulateOpen();

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-create",
        data: {
          cols: 100,
          rows: 30,
          cwd: "/test/path",
        },
        timestamp: expect.any(Date),
      }));
    });

    it("should handle WebSocket close event", () => {
      mockWebSocket.simulateClose();

      expect(state.connectionState.value).toBe("disconnected");
      expect(mockEmit).toHaveBeenCalledWith("disconnected");
    });

    it("should handle WebSocket error event", () => {
      mockWebSocket.simulateError();

      expect(state.statusMessage.value).toBe("Connection error");
      expect(mockEmit).toHaveBeenCalledWith("error", "WebSocket connection error");
    });

    it("should use fallback cwd when process.cwd is not available", () => {
      const propsWithoutCwd = { ...mockProps, cwd: "" };
      const xtermRef = ref<ReturnType<typeof useTerminalXterm> | undefined>(undefined);
      xtermRef.value = xterm;
      const websocketWithoutCwd = useTerminalWebSocket(state, xtermRef as Ref<ReturnType<typeof useTerminalXterm> | undefined>, propsWithoutCwd, mockEmit);

      // Mock process.cwd to be undefined
      global.process = undefined as unknown as typeof process;

      websocketWithoutCwd.connect();
      const mockWs = websocketWithoutCwd.ws.value as unknown as MockWebSocket;
      mockWs.simulateOpen();

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-create",
        data: {
          cols: 100,
          rows: 30,
          cwd: "/",
        },
        timestamp: expect.any(Date),
      }));
    });
  });

  describe("message handling", () => {
    beforeEach(async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
    });

    it("should handle terminal-created message", () => {
      const message = {
        type: "terminal-created",
        terminalId: "test-terminal-123",
        data: {},
      };

      mockWebSocket.simulateMessage(message);

      expect(state.connectionState.value).toBe("connected");
      expect(state.terminalId.value).toBe("test-terminal-123");
      expect(mockEmit).toHaveBeenCalledWith("connected", "test-terminal-123");
    });

    it("should handle terminal-data message", () => {
      const message = {
        type: "terminal-data",
        data: { output: "Hello from terminal" },
      };

      vi.spyOn(xterm, "writeData");
      mockWebSocket.simulateMessage(message);

      expect(xterm.writeData).toHaveBeenCalledWith("Hello from terminal");
    });

    it("should handle terminal-exit message", () => {
      vi.spyOn(xterm, "writeData");
      const message = { type: "terminal-exit", data: {} };

      mockWebSocket.simulateMessage(message);

      expect(xterm.writeData).toHaveBeenCalledWith("\\r\\n\\x1b[31mTerminal process exited\\x1b[0m\\r\\n");
    });

    it("should handle terminal-destroyed message", () => {
      const message = { type: "terminal-destroyed", data: {} };

      mockWebSocket.simulateMessage(message);

      expect(state.connectionState.value).toBe("disconnected");
    });

    it("should handle error message", () => {
      const message = {
        type: "error",
        data: { message: "Terminal creation failed" },
      };

      mockWebSocket.simulateMessage(message);

      expect(state.statusMessage.value).toBe("Terminal creation failed");
      expect(mockEmit).toHaveBeenCalledWith("error", "Terminal creation failed");
    });

    it("should handle invalid error message gracefully", () => {
      const message = {
        type: "error",
        data: { invalidField: "no message" },
      };

      mockWebSocket.simulateMessage(message);

      expect(state.statusMessage.value).toBe("Terminal error");
      expect(mockEmit).toHaveBeenCalledWith("error", "Terminal error");
    });

    it("should handle unknown message type", () => {
      const message = { type: "unknown-type", data: {} };

      mockWebSocket.simulateMessage(message);

      // Should not throw error, just log warning
      expect(() => mockWebSocket.simulateMessage(message)).not.toThrow();
    });

    it("should handle invalid JSON message gracefully", () => {
      const invalidMessage = "invalid json";

      mockWebSocket.onmessage?.(new MessageEvent("message", { data: invalidMessage }));

      // Should not throw error, just log error
      expect(() => mockWebSocket.onmessage?.(new MessageEvent("message", { data: invalidMessage }))).not.toThrow();
    });
  });

  describe("sending messages", () => {
    beforeEach(async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      mockWebSocket.simulateOpen();
    });

    it("should send terminal data", () => {
      state.setConnectionState("connected");
      state.setTerminalId("test-terminal-123");

      websocket.sendTerminalData("test input");

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-data",
        terminalId: "test-terminal-123",
        data: { input: "test input" },
        timestamp: expect.any(Date),
      }));
    });

    it("should send terminal resize", () => {
      state.setConnectionState("connected");
      state.setTerminalId("test-terminal-123");

      websocket.sendTerminalResize({ cols: 120, rows: 40 });

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-resize",
        terminalId: "test-terminal-123",
        data: { cols: 120, rows: 40 },
        timestamp: expect.any(Date),
      }));
    });

    it("should not send data when not connected", () => {
      state.setConnectionState("disconnected");

      websocket.sendTerminalData("test input");

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it("should not send data without terminal ID", () => {
      state.setConnectionState("connected");
      // Don't set terminal ID

      websocket.sendTerminalData("test input");

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it("should handle send errors gracefully", () => {
      state.setConnectionState("connected");
      state.setTerminalId("test-terminal-123");

      mockWebSocket.send.mockImplementationOnce(() => {
        throw new Error("Send failed");
      });

      expect(() => websocket.sendTerminalData("test")).not.toThrow();
    });

    it("should not send on closed WebSocket", () => {
      mockWebSocket.readyState = MockWebSocket.CLOSED;

      websocket.sendMessage({ type: "terminal-create", data: {}, timestamp: new Date() });

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe("terminal event handlers setup", () => {
    beforeEach(async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      mockWebSocket.simulateOpen();
      state.setConnectionState("connected");
      state.setTerminalId("test-terminal-123");
    });

    it("should setup terminal event handlers", () => {
      vi.spyOn(xterm, "setOnDataCallback");
      vi.spyOn(xterm, "setOnResizeCallback");

      websocket.setupTerminalEventHandlers();

      expect(xterm.setOnDataCallback).toHaveBeenCalledWith(expect.any(Function));
      expect(xterm.setOnResizeCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should handle terminal data callback", () => {
      websocket.setupTerminalEventHandlers();

      // Get the callback that was set
      const dataCallback = vi.mocked(xterm.setOnDataCallback).mock.calls[0]?.[0];
      dataCallback?.("test input");

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-data",
        terminalId: "test-terminal-123",
        data: { input: "test input" },
        timestamp: expect.any(Date),
      }));
    });

    it("should handle terminal resize callback", () => {
      websocket.setupTerminalEventHandlers();

      // Get the callback that was set
      const resizeCallback = vi.mocked(xterm.setOnResizeCallback).mock.calls[0]?.[0];
      resizeCallback?.({ cols: 120, rows: 40 });

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-resize",
        terminalId: "test-terminal-123",
        data: { cols: 120, rows: 40 },
        timestamp: expect.any(Date),
      }));
    });
  });

  describe("disconnect and cleanup", () => {
    beforeEach(async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      mockWebSocket.simulateOpen();
      state.setConnectionState("connected");
      state.setTerminalId("test-terminal-123");
    });

    it("should disconnect and send destroy message", () => {
      websocket.disconnect();

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: "terminal-destroy",
        terminalId: "test-terminal-123",
        data: {},
        timestamp: expect.any(Date),
      }));
      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(state.connectionState.value).toBe("disconnected");
    });

    it("should not disconnect if not connected", () => {
      state.setConnectionState("disconnected");

      websocket.disconnect();

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it("should cleanup WebSocket and state", () => {
      websocket.cleanup();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(websocket.ws.value).toBeUndefined();
      expect(state.connectionState.value).toBe("disconnected");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete connection lifecycle", async () => {
      // Connect
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      expect(state.connectionState.value).toBe("connecting");

      // WebSocket opens
      mockWebSocket.simulateOpen();
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("terminal-create"));

      // Terminal created
      mockWebSocket.simulateMessage({
        type: "terminal-created",
        terminalId: "test-123",
        data: {},
      });
      expect(state.connectionState.value).toBe("connected");
      expect(state.terminalId.value).toBe("test-123");
      expect(mockEmit).toHaveBeenCalledWith("connected", "test-123");

      // Use terminal
      websocket.sendTerminalData("ls -la");
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("terminal-data"));

      // Receive data
      mockWebSocket.simulateMessage({
        type: "terminal-data",
        data: { output: "file1.txt\\nfile2.txt" },
      });
      expect(xterm.writeData).toHaveBeenCalledWith("file1.txt\\nfile2.txt");

      // Disconnect
      websocket.disconnect();
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("terminal-destroy"));
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it("should handle connection errors", async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;

      mockWebSocket.simulateError();

      expect(state.statusMessage.value).toBe("Connection error");
      expect(mockEmit).toHaveBeenCalledWith("error", "WebSocket connection error");
    });

    it("should handle terminal process exit", async () => {
      await websocket.connect();
      mockWebSocket = websocket.ws.value as unknown as MockWebSocket;
      mockWebSocket.simulateOpen();

      state.setConnectionState("connected");
      state.setTerminalId("test-123");

      vi.spyOn(xterm, "writeData");
      mockWebSocket.simulateMessage({ type: "terminal-exit", data: {} });

      expect(xterm.writeData).toHaveBeenCalledWith(expect.stringContaining("Terminal process exited"));
    });
  });
});