<template>
  <div
    ref="terminalRef"
    class="terminal-content"
    :class="{ 'terminal-disconnected': !isConnected }"
    @click="$emit('focus')"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { XTermOptions } from "~/types/terminal";
import { useTerminalXterm } from "~/composables/useTerminalXterm";
import { DEFAULT_TERMINAL_CONFIG } from "~/types/terminal";
import { logger } from "~/utils/logger";

/**
 * Terminal content component
 *
 * Handles xterm.js DOM integration and provides the container
 * for terminal rendering. Focused solely on DOM integration
 * and lifecycle management.
 */

interface Props {
  isConnected: boolean;
  terminalConfig?: XTermOptions;
}

interface Emits {
  focus: [];
  terminalReady: [];
  initError: [error: string];
}

const props = withDefaults(defineProps<Props>(), {
  terminalConfig: () => DEFAULT_TERMINAL_CONFIG,
});

const emit = defineEmits<Emits>();

// Template ref for terminal container
const terminalRef = ref<HTMLDivElement>();

// Use terminal xterm composable
const xterm = useTerminalXterm();

// Initialize terminal on mount
onMounted(async () => {
  if (!terminalRef.value) {
    emit("initError", "Terminal container not found");
    return;
  }

  try {
    await xterm.initializeTerminal(terminalRef.value, props.terminalConfig);
    emit("terminalReady");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Terminal initialization failed";
    emit("initError", errorMessage);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  try {
    xterm.cleanup();
  } catch (error) {
    // Silently handle cleanup errors - component is being destroyed anyway
    logger.warn("Error during terminal cleanup", { error });
  }
});

// Expose xterm instance to parent
defineExpose({
  xterm,
});
</script>

<style scoped>
.terminal-content {
  flex: 1;
  min-height: 0;
  background-color: var(--terminal-bg);
  position: relative;
  padding: var(--spacing-sm);
  cursor: text;
}

.terminal-disconnected {
  opacity: 0.5;
  pointer-events: none;
}

/* Ensure xterm container leaves room for scrollbar
 * This reserves space for the terminal's vertical scrollbar to prevent content
 * from being hidden underneath it. The scrollbar width is subtracted from the
 * total width so text doesn't get cut off when the scrollbar appears.
 */
:deep(.xterm-screen),
:deep(.xterm-rows) {
  width: calc(100% - var(--scrollbar-width)) !important;
}
</style>