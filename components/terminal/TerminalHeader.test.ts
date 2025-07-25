import { describe, it, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import TerminalHeader from "~/components/terminal/TerminalHeader.vue";

describe("TerminalHeader", () => {
  describe("rendering", () => {
    it("should render with default props", () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      expect(wrapper.find(".terminal-header").exists()).toBe(true);
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
    });

    test.each([
      {
        description: "should display terminal ID when provided",
        displayTerminalId: "abc12345",
        expectedText: "Terminal abc12345",
        shouldNotContain: undefined,
      },
      {
        description: "should display terminal without ID when empty",
        displayTerminalId: "",
        expectedText: "Terminal",
        shouldNotContain: "abc",
      },
    ])("$description", ({ displayTerminalId, expectedText, shouldNotContain }: { displayTerminalId: string; expectedText: string; shouldNotContain?: string | undefined }) => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: true,
          isConnecting: false,
          displayTerminalId,
        },
      });

      const titleText = wrapper.find(".terminal-title").text();
      expect(titleText).toContain(expectedText);

      if (shouldNotContain) {
        expect(titleText).not.toContain(shouldNotContain);
      }
    });
  });

  describe("connection states", () => {
    test.each([
      {
        description: "should show connect button when disconnected",
        isConnected: false,
        isConnecting: false,
        displayTerminalId: "",
        expectedButtonSelector: ".connect-button",
        expectedButtonText: "Connect",
        expectedDisabled: false,
      },
      {
        description: "should show disabled connect button when connecting",
        isConnected: false,
        isConnecting: true,
        displayTerminalId: "",
        expectedButtonSelector: ".connect-button",
        expectedButtonText: "Connecting...",
        expectedDisabled: true,
      },
      {
        description: "should show disconnect button when connected",
        isConnected: true,
        isConnecting: false,
        displayTerminalId: "abc12345",
        expectedButtonSelector: ".disconnect-button",
        expectedButtonText: "Disconnect",
        expectedDisabled: false,
      },
    ])("$description", ({ isConnected, isConnecting, displayTerminalId, expectedButtonSelector, expectedButtonText, expectedDisabled }: { isConnected: boolean; isConnecting: boolean; displayTerminalId: string; expectedButtonSelector: string; expectedButtonText: string; expectedDisabled: boolean }) => {
      const wrapper = mount(TerminalHeader, {
        props: { isConnected, isConnecting, displayTerminalId },
      });

      const button = wrapper.find(expectedButtonSelector);
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain(expectedButtonText);

      if (expectedDisabled) {
        expect(button.attributes("disabled")).toBeDefined();
      } else {
        expect(button.attributes("disabled")).toBeUndefined();
      }
    });
  });

  describe("event handling", () => {
    it("should emit connect event when connect button is clicked", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      const connectButton = wrapper.find(".connect-button");
      await connectButton.trigger("click");

      expect(wrapper.emitted("connect")).toHaveLength(1);
    });

    it("should emit disconnect event when disconnect button is clicked", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: true,
          isConnecting: false,
          displayTerminalId: "abc12345",
        },
      });

      const disconnectButton = wrapper.find(".disconnect-button");
      await disconnectButton.trigger("click");

      expect(wrapper.emitted("disconnect")).toHaveLength(1);
    });

    it("should not emit connect event when button is disabled", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: true,
          displayTerminalId: "",
        },
      });

      const connectButton = wrapper.find(".connect-button");
      await connectButton.trigger("click");

      // Event should not be emitted when button is disabled
      expect(wrapper.emitted("connect")).toBeUndefined();
    });
  });

  describe("prop validation", () => {
    it("should handle boolean props correctly", () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: true,
          isConnecting: false,
          displayTerminalId: "test123",
        },
      });

      expect(wrapper.props("isConnected")).toBe(true);
      expect(wrapper.props("isConnecting")).toBe(false);
      expect(wrapper.props("displayTerminalId")).toBe("test123");
    });

    it("should handle string props correctly", () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "very-long-id-that-should-be-truncated",
        },
      });

      expect(wrapper.props("displayTerminalId")).toBe("very-long-id-that-should-be-truncated");
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal very-long-id-that-should-be-truncated");
    });
  });

  describe("accessibility", () => {
    it("should have proper button attributes", () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      const connectButton = wrapper.find(".connect-button");
      expect(connectButton.attributes("type")).toBeUndefined(); // Vue doesn't add type="button" by default
    });

    it("should have proper disabled state", () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: true,
          displayTerminalId: "",
        },
      });

      const connectButton = wrapper.find(".connect-button");
      expect(connectButton.attributes("disabled")).toBeDefined();
    });

    it("should have proper button text for screen readers", () => {
      const disconnectedWrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      const connectedWrapper = mount(TerminalHeader, {
        props: {
          isConnected: true,
          isConnecting: false,
          displayTerminalId: "abc123",
        },
      });

      const connectingWrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: true,
          displayTerminalId: "",
        },
      });

      expect(disconnectedWrapper.find(".connect-button").text()).toContain("Connect");
      expect(connectedWrapper.find(".disconnect-button").text()).toContain("Disconnect");
      expect(connectingWrapper.find(".connect-button").text()).toContain("Connecting...");
    });
  });

  describe("reactive updates", () => {
    it("should update button when connection state changes", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      // Initially shows connect button
      expect(wrapper.find(".connect-button").exists()).toBe(true);
      expect(wrapper.find(".disconnect-button").exists()).toBe(false);

      // Change to connecting state
      await wrapper.setProps({ isConnecting: true });
      expect(wrapper.find(".connect-button").attributes("disabled")).toBeDefined();
      expect(wrapper.find(".connect-button").text()).toContain("Connecting...");

      // Change to connected state
      await wrapper.setProps({
        isConnected: true,
        isConnecting: false,
        displayTerminalId: "abc123",
      });
      expect(wrapper.find(".connect-button").exists()).toBe(false);
      expect(wrapper.find(".disconnect-button").exists()).toBe(true);
    });

    it("should show/hide terminal ID based on props", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      // Initially no terminal ID shown
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
      expect(wrapper.find(".terminal-title").text()).not.toContain("test123");

      // Add terminal ID
      await wrapper.setProps({ displayTerminalId: "test123" });
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal test123");

      // Remove terminal ID
      await wrapper.setProps({ displayTerminalId: "" });
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
      expect(wrapper.find(".terminal-title").text()).not.toContain("test123");
    });
  });

  describe("component integration", () => {
    it("should handle complete connection lifecycle", async () => {
      const wrapper = mount(TerminalHeader, {
        props: {
          isConnected: false,
          isConnecting: false,
          displayTerminalId: "",
        },
      });

      // Start disconnected
      expect(wrapper.find(".connect-button").text()).toContain("Connect");
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
      expect(wrapper.find(".terminal-title").text()).not.toContain("abc123");

      // Click connect
      await wrapper.find(".connect-button").trigger("click");
      expect(wrapper.emitted("connect")).toHaveLength(1);

      // Simulate connecting state
      await wrapper.setProps({ isConnecting: true });
      expect(wrapper.find(".connect-button").text()).toContain("Connecting...");
      expect(wrapper.find(".connect-button").attributes("disabled")).toBeDefined();

      // Simulate connected state
      await wrapper.setProps({
        isConnected: true,
        isConnecting: false,
        displayTerminalId: "abc123",
      });
      expect(wrapper.find(".disconnect-button").exists()).toBe(true);
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal abc123");

      // Click disconnect
      await wrapper.find(".disconnect-button").trigger("click");
      expect(wrapper.emitted("disconnect")).toHaveLength(1);

      // Simulate disconnected state
      await wrapper.setProps({
        isConnected: false,
        isConnecting: false,
        displayTerminalId: "",
      });
      expect(wrapper.find(".connect-button").exists()).toBe(true);
      expect(wrapper.find(".terminal-title").text()).toContain("Terminal");
      expect(wrapper.find(".terminal-title").text()).not.toContain("abc123");
    });
  });
});