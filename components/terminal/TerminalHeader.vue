<template>
  <div class="terminal-header">
    <div class="terminal-title">
      <Icon name="i-heroicons-terminal" class="terminal-icon" />
      Terminal {{ displayTerminalId }}
    </div>
    <div class="terminal-controls">
      <button
        v-if="!isConnected"
        class="connect-button"
        :class="{ 'loading': isConnecting }"
        :disabled="isConnecting"
        @click="$emit('connect')"
      >
        <Icon v-if="isConnecting" name="i-heroicons-arrow-path" class="animate-spin" />
        <Icon v-else name="i-heroicons-play" />
        {{ isConnecting ? 'Connecting...' : 'Connect' }}
      </button>
      <button
        v-else
        class="disconnect-button"
        @click="$emit('disconnect')"
      >
        <Icon name="i-heroicons-x-mark" />
        Disconnect
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Terminal header component
 *
 * Displays terminal title with ID and connection controls.
 * Handles user interaction events and emits them to parent.
 */

interface Props {
  isConnected: boolean;
  isConnecting: boolean;
  displayTerminalId: string;
}

interface Emits {
  connect: [];
  disconnect: [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-primary-light) 100%);
  border-bottom: 1px solid var(--color-border);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.terminal-icon {
  width: var(--spacing-lg);
  height: var(--spacing-lg);
}

.terminal-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.connect-button,
.disconnect-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.connect-button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.connect-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.connect-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.disconnect-button {
  background-color: var(--color-lavender-400);
  color: var(--color-text-on-primary);
}

.disconnect-button:hover {
  background-color: var(--color-lavender-200);
  transform: translateY(-1px);
}

.connect-button:active,
.disconnect-button:active {
  transform: translateY(0);
}
</style>