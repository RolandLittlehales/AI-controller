<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div
          class="modal-content"
          :class="{
            'modal-sm': size === 'sm',
            'modal-md': size === 'md',
            'modal-lg': size === 'lg',
            'modal-xl': size === 'xl',
            'modal-fullscreen': size === 'fullscreen'
          }"
          @click.stop
        >
          <!-- Header -->
          <div v-if="showHeader" class="modal-header">
            <div class="modal-header-content">
              <div v-if="icon" class="modal-icon">{{ icon }}</div>
              <h2 v-if="title" class="modal-title">{{ title }}</h2>
            </div>
            <button
              v-if="showClose"
              class="modal-close"
              type="button"
              aria-label="Close modal"
              @click="handleClose"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="hasFooter" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, useSlots, onUnmounted } from "vue";

interface Props {
  modelValue: boolean;
  title?: string;
  icon?: string;
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
  showClose?: boolean;
  showHeader?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  icon: "",
  size: "md",
  showClose: true,
  showHeader: true,
  closeOnOverlay: true,
  closeOnEscape: true,
});

const emit = defineEmits<Emits>();
const slots = useSlots();

const isOpen = ref(props.modelValue);

// Check if footer slot has content
const hasFooter = computed(() => !!slots.footer);

watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue;
    if (newValue) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
);

const handleClose = (): void => {
  emit("close");
  emit("update:modelValue", false);
  isOpen.value = false;
};

const handleOverlayClick = (): void => {
  if (props.closeOnOverlay) {
    handleClose();
  }
};

// Handle escape key
const handleEscape = (e: KeyboardEvent): void => {
  if (props.closeOnEscape && e.key === "Escape" && isOpen.value) {
    handleClose();
  }
};

// Add/remove escape key listener
watch(isOpen, (value) => {
  if (value) {
    document.addEventListener("keydown", handleEscape);
  } else {
    document.removeEventListener("keydown", handleEscape);
  }
});

// Clean up on unmount
onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
  document.body.style.overflow = "";
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(26, 27, 38, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: var(--spacing-4);
}

.modal-content {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
}

/* Size variants */
.modal-sm {
  max-width: 24rem;
}

.modal-md {
  max-width: 32rem;
}

.modal-lg {
  max-width: 48rem;
}

.modal-xl {
  max-width: 64rem;
}

.modal-fullscreen {
  max-width: 100%;
  max-height: 100%;
  height: 100%;
  border-radius: 0;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.modal-icon {
  font-size: 2rem;
  line-height: 1;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: var(--color-muted);
  color: var(--color-text-primary);
}

.modal-close:active {
  transform: scale(0.95);
}

/* Body */
.modal-body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  color: var(--color-text-primary);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 200ms ease, opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content:not(.modal-fullscreen) {
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>