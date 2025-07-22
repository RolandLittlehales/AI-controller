<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>

          <div class="modal-footer">
            <AppButton variant="secondary" @click="handleCancel">
              {{ cancelText }}
            </AppButton>
            <AppButton
              :variant="confirmVariant"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import AppButton from "./AppButton.vue";

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

const handleOverlayClick = (): void => {
  handleCancel();
};

const handleConfirm = (): void => {
  emit("confirm");
  emit("update:modelValue", false);
  isOpen.value = false;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: var(--spacing-4);
}

.modal-content {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
  max-width: 28rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-body {
  padding: var(--spacing-6);
  flex: 1;
  overflow-y: auto;
}

.modal-message {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.modal-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 150ms ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 150ms ease, opacity 150ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
  opacity: 0;
}
</style>