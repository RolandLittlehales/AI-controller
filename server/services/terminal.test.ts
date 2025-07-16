import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TerminalService } from "./terminal";
import type { TerminalOptions } from "./terminal";

// ONLY mock external system APIs that we don't control
vi.mock("node-pty", () => ({
  spawn: vi.fn(() => ({
    pid: 1234,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn(),
    onExit: vi.fn(),
  })),
}));

describe("TerminalService", () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    terminalService = new TerminalService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    terminalService.cleanup();
  });

  describe("createTerminal", () => {
    it("should create a terminal with default options", async () => {
      const terminal = await terminalService.createTerminal();

      expect(terminal).toBeDefined();
      expect(terminal.id).toBeTruthy();
      expect(terminal.metadata.cols).toBe(80);
      expect(terminal.metadata.rows).toBe(24);
      expect(terminal.isActive).toBe(true);
    });

    it("should create a terminal with custom options", async () => {
      const options: TerminalOptions = {
        cols: 120,
        rows: 30,
        cwd: "/tmp",
        shell: "/bin/bash",
      };

      const terminal = await terminalService.createTerminal(options);

      expect(terminal.metadata.cols).toBe(120);
      expect(terminal.metadata.rows).toBe(30);
      expect(terminal.metadata.cwd).toBe("/tmp");
      expect(terminal.metadata.shell).toBe("/bin/bash");
    });

    it("should merge environment variables correctly", async () => {
      const customEnv = { CUSTOM_VAR: "test_value" };
      await terminalService.createTerminal({ env: customEnv });

      // Verify spawn was called with merged environment
      const spawnMock = vi.mocked((await import("node-pty")).spawn);
      const spawnArgs = spawnMock.mock.calls[spawnMock.mock.calls.length - 1];
      const spawnOptions = spawnArgs?.[2];

      expect(spawnOptions?.env).toEqual({
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
        CUSTOM_VAR: "test_value",
      });
    });
  });

  describe("Terminal operations", () => {
    it("should resize terminal successfully", async () => {
      const terminal = await terminalService.createTerminal();
      const result = terminalService.resizeTerminal(terminal.id, 100, 50);

      expect(result).toBe(true);
      expect(terminal.pty.resize).toHaveBeenCalledWith(100, 50);
      expect(terminal.metadata.cols).toBe(100);
      expect(terminal.metadata.rows).toBe(50);
    });

    it("should fail to resize non-existent terminal", () => {
      const result = terminalService.resizeTerminal("non-existent-id", 100, 50);
      expect(result).toBe(false);
    });

    it("should fail to resize inactive terminal", async () => {
      const terminal = await terminalService.createTerminal();
      terminal.isActive = false;

      const result = terminalService.resizeTerminal(terminal.id, 100, 50);
      expect(result).toBe(false);
    });

    it("should write to terminal successfully", async () => {
      const terminal = await terminalService.createTerminal();
      const result = terminalService.writeToTerminal(terminal.id, "hello\r");

      expect(result).toBe(true);
      expect(terminal.pty.write).toHaveBeenCalledWith("hello\r");
    });

    it("should fail to write to inactive terminal", async () => {
      const terminal = await terminalService.createTerminal();
      terminal.isActive = false;

      const result = terminalService.writeToTerminal(terminal.id, "hello\r");
      expect(result).toBe(false);
    });
  });

  describe("Terminal lifecycle", () => {
    it("should destroy terminal successfully", async () => {
      const terminal = await terminalService.createTerminal();
      const result = await terminalService.destroyTerminal(terminal.id);

      expect(result).toBe(true);
      expect(terminal.pty.kill).toHaveBeenCalled();
      expect(terminalService.getTerminal(terminal.id)).toBeUndefined();
    });

    it("should return false for non-existent terminal destruction", async () => {
      const result = await terminalService.destroyTerminal("non-existent-id");
      expect(result).toBe(false);
    });

    it("should handle terminal events properly", async () => {
      const terminal = await terminalService.createTerminal();
      const handler = vi.fn();

      terminalService.onTerminalEvent(terminal.id, handler);

      // Trigger data event through the actual pty mock
      const mockOnData = vi.mocked(terminal.pty.onData);
      const dataCallback = mockOnData.mock.calls[0]?.[0];
      dataCallback?.("test output");

      expect(handler).toHaveBeenCalledWith({
        type: "data",
        terminalId: terminal.id,
        data: { output: "test output" },
        timestamp: expect.any(Date),
      });
    });

    it("should handle terminal exit events", async () => {
      const terminal = await terminalService.createTerminal();
      const handler = vi.fn();
      terminalService.onTerminalEvent(terminal.id, handler);

      // Trigger exit event through the actual pty mock
      const mockOnExit = vi.mocked(terminal.pty.onExit);
      const exitCallback = mockOnExit.mock.calls[0]?.[0];
      exitCallback?.({ exitCode: 0, signal: 1 });

      expect(terminal.isActive).toBe(false);
      expect(handler).toHaveBeenCalledWith({
        type: "exit",
        terminalId: terminal.id,
        data: { exitCode: 0, signal: 1 },
        timestamp: expect.any(Date),
      });
    });

    it("should auto-cleanup after exit", async () => {
      const terminal = await terminalService.createTerminal();

      // Mock setTimeout to run immediately for testing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((callback: () => void) => callback()) as typeof setTimeout;

      try {
        // Trigger exit event
        const mockOnExit = vi.mocked(terminal.pty.onExit);
        const exitCallback = mockOnExit.mock.calls[0]?.[0];
        exitCallback?.({ exitCode: 0, signal: 1 });

        expect(terminalService.getTerminal(terminal.id)).toBeUndefined();
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    it("should cleanup all terminals", async () => {
      const terminal1 = await terminalService.createTerminal();
      const terminal2 = await terminalService.createTerminal();

      await terminalService.cleanup();

      expect(terminal1.pty.kill).toHaveBeenCalled();
      expect(terminal2.pty.kill).toHaveBeenCalled();
      expect(terminalService.getAllTerminals()).toHaveLength(0);
    });
  });

  describe("Terminal management", () => {
    it("should return terminal by id", async () => {
      const terminal = await terminalService.createTerminal();
      const found = terminalService.getTerminal(terminal.id);

      expect(found).toBe(terminal);
    });

    it("should return undefined for non-existent terminal", () => {
      const found = terminalService.getTerminal("non-existent-id");
      expect(found).toBeUndefined();
    });

    it("should return all terminals", async () => {
      const terminal1 = await terminalService.createTerminal();
      const terminal2 = await terminalService.createTerminal();

      const terminals = terminalService.getAllTerminals();
      expect(terminals).toHaveLength(2);
      expect(terminals).toContain(terminal1);
      expect(terminals).toContain(terminal2);
    });

    it("should return empty array when no terminals", () => {
      const terminals = terminalService.getAllTerminals();
      expect(terminals).toHaveLength(0);
    });

    it("should return only active terminals", async () => {
      const terminal1 = await terminalService.createTerminal();
      const terminal2 = await terminalService.createTerminal();

      // Destroy one terminal
      await terminalService.destroyTerminal(terminal2.id);

      const activeTerminals = terminalService.getActiveTerminals();
      expect(activeTerminals).toHaveLength(1);
      expect(activeTerminals[0]).toBe(terminal1);
    });

    it("should return correct statistics", async () => {
      const terminal1 = await terminalService.createTerminal();
      const terminal2 = await terminalService.createTerminal();

      // Destroy one terminal to test stats
      await terminalService.destroyTerminal(terminal2.id);

      const stats = terminalService.getTerminalStats();

      expect(stats.total).toBe(1); // Only one left after destruction
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(0);
      expect(stats.processes).toHaveLength(1);
      expect(stats.processes[0]).toEqual({
        id: terminal1.id,
        pid: 1234,
        isActive: true,
        createdAt: expect.any(Date),
      });
    });
  });

  describe("Event handling", () => {
    it("should register and remove event handlers", async () => {
      const terminal = await terminalService.createTerminal();
      const handler = vi.fn();

      terminalService.onTerminalEvent(terminal.id, handler);
      terminalService.offTerminalEvent(terminal.id);

      // Trigger data event - should not call handler after removal
      const mockOnData = vi.mocked(terminal.pty.onData);
      const dataCallback = mockOnData.mock.calls[0]?.[0];
      dataCallback?.("test output");

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Error handling with real logger integration", () => {
    it("should handle and log write errors properly", async () => {
      const terminal = await terminalService.createTerminal();

      // Make the actual pty.write throw an error
      const mockWrite = vi.fn(() => {
        throw new Error("Write operation failed");
      });
      terminal.pty.write = mockWrite;

      const success = terminalService.writeToTerminal(terminal.id, "ls -la\r");

      expect(success).toBe(false);
      // Logger is real, not mocked - it will actually log the error
    });

    it("should handle and log resize errors properly", async () => {
      const terminal = await terminalService.createTerminal();

      // Make the actual pty.resize throw an error
      const mockResize = vi.fn(() => {
        throw new Error("Resize operation failed");
      });
      terminal.pty.resize = mockResize;

      const success = terminalService.resizeTerminal(terminal.id, 120, 30);

      expect(success).toBe(false);
      // Logger is real, not mocked - it will actually log the error
    });

    it("should handle and log destruction errors properly", async () => {
      const terminal = await terminalService.createTerminal();

      // Make the actual pty.kill throw an error
      const mockKill = vi.fn(() => {
        throw new Error("Kill operation failed");
      });
      terminal.pty.kill = mockKill;

      const success = await terminalService.destroyTerminal(terminal.id);

      expect(success).toBe(false);
      // Logger is real, not mocked - it will actually log the error
    });
  });
});

// Integration tests that test real interaction between components
describe("TerminalService Integration", () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    terminalService = new TerminalService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    terminalService.cleanup();
  });

  describe("User Journey: Complete terminal lifecycle", () => {
    it("should handle full terminal creation, usage, and cleanup flow", async () => {
      // User creates a terminal
      const terminal = await terminalService.createTerminal({
        cols: 120,
        rows: 40,
        cwd: "/home/user",
        shell: "/bin/bash",
      });

      expect(terminal.isActive).toBe(true);
      expect(terminal.metadata.cols).toBe(120);
      expect(terminal.metadata.rows).toBe(40);

      // User resizes the terminal
      const resizeSuccess = terminalService.resizeTerminal(terminal.id, 80, 24);
      expect(resizeSuccess).toBe(true);
      expect(terminal.metadata.cols).toBe(80);
      expect(terminal.metadata.rows).toBe(24);

      // User types commands
      const writeSuccess = terminalService.writeToTerminal(terminal.id, "ls -la\r");
      expect(writeSuccess).toBe(true);

      // Check terminal stats
      const stats = terminalService.getTerminalStats();
      expect(stats.total).toBe(1);
      expect(stats.active).toBe(1);

      // User closes the terminal
      const destroySuccess = await terminalService.destroyTerminal(terminal.id);
      expect(destroySuccess).toBe(true);

      // Verify cleanup
      expect(terminalService.getTerminal(terminal.id)).toBeUndefined();
      const finalStats = terminalService.getTerminalStats();
      expect(finalStats.total).toBe(0);
    });

    it("should handle multiple terminals independently", async () => {
      // User opens multiple terminals
      const terminal1 = await terminalService.createTerminal({ cwd: "/home/user1" });
      const terminal2 = await terminalService.createTerminal({ cwd: "/home/user2" });

      expect(terminalService.getAllTerminals()).toHaveLength(2);

      // User works with each terminal independently
      const write1Success = terminalService.writeToTerminal(terminal1.id, "pwd\r");
      const write2Success = terminalService.writeToTerminal(terminal2.id, "ls\r");

      expect(write1Success).toBe(true);
      expect(write2Success).toBe(true);

      // User closes one terminal
      await terminalService.destroyTerminal(terminal1.id);

      expect(terminalService.getAllTerminals()).toHaveLength(1);
      expect(terminalService.getTerminal(terminal2.id)).toBe(terminal2);

      // Cleanup remaining terminal
      await terminalService.destroyTerminal(terminal2.id);
      expect(terminalService.getAllTerminals()).toHaveLength(0);
    });
  });
});