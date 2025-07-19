import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import IndexPage from "./index.vue";

// Mock $fetch for settings API calls
global.$fetch = vi.fn().mockResolvedValue({}) as unknown as typeof $fetch;

// Mock Terminal component - it has its own comprehensive tests
vi.mock("~/components/Terminal.vue", () => ({
  default: {
    name: "Terminal",
    template: '<div class="mock-terminal">Terminal Component</div>',
    props: ["autoConnect"],
  },
}));

// Mock AppButton component
vi.mock("~/components/ui/AppButton.vue", () => ({
  default: {
    name: "AppButton",
    template: '<button class="mock-app-button"><slot /></button>',
    props: ["icon", "variant", "size", "aria-label"],
    emits: ["click"],
  },
}));

// Mock ClientOnly component for testing
const ClientOnlyMock = {
  name: "ClientOnly",
  template: '<template v-if="mounted"><slot /></template><template v-else><slot name="fallback" /></template>',
  data() {
    return { mounted: false };
  },
};

beforeEach(() => {
  setActivePinia(createPinia());
});

// Helper function to mount component with welcome message visible
const mountWithWelcomeMessage = async () => {
  // Update the store to show welcome message before mounting
  const { useSettingsStore } = await import("~/stores/settings");
  const store = useSettingsStore();
  store.ui.showWelcomeMessage = true;

  const wrapper = mount(IndexPage);
  return wrapper;
};

describe("IndexPage", () => {
  it("should render page with correct title", async () => {
    const wrapper = await mountWithWelcomeMessage();

    expect(wrapper.find("h1").text()).toBe("AI Agent Manager");
    expect(wrapper.find("h2").text()).toBe("🚀 Welcome to AI Agent Manager");
  });

  it("should display application description", async () => {
    const wrapper = await mountWithWelcomeMessage();

    expect(wrapper.text()).toContain("A powerful web application for managing multiple terminal-based AI instances");
  });

  it("should render feature list", async () => {
    const wrapper = await mountWithWelcomeMessage();

    const featureItems = wrapper.findAll(".features-list-item");
    expect(featureItems).toHaveLength(4);

    const featureTexts = featureItems.map(item => item.text());
    expect(featureTexts).toContain("Multi-terminal management");
    expect(featureTexts).toContain("Git worktree integration");
    expect(featureTexts).toContain("Real-time communication");
    expect(featureTexts).toContain("Session persistence");
  });

  it("should display version and status information", async () => {
    const wrapper = await mountWithWelcomeMessage();

    expect(wrapper.text()).toContain("Version: 0.1.0");
    expect(wrapper.text()).toContain("Status: Ready");
  });

  it("should display technology stack information", () => {
    const wrapper = mount(IndexPage);

    expect(wrapper.find("footer").text()).toBe("Built with Nuxt 3, TypeScript, and vanilla-extract");
  });

  it("should have proper semantic HTML structure", () => {
    const wrapper = mount(IndexPage);

    expect(wrapper.find("header").exists()).toBe(true);
    expect(wrapper.find("main").exists()).toBe(true);
    expect(wrapper.find("footer").exists()).toBe(true);
  });

  it("should have proper heading hierarchy", async () => {
    const wrapper = await mountWithWelcomeMessage();

    const h1 = wrapper.find("h1");
    const h2 = wrapper.find("h2");

    expect(h1.exists()).toBe(true);
    expect(h2.exists()).toBe(true);
    expect(h1.text()).toBe("AI Agent Manager");
    expect(h2.text()).toBe("🚀 Welcome to AI Agent Manager");
  });

  it("should render feature description text", async () => {
    const wrapper = await mountWithWelcomeMessage();

    expect(wrapper.find(".features-text").text()).toBe("This application helps you manage multiple CLI-based AI tools with:");
  });

  it("should render application subtitle", () => {
    const wrapper = mount(IndexPage);

    expect(wrapper.find(".header-subtitle").text()).toBe("A powerful web application for managing multiple terminal-based AI instances");
  });

  it("should include Terminal component wrapped in ClientOnly", () => {
    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          ClientOnly: ClientOnlyMock,
        },
      },
    });

    // Check for terminal section container
    expect(wrapper.find(".terminal-section").exists()).toBe(true);
    // In testing environment, ClientOnly renders the fallback
    expect(wrapper.text()).toContain("Loading terminals...");
  });

  it("should have terminal section with proper styling", () => {
    const wrapper = mount(IndexPage);

    const terminalSection = wrapper.find(".terminal-section");
    expect(terminalSection.exists()).toBe(true);
    expect(terminalSection.classes()).toContain("terminal-section");
  });
});