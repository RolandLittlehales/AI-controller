<template>
  <AppModal
    v-model="isOpen"
    :title="title"
    size="sm"
    @close="handleCancel"
  >
    <p class="confirm-message">{{ message }}</p>

    <template #footer>
      <AppButton variant="secondary" @click="handleCancel">
        {{ cancelText }}
      </AppButton>
      <AppButton
        :variant="confirmVariant"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import AppButton from "./AppButton.vue";
import AppModal from "./AppModal.vue";

interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm" | "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Confirm Action",
  message: "Are you sure you want to proceed?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmVariant: "primary",
});

const emit = defineEmits<Emits>();

const isOpen = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue;
  },
);

const handleCancel = (): void => {
  emit("cancel");
  emit("update:modelValue", false);
  isOpen.value = false;
};

const handleConfirm = (): void => {
  emit("confirm");
  emit("update:modelValue", false);
  isOpen.value = false;
};
</script>

<style scoped>
.confirm-message {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}
</style>