import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { ref } from "vue";
import ResourceMonitor from "./ResourceMonitor.vue";

// Create reactive mock refs that can be updated per test
const mockSystemInfo = ref({
  totalCores: 8,
  maxTerminals: 6,
});

const mockTerminalCount = ref(3);
const mockDetectSystemCapability = vi.fn();

// Mock the composables with reactive refs
vi.mock("~/composables/useSystemResources", () => ({
  useSystemResources: () => ({
    systemInfo: mockSystemInfo,
    detectSystemCapability: mockDetectSystemCapability,
  }),
}));

vi.mock("~/stores/terminalManager", () => ({
  useTerminalManagerStore: () => ({
    get terminalCount() {
      return mockTerminalCount.value;
    },
  }),
}));

describe("ResourceMonitor", () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset to default mock values
    mockSystemInfo.value = {
      totalCores: 8,
      maxTerminals: 6,
    };
    mockTerminalCount.value = 3;
  });

  it("should render correctly with initial state", () => {
    const wrapper = mount(ResourceMonitor);

    expect(wrapper.find(".resource-title").text()).toBe("System Resources");
    expect(wrapper.find(".resource-indicator").text()).toBe("3/6");
  });

  it("should display correct resource details", () => {
    const wrapper = mount(ResourceMonitor);

    const resourceRows = wrapper.findAll(".resource-row");
    expect(resourceRows).toHaveLength(3);

    // Check active terminals
    expect(resourceRows[0]?.find(".resource-label").text()).toBe("Active Terminals:");
    expect(resourceRows[0]?.find(".resource-value").text()).toBe("3");

    // Check available slots
    expect(resourceRows[1]?.find(".resource-label").text()).toBe("Available Slots:");
    expect(resourceRows[1]?.find(".resource-value").text()).toBe("6");

    // Check total CPU cores
    expect(resourceRows[2]?.find(".resource-label").text()).toBe("Total CPU Cores:");
    expect(resourceRows[2]?.find(".resource-value").text()).toBe("8");
  });

  it("should calculate usage percentage correctly", () => {
    const wrapper = mount(ResourceMonitor);

    // 3/6 terminals = 50%
    expect(wrapper.find(".progress-text").text()).toBe("50% of available slots");
  });

  it("should apply correct progress bar width", () => {
    const wrapper = mount(ResourceMonitor);

    const progressFill = wrapper.find(".progress-fill");
    expect(progressFill.attributes("style")).toContain("width: 50%");
  });

  it.each([
    { terminalCount: 2, usage: 33, indicatorClass: "indicator-safe", progressClass: "progress-safe", description: "low usage (33%)" },
    { terminalCount: 4, usage: 67, indicatorClass: "indicator-warning", progressClass: "progress-warning", description: "medium usage (67%)" },
    { terminalCount: 5, usage: 83, indicatorClass: "indicator-danger", progressClass: "progress-danger", description: "high usage (83%)" },
  ])("should apply correct styling for $description", async ({ terminalCount, indicatorClass, progressClass }: { terminalCount: number; indicatorClass: string; progressClass: string }) => {
    mockTerminalCount.value = terminalCount;

    const wrapper = mount(ResourceMonitor);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".resource-indicator").classes()).toContain(indicatorClass);
    expect(wrapper.find(".progress-fill").classes()).toContain(progressClass);
  });

  it("should handle zero terminals correctly", async () => {
    // Mock zero terminals
    mockTerminalCount.value = 0;

    const wrapper = mount(ResourceMonitor);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".resource-indicator").text()).toBe("0/6");
    expect(wrapper.find(".progress-text").text()).toBe("0% of available slots");
    expect(wrapper.find(".progress-fill").attributes("style")).toContain("width: 0%");
    expect(wrapper.find(".resource-indicator").classes()).toContain("indicator-safe");
  });

  it("should handle maximum terminals correctly", async () => {
    // Mock maximum terminals (6/6 = 100%)
    mockTerminalCount.value = 6;

    const wrapper = mount(ResourceMonitor);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".resource-indicator").text()).toBe("6/6");
    expect(wrapper.find(".progress-text").text()).toBe("100% of available slots");
    expect(wrapper.find(".progress-fill").attributes("style")).toContain("width: 100%");
    expect(wrapper.find(".resource-indicator").classes()).toContain("indicator-danger");
  });

  it("should handle edge case with zero max terminals", async () => {
    // Mock system with zero max terminals
    mockSystemInfo.value = {
      totalCores: 0,
      maxTerminals: 0,
    };
    mockTerminalCount.value = 0;

    const wrapper = mount(ResourceMonitor);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".progress-text").text()).toBe("0% of available slots");
    expect(wrapper.find(".progress-fill").attributes("style")).toContain("width: 0%");
  });

  it("should call detectSystemCapability on mount", () => {
    mount(ResourceMonitor);

    expect(mockDetectSystemCapability).toHaveBeenCalledOnce();
  });

  it("should have correct CSS classes structure", () => {
    const wrapper = mount(ResourceMonitor);

    // Check main container
    expect(wrapper.find(".resource-monitor").exists()).toBe(true);

    // Check header structure
    expect(wrapper.find(".resource-header").exists()).toBe(true);
    expect(wrapper.find(".resource-title").exists()).toBe(true);
    expect(wrapper.find(".resource-indicator").exists()).toBe(true);

    // Check details structure
    expect(wrapper.find(".resource-details").exists()).toBe(true);
    expect(wrapper.findAll(".resource-row")).toHaveLength(3);
    expect(wrapper.findAll(".resource-label")).toHaveLength(3);
    expect(wrapper.findAll(".resource-value")).toHaveLength(3);

    // Check progress structure
    expect(wrapper.find(".resource-progress").exists()).toBe(true);
    expect(wrapper.find(".progress-bar").exists()).toBe(true);
    expect(wrapper.find(".progress-fill").exists()).toBe(true);
    expect(wrapper.find(".progress-text").exists()).toBe(true);
  });

  it("should use monospace font for numeric values", () => {
    const wrapper = mount(ResourceMonitor);

    const indicator = wrapper.find(".resource-indicator");
    const values = wrapper.findAll(".resource-value");

    // Resource indicator should use monospace
    expect(indicator.classes()).not.toContain("font-sans");

    // Resource values should use monospace
    values.forEach(value => {
      expect(value.classes()).not.toContain("font-sans");
    });
  });

  it("should have proper accessibility structure", () => {
    const wrapper = mount(ResourceMonitor);

    // Should have proper heading structure
    const title = wrapper.find("h4");
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe("System Resources");

    // Should have descriptive labels
    const labels = wrapper.findAll(".resource-label");
    expect(labels[0]?.text()).toBe("Active Terminals:");
    expect(labels[1]?.text()).toBe("Available Slots:");
    expect(labels[2]?.text()).toBe("Total CPU Cores:");
  });

  it("should handle different system configurations", async () => {
    // Test with different system specs (like user's 20-core machine)
    mockSystemInfo.value = {
      totalCores: 20,
      maxTerminals: 15,
    };
    mockTerminalCount.value = 8;

    const wrapper = mount(ResourceMonitor);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".resource-indicator").text()).toBe("8/15");
    expect(wrapper.find(".progress-text").text()).toBe("53% of available slots");

    // Check resource details
    const resourceRows = wrapper.findAll(".resource-row");
    expect(resourceRows[0]?.find(".resource-value").text()).toBe("8");  // Active terminals
    expect(resourceRows[1]?.find(".resource-value").text()).toBe("15"); // Available slots
    expect(resourceRows[2]?.find(".resource-value").text()).toBe("20"); // Total cores
  });
});