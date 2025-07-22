import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import AppConfirmDialog from "./AppConfirmDialog.vue";
import AppButton from "./AppButton.vue";

describe("AppConfirmDialog", () => {
  const defaultProps = {
    modelValue: true,
    title: "Test Title",
    message: "Test message",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmVariant: "primary" as const,
  };

  describe("rendering", () => {
    it("should render when modelValue is true", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      expect(wrapper.find(".modal-overlay").exists()).toBe(true);
      expect(wrapper.find(".modal-title").text()).toBe("Test Title");
      expect(wrapper.find(".modal-message").text()).toBe("Test message");
    });

    it("should not render when modelValue is false", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          ...defaultProps,
          modelValue: false,
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      expect(wrapper.find(".modal-overlay").exists()).toBe(false);
    });

    it("should render with default props", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          modelValue: true,
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      expect(wrapper.find(".modal-title").text()).toBe("Confirm Action");
      expect(wrapper.find(".modal-message").text()).toBe("Are you sure you want to proceed?");

      const buttons = wrapper.findAllComponents(AppButton);
      expect(buttons[0]?.text()).toBe("Cancel");
      expect(buttons[1]?.text()).toBe("Confirm");
    });

    it("should apply correct variant to confirm button", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          ...defaultProps,
          confirmVariant: "danger",
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      const buttons = wrapper.findAllComponents(AppButton);
      expect(buttons[1]?.props("variant")).toBe("danger");
    });
  });

  describe("interactions", () => {
    it("should emit confirm and update:modelValue when confirm button clicked", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      const buttons = wrapper.findAllComponents(AppButton);
      await buttons[1]?.trigger("click");

      expect(wrapper.emitted("confirm")).toHaveLength(1);
      expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });

    it("should emit cancel and update:modelValue when cancel button clicked", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      const buttons = wrapper.findAllComponents(AppButton);
      await buttons[0]?.trigger("click");

      expect(wrapper.emitted("cancel")).toHaveLength(1);
      expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });

    it("should emit cancel when overlay clicked", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      await wrapper.find(".modal-overlay").trigger("click");

      expect(wrapper.emitted("cancel")).toHaveLength(1);
      expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
    });

    it("should not close when modal content clicked", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      await wrapper.find(".modal-content").trigger("click");

      expect(wrapper.emitted("cancel")).toBeUndefined();
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });
  });

  describe("reactivity", () => {
    it("should update visibility when modelValue changes", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: {
          ...defaultProps,
          modelValue: false,
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      expect(wrapper.find(".modal-overlay").exists()).toBe(false);

      await wrapper.setProps({ modelValue: true });
      expect(wrapper.find(".modal-overlay").exists()).toBe(true);

      await wrapper.setProps({ modelValue: false });
      expect(wrapper.find(".modal-overlay").exists()).toBe(false);
    });

    it("should update content when props change", async () => {
      const wrapper = mount(AppConfirmDialog, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true,
          },
        },
      });

      await nextTick();

      await wrapper.setProps({
        title: "Updated Title",
        message: "Updated message",
      });

      expect(wrapper.find(".modal-title").text()).toBe("Updated Title");
      expect(wrapper.find(".modal-message").text()).toBe("Updated message");
    });
  });
});