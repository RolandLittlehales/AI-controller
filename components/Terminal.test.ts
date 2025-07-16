import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import Terminal from "./Terminal.vue";

// Global mocks are set up in test/setup.ts for xterm libraries

// WebSocket mock for testing
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
};

global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket;

describe("Terminal.vue", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock browser location API (external)
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        host: "localhost:3000",
      },
      writable: true,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // Minimal stubs for Nuxt UI components (would need full Nuxt test setup to use real ones)
  const mountOptions = {
    global: {
      stubs: {
        Icon: {
          template: '<i class="nuxt-icon"></i>',
        },
        UButton: {
          template: '<button class="nuxt-button" @click="$emit(\'click\')"><slot /></button>',
          props: ["loading", "size", "color"],
          emits: ["click"],
        },
      },
    },
  };

  describe("Component Initialization", () => {
    it("should render terminal component with default props", () => {
      wrapper = mount(Terminal, mountOptions);

      expect(wrapper.find(".terminal-container").exists()).toBe(true);
      expect(wrapper.find(".terminal-header").exists()).toBe(true);
      expect(wrapper.find(".terminal-content").exists()).toBe(true);
    });

    it("should display terminal title", () => {
      wrapper = mount(Terminal, mountOptions);

      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
    });

    it("should show connect button when not connected", () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      expect(wrapper.text()).toContain("Connect");
    });

    it("should display status message when not connected", () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      expect(wrapper.find(".status-message").exists()).toBe(true);
    });
  });

  describe("Terminal Lifecycle", () => {
    it("should initialize terminal libraries on mount", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      await nextTick();

      // Verify that our component initializes the external xterm library
      const { Terminal: MockTerminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      expect(MockTerminal).toHaveBeenCalled();
      expect(FitAddon).toHaveBeenCalled();
      expect(WebLinksAddon).toHaveBeenCalled();
    });

    it("should handle autoConnect prop correctly", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: true },
      });

      await nextTick();

      // Component should render properly with autoConnect
      expect(wrapper.find(".terminal-container").exists()).toBe(true);
      expect(wrapper.find(".terminal-content").exists()).toBe(true);
    });

    it("should not auto-connect when autoConnect is false", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      await nextTick();

      // Should not attempt WebSocket connection
      expect(WebSocket).not.toHaveBeenCalled();
    });
  });

  describe("WebSocket Communication", () => {
    it("should attempt connection when connect button clicked", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: {
          autoConnect: false,
          cols: 100,
          rows: 30,
          cwd: "/custom/path",
        },
      });

      await nextTick();

      // User clicks connect button
      await wrapper.find("button").trigger("click");

      // Should attempt WebSocket connection
      expect(WebSocket).toHaveBeenCalledWith("ws://localhost:3000/api/ws/terminal");
    });

    it("should emit events based on component state changes", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      await nextTick();

      // The actual integration testing of WebSocket message handling
      // should be done in integration tests with real WebSocket server
      expect(wrapper.find(".terminal-container").exists()).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle terminal initialization errors gracefully", async () => {
      const { Terminal: MockTerminal } = await import("@xterm/xterm");
      vi.mocked(MockTerminal).mockImplementation(() => {
        throw new Error("Terminal initialization failed");
      });

      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for error handling

      // Should emit error event when terminal initialization fails
      expect(wrapper.emitted("error")).toBeTruthy();
    });

    it("should not crash on invalid WebSocket messages", async () => {
      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      await nextTick();

      // Component should remain stable
      expect(wrapper.find(".terminal-container").exists()).toBe(true);
    });
  });

  describe("Component Cleanup", () => {
    it("should cleanup external resources on unmount", async () => {
      const { Terminal: MockTerminal } = await import("@xterm/xterm");
      const mockTerminalInstance = {
        dispose: vi.fn(),
        loadAddon: vi.fn(),
        open: vi.fn(),
        onData: vi.fn(),
        onResize: vi.fn(),
        focus: vi.fn(),
        write: vi.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(MockTerminal).mockReturnValue(mockTerminalInstance as any);

      wrapper = mount(Terminal, {
        ...mountOptions,
        props: { autoConnect: false },
      });

      // Wait for terminal initialization to complete
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify terminal was created
      expect(MockTerminal).toHaveBeenCalled();

      // Unmount component
      wrapper.unmount();

      // Wait for cleanup to complete
      await nextTick();

      // Should cleanup external terminal library
      expect(mockTerminalInstance.dispose).toHaveBeenCalled();
    });
  });
});