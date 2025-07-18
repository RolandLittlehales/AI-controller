<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Leading icon -->
    <Icon
      v-if="icon && !loading"
      :name="icon"
      class="button-icon"
    />

    <!-- Loading spinner -->
    <span v-if="loading" class="button-loading">
      <Icon
        name="i-heroicons-arrow-path"
        class="button-loading-icon"
      />
    </span>

    <!-- Button content -->
    <slot />

    <!-- Trailing icon -->
    <Icon
      v-if="trailingIcon && !loading"
      :name="trailingIcon"
      class="button-icon button-icon--trailing"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "xs" | "sm" | "md" | "lg";
type ButtonType = "button" | "submit" | "reset";

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  icon?: string | null
  trailingIcon?: string | null
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "sm",
  type: "button",
  icon: null,
  trailingIcon: null,
  loading: false,
  disabled: false,
  block: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent]
}>();

// Computed properties
const isDisabled = computed(() => props.disabled || props.loading);

const buttonClasses = computed(() => {
  const classes = [
    "app-button",
    `app-button--${props.variant}`,
    `app-button--${props.size}`,
  ];

  if (props.loading) classes.push("app-button--loading");
  if (props.block) classes.push("app-button--block");
  if (isDisabled.value) classes.push("app-button--disabled");

  return classes;
});

// Event handlers
const handleClick = (event: MouseEvent) => {
  if (!isDisabled.value) {
    emit("click", event);
  }
};
</script>

<style scoped>
/* Base button styles */
.app-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-normal);
  outline: none;
}

.app-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.app-button:active:not(.app-button--disabled) {
  transform: translateY(0);
}

/* Size modifiers */
.app-button--xs {
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.app-button--sm {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.app-button--md {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
}

.app-button--lg {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* Block modifier */
.app-button--block {
  width: 100%;
}

/* Variant styles */
.app-button--primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.app-button--primary:hover:not(.app-button--disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.app-button--secondary {
  background-color: var(--color-lavender-400);
  color: var(--color-text-on-primary);
}

.app-button--secondary:hover:not(.app-button--disabled) {
  background-color: var(--color-lavender-200);
  transform: translateY(-1px);
}

.app-button--danger {
  background-color: var(--color-error);
  color: var(--color-text-on-primary);
}

.app-button--danger:hover:not(.app-button--disabled) {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

/* State modifiers */
.app-button--disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.app-button--loading {
  color: transparent;
}

/* Icon styles */
.button-icon {
  flex-shrink: 0;
}

.button-icon--trailing {
  margin-left: auto;
}

/* Icon-only buttons */
.app-button:has(> .button-icon:only-child) {
  aspect-ratio: 1;
  padding: var(--spacing-sm);
}

.app-button--xs:has(> .button-icon:only-child) {
  padding: var(--spacing-xs);
}

.app-button--sm:has(> .button-icon:only-child) {
  padding: var(--spacing-sm);
}

.app-button--md:has(> .button-icon:only-child) {
  padding: var(--spacing-md);
}

.app-button--lg:has(> .button-icon:only-child) {
  padding: var(--spacing-lg);
}

/* Loading spinner */
.button-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-on-primary);
}

.button-loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>