<template>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="terminal-title">
        <Icon name="i-heroicons-terminal" class="terminal-icon" />
        Terminal {{ terminalId ? `(${terminalId.slice(0, 8)})` : '' }}
      </div>
      <div class="terminal-controls">
        <button
          v-if="!isConnected"
          class="connect-button"
          :class="{ 'loading': isConnecting }"
          :disabled="isConnecting"
          @click="connect"
        >
          <Icon v-if="isConnecting" name="i-heroicons-arrow-path" class="animate-spin" />
          <Icon v-else name="i-heroicons-play" />
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
        <button
          v-else
          class="disconnect-button"
          @click="disconnect"
        >
          <Icon name="i-heroicons-x-mark" />
          Disconnect
        </button>
      </div>
    </div>

    <div v-if="!isConnected" class="terminal-status">
      <div class="status-message">
        <Icon name="i-heroicons-exclamation-triangle" />
        {{ statusMessage }}
      </div>
    </div>

    <div
      ref="terminalRef"
      class="terminal-content"
      :class="{ 'terminal-disconnected': !isConnected }"
      @click="focusTerminal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, readonly } from "vue";
import type { WebSocketMessage, TerminalMessage } from "~/types";
import { logger } from "~/utils/logger";
import "@xterm/xterm/css/xterm.css";
// Simplified type definitions for xterm.js integration
interface XTerminalConstructor {
  new (config: XTermOptions): XTerminalInstance;
}

interface XTerminalInstance {
  [key: string]: unknown;
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  onResize(callback: (size: { cols: number; rows: number }) => void): void;
  focus(): void;
  loadAddon(addon: unknown): void;
}

interface XTermFitAddonConstructor {
  new (): XTermFitAddon;
}

interface XTermFitAddon {
  [key: string]: unknown;
  fit(): void;
}

interface XTermWebLinksAddonConstructor {
  new (): XTermWebLinksAddon;
}

interface XTermWebLinksAddon {
  [key: string]: unknown;
}

interface XTermOptions {
  [key: string]: unknown;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  cursorBlink?: boolean;
  cursorStyle?: string;
  theme?: Record<string, unknown>;
}

// Dynamic imports for browser-only modules
let Terminal: XTerminalConstructor;
let FitAddon: XTermFitAddonConstructor;
let WebLinksAddon: XTermWebLinksAddonConstructor;

interface Props {
  cwd?: string
  rows?: number
  cols?: number
  autoConnect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cwd: "",
  rows: 30,
  cols: 100,
  autoConnect: true,
});

const emit = defineEmits<{
  connected: [terminalId: string]
  disconnected: []
  error: [message: string]
}>();

// Terminal state
const terminalRef = ref<HTMLDivElement>();
const terminal = ref<XTerminalInstance>();
const fitAddon = ref<XTermFitAddon>();
const webLinksAddon = ref<XTermWebLinksAddon>();

// Connection state
const ws = ref<WebSocket>();
const isConnected = ref(false);
const isConnecting = ref(false);
const terminalId = ref<string>();
const statusMessage = ref("Terminal not connected");

// Terminal configuration
const terminalConfig: XTermOptions = {
  fontFamily: "Fira Code, JetBrains Mono, Monaco, Consolas, monospace",
  fontSize: 14,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: "block" as const,
  theme: {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    cursor: "#ffffff",
    selection: "#264f78",
    black: "#000000",
    red: "#cd3131",
    green: "#0dbc79",
    yellow: "#e5e510",
    blue: "#2472c8",
    magenta: "#bc3fbc",
    cyan: "#11a8cd",
    white: "#e5e5e5",
    brightBlack: "#666666",
    brightRed: "#f14c4c",
    brightGreen: "#23d18b",
    brightYellow: "#f5f543",
    brightBlue: "#3b8eea",
    brightMagenta: "#d670d6",
    brightCyan: "#29b8db",
    brightWhite: "#ffffff",
  },
};

onMounted(async () => {
  await initializeTerminal();
  if (props.autoConnect) {
    await connect();
  }
});

onUnmounted(() => {
  cleanup();
});

async function initializeTerminal() {
  if (!terminalRef.value) return;

  try {
    // Dynamic imports for browser-only modules
    if (!Terminal) {
      const xterm = await import("@xterm/xterm");
      const fitAddon = await import("@xterm/addon-fit");
      const webLinksAddon = await import("@xterm/addon-web-links");

      Terminal = xterm.Terminal as unknown as XTerminalConstructor;
      FitAddon = fitAddon.FitAddon as unknown as XTermFitAddonConstructor;
      WebLinksAddon = webLinksAddon.WebLinksAddon as unknown as XTermWebLinksAddonConstructor;
    }

    // Create terminal instance
    terminal.value = new Terminal(terminalConfig);

    // Create addons
    fitAddon.value = new FitAddon();
    webLinksAddon.value = new WebLinksAddon();

    // Load addons
    terminal.value.loadAddon(fitAddon.value);
    terminal.value.loadAddon(webLinksAddon.value);

    // Open terminal in DOM
    terminal.value.open(terminalRef.value);

    // Handle terminal input
    terminal.value.onData((data: string) => {
      if (isConnected.value && ws.value && terminalId.value) {
        const message: TerminalMessage = {
          type: "terminal-data",
          terminalId: terminalId.value,
          data: { input: data },
          timestamp: new Date(),
        };
        ws.value.send(JSON.stringify(message));
      }
    });

    // Handle resize
    terminal.value.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      if (isConnected.value && ws.value && terminalId.value) {
        const message: WebSocketMessage = {
          type: "terminal-resize",
          terminalId: terminalId.value,
          data: { cols, rows },
          timestamp: new Date(),
        };
        ws.value.send(JSON.stringify(message));
      }
    });

    // Fit terminal to container
    await nextTick();
    fitAddon.value?.fit();

    // Allow CSS to apply, then fit again to ensure proper scrollbar space
    setTimeout(() => {
      fitAddon.value?.fit();
    }, 100);

    // Focus terminal after initialization
    terminal.value.focus();

    // Handle window resize
    window.addEventListener("resize", handleWindowResize);

  } catch (error) {
    logger.error("Terminal initialization failed", error, { component: "Terminal", action: "initialize" });
    statusMessage.value = "Failed to initialize terminal";
    emit("error", "Failed to initialize terminal");
  }
}

async function connect() {
  if (isConnecting.value || isConnected.value) return;

  isConnecting.value = true;
  statusMessage.value = "Connecting...";

  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal`;

    ws.value = new WebSocket(wsUrl);

    ws.value.onopen = () => {

      // Request terminal creation
      const message: WebSocketMessage = {
        type: "terminal-create",
        data: {
          cols: props.cols,
          rows: props.rows,
          cwd: props.cwd || (typeof process !== "undefined" && process.cwd?.() || "/"),
        },
        timestamp: new Date(),
      };

      if (ws.value) {
        ws.value.send(JSON.stringify(message));
      }
    };

    ws.value.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        logger.error("Invalid WebSocket message received", error, { component: "Terminal", action: "message" });
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      isConnecting.value = false;
      statusMessage.value = "Terminal disconnected";
      emit("disconnected");
    };

    ws.value.onerror = (error) => {
      logger.error("WebSocket connection error", error, { component: "Terminal", action: "websocket" });
      isConnected.value = false;
      isConnecting.value = false;
      statusMessage.value = "Connection error";
      emit("error", "WebSocket connection error");
    };

  } catch (error) {
    logger.error("Terminal connection failed", error, { component: "Terminal", action: "connect" });
    isConnecting.value = false;
    statusMessage.value = "Failed to connect";
    emit("error", "Failed to connect to terminal");
  }
}

function disconnect() {
  if (!isConnected.value) return;

  if (ws.value && terminalId.value) {
    // Send destroy message
    const message: WebSocketMessage = {
      type: "terminal-destroy",
      terminalId: terminalId.value,
      data: {},
      timestamp: new Date(),
    };
    ws.value.send(JSON.stringify(message));
  }

  cleanup();
}

// Type guard functions for better message handling
function isTerminalCreatedMessage(message: WebSocketMessage): message is WebSocketMessage & { terminalId: string } {
  return message.type === "terminal-created" && typeof message.terminalId === "string";
}

function isTerminalDataMessage(message: WebSocketMessage): message is WebSocketMessage & { data: { output: string } } {
  return message.type === "terminal-data" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "output" in message.data &&
         typeof message.data.output === "string";
}

function isErrorMessage(message: WebSocketMessage): message is WebSocketMessage & { data: { message: string } } {
  return message.type === "error" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "message" in message.data &&
         typeof message.data.message === "string";
}

function handleWebSocketMessage(message: WebSocketMessage) {
  switch (message.type) {
    case "terminal-created":
      if (isTerminalCreatedMessage(message)) {
        isConnected.value = true;
        isConnecting.value = false;
        terminalId.value = message.terminalId;
        statusMessage.value = "Terminal connected";
        // Focus terminal after a short delay to ensure it's ready
        setTimeout(() => {
          terminal.value?.focus();
        }, 100);
        emit("connected", message.terminalId);
      }
      break;

    case "terminal-data":
      if (isTerminalDataMessage(message) && terminal.value) {
        terminal.value.write(message.data.output);
      }
      break;

    case "terminal-exit":
      terminal.value?.write("\r\n\x1b[31mTerminal process exited\x1b[0m\r\n");
      setTimeout(() => {
        disconnect();
      }, 1000);
      break;

    case "terminal-destroyed":
      disconnect();
      break;

    case "error": {
      logger.error("Terminal error received", message.data, { component: "Terminal", action: "handleMessage" });
      const errorMessage = isErrorMessage(message) ? message.data.message : "Terminal error";
      statusMessage.value = errorMessage;
      emit("error", errorMessage);
      break;
    }
  }
}

function handleWindowResize() {
  if (fitAddon.value && terminal.value) {
    fitAddon.value?.fit?.();
  }
}

function cleanup() {
  if (ws.value) {
    ws.value.close();
    ws.value = undefined;
  }

  if (terminal.value) {
    terminal.value.dispose();
    terminal.value = undefined;
  }

  window.removeEventListener("resize", handleWindowResize);

  isConnected.value = false;
  isConnecting.value = false;
  terminalId.value = undefined;
  statusMessage.value = "Terminal not connected";
}

function focusTerminal() {
  if (terminal.value && isConnected.value) {
    terminal.value.focus();
  }
}

// Public methods
defineExpose({
  connect,
  disconnect,
  isConnected: readonly(isConnected),
  terminalId: readonly(terminalId),
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

/* Ensure xterm container leaves room for scrollbar */
:deep(.xterm-screen),
:deep(.xterm-rows) {
  width: calc(100% - var(--scrollbar-width)) !important;
}

</style>