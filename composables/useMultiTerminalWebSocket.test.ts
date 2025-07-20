import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMultiTerminalWebSocket, useMultiTerminalManager, type MultiTerminalWebSocketOptions } from "./useMultiTerminalWebSocket";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN; // Start in OPEN state for tests
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(_data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    // Mock sending data
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", { 
      code: code || 1000, 
      reason: reason || "", 
      wasClean: true 
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
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }
}

// Mock global WebSocket
const MockWebSocketSpy = vi.fn().mockImplementation((url: string) => new MockWebSocket(url));
global.WebSocket = MockWebSocketSpy as unknown as typeof WebSocket;

// Mock logger
vi.mock("~/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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
});

describe("useMultiTerminalManager", () => {
  it("should create and manage multiple terminal connections", () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
    });

    manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
    });

    expect(manager.connections.value.size).toBe(2);
    expect(manager.getConnection("terminal-1")).toBeDefined();
    expect(manager.getConnection("terminal-2")).toBeDefined();
  });

  it("should remove terminal connections", () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
    });

    manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
    });

    expect(manager.connections.value.size).toBe(2);

    manager.removeConnection("terminal-1");

    expect(manager.connections.value.size).toBe(1);
    expect(manager.getConnection("terminal-1")).toBeUndefined();
    expect(manager.getConnection("terminal-2")).toBeDefined();
  });

  it("should disconnect all terminals", () => {
    const manager = useMultiTerminalManager();

    const connection1 = manager.createConnection({
      terminalId: "terminal-1",
      workingDirectory: "/path/1",
    });

    const connection2 = manager.createConnection({
      terminalId: "terminal-2",
      workingDirectory: "/path/2",
    });

    const disconnectSpy1 = vi.spyOn(connection1, "disconnect");
    const disconnectSpy2 = vi.spyOn(connection2, "disconnect");

    manager.disconnectAll();

    expect(disconnectSpy1).toHaveBeenCalled();
    expect(disconnectSpy2).toHaveBeenCalled();
    expect(manager.connections.value.size).toBe(0);
  });

  it("should manage connection lifecycle", () => {
    const manager = useMultiTerminalManager();

    // Test creation
    manager.createConnection({
      terminalId: "test-terminal",
      workingDirectory: "/test",
    });

    // Test retrieval
    expect(manager.getConnection("test-terminal")).toBeDefined();
    expect(manager.connections.value.has("test-terminal")).toBe(true);

    // Test removal
    manager.removeConnection("test-terminal");
    expect(manager.getConnection("test-terminal")).toBeUndefined();
    expect(manager.connections.value.has("test-terminal")).toBe(false);
  });
});
