import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppButton from "./AppButton.vue";

// Mock Icon component for testing
const IconMock = {
  name: "Icon",
  template: '<span class="mock-icon" :data-name="name"></span>',
  props: ["name"],
};

// Helper function to mount AppButton with proper stubs
const mountAppButton = (options = {}) => {
  return mount(AppButton, {
    global: {
      stubs: {
        Icon: IconMock,
      },
    },
    ...options,
  });
};

describe("AppButton", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const wrapper = mountAppButton();

      expect(wrapper.find("button").exists()).toBe(true);
      expect(wrapper.find("button").attributes("type")).toBe("button");
      expect(wrapper.find("button").classes()).toContain("app-button");
      expect(wrapper.find("button").classes()).toContain("app-button--primary");
      expect(wrapper.find("button").classes()).toContain("app-button--sm");
    });

    it("should render with slot content", () => {
      const wrapper = mountAppButton({
        slots: {
          default: "Click me",
        },
      });

      expect(wrapper.text()).toContain("Click me");
    });
  });

  describe("Props and Variants", () => {
    it("should apply variant classes correctly", () => {
      const primaryWrapper = mountAppButton({ props: { variant: "primary" } });
      const secondaryWrapper = mountAppButton({ props: { variant: "secondary" } });
      const dangerWrapper = mountAppButton({ props: { variant: "danger" } });

      expect(primaryWrapper.find("button").classes()).toContain("app-button--primary");
      expect(secondaryWrapper.find("button").classes()).toContain("app-button--secondary");
      expect(dangerWrapper.find("button").classes()).toContain("app-button--danger");
    });

    it("should apply size classes correctly", () => {
      const xsWrapper = mountAppButton({ props: { size: "xs" } });
      const lgWrapper = mountAppButton({ props: { size: "lg" } });

      expect(xsWrapper.find("button").classes()).toContain("app-button--xs");
      expect(lgWrapper.find("button").classes()).toContain("app-button--lg");
    });

    it("should apply block class when block prop is true", () => {
      const wrapper = mountAppButton({ props: { block: true } });

      expect(wrapper.find("button").classes()).toContain("app-button--block");
    });

    it("should set custom type attribute", () => {
      const wrapper = mountAppButton({ props: { type: "submit" } });

      expect(wrapper.find("button").attributes("type")).toBe("submit");
    });
  });

  describe("Icon Handling", () => {
    it("should render leading and trailing icons", () => {
      const wrapper = mountAppButton({
        props: {
          icon: "i-heroicons-plus",
          trailingIcon: "i-heroicons-arrow-right",
        },
      });

      const leadingIcon = wrapper.find('[data-name="i-heroicons-plus"]');
      const trailingIcon = wrapper.find('[data-name="i-heroicons-arrow-right"]');

      expect(leadingIcon.exists()).toBe(true);
      expect(trailingIcon.exists()).toBe(true);
      expect(leadingIcon.classes()).toContain("button-icon");
      expect(trailingIcon.classes()).toContain("button-icon--trailing");
    });

    it("should not render icons when props are null", () => {
      const wrapper = mountAppButton({
        props: {
          icon: null,
          trailingIcon: null,
        },
      });

      const icons = wrapper.findAll(".button-icon");
      expect(icons).toHaveLength(0);
    });
  });

  describe("Loading State", () => {
    it("should handle loading state correctly", () => {
      const wrapper = mountAppButton({
        props: {
          loading: true,
          icon: "i-heroicons-plus",
        },
      });

      expect(wrapper.find("button").classes()).toContain("app-button--loading");
      expect(wrapper.find("button").classes()).toContain("app-button--disabled");
      expect(wrapper.find("button").attributes("disabled")).toBeDefined();

      // Should show loading spinner and hide regular icon
      expect(wrapper.find(".button-loading").exists()).toBe(true);
      expect(wrapper.find('[data-name="i-heroicons-arrow-path"]').exists()).toBe(true);
      expect(wrapper.find('[data-name="i-heroicons-plus"]').exists()).toBe(false);
    });
  });

  describe("Disabled State", () => {
    it("should handle disabled state correctly", () => {
      const wrapper = mountAppButton({
        props: {
          disabled: true,
        },
      });

      expect(wrapper.find("button").classes()).toContain("app-button--disabled");
      expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    });
  });

  describe("Event Handling", () => {
    it("should emit click event when clicked", async () => {
      const wrapper = mountAppButton();

      await wrapper.find("button").trigger("click");

      const clickEvents = wrapper.emitted("click");
      expect(clickEvents).toBeTruthy();
      expect(clickEvents).toHaveLength(1);

      // Verify the event payload
      expect(clickEvents?.[0]).toHaveLength(1);
      expect(clickEvents?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    });

    it("should not emit click event when disabled or loading", async () => {
      const disabledWrapper = mountAppButton({ props: { disabled: true } });
      const loadingWrapper = mountAppButton({ props: { loading: true } });

      await disabledWrapper.find("button").trigger("click");
      await loadingWrapper.find("button").trigger("click");

      expect(disabledWrapper.emitted("click")).toBeFalsy();
      expect(loadingWrapper.emitted("click")).toBeFalsy();
    });
  });

  describe("Accessibility", () => {
    it("should support accessibility attributes", () => {
      const wrapper = mountAppButton({
        attrs: {
          "aria-label": "Custom label",
          "aria-describedby": "description-id",
        },
      });

      expect(wrapper.find("button").element.tagName).toBe("BUTTON");
      expect(wrapper.find("button").attributes("aria-label")).toBe("Custom label");
      expect(wrapper.find("button").attributes("aria-describedby")).toBe("description-id");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle all props together", () => {
      const wrapper = mountAppButton({
        props: {
          variant: "danger",
          size: "lg",
          type: "submit",
          icon: "i-heroicons-trash",
          trailingIcon: "i-heroicons-arrow-right",
          block: true,
        },
        slots: {
          default: "Delete Item",
        },
      });

      const button = wrapper.find("button");
      expect(button.classes()).toContain("app-button--danger");
      expect(button.classes()).toContain("app-button--lg");
      expect(button.classes()).toContain("app-button--block");
      expect(button.attributes("type")).toBe("submit");
      expect(wrapper.text()).toContain("Delete Item");
      expect(wrapper.find('[data-name="i-heroicons-trash"]').exists()).toBe(true);
      expect(wrapper.find('[data-name="i-heroicons-arrow-right"]').exists()).toBe(true);
    });

    it("should handle state changes reactively", async () => {
      const wrapper = mountAppButton({
        props: {
          loading: false,
          disabled: false,
        },
      });

      // Initial state
      expect(wrapper.find("button").classes()).not.toContain("app-button--loading");
      expect(wrapper.find("button").classes()).not.toContain("app-button--disabled");

      // Change to loading
      await wrapper.setProps({ loading: true });
      expect(wrapper.find("button").classes()).toContain("app-button--loading");
      expect(wrapper.find("button").classes()).toContain("app-button--disabled");

      // Change to disabled
      await wrapper.setProps({ loading: false, disabled: true });
      expect(wrapper.find("button").classes()).not.toContain("app-button--loading");
      expect(wrapper.find("button").classes()).toContain("app-button--disabled");
    });
  });

  describe("User Journey", () => {
    it("should handle complete user interaction flow", async () => {
      const wrapper = mountAppButton({
        props: {
          variant: "primary",
          icon: "i-heroicons-plus",
        },
        slots: {
          default: "Add Item",
        },
      });

      // Initial render
      expect(wrapper.text()).toContain("Add Item");
      expect(wrapper.find('[data-name="i-heroicons-plus"]').exists()).toBe(true);

      // User clicks button
      await wrapper.find("button").trigger("click");
      expect(wrapper.emitted("click")).toHaveLength(1);

      // Simulate loading state during operation
      await wrapper.setProps({ loading: true });
      expect(wrapper.find(".button-loading").exists()).toBe(true);
      expect(wrapper.find('[data-name="i-heroicons-plus"]').exists()).toBe(false);

      // Operation completes
      await wrapper.setProps({ loading: false });
      expect(wrapper.find(".button-loading").exists()).toBe(false);
      expect(wrapper.find('[data-name="i-heroicons-plus"]').exists()).toBe(true);
    });
  });
});