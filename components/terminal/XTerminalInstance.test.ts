import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import XTerminalInstance from "./XTerminalInstance.vue";
import type { BasicTerminal } from "~/stores/terminalManager";

// Mock xterm.js modules
const mockTerminal = {
  open: vi.fn(),
  write: vi.fn(),
  dispose: vi.fn(),
  onData: vi.fn(),
  onResize: vi.fn(),
  focus: vi.fn(),
  loadAddon: vi.fn(),
};

const mockFitAddon = {
  fit: vi.fn(),
};

// Mock dynamic imports
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => mockTerminal),
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: vi.fn(() => mockFitAddon),
}));

vi.mock("@xterm/xterm/css/xterm.css", () => ({}));

// Mock terminal manager store
const mockTerminalStore = {
  sendInput: vi.fn(),
  getTerminalOutput: vi.fn(() => []),
  webSocketManager: {
    getConnection: vi.fn(() => ({
      connection: { value: { status: "connected" } },
      resize: vi.fn(),
      reconnect: vi.fn(),
    })),
  },
};

vi.mock("~/stores/terminalManager", () => ({
  useTerminalManagerStore: () => mockTerminalStore,
}));

// Mock AppButton component
vi.mock("~/components/ui/AppButton.vue", () => ({
  default: {
    name: "AppButton",
    template: "<button><slot /></button>",
    props: ["icon", "size", "variant", "disabled", "loading", "title"],
  },
}));

describe("XTerminalInstance", () => {
  let mockTerminal: BasicTerminal;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTerminal = {
      id: "term_123456_abcdef",
      name: "Test Terminal",
      status: "connected",
      isActive: true,
      createdAt: new Date(),
      workingDirectory: "/home/user/project",
      git: {
        hasWorktree: true,
        branchName: "feature/test",
        worktreePath: "/home/user/project/.worktrees/term_123456_abcdef",
        isTemporary: false,
      },
    };
  });

  it("should render terminal header with correct information", () => {
    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    expect(wrapper.find(".terminal-title").text()).toBe("Test Terminal");
    expect(wrapper.find(".terminal-id").text()).toBe("term_123");
    expect(wrapper.find(".branch-info").text()).toBe("📋 feature/test");
    expect(wrapper.find(".working-dir").text()).toBe("📁 /home/user/project");
  });

  it("should format connection status correctly", () => {
    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    // Should show connected status
    expect(wrapper.find(".connection-status").text()).toBe("Connected");
    expect(wrapper.find(".connection-status").classes()).toContain("status-connected");
  });

  it("should truncate long working directory paths", () => {
    const longPathTerminal = {
      ...mockTerminal,
      workingDirectory: "/very/long/path/to/some/deeply/nested/project/directory/that/should/be/truncated",
    };

    const wrapper = mount(XTerminalInstance, {
      props: { terminal: longPathTerminal },
    });

    const workingDirText = wrapper.find(".working-dir").text();
    expect(workingDirText).toContain("...");
    expect(workingDirText.length).toBeLessThanOrEqual(33); // 📁 + ... + 27 chars
  });

  it("should show reconnect and close buttons", () => {
    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    const buttons = wrapper.findAllComponents({ name: "AppButton" });
    expect(buttons).toHaveLength(2);

    // Check button contents
    expect(buttons[0]?.text()).toContain("Reconnect");
    expect(buttons[1]?.text()).toContain("Close");
  });

  it("should emit remove event when close button clicked", async () => {
    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    const closeButton = wrapper.findAllComponents({ name: "AppButton" })[1];
    await closeButton?.trigger("click");

    expect(wrapper.emitted("remove")).toHaveLength(1);
  });

  it("should call reconnect when reconnect button clicked", async () => {
    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    const reconnectButton = wrapper.findAllComponents({ name: "AppButton" })[0];
    await reconnectButton?.trigger("click");

    expect(mockTerminalStore.webSocketManager.getConnection).toHaveBeenCalledWith("term_123456_abcdef");
  });

  it("should show disconnected overlay when status is disconnected", () => {
    // Mock disconnected status
    mockTerminalStore.webSocketManager.getConnection.mockReturnValue({
      connection: { value: { status: "disconnected" } },
      resize: vi.fn(),
      reconnect: vi.fn(),
    });

    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    expect(wrapper.find(".connection-overlay").exists()).toBe(true);
    expect(wrapper.find(".overlay-content h3").text()).toBe("Terminal Disconnected");
  });

  it("should show error overlay when status is error", () => {
    // Mock error status
    mockTerminalStore.webSocketManager.getConnection.mockReturnValue({
      connection: { value: { status: "error" } },
      resize: vi.fn(),
      reconnect: vi.fn(),
    });

    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    expect(wrapper.find(".connection-overlay.error").exists()).toBe(true);
    expect(wrapper.find(".overlay-content h3").text()).toBe("Terminal Error");
  });

  it("should handle terminal without git information", () => {
    const { git: _git, ...terminalWithoutGit } = mockTerminal;
    const terminal: BasicTerminal = terminalWithoutGit;

    const wrapper = mount(XTerminalInstance, {
      props: { terminal },
    });

    expect(wrapper.find(".branch-info").exists()).toBe(false);
  });

  it("should handle terminal without working directory", () => {
    const { workingDirectory: _workingDirectory, ...terminalWithoutWorkingDir } = mockTerminal;
    const terminal: BasicTerminal = terminalWithoutWorkingDir;

    const wrapper = mount(XTerminalInstance, {
      props: { terminal },
    });

    expect(wrapper.find(".working-dir").exists()).toBe(false);
  });

  it("should disable reconnect button when connecting", () => {
    // Mock connecting status
    mockTerminalStore.webSocketManager.getConnection.mockReturnValue({
      connection: { value: { status: "connecting" } },
      resize: vi.fn(),
      reconnect: vi.fn(),
    });

    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    const reconnectButton = wrapper.findAllComponents({ name: "AppButton" })[0];
    expect(reconnectButton?.props("disabled")).toBe(true);
    expect(reconnectButton?.props("loading")).toBe(true);
  });

  it("should show loading animation when connecting", () => {
    // Mock connecting status
    mockTerminalStore.webSocketManager.getConnection.mockReturnValue({
      connection: { value: { status: "connecting" } },
      resize: vi.fn(),
      reconnect: vi.fn(),
    });

    const wrapper = mount(XTerminalInstance, {
      props: { terminal: mockTerminal },
    });

    expect(wrapper.find(".terminal-container").classes()).toContain("terminal-loading");
  });
});
