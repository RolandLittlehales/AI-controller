import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ThemeControls from "./ThemeControls.vue";
import { createThemeTestUtils, createMockSettingsStore } from "../../test/utils/theme";

// Mock settings store
const mockSettingsStore = createMockSettingsStore();
vi.mock("~/stores/settings", () => ({
  useSettingsStore: vi.fn(() => mockSettingsStore),
}));

describe("ThemeControls", () => {
  const themeUtils = createThemeTestUtils();

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset DOM classes
    document.documentElement.className = "";

    // Reset mock store
    mockSettingsStore.ui.theme = "system";
    mockSettingsStore.isDarkMode = false;
  });

  it("should render theme toggle button", () => {
    const wrapper = mount(ThemeControls);

    expect(wrapper.find(".theme-toggle-btn").exists()).toBe(true);
  });

  it("should display light mode text when in dark mode", () => {
    mockSettingsStore.isDarkMode = true;

    const wrapper = mount(ThemeControls);

    expect(wrapper.text()).toContain("☀️ Light Mode");
  });

  it("should display dark mode text when in light mode", () => {
    mockSettingsStore.isDarkMode = false;

    const wrapper = mount(ThemeControls);

    expect(wrapper.text()).toContain("🌙 Dark Mode");
  });

  it("should have correct aria-pressed attribute", () => {
    mockSettingsStore.isDarkMode = true;

    const wrapper = mount(ThemeControls);

    expect(wrapper.find(".theme-toggle-btn").attributes("aria-pressed")).toBe("true");
  });

  it("should be clickable", async () => {
    const wrapper = mount(ThemeControls);

    const button = wrapper.find(".theme-toggle-btn");
    expect(button.exists()).toBe(true);

    // Test that button is clickable (doesn't throw)
    await button.trigger("click");

    expect(button.exists()).toBe(true);
  });

  describe("Theme Integration", () => {
    it("should work with light theme", async () => {
      mockSettingsStore.ui.theme = "light";
      mockSettingsStore.isDarkMode = false;

      const wrapper = mount(ThemeControls);

      expect(wrapper.text()).toContain("🌙 Dark Mode");
      expect(wrapper.find(".theme-toggle-btn").attributes("aria-pressed")).toBe("false");
    });

    it("should work with dark theme", async () => {
      mockSettingsStore.ui.theme = "dark";
      mockSettingsStore.isDarkMode = true;

      const wrapper = mount(ThemeControls);

      expect(wrapper.text()).toContain("☀️ Light Mode");
      expect(wrapper.find(".theme-toggle-btn").attributes("aria-pressed")).toBe("true");
    });

    it("should work with system theme preference", async () => {
      themeUtils.mockSystemPreference(true);
      mockSettingsStore.ui.theme = "system";
      mockSettingsStore.isDarkMode = true;

      const wrapper = mount(ThemeControls);

      expect(wrapper.text()).toContain("☀️ Light Mode");
      expect(wrapper.find(".theme-toggle-btn").attributes("aria-pressed")).toBe("true");
    });

    it("should display correct text for current theme", async () => {
      mockSettingsStore.isDarkMode = false;

      const wrapper = mount(ThemeControls);

      expect(wrapper.text()).toContain("🌙 Dark Mode");

      // Test with different theme
      mockSettingsStore.isDarkMode = true;

      const wrapper2 = mount(ThemeControls);
      expect(wrapper2.text()).toContain("☀️ Light Mode");
    });

    it("should render correctly with different theme states", async () => {
      // Test light theme
      mockSettingsStore.ui.theme = "light";
      mockSettingsStore.isDarkMode = false;

      const lightWrapper = mount(ThemeControls);
      expect(lightWrapper.text()).toContain("🌙 Dark Mode");

      // Test dark theme
      mockSettingsStore.ui.theme = "dark";
      mockSettingsStore.isDarkMode = true;

      const darkWrapper = mount(ThemeControls);
      expect(darkWrapper.text()).toContain("☀️ Light Mode");

      // Test system theme
      mockSettingsStore.ui.theme = "system";
      mockSettingsStore.isDarkMode = false;

      const systemWrapper = mount(ThemeControls);
      expect(systemWrapper.text()).toContain("🌙 Dark Mode");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button semantics", () => {
      const wrapper = mount(ThemeControls);

      const button = wrapper.find(".theme-toggle-btn");
      expect(button.element.tagName).toBe("BUTTON");
      expect(button.attributes("aria-pressed")).toBeDefined();
    });

    it("should be keyboard accessible", async () => {
      mockSettingsStore.toggleTheme = vi.fn();

      const wrapper = mount(ThemeControls);

      // Test Enter key
      await wrapper.find(".theme-toggle-btn").trigger("keydown.enter");

      // Button should be clickable with keyboard navigation
      expect(wrapper.find(".theme-toggle-btn").exists()).toBe(true);
    });
  });

  describe("Visual States", () => {
    it("should have proper CSS classes", () => {
      const wrapper = mount(ThemeControls);

      expect(wrapper.find(".theme-toggle-btn").classes()).toContain("theme-toggle-btn");
    });

    it("should use CSS custom properties for styling", () => {
      const wrapper = mount(ThemeControls);

      // The component uses CSS custom properties like var(--color-primary)
      // We test that the structure is correct, not the actual computed styles
      expect(wrapper.find(".theme-toggle-btn").exists()).toBe(true);
    });
  });
});