<template>
  <div v-if="!isConnected" class="terminal-status">
    <div class="status-message">
      <Icon name="i-heroicons-exclamation-triangle" />
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Terminal status display component
 *
 * Shows status messages when terminal is not connected.
 * Simple, focused component with minimal logic.
 */

interface Props {
  isConnected: boolean;
  statusMessage: string;
}

defineProps<Props>();
</script>

<style scoped>
.terminal-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border);
}

.status-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
}
</style>