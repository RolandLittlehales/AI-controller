<template>
  <div class="xterminal-instance">
    <div class="terminal-header">
      <div class="terminal-info">
        <h4 class="terminal-title">{{ terminal.name }}</h4>
        <div class="terminal-meta">
          <span class="terminal-id">{{ terminal.id.split('-')[0] }}</span>
          <span
            class="connection-status"
            :class="`status-${connectionStatus}`"
          >
            {{ formatConnectionStatus(connectionStatus) }}
          </span>
          <span v-if="terminal.git?.branchName" class="branch-info">
            📋 {{ terminal.git.branchName }}
          </span>
          <span v-if="terminal.workingDirectory" class="working-dir">
            📁 {{ formatWorkingDirectory(terminal.workingDirectory) }}
          </span>
        </div>
      </div>

      <div class="terminal-controls">
        <AppButton
          icon="i-heroicons-arrow-path"
          size="sm"
          variant="secondary"
          :disabled="connectionStatus === 'connecting'"
          :loading="connectionStatus === 'connecting'"
          title="Reconnect terminal"
          @click="reconnect"
        >
          Reconnect
        </AppButton>
        <AppButton
          icon="i-heroicons-x-mark"
          size="sm"
          variant="danger"
          title="Close terminal"
          @click="showRemoveConfirmDialog = true"
        >
          Close
        </AppButton>
      </div>
    </div>

    <div
      ref="terminalContainer"
      class="terminal-container"
      :class="{ 'terminal-loading': connectionStatus === 'connecting' }"
    />

    <!-- Connection overlay for disconnected state -->
    <div v-if="connectionStatus === 'disconnected' && showDisconnectedModal" class="connection-overlay">
      <div class="overlay-content">
        <div class="overlay-body">
          <div class="overlay-icon">🔌</div>
          <h3>Terminal Disconnected</h3>
          <p>The terminal connection has been lost.</p>
        </div>
        <div class="overlay-footer">
          <AppButton variant="secondary" @click="showDisconnectedModal = false">Close</AppButton>
          <AppButton variant="primary" @click="reconnect">Reconnect</AppButton>
        </div>
      </div>
    </div>

    <!-- Error overlay -->
    <div v-if="connectionStatus === 'error' && showErrorModal" class="connection-overlay error">
      <div class="overlay-content">
        <div class="overlay-body">
          <div class="overlay-icon">⚠️</div>
          <h3>Terminal Error</h3>
          <p>Failed to connect to terminal.</p>
        </div>
        <div class="overlay-footer">
          <AppButton variant="secondary" @click="showErrorModal = false">Close</AppButton>
          <AppButton variant="primary" @click="reconnect">Try Again</AppButton>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <AppConfirmDialog
      v-model="showRemoveConfirmDialog"
      title="Close Terminal"
      message="Are you sure you want to close this terminal?"
      confirm-text="Close"
      confirm-variant="danger"
      @confirm="$emit('remove')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { BasicTerminal } from "~/stores/terminalManager";
import { useTerminalManagerStore } from "~/stores/terminalManager";
import { logger } from "~/utils/logger";
import AppButton from "~/components/ui/AppButton.vue";
import AppConfirmDialog from "~/components/ui/AppConfirmDialog.vue";

// Dynamic imports for xterm.js to avoid SSR issues
let Terminal: typeof import("@xterm/xterm").Terminal | null = null;
let FitAddon: typeof import("@xterm/addon-fit").FitAddon | null = null;

// Terminal configuration constants
const TERMINAL_CONFIG = {
  FOCUS_DELAY_MS: 100,
} as const;

interface Props {
  terminal: BasicTerminal;
}

interface Emits {
  (e: "remove"): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const terminalStore = useTerminalManagerStore();
const terminalContainer = ref<HTMLElement>();

// Terminal instance references
let xterm: import("@xterm/xterm").Terminal | null = null;
let fitAddon: import("@xterm/addon-fit").FitAddon | null = null;

// Connection status from WebSocket manager - start with connecting since terminal is being created
const connectionStatus = ref<"connecting" | "connected" | "disconnected" | "error">("connecting");

// Separate state for showing/hiding modal overlays
const showDisconnectedModal = ref(true);
const showErrorModal = ref(true);
const showRemoveConfirmDialog = ref(false);

/**
 * Initialize xterm.js libraries dynamically
 */
const initializeXTermLibraries = async () => {
  if (Terminal && FitAddon) return; // Already loaded

  try {
    // Dynamic imports to avoid SSR issues
    const [terminalModule, fitAddonModule] = await Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]);

    ({ Terminal } = terminalModule);
    ({ FitAddon } = fitAddonModule);

    // Import CSS dynamically
    await import("@xterm/xterm/css/xterm.css");
  } catch (error) {
    logger.error("Failed to load xterm.js libraries", { error });
    throw error;
  }
};

/**
 * Initialize the terminal instance
 */
const initializeTerminal = async (): Promise<void> => {
  if (!terminalContainer.value || xterm) return;

  try {
    await initializeXTermLibraries();

    // Create xterm instance with our theme
    if (!Terminal) {
      throw new Error("Terminal class not loaded");
    }
    xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
      theme: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        cursor: "#c0caf5",
        selectionBackground: "#33467C",
        black: "#15161E",
        red: "#f7768e",
        green: "#9ece6a",
        yellow: "#e0af68",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
        cyan: "#7dcfff",
        white: "#a9b1d6",
        brightBlack: "#414868",
        brightRed: "#f7768e",
        brightGreen: "#9ece6a",
        brightYellow: "#e0af68",
        brightBlue: "#7aa2f7",
        brightMagenta: "#bb9af7",
        brightCyan: "#7dcfff",
        brightWhite: "#c0caf5",
      },
      allowProposedApi: true,
    });

    // Add fit addon for responsive sizing
    if (!FitAddon) {
      throw new Error("FitAddon class not loaded");
    }
    fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Open terminal and fit to container
    xterm.open(terminalContainer.value);
    await nextTick();
    fitAddon.fit();

    // Focus the terminal for immediate input handling
    xterm.focus();

    // Setup input handling - send data to WebSocket
    xterm.onData((data: string) => {
      terminalStore.sendInput(props.terminal.id, data);
    });

    // Setup resize handling - send resize events to WebSocket
    xterm.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      const connection = terminalStore.webSocketManager.getConnection(props.terminal.id);
      connection?.resize(cols, rows);
    });

    // Load existing output history
    const outputHistory = terminalStore.getTerminalOutput(props.terminal.id);
    outputHistory.forEach(output => {
      if (xterm) {
        xterm.write(output);
      }
    });

    logger.info("XTerm terminal initialized successfully", { terminalId: props.terminal.id });
  } catch (error) {
    logger.error("Failed to initialize terminal", { error, terminalId: props.terminal.id });
    connectionStatus.value = "error";
  }
};

/**
 * Cleanup terminal instance
 */
const cleanupTerminal = (): void => {
  if (xterm) {
    xterm.dispose();
    xterm = null;
  }
  if (fitAddon) {
    fitAddon = null;
  }
};

/**
 * Reconnect terminal
 */
const reconnect = async (): Promise<void> => {
  try {
    connectionStatus.value = "connecting";
    // Reset modal visibility when attempting to reconnect
    showDisconnectedModal.value = true;
    showErrorModal.value = true;

    const connection = terminalStore.webSocketManager.getConnection(props.terminal.id);
    if (connection) {
      // Existing connection - use reconnect
      await connection.reconnect();
      return;
    }

    // No connection exists - recreate WebSocket connection for existing terminal
    logger.info("Recreating WebSocket connection for disconnected terminal", { terminalId: props.terminal.id });

    // Create new WebSocket connection using existing terminal data
    const newConnection = terminalStore.webSocketManager.createConnection({
      terminalId: props.terminal.id,
      workingDirectory: props.terminal.workingDirectory,
      onOutput: (output) => terminalStore.handleTerminalOutput(props.terminal.id, output),
      onError: (error) => terminalStore.handleTerminalError(props.terminal.id, error),
      onStatusChange: (status) => terminalStore.updateTerminalStatus(props.terminal.id, status),
      onConnected: (serverTerminalId) => terminalStore.handleTerminalConnected(props.terminal.id, serverTerminalId),
      onDisconnected: () => terminalStore.handleTerminalDisconnected(props.terminal.id),
    });

    // Start the connection
    await newConnection.connect();

  } catch (error) {
    logger.error("Failed to reconnect terminal", { error, terminalId: props.terminal.id });
    connectionStatus.value = "error";
    terminalStore.updateTerminalStatus(props.terminal.id, "error");
  }
};

/**
 * Format connection status for display
 */
const formatConnectionStatus = (status: string): string => {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
    default:
      return status;
  }
};

/**
 * Format working directory for display
 */
const formatWorkingDirectory = (path: string): string => {
  if (path.length > 30) {
    return "..." + path.slice(-27);
  }
  return path;
};

/**
 * Watch for connection status changes
 */
watch(
  () => {
    const connection = terminalStore.webSocketManager.getConnection(props.terminal.id);
    return connection?.connection?.value?.status || props.terminal.status;
  },
  (newStatus) => {
    connectionStatus.value = newStatus;

    // Reset modal visibility when connection is restored
    if (newStatus === "connected") {
      showDisconnectedModal.value = true;
      showErrorModal.value = true;
    }
  },
  { immediate: true },
);

/**
 * Watch for terminal output changes and write to xterm
 */
watch(
  () => {
    // Watch the output array length to trigger on new outputs
    const outputs = terminalStore.getTerminalOutput(props.terminal.id);
    return outputs.length;
  },
  (newLength, oldLength) => {
    if (!xterm || newLength <= (oldLength || 0)) return;

    // Get all outputs and write only the new ones
    const allOutputs = terminalStore.getTerminalOutput(props.terminal.id);
    const newOutputs = allOutputs.slice(oldLength || 0);

    newOutputs.forEach(output => {
      if (xterm) {
        xterm.write(output);
      }
    });
  },
  { immediate: false },
);

/**
 * Handle window resize to fit terminal
 */
const handleResize = (): void => {
  if (fitAddon && xterm) {
    try {
      fitAddon.fit();
    } catch (error) {
      logger.warn("Failed to fit terminal", { error });
    }
  }
};

// Lifecycle management
onMounted(async () => {
  await initializeTerminal();

  // Add resize listener
  window.addEventListener("resize", handleResize);

  // Focus terminal after a short delay
  setTimeout(() => {
    if (xterm) {
      xterm.focus();
    }
  }, TERMINAL_CONFIG.FOCUS_DELAY_MS);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  cleanupTerminal();
});
</script>

<style scoped>
.xterminal-instance {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.terminal-info {
  flex: 1;
}

.terminal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.terminal-meta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.terminal-id,
.connection-status,
.branch-info,
.working-dir {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
}

.terminal-id {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.connection-status.status-connecting {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.connection-status.status-connected {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.connection-status.status-disconnected,
.connection-status.status-error {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.branch-info {
  background-color: var(--color-info-light);
  color: var(--color-info-dark);
}

.working-dir {
  background-color: var(--color-muted);
  color: var(--color-text-secondary);
}

.terminal-controls {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.terminal-container {
  flex: 1;
  position: relative;
  background-color: #1a1b26;
  overflow: hidden;
}

.terminal-loading {
  background-image:
    linear-gradient(
      45deg,
      transparent 25%,
      rgba(255, 255, 255, 0.02) 25%,
      rgba(255, 255, 255, 0.02) 50%,
      transparent 50%,
      transparent 75%,
      rgba(255, 255, 255, 0.02) 75%
    );
  background-size: 20px 20px;
  animation: loading-stripes 1s linear infinite;
}

@keyframes loading-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

.connection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 27, 38, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.connection-overlay.error {
  background-color: rgba(26, 27, 38, 0.98);
}

.overlay-content {
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
}

.overlay-body {
  text-align: center;
  padding: var(--spacing-xl);
}

.overlay-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.overlay-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.overlay-content h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.overlay-content p {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .terminal-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .terminal-controls {
    justify-content: flex-end;
  }

  .terminal-meta {
    order: -1;
  }

  .working-dir {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>