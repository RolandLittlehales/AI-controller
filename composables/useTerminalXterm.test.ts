import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { MockedFunction } from "vitest";
import { useTerminalXterm } from "~/composables/useTerminalXterm";
import { mockLogger } from "~/test/setup";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedAny = MockedFunction<any>;

// Mock xterm.js modules
const mockTerminal = {
  open: vi.fn(),
  loadAddon: vi.fn(),
  focus: vi.fn(),
  write: vi.fn(),
  dispose: vi.fn(),
  onData: vi.fn(),
  onResize: vi.fn(),
};

const mockFitAddon = {
  fit: vi.fn(),
};

const mockWebLinksAddon = {};

// Mock dynamic imports
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => mockTerminal),
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: vi.fn(() => mockFitAddon),
}));

vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: vi.fn(() => mockWebLinksAddon),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.addEventListener/removeEventListener
Object.defineProperty(window, "addEventListener", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, "removeEventListener", {
  value: vi.fn(),
  writable: true,
});

describe("useTerminalXterm", () => {
  let xterm: ReturnType<typeof useTerminalXterm>;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    xterm = useTerminalXterm();
    mockContainer = document.createElement("div");
    vi.clearAllMocks();
    mockLogger.warn.mockClear();
  });

  afterEach(() => {
    xterm.cleanup();
  });

  describe("initialization", () => {
    it("should initialize with empty state", () => {
      expect(xterm.terminal.value).toBeUndefined();
      expect(xterm.fitAddon.value).toBeUndefined();
      expect(xterm.webLinksAddon.value).toBeUndefined();
    });

    it("should initialize terminal successfully", async () => {
      await xterm.initializeTerminal(mockContainer);

      expect(xterm.terminal.value).toBeDefined();
      expect(xterm.fitAddon.value).toBeDefined();
      expect(xterm.webLinksAddon.value).toBeDefined();
      expect(mockTerminal.open).toHaveBeenCalledWith(mockContainer);
      expect(mockTerminal.loadAddon).toHaveBeenCalledWith(mockFitAddon);
      expect(mockTerminal.loadAddon).toHaveBeenCalledWith(mockWebLinksAddon);
      expect(mockTerminal.focus).toHaveBeenCalled();
      expect(mockFitAddon.fit).toHaveBeenCalled();
    });

    it("should throw error if container is not provided", async () => {
      await expect(xterm.initializeTerminal(null as unknown as HTMLElement)).rejects.toThrow("Container element is required");
    });

    it("should setup event handlers during initialization", async () => {
      await xterm.initializeTerminal(mockContainer);

      expect(mockTerminal.onData).toHaveBeenCalled();
      expect(mockTerminal.onResize).toHaveBeenCalled();
    });

    it("should setup resize observer during initialization", async () => {
      await xterm.initializeTerminal(mockContainer);

      expect(global.ResizeObserver).toHaveBeenCalled();
    });

    it("should setup window resize listener during initialization", async () => {
      await xterm.initializeTerminal(mockContainer);

      expect(window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });
  });

  describe("terminal operations", () => {
    beforeEach(async () => {
      await xterm.initializeTerminal(mockContainer);
    });

    it("should write data to terminal", () => {
      const testData = "Hello, terminal!";
      xterm.writeData(testData);

      expect(mockTerminal.write).toHaveBeenCalledWith(testData);
    });

    it("should handle write to uninitialized terminal gracefully", () => {
      const uninitializedXterm = useTerminalXterm();
      uninitializedXterm.writeData("test");

      // Should not throw error, just log warning
      expect(mockTerminal.write).not.toHaveBeenCalled();
    });

    it("should focus terminal", () => {
      xterm.focusTerminal();

      expect(mockTerminal.focus).toHaveBeenCalled();
    });

    it("should handle focus on uninitialized terminal gracefully", () => {
      const uninitializedXterm = useTerminalXterm();
      vi.clearAllMocks(); // Clear mocks after creating new instance
      uninitializedXterm.focusTerminal();

      // Should not throw error, just log warning
      expect(mockTerminal.focus).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith("Attempted to focus uninitialized terminal");
    });

    it("should fit terminal to container", () => {
      xterm.fitTerminal();

      expect(mockFitAddon.fit).toHaveBeenCalled();
    });

    it("should handle fit on uninitialized terminal gracefully", () => {
      const uninitializedXterm = useTerminalXterm();
      vi.clearAllMocks(); // Clear mocks after creating new instance
      uninitializedXterm.fitTerminal();

      // Should not throw error, just log warning
      expect(mockFitAddon.fit).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith("Attempted to fit terminal without fit addon");
    });
  });

  describe("event handlers", () => {
    beforeEach(async () => {
      await xterm.initializeTerminal(mockContainer);
    });

    it("should set data callback handler", () => {
      const callback = vi.fn();
      xterm.setOnDataCallback(callback);

      // Simulate xterm.js calling the data handler
      const dataHandler = mockTerminal.onData.mock.calls[0]?.[0];
      dataHandler?.("test data");

      expect(callback).toHaveBeenCalledWith("test data");
    });

    it("should set resize callback handler", () => {
      const callback = vi.fn();
      xterm.setOnResizeCallback(callback);

      // Simulate xterm.js calling the resize handler
      const resizeHandler = mockTerminal.onResize.mock.calls[0]?.[0];
      const resizeEvent = { cols: 80, rows: 24 };
      resizeHandler?.(resizeEvent);

      expect(callback).toHaveBeenCalledWith(resizeEvent);
    });

    it("should handle resize observer callback", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Simulate ResizeObserver callback
      const resizeObserver = (global.ResizeObserver as unknown as MockedAny);
      const resizeObserverCallback = resizeObserver.mock.calls?.[0]?.[0];
      if (typeof resizeObserverCallback === "function") {
        resizeObserverCallback();
      }

      expect(mockFitAddon.fit).toHaveBeenCalled();
    });

    it("should handle window resize event", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Get the resize event handler
      const addEventListenerMock = (window.addEventListener as unknown as MockedAny);
      const resizeCall = addEventListenerMock.mock.calls?.find(
        (call: unknown[]) => call[0] === "resize",
      );
      const resizeHandler = resizeCall?.[1];

      // Simulate window resize
      if (typeof resizeHandler === "function") {
        resizeHandler();
      }

      expect(mockFitAddon.fit).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle terminal initialization errors", async () => {
      // Mock Terminal constructor to throw error
      const { Terminal } = await import("@xterm/xterm");
      vi.mocked(Terminal).mockImplementationOnce(() => {
        throw new Error("Terminal initialization failed");
      });

      await expect(xterm.initializeTerminal(mockContainer)).rejects.toThrow("Terminal initialization failed");
    });

    it("should handle write errors gracefully", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Mock write to throw error
      mockTerminal.write.mockImplementationOnce(() => {
        throw new Error("Write failed");
      });

      // Should not throw error, just log it
      expect(() => xterm.writeData("test")).not.toThrow();
    });

    it("should handle focus errors gracefully", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Mock focus to throw error
      mockTerminal.focus.mockImplementationOnce(() => {
        throw new Error("Focus failed");
      });

      // Should not throw error, just log it
      expect(() => xterm.focusTerminal()).not.toThrow();
    });

    it("should handle fit errors gracefully", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Mock fit to throw error
      mockFitAddon.fit.mockImplementationOnce(() => {
        throw new Error("Fit failed");
      });

      // Should not throw error, just log it
      expect(() => xterm.fitTerminal()).not.toThrow();
    });
  });

  describe("cleanup", () => {
    it("should cleanup terminal resources", async () => {
      await xterm.initializeTerminal(mockContainer);

      xterm.cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(mockTerminal.dispose).toHaveBeenCalled();
      expect(xterm.terminal.value).toBeUndefined();
      expect(xterm.fitAddon.value).toBeUndefined();
      expect(xterm.webLinksAddon.value).toBeUndefined();
    });

    it("should cleanup resize observer", async () => {
      await xterm.initializeTerminal(mockContainer);

      const resizeObserverMock = (global.ResizeObserver as unknown as MockedAny);
      const resizeObserver = resizeObserverMock.mock.results?.[0]?.value;
      xterm.cleanup();

      if (resizeObserver && typeof resizeObserver.disconnect === "function") {
        expect(resizeObserver.disconnect).toHaveBeenCalled();
      }
    });

    it("should handle cleanup errors gracefully", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Mock dispose to throw error
      mockTerminal.dispose.mockImplementationOnce(() => {
        throw new Error("Dispose failed");
      });

      // Should not throw error, just log it
      expect(() => xterm.cleanup()).not.toThrow();
    });

    it("should handle cleanup on uninitialized terminal gracefully", () => {
      const uninitializedXterm = useTerminalXterm();

      // Should not throw error
      expect(() => uninitializedXterm.cleanup()).not.toThrow();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete terminal lifecycle", async () => {
      // Initialize
      await xterm.initializeTerminal(mockContainer);
      expect(xterm.terminal.value).toBeDefined();
      expect(mockTerminal.open).toHaveBeenCalled();
      expect(mockTerminal.focus).toHaveBeenCalled();

      // Use terminal
      xterm.writeData("test command");
      expect(mockTerminal.write).toHaveBeenCalledWith("test command");

      xterm.focusTerminal();
      expect(mockTerminal.focus).toHaveBeenCalledTimes(2); // Once during init, once manual

      xterm.fitTerminal();
      expect(mockFitAddon.fit).toHaveBeenCalledTimes(2); // Once during init, once manual

      // Cleanup
      xterm.cleanup();
      expect(mockTerminal.dispose).toHaveBeenCalled();
      expect(xterm.terminal.value).toBeUndefined();
    });

    it("should handle multiple resize events", async () => {
      await xterm.initializeTerminal(mockContainer);

      // Simulate multiple resize events
      const resizeObserverMock = (global.ResizeObserver as unknown as MockedAny);
      const resizeObserverCallback = resizeObserverMock.mock.calls?.[0]?.[0];
      const addEventListenerMock = (window.addEventListener as unknown as MockedAny);
      const windowResizeCall = addEventListenerMock.mock.calls?.find(
        (call: unknown[]) => call[0] === "resize",
      );
      const windowResizeHandler = windowResizeCall?.[1];

      if (typeof resizeObserverCallback === "function") {
        resizeObserverCallback();
      }
      if (typeof windowResizeHandler === "function") {
        windowResizeHandler();
      }
      xterm.fitTerminal();

      expect(mockFitAddon.fit).toHaveBeenCalledTimes(4); // 1 during init + 3 from events
    });

    it("should handle callback setup and execution", async () => {
      const dataCallback = vi.fn();
      const resizeCallback = vi.fn();

      await xterm.initializeTerminal(mockContainer);

      xterm.setOnDataCallback(dataCallback);
      xterm.setOnResizeCallback(resizeCallback);

      // Simulate xterm.js events
      const dataHandler = mockTerminal.onData.mock.calls[0]?.[0];
      const resizeHandler = mockTerminal.onResize.mock.calls[0]?.[0];

      dataHandler?.("input data");
      resizeHandler?.({ cols: 120, rows: 40 });

      expect(dataCallback).toHaveBeenCalledWith("input data");
      expect(resizeCallback).toHaveBeenCalledWith({ cols: 120, rows: 40 });
    });
  });
});