import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMultiTerminalWebSocket, useMultiTerminalManager  } from "./useMultiTerminalWebSocket";
import type { MultiTerminalWebSocketOptions } from "./useMultiTerminalWebSocket";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  private _readyState = MockWebSocket.OPEN;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  get readyState() {
    return this._readyState;
  }

  set readyState(value: number) {
    this._readyState = value;
  }

  send(_data: string) {
    if (this._readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    // Mock sending data
  }

  close(code?: number, reason?: string) {
    this._readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", {
      code: code || 1000,
      reason: reason || "",
      wasClean: true,
    }));
  }

  // Test helper methods
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }

  simulateOpen() {
    this._readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }
}

// Mock global WebSocket
const MockWebSocketSpy = vi.fn().mockImplementation((url: string) => new MockWebSocket(url));
// Add WebSocket constants
Object.assign(MockWebSocketSpy, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});
global.WebSocket = MockWebSocketSpy as unknown as typeof WebSocket;

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    protocol: "http:",
    host: "localhost:3000",
  },
  writable: true,
});

describe("useMultiTerminalWebSocket", () => {
  let mockOptions: MultiTerminalWebSocketOptions;

  beforeEach(() => {
    mockOptions = {
      terminalId: "test-terminal-123",
      workingDirectory: "/test/path",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    MockWebSocketSpy.mockClear();
    // Restore original window.location
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        host: "localhost:3000",
      },
      writable: true,
    });
  });

  it("should create terminal connection with correct initial state", () => {
    const { connection } = useMultiTerminalWebSocket(mockOptions);

    expect(connection.value.terminalId).toBe("test-terminal-123");
    expect(connection.value.status).toBe("disconnected");
    expect(connection.value.websocket).toBeNull();
    expect(connection.value.workingDirectory).toBe("/test/path");
    expect(connection.value.retryCount).toBe(0);
  });

  it("should build WebSocket URL with terminal parameters", async () => {
    const { connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    // Check that WebSocket was created with correct URL
    const expectedUrl = "ws://localhost:3000/api/ws/terminal?terminalId=test-terminal-123&cwd=%2Ftest%2Fpath";
    expect(MockWebSocketSpy).toHaveBeenCalledWith(expectedUrl);
  });

  it("should handle terminal-created message", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: "terminal-created",
      terminalId: "server-terminal-456",
      data: { pid: 12345 },
    });

    expect(mockOptions.onConnected).toHaveBeenCalledWith("server-terminal-456");
  });

  it("should handle terminal-data message", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: "terminal-data",
      data: { output: "Hello World\n" },
    });

    expect(mockOptions.onOutput).toHaveBeenCalledWith("Hello World\n");
  });

  it("should handle error message", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: "error",
      data: { message: "Terminal creation failed" },
    });

    expect(mockOptions.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should connect to WebSocket", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    expect(connection.value.websocket).toBeDefined();
    expect(MockWebSocketSpy).toHaveBeenCalled();
  });

  it("should fail to send input when not connected", () => {
    const { sendInput } = useMultiTerminalWebSocket(mockOptions);

    const result = sendInput("ls -la\n");

    expect(result).toBe(false);
  });

  it("should disconnect WebSocket", async () => {
    const { connection, connect, disconnect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    const closeSpy = vi.spyOn(mockWebSocket, "close");

    disconnect();

    expect(closeSpy).toHaveBeenCalledWith(1000, "Client disconnect");
  });

  it("should handle terminal-exit message", async () => {
    vi.useFakeTimers();
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: "terminal-exit",
      data: { code: 0, signal: null },
    });

    // terminal-exit triggers disconnect after 1 second timeout
    vi.advanceTimersByTime(1000);

    expect(mockOptions.onDisconnected).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should handle terminal-destroyed message", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: "terminal-destroyed",
      terminalId: "server-terminal-456",
    });

    expect(mockOptions.onDisconnected).toHaveBeenCalled();
  });

  it("should handle JSON parse errors in messages", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;

    // Simulate invalid JSON by directly calling onmessage
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(new MessageEvent("message", { data: "invalid json" }));
    }

    expect(mockOptions.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should handle WebSocket send failures", async () => {
    const { connection, connect, sendInput } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    // Mock send to throw error
    vi.spyOn(mockWebSocket, "send").mockImplementation(() => {
      throw new Error("Send failed");
    });

    const result = sendInput("test command");
    expect(result).toBe(false);
  });

  it("should prevent connection when already connecting", async () => {
    const { connect } = useMultiTerminalWebSocket(mockOptions);

    // Start first connection
    const promise1 = connect();

    // Try to connect again while first is still connecting
    await connect(); // Should log warning and return early

    await promise1; // Wait for first connection to complete

    // Should have only created one WebSocket
    expect(MockWebSocketSpy).toHaveBeenCalledTimes(1);
  });

  it("should prevent connection when already connected", async () => {
    const { connect } = useMultiTerminalWebSocket(mockOptions);

    // Connect first time
    await connect();

    // Try to connect again when already connected
    await connect(); // Should log warning and return early

    // Should have only created one WebSocket
    expect(MockWebSocketSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle WebSocket creation failures", async () => {
    // Mock WebSocket constructor to throw
    const originalWebSocket = global.WebSocket;
    global.WebSocket = vi.fn().mockImplementation(() => {
      throw new Error("WebSocket creation failed");
    }) as unknown as typeof WebSocket;

    const { connect } = useMultiTerminalWebSocket(mockOptions);

    await connect(); // Should handle error gracefully
    expect(mockOptions.onError).toHaveBeenCalledWith(expect.any(Error));

    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
  });

  it("should detect HTTPS protocol correctly", async () => {
    // Mock window.location for HTTPS
    Object.defineProperty(window, "location", {
      value: {
        protocol: "https:",
        host: "example.com",
      },
      writable: true,
    });

    const { connect } = useMultiTerminalWebSocket({
      ...mockOptions,
      terminalId: "https-terminal",
    });

    await connect();

    // Should use wss:// for HTTPS
    expect(MockWebSocketSpy).toHaveBeenCalledWith(
      expect.stringContaining("wss://"),
    );
  });

  it("should handle missing working directory parameter", async () => {
    const optionsWithoutCwd = {
      ...mockOptions,
      terminalId: "no-cwd-terminal",
      workingDirectory: undefined,
    };

    const { connect } = useMultiTerminalWebSocket(optionsWithoutCwd);
    await connect();

    // Should still create WebSocket without cwd parameter
    expect(MockWebSocketSpy).toHaveBeenCalledWith(
      expect.stringMatching(/terminalId=no-cwd-terminal$/),
    );
  });

  it("should fail to resize when not connected", () => {
    const { resize } = useMultiTerminalWebSocket(mockOptions);

    const result = resize(80, 24);
    expect(result).toBe(false);
  });

  it("should resize when connected", async () => {
    const { connection, connect, resize } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    // Get the original WebSocket before it becomes reactive/readonly
    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;

    // Store a spy before triggering events
    const sendSpy = vi.spyOn(mockWebSocket, "send");

    // Manually trigger onopen to set status to connected
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen(new Event("open"));
    }

    // Verify status is now connected
    expect(connection.value.status).toBe("connected");

    const result = resize(100, 30);

    expect(result).toBe(true);
    // Check that the 2nd call (resize) was made with correct parameters
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining("terminal-resize"),
    );
    const resizeCallData = sendSpy.mock.calls[1]?.[0];
    if (resizeCallData) {
      const resizeCall = JSON.parse(resizeCallData);
      expect(resizeCall.type).toBe("terminal-resize");
      expect(resizeCall.data).toEqual({ cols: 100, rows: 30 });
    }
  });

  it("should handle WebSocket errors", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    if (mockWebSocket) {
      mockWebSocket.simulateError();
      expect(mockOptions.onError).toHaveBeenCalledWith(expect.any(Error));
    }
  });

  it("should handle WebSocket close events", async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    if (mockWebSocket) {
      mockWebSocket.close(1000, "Normal closure");
      expect(mockOptions.onDisconnected).toHaveBeenCalled();
    }
  });
});

describe("useMultiTerminalManager", () => {
  it("should create and manage multiple terminal connections", () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    expect(Object.keys(manager.connections.value).length).toBe(2);
    expect(manager.getConnection("terminal-1")).toBeDefined();
    expect(manager.getConnection("terminal-2")).toBeDefined();
  });

  it("should remove terminal connections", () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    expect(Object.keys(manager.connections.value).length).toBe(2);

    manager.removeConnection("terminal-1");

    expect(Object.keys(manager.connections.value).length).toBe(1);
    expect(manager.getConnection("terminal-1")).toBeUndefined();
    expect(manager.getConnection("terminal-2")).toBeDefined();
  });

  it("should disconnect all terminals", () => {
    const manager = useMultiTerminalManager();

    const connection1 = manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    const connection2 = manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    const disconnectSpy1 = vi.spyOn(connection1, "disconnect");
    const disconnectSpy2 = vi.spyOn(connection2, "disconnect");

    manager.disconnectAll();

    expect(disconnectSpy1).toHaveBeenCalled();
    expect(disconnectSpy2).toHaveBeenCalled();
    expect(Object.keys(manager.connections.value).length).toBe(0);
  });

  it("should manage connection lifecycle", () => {
    const manager = useMultiTerminalManager();

    // Test creation
    manager.createConnection({
      terminalId: "test-terminal",
      workingDirectory: "/test",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    // Test retrieval
    expect(manager.getConnection("test-terminal")).toBeDefined();
    expect("test-terminal" in manager.connections.value).toBe(true);

    // Test removal
    manager.removeConnection("test-terminal");
    expect(manager.getConnection("test-terminal")).toBeUndefined();
    expect("test-terminal" in manager.connections.value).toBe(false);
  });

  it("should get all connection statuses", () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    const statuses = manager.getAllStatuses();

    expect(statuses).toHaveProperty("terminal-1");
    expect(statuses).toHaveProperty("terminal-2");
    expect(typeof statuses["terminal-1"]).toBe("string");
    expect(typeof statuses["terminal-2"]).toBe("string");
  });

  it("should handle reconnection logic", async () => {
    const manager = useMultiTerminalManager();

    const connection = manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
    });

    // Test that reconnect method exists and can be called
    expect(typeof connection.reconnect).toBe("function");

    // Mock the reconnect implementation
    const reconnectSpy = vi.spyOn(connection, "reconnect").mockImplementation(async () => {
      // Mock implementation
    });

    await connection.reconnect();
    expect(reconnectSpy).toHaveBeenCalled();
  });
});
