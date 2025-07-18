import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import type { VueWrapper } from "@vue/test-utils";
import TerminalContent from "~/components/terminal/TerminalContent.vue";
import { DEFAULT_TERMINAL_CONFIG } from "~/types/terminal";

// Mock the xterm composable
const mockXterm = {
  initializeTerminal: vi.fn(),
  cleanup: vi.fn(),
  focusTerminal: vi.fn(),
};

vi.mock("~/composables/useTerminalXterm", () => ({
  useTerminalXterm: () => mockXterm,
}));

describe("TerminalContent", () => {
  let wrapper: VueWrapper<InstanceType<typeof TerminalContent>>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("rendering", () => {
    it("should render with default props", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").exists()).toBe(true);
    });

    it("should apply disconnected class when not connected", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");
    });

    it("should not apply disconnected class when connected", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").classes()).not.toContain("terminal-disconnected");
    });

    it("should have terminal container element", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").exists()).toBe(true);
    });
  });

  describe("terminal initialization", () => {
    it("should initialize terminal on mount", async () => {
      mockXterm.initializeTerminal.mockResolvedValue(undefined);

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(mockXterm.initializeTerminal).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        DEFAULT_TERMINAL_CONFIG,
      );
    });

    it("should emit terminal-ready event on successful initialization", async () => {
      mockXterm.initializeTerminal.mockResolvedValue(undefined);

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(wrapper.emitted("terminalReady")).toHaveLength(1);
    });

    it("should emit init-error event on initialization failure", async () => {
      const errorMessage = "Terminal initialization failed";
      mockXterm.initializeTerminal.mockRejectedValue(new Error(errorMessage));

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(wrapper.emitted("initError")).toHaveLength(1);
      expect(wrapper.emitted("initError")?.[0]).toEqual([errorMessage]);
    });

    it("should emit init-error when terminal initialization fails", async () => {
      // Mock the xterm initialization to fail
      mockXterm.initializeTerminal.mockRejectedValue(new Error("Terminal initialization failed"));

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(wrapper.emitted("initError")).toHaveLength(1);
      expect(wrapper.emitted("initError")?.[0]).toEqual(["Terminal initialization failed"]);
    });
  });

  describe("focus handling", () => {
    it("should emit focus event when content is clicked", async () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await wrapper.find(".terminal-content").trigger("click");

      expect(wrapper.emitted("focus")).toHaveLength(1);
    });

    it("should emit focus event when not connected", async () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await wrapper.find(".terminal-content").trigger("click");

      expect(wrapper.emitted("focus")).toHaveLength(1);
    });

    it("should expose xterm instance", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.vm.xterm).toBeDefined();
      expect(wrapper.vm.xterm).toBe(mockXterm);
    });
  });

  describe("prop validation", () => {
    it("should handle isConnected prop changes", async () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");

      await wrapper.setProps({ isConnected: true });
      expect(wrapper.find(".terminal-content").classes()).not.toContain("terminal-disconnected");

      await wrapper.setProps({ isConnected: false });
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");
    });

    it("should handle terminalConfig prop", () => {
      const customConfig = { ...DEFAULT_TERMINAL_CONFIG, fontSize: 16 };
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: customConfig,
        },
      });

      expect(wrapper.props("terminalConfig")).toEqual(customConfig);
    });
  });

  describe("lifecycle management", () => {
    it("should cleanup terminal on unmount", async () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      wrapper.unmount();

      expect(mockXterm.cleanup).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple mount/unmount cycles", () => {
      // First mount
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });
      wrapper.unmount();
      expect(mockXterm.cleanup).toHaveBeenCalledTimes(1);

      // Second mount
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });
      wrapper.unmount();
      expect(mockXterm.cleanup).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle terminal initialization errors gracefully", async () => {
      mockXterm.initializeTerminal.mockRejectedValue(new Error("Init failed"));

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(wrapper.emitted("initError")).toHaveLength(1);
      expect(wrapper.emitted("initError")?.[0]).toEqual(["Init failed"]);
    });

    it("should handle cleanup errors gracefully", () => {
      mockXterm.cleanup.mockImplementation(() => {
        throw new Error("Cleanup failed");
      });

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      // Should not throw error on unmount
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe("component integration", () => {
    it("should handle complete terminal lifecycle", async () => {
      mockXterm.initializeTerminal.mockResolvedValue(undefined);

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      // Initial state - disconnected styling
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");
      expect(mockXterm.initializeTerminal).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted("terminalReady")).toHaveLength(1);

      // Connect
      await wrapper.setProps({ isConnected: true });
      expect(wrapper.find(".terminal-content").classes()).not.toContain("terminal-disconnected");

      // Focus terminal
      await wrapper.find(".terminal-content").trigger("click");
      expect(wrapper.emitted("focus")).toHaveLength(1);

      // Disconnect
      await wrapper.setProps({ isConnected: false });
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");
    });

    it("should handle initialization failure", async () => {
      // First attempt fails
      mockXterm.initializeTerminal.mockRejectedValueOnce(new Error("Network error"));

      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      await nextTick();

      expect(wrapper.emitted("initError")).toHaveLength(1);
      expect(wrapper.emitted("initError")?.[0]).toEqual(["Network error"]);
    });
  });

  describe("exposed properties", () => {
    it("should expose xterm instance", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.vm.xterm).toBeDefined();
      expect(wrapper.vm.xterm).toBe(mockXterm);
    });

    it("should expose xterm methods through instance", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: true,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(typeof wrapper.vm.xterm.initializeTerminal).toBe("function");
      expect(typeof wrapper.vm.xterm.cleanup).toBe("function");
      expect(typeof wrapper.vm.xterm.focusTerminal).toBe("function");
    });
  });

  describe("CSS classes and styling", () => {
    it("should have proper CSS classes", () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      expect(wrapper.find(".terminal-content").exists()).toBe(true);
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-content");
    });

    it("should toggle disconnected class correctly", async () => {
      wrapper = mount(TerminalContent, {
        props: {
          isConnected: false,
          terminalConfig: DEFAULT_TERMINAL_CONFIG,
        },
      });

      // Not connected - disconnected class present
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");

      // Connected - disconnected class removed
      await wrapper.setProps({ isConnected: true });
      expect(wrapper.find(".terminal-content").classes()).not.toContain("terminal-disconnected");

      // Disconnected - disconnected class added again
      await wrapper.setProps({ isConnected: false });
      expect(wrapper.find(".terminal-content").classes()).toContain("terminal-disconnected");
    });
  });
});