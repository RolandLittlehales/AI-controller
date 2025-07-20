import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMultiTerminalWebSocket, useMultiTerminalManager } from './useMultiTerminalWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock sending data
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: true }));
  }

  // Test helper methods
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock global WebSocket
const MockWebSocketSpy = vi.fn().mockImplementation((url: string) => new MockWebSocket(url));
global.WebSocket = MockWebSocketSpy as unknown as typeof WebSocket;

// Mock logger
vi.mock('~/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'http:',
    host: 'localhost:3000'
  },
  writable: true
});

describe('useMultiTerminalWebSocket', () => {
  let mockOptions: any;
  let onOutput: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let onStatusChange: ReturnType<typeof vi.fn>;
  let onConnected: ReturnType<typeof vi.fn>;
  let onDisconnected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOutput = vi.fn();
    onError = vi.fn();
    onStatusChange = vi.fn();
    onConnected = vi.fn();
    onDisconnected = vi.fn();

    mockOptions = {
      terminalId: 'test-terminal-123',
      workingDirectory: '/test/path',
      onOutput,
      onError,
      onStatusChange,
      onConnected,
      onDisconnected
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    MockWebSocketSpy.mockClear();
  });

  it('should create terminal connection with correct initial state', () => {
    const { connection } = useMultiTerminalWebSocket(mockOptions);

    expect(connection.value.terminalId).toBe('test-terminal-123');
    expect(connection.value.status).toBe('disconnected');
    expect(connection.value.websocket).toBeNull();
    expect(connection.value.workingDirectory).toBe('/test/path');
    expect(connection.value.retryCount).toBe(0);
  });

  it('should connect to WebSocket with correct URL parameters', async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    expect(connection.value.status).toBe('connecting');
    expect(onStatusChange).toHaveBeenCalledWith('connecting');

    // Wait for connection to open
    await new Promise(resolve => setTimeout(resolve, 15));

    expect(connection.value.status).toBe('connected');
    expect(onStatusChange).toHaveBeenCalledWith('connected');
  });

  it('should build WebSocket URL with terminal parameters', async () => {
    const { connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();

    // Check that WebSocket was created with correct URL
    const expectedUrl = 'ws://localhost:3000/api/ws/terminal?terminalId=test-terminal-123&cwd=%2Ftest%2Fpath';
    expect(MockWebSocketSpy).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle terminal-created message', async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: 'terminal-created',
      terminalId: 'server-terminal-456',
      data: { pid: 12345 }
    });

    expect(onConnected).toHaveBeenCalledWith('server-terminal-456');
  });

  it('should handle terminal-data message', async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: 'terminal-data',
      data: { output: 'Hello World\n' }
    });

    expect(onOutput).toHaveBeenCalledWith('Hello World\n');
  });

  it('should handle error message', async () => {
    const { connection, connect } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    mockWebSocket.simulateMessage({
      type: 'error',
      data: { message: 'Terminal creation failed' }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(connection.value.status).toBe('error');
    expect(onStatusChange).toHaveBeenCalledWith('error');
  });

  it('should send input when connected', async () => {
    const { connection, connect, sendInput } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    // Manually set connected status for test
    connection.value.status = 'connected';

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    const sendSpy = vi.spyOn(mockWebSocket, 'send');

    const result = sendInput('ls -la\n');

    expect(result).toBe(true);
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should fail to send input when not connected', () => {
    const { sendInput } = useMultiTerminalWebSocket(mockOptions);

    const result = sendInput('ls -la\n');

    expect(result).toBe(false);
  });

  it('should send resize event when connected', async () => {
    const { connection, connect, resize } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    // Manually set connected status for test
    connection.value.status = 'connected';

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    const sendSpy = vi.spyOn(mockWebSocket, 'send');

    const result = resize(120, 40);

    expect(result).toBe(true);
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should disconnect and send destroy message', async () => {
    const { connection, connect, disconnect } = useMultiTerminalWebSocket(mockOptions);

    await connect();
    await new Promise(resolve => setTimeout(resolve, 15));

    // Manually set connected status for test
    connection.value.status = 'connected';

    const mockWebSocket = connection.value.websocket as unknown as MockWebSocket;
    const sendSpy = vi.spyOn(mockWebSocket, 'send');
    const closeSpy = vi.spyOn(mockWebSocket, 'close');

    disconnect();

    expect(sendSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledWith(1000, 'Client disconnect');
    expect(connection.value.status).toBe('disconnected');
  });
});

describe('useMultiTerminalManager', () => {
  it('should create and manage multiple terminal connections', () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: 'terminal-1',
      workingDirectory: '/path/1'
    });

    manager.createConnection({
      terminalId: 'terminal-2',
      workingDirectory: '/path/2'
    });

    expect(manager.connections.value.size).toBe(2);
    expect(manager.getConnection('terminal-1')).toBeDefined();
    expect(manager.getConnection('terminal-2')).toBeDefined();
  });

  it('should remove terminal connections', () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: 'terminal-1',
      workingDirectory: '/path/1'
    });

    manager.createConnection({
      terminalId: 'terminal-2',
      workingDirectory: '/path/2'
    });

    expect(manager.connections.value.size).toBe(2);

    manager.removeConnection('terminal-1');

    expect(manager.connections.value.size).toBe(1);
    expect(manager.getConnection('terminal-1')).toBeUndefined();
    expect(manager.getConnection('terminal-2')).toBeDefined();
  });

  it('should get all connection statuses', () => {
    const manager = useMultiTerminalManager();

    manager.createConnection({
      terminalId: 'terminal-1',
      workingDirectory: '/path/1'
    });

    manager.createConnection({
      terminalId: 'terminal-2',
      workingDirectory: '/path/2'
    });

    const statuses = manager.getAllStatuses();

    expect(Object.keys(statuses)).toHaveLength(2);
    expect(statuses['terminal-1']).toBe('disconnected');
    expect(statuses['terminal-2']).toBe('disconnected');
  });

  it('should disconnect all terminals', () => {
    const manager = useMultiTerminalManager();

    const connection1 = manager.createConnection({
      terminalId: 'terminal-1',
      workingDirectory: '/path/1'
    });

    const connection2 = manager.createConnection({
      terminalId: 'terminal-2',
      workingDirectory: '/path/2'
    });

    const disconnectSpy1 = vi.spyOn(connection1, 'disconnect');
    const disconnectSpy2 = vi.spyOn(connection2, 'disconnect');

    manager.disconnectAll();

    expect(disconnectSpy1).toHaveBeenCalled();
    expect(disconnectSpy2).toHaveBeenCalled();
    expect(manager.connections.value.size).toBe(0);
  });
});