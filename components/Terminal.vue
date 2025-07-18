<template>
  <div class="terminal-container">
    <TerminalHeader
      :is-connected="state.isConnected.value"
      :is-connecting="state.isConnecting.value"
      :display-terminal-id="state.displayTerminalId.value"
      @connect="handleConnect"
      @disconnect="handleDisconnect"
    />

    <TerminalStatus
      :is-connected="state.isConnected.value"
      :status-message="state.statusMessage.value"
    />

    <TerminalContent
      ref="terminalContentRef"
      :is-connected="state.isConnected.value"
      :terminal-config="terminalConfig"
      @focus="handleFocus"
      @terminal-ready="handleTerminalReady"
      @init-error="handleInitError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, readonly } from "vue";
import type { Ref } from "vue";
import { useTerminalState } from "~/composables/useTerminalState";
import type { useTerminalXterm } from "~/composables/useTerminalXterm";
import { useTerminalWebSocket } from "~/composables/useTerminalWebSocket";
import { DEFAULT_TERMINAL_CONFIG } from "~/types/terminal";
// Remove unused imports - interface defined inline
import TerminalHeader from "./terminal/TerminalHeader.vue";
import TerminalStatus from "./terminal/TerminalStatus.vue";
import TerminalContent from "./terminal/TerminalContent.vue";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal component - Hybrid refactored version
 *
 * Main orchestration component that coordinates:
 * - State management (useTerminalState)
 * - WebSocket communication (useTerminalWebSocket)
 * - xterm.js integration (useTerminalXterm)
 * - UI components (TerminalHeader, TerminalStatus, TerminalContent)
 *
 * Maintains exact same interface as original component for backwards compatibility.
 */

// Props - maintain exact same interface
interface Props {
  cwd?: string;
  rows?: number;
  cols?: number;
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cwd: "",
  rows: 30,
  cols: 100,
  autoConnect: true,
});

// Emits - maintain exact same interface
const emit = defineEmits<{
  connected: [terminalId: string];
  disconnected: [];
  error: [message: string];
}>();

// Template refs
const terminalContentRef = ref<InstanceType<typeof TerminalContent>>();

// Terminal configuration
const terminalConfig = DEFAULT_TERMINAL_CONFIG;

// Initialize composables
const state = useTerminalState();

// Create a placeholder xterm ref that will be populated from TerminalContent
const xtermRef = ref<ReturnType<typeof useTerminalXterm>>();

// Create type-safe emit wrapper
const emitWrapper = (event: string, ...args: unknown[]) => {
  if (event === "connected" && args.length === 1 && typeof args[0] === "string") {
    emit("connected", args[0]);
  } else if (event === "disconnected" && args.length === 0) {
    emit("disconnected");
  } else if (event === "error" && args.length === 1 && typeof args[0] === "string") {
    emit("error", args[0]);
  }
};

const websocket = useTerminalWebSocket(
  state,
  xtermRef as Ref<ReturnType<typeof useTerminalXterm> | undefined>,
  props,
  emitWrapper,
);

// Event handlers
const handleConnect = async () => {
  try {
    await websocket.connect();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Connection failed";
    state.setCustomError(errorMessage);
    emit("error", errorMessage);
  }
};

// Component lifecycle
onMounted(async () => {
  if (props.autoConnect) {
    await handleConnect();
  }
});

onUnmounted(() => {
  websocket.cleanup();
  // xterm cleanup is handled by TerminalContent
});

const handleDisconnect = () => {
  websocket.disconnect();
};

const handleFocus = () => {
  // Focus the terminal in TerminalContent
  if (terminalContentRef.value?.xterm) {
    terminalContentRef.value.xterm.focusTerminal();
  }
};

const handleTerminalReady = () => {
  // Get the xterm instance from the TerminalContent component
  if (terminalContentRef.value?.xterm) {
    // Set the xterm instance reference for the websocket
    xtermRef.value = terminalContentRef.value.xterm;
    websocket.setupTerminalEventHandlers();
  }
};

const handleInitError = (error: string) => {
  state.setCustomError(error);
  emit("error", error);
};

// Public methods - maintain exact same interface
const connect = async () => {
  await handleConnect();
};

const disconnect = () => {
  handleDisconnect();
};

// Expose public API - maintain exact same interface
defineExpose({
  connect,
  disconnect,
  isConnected: readonly(state.isConnected),
  terminalId: readonly(state.terminalId),
});
</script>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--terminal-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  --scrollbar-width: 8px;
}
</style>