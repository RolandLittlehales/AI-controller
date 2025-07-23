import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import AppSidebar from "./AppSidebar.vue";

// Mock the composable
const mockSetTheme = vi.fn();
const mockTheme = {
  value: "system" as "light" | "dark" | "system",
};
const mockSystemPreference = {
  value: "Dark",
};

vi.mock("~/composables/useSettings", () => ({
  useThemeSettings: () => ({
    theme: mockTheme,
    systemPreference: mockSystemPreference,
    setTheme: mockSetTheme,
  }),
}));

// Mock NuxtLink
const NuxtLinkMock = {
  name: "NuxtLink",
  template: '<a :href="to"><slot /></a>',
  props: ["to"],
};

// Mock UIcon
const UIconMock = {
  name: "UIcon",
  template: '<span class="mock-icon" :data-name="name"></span>',
  props: ["name"],
};

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.value = "system";
    mockSystemPreference.value = "Dark";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = (props = {}) => {
    return mount(AppSidebar, {
      props,
      global: {
        stubs: {
          NuxtLink: NuxtLinkMock,
          UIcon: UIconMock,
        },
      },
    });
  };

  describe("rendering", () => {
    it("should render sidebar with correct default state", () => {
      const wrapper = mountComponent();

      expect(wrapper.find(".sidebar").exists()).toBe(true);
      expect(wrapper.find(".sidebar").classes()).toContain("collapsed");
      expect(wrapper.find(".toggle-btn").exists()).toBe(true);
      expect(wrapper.find(".sidebar-content").exists()).toBe(true);
    });

    it("should render theme switcher with correct icon and label", () => {
      const wrapper = mountComponent();

      const themeItem = wrapper.find('[data-test="theme-switcher"]');
      expect(themeItem.exists()).toBe(true);

      const themeIcon = wrapper.find('[data-name="i-heroicons-computer-desktop"]');
      expect(themeIcon.exists()).toBe(true);
    });

    it("should render terminal link", () => {
      const wrapper = mountComponent();

      const terminalLink = wrapper.find('a[href="/"]');
      expect(terminalLink.exists()).toBe(true);
      expect(terminalLink.text()).toContain("Terminal");
    });

    it("should render design system link", () => {
      const wrapper = mountComponent();

      const designLink = wrapper.find('a[href="/design-system"]');
      expect(designLink.exists()).toBe(true);
      expect(designLink.text()).toContain("Design System");
    });
  });

  describe("theme cycling", () => {
    it("should cycle through themes correctly", async () => {
      const wrapper = mountComponent();

      // Find theme switcher (first sidebar item)
      const sidebarItems = wrapper.findAll(".sidebar-item");
      expect(sidebarItems).toHaveLength(3); // Should have 3 items: theme, terminal, design system

      const themeSwitcher = sidebarItems[0]; // Theme switcher is now the first item
      expect(themeSwitcher).toBeDefined();

      // Click to cycle theme
      if (themeSwitcher) {
        await themeSwitcher.trigger("click");
      }

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("should display correct theme icons", async () => {
      // Test light theme
      mockTheme.value = "light";
      const lightWrapper = mountComponent();
      expect(lightWrapper.find('[data-name="i-heroicons-sun"]').exists()).toBe(true);

      // Test dark theme
      mockTheme.value = "dark";
      const darkWrapper = mountComponent();
      expect(darkWrapper.find('[data-name="i-heroicons-moon"]').exists()).toBe(true);

      // Test system theme
      mockTheme.value = "system";
      const systemWrapper = mountComponent();
      expect(systemWrapper.find('[data-name="i-heroicons-computer-desktop"]').exists()).toBe(true);
    });
  });

  describe("collapsible behavior", () => {
    it("should toggle collapsed state when toggle button is clicked", async () => {
      const wrapper = mountComponent();

      expect(wrapper.find(".sidebar").classes()).toContain("collapsed");

      await wrapper.find(".toggle-btn").trigger("click");

      expect(wrapper.find(".sidebar").classes()).toContain("expanded");
      expect(wrapper.find(".sidebar").classes()).not.toContain("collapsed");
    });

    it("should show correct toggle icon based on state", async () => {
      const wrapper = mountComponent();

      // Initially collapsed - should show right chevron
      expect(wrapper.find('[data-name="i-heroicons-chevron-right"]').exists()).toBe(true);

      // After clicking - should show left chevron
      await wrapper.find(".toggle-btn").trigger("click");
      expect(wrapper.find('[data-name="i-heroicons-chevron-left"]').exists()).toBe(true);
    });

    it("should have correct title attributes", async () => {
      const wrapper = mountComponent();

      expect(wrapper.find(".toggle-btn").attributes("title")).toBe("Expand sidebar");

      await wrapper.find(".toggle-btn").trigger("click");
      expect(wrapper.find(".toggle-btn").attributes("title")).toBe("Collapse sidebar");
    });
  });

  describe("hover behavior", () => {
    it("should handle mouse enter and leave events", async () => {
      const wrapper = mountComponent();

      await wrapper.find(".sidebar").trigger("mouseenter");
      await wrapper.find(".sidebar").trigger("mouseleave");

      // No errors should occur
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("accessibility", () => {
    it("should have proper button attributes", () => {
      const wrapper = mountComponent();

      const toggleBtn = wrapper.find(".toggle-btn");
      expect(toggleBtn.attributes("title")).toBeDefined();
    });

    it("should have proper ARIA attributes on theme switcher", () => {
      const wrapper = mountComponent();

      const themeSwitcher = wrapper.find('[data-test="theme-switcher"]');
      expect(themeSwitcher.attributes("role")).toBe("button");
      expect(themeSwitcher.attributes("tabindex")).toBe("0");
      expect(themeSwitcher.attributes("aria-label")).toContain("Switch theme");
      expect(themeSwitcher.attributes("aria-label")).toContain("Current: System (Dark)");
    });

    it("should have proper ARIA attributes on navigation links", () => {
      const wrapper = mountComponent();

      const terminalLink = wrapper.find('[data-test="terminal-link"]');
      expect(terminalLink.attributes("aria-label")).toBe("Go to Terminal page");

      const designLink = wrapper.find('[data-test="design-system-link"]');
      expect(designLink.attributes("aria-label")).toBe("Go to Design System page");
    });

    it("should support keyboard navigation on theme switcher", async () => {
      const wrapper = mountComponent();

      const themeSwitcher = wrapper.find('[data-test="theme-switcher"]');

      // Test Enter key
      await themeSwitcher.trigger("keydown.enter");
      expect(mockSetTheme).toHaveBeenCalledWith("light");

      mockSetTheme.mockClear();

      // Test Space key
      await themeSwitcher.trigger("keydown.space");
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("should update ARIA label when theme changes", async () => {
      mockTheme.value = "light";
      const wrapper = mountComponent();

      const themeSwitcher = wrapper.find('[data-test="theme-switcher"]');
      expect(themeSwitcher.attributes("aria-label")).toBe("Switch theme. Current: Light Theme");
    });

    it("should have data-test attributes for reliable testing", () => {
      const wrapper = mountComponent();

      expect(wrapper.find('[data-test="theme-switcher"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="terminal-link"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="design-system-link"]').exists()).toBe(true);
    });
  });
});