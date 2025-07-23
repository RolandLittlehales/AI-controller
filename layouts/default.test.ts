import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import DefaultLayout from "./default.vue";

// Mock the useThemeSettings composable
vi.mock("~/composables/useSettings", () => ({
  useThemeSettings: () => ({
    isDarkMode: ref(false),
    theme: ref("system"),
    systemPreference: ref("Dark"),
    setTheme: vi.fn(),
  }),
}));

// Mock AppSidebar component
const AppSidebarMock = {
  name: "AppSidebar",
  template: '<div class="mock-sidebar">Sidebar</div>',
};

// Mock UIcon
const UIconMock = {
  name: "UIcon",
  template: '<span class="mock-icon" :data-name="name"></span>',
  props: ["name"],
};

// Mock NuxtLink
const NuxtLinkMock = {
  name: "NuxtLink",
  template: '<a :href="to"><slot /></a>',
  props: ["to"],
};

describe("DefaultLayout", () => {
  const mountComponent = (slots = {}) => {
    return mount(DefaultLayout, {
      slots,
      global: {
        stubs: {
          AppSidebar: AppSidebarMock,
          UIcon: UIconMock,
          NuxtLink: NuxtLinkMock,
        },
      },
    });
  };

  it("should render layout with slot content", () => {
    const wrapper = mountComponent({
      default: '<div class="test-content">Test Content</div>',
    });

    expect(wrapper.find(".layout-container").exists()).toBe(true);
    expect(wrapper.find(".main-content").exists()).toBe(true);
    expect(wrapper.find(".mock-sidebar").exists()).toBe(true);
    expect(wrapper.find(".test-content").exists()).toBe(true);
    expect(wrapper.text()).toContain("Test Content");
  });

  it("should render empty layout when no slot content provided", () => {
    const wrapper = mountComponent();

    expect(wrapper.find(".layout-container").exists()).toBe(true);
    expect(wrapper.find(".main-content").exists()).toBe(true);
    expect(wrapper.find(".mock-sidebar").exists()).toBe(true);
  });

  it("should have correct CSS class structure", () => {
    const wrapper = mountComponent();

    expect(wrapper.find(".layout-container").exists()).toBe(true);
    expect(wrapper.find(".main-content").exists()).toBe(true);
  });

  it("should accept multiple slot elements", () => {
    const wrapper = mountComponent({
      default: `
        <div class="header">Header</div>
        <div class="content">Content</div>
        <div class="footer">Footer</div>
      `,
    });

    expect(wrapper.find(".header").exists()).toBe(true);
    expect(wrapper.find(".content").exists()).toBe(true);
    expect(wrapper.find(".footer").exists()).toBe(true);
  });
});