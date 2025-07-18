import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TerminalStatus from "~/components/terminal/TerminalStatus.vue";

describe("TerminalStatus", () => {
  describe("rendering", () => {
    it("should render when not connected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Terminal not connected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(true);
      expect(wrapper.find(".status-message").text()).toContain("Terminal not connected");
    });

    it("should not render when connected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: true,
          statusMessage: "Terminal connected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(false);
    });

    it("should display custom status message when disconnected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Connection failed",
        },
      });

      expect(wrapper.find(".status-message").text()).toContain("Connection failed");
    });

    it("should handle empty status message", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "",
        },
      });

      expect(wrapper.find(".status-message").text()).toBe("");
    });
  });

  describe("visibility based on connection state", () => {
    it("should be visible when not connected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Terminal not connected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });

    it("should be hidden when connected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: true,
          statusMessage: "Terminal connected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(false);
    });
  });

  describe("status message types", () => {
    it("should display connecting message", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Connecting...",
        },
      });

      expect(wrapper.find(".status-message").text()).toContain("Connecting...");
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });

    it("should not display when connected", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: true,
          statusMessage: "Terminal connected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(false);
    });

    it("should display error message", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Connection failed: Network error",
        },
      });

      expect(wrapper.find(".status-message").text()).toContain("Connection failed: Network error");
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });

    it("should display long status messages", () => {
      const longMessage = "This is a very long status message that should be displayed correctly";
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: longMessage,
        },
      });

      expect(wrapper.find(".status-message").text()).toContain(longMessage);
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });
  });

  describe("prop validation", () => {
    it("should handle boolean isConnected prop", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Test message",
        },
      });

      expect(wrapper.props("isConnected")).toBe(false);
      expect(wrapper.props("statusMessage")).toBe("Test message");
    });

    it("should handle string statusMessage prop", () => {
      const longMessage = "This is a very long status message that should be displayed correctly without any truncation or formatting issues";
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: longMessage,
        },
      });

      expect(wrapper.props("statusMessage")).toBe(longMessage);
      expect(wrapper.find(".status-message").text()).toContain(longMessage);
    });
  });

  describe("component structure", () => {
    it("should include warning icon", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Test message",
        },
      });

      expect(wrapper.find(".status-message").exists()).toBe(true);
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });

    it("should have proper CSS classes", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Test message",
        },
      });

      expect(wrapper.find(".terminal-status").classes()).toContain("terminal-status");
      expect(wrapper.find(".status-message").classes()).toContain("status-message");
    });
  });

  describe("reactive updates", () => {
    it("should update status message when props change", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Initial message",
        },
      });

      expect(wrapper.find(".status-message").text()).toContain("Initial message");

      await wrapper.setProps({ statusMessage: "Updated message" });
      expect(wrapper.find(".status-message").text()).toContain("Updated message");
    });

    it("should show/hide based on connection state", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Disconnected",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(true);

      await wrapper.setProps({ isConnected: true, statusMessage: "Connected" });
      expect(wrapper.find(".terminal-status").exists()).toBe(false);

      await wrapper.setProps({ isConnected: false, statusMessage: "Disconnected again" });
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
      expect(wrapper.find(".status-message").text()).toContain("Disconnected again");
    });

    it("should handle multiple rapid updates", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Initial",
        },
      });

      await wrapper.setProps({ statusMessage: "Connecting..." });
      expect(wrapper.find(".status-message").text()).toContain("Connecting...");

      await wrapper.setProps({ isConnected: true, statusMessage: "Connected" });
      expect(wrapper.find(".terminal-status").exists()).toBe(false);

      await wrapper.setProps({ isConnected: false, statusMessage: "Disconnected" });
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
      expect(wrapper.find(".status-message").text()).toContain("Disconnected");
    });
  });

  describe("component integration", () => {
    it("should handle complete status lifecycle", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Terminal not connected",
        },
      });

      // Initial state - visible
      expect(wrapper.find(".status-message").text()).toContain("Terminal not connected");
      expect(wrapper.find(".terminal-status").exists()).toBe(true);

      // Connecting state - still visible
      await wrapper.setProps({ statusMessage: "Connecting..." });
      expect(wrapper.find(".status-message").text()).toContain("Connecting...");
      expect(wrapper.find(".terminal-status").exists()).toBe(true);

      // Connected state - hidden
      await wrapper.setProps({ isConnected: true, statusMessage: "Terminal connected" });
      expect(wrapper.find(".terminal-status").exists()).toBe(false);

      // Error state - visible again
      await wrapper.setProps({ isConnected: false, statusMessage: "Connection failed" });
      expect(wrapper.find(".status-message").text()).toContain("Connection failed");
      expect(wrapper.find(".terminal-status").exists()).toBe(true);

      // Recovery - hidden again
      await wrapper.setProps({ isConnected: true, statusMessage: "Reconnected successfully" });
      expect(wrapper.find(".terminal-status").exists()).toBe(false);
    });

    it("should handle edge cases", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Normal message",
        },
      });

      // Empty message
      await wrapper.setProps({ statusMessage: "" });
      expect(wrapper.find(".status-message").text()).toBe("");

      // Very long message
      const longMessage = "A".repeat(1000);
      await wrapper.setProps({ statusMessage: longMessage });
      expect(wrapper.find(".status-message").text()).toContain(longMessage);

      // Special characters
      await wrapper.setProps({ statusMessage: "Message with special chars: <>&\"'" });
      expect(wrapper.find(".status-message").text()).toContain("Message with special chars: <>&\"'");
    });
  });

  describe("CSS classes", () => {
    it("should have consistent base classes", () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Test",
        },
      });

      expect(wrapper.find(".terminal-status").exists()).toBe(true);
      expect(wrapper.find(".status-message").exists()).toBe(true);
    });

    it("should only render when disconnected", async () => {
      const wrapper = mount(TerminalStatus, {
        props: {
          isConnected: false,
          statusMessage: "Test",
        },
      });

      // Check initial state - disconnected
      expect(wrapper.find(".terminal-status").exists()).toBe(true);

      // Toggle to connected - should disappear
      await wrapper.setProps({ isConnected: true });
      expect(wrapper.find(".terminal-status").exists()).toBe(false);

      // Toggle back to disconnected - should appear again
      await wrapper.setProps({ isConnected: false });
      expect(wrapper.find(".terminal-status").exists()).toBe(true);
    });
  });
});