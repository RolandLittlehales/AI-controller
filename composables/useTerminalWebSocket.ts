import { ref  } from "vue";
import type { Ref } from "vue";
import type { WebSocketMessage, TerminalMessage } from "~/types";
import type { TerminalProps, TerminalSize } from "~/types/terminal";
import type { TerminalState } from "./useTerminalState";
import type { TerminalXterm } from "./useTerminalXterm";
import { logger } from "~/utils/logger";

/**
 * WebSocket message type guards for better type safety
 */
const isTerminalCreatedMessage = (message: WebSocketMessage): message is WebSocketMessage & { terminalId: string } => {
  return message.type === "terminal-created" && typeof message.terminalId === "string";
};

const isTerminalDataMessage = (message: WebSocketMessage): message is WebSocketMessage & { data: { output: string } } => {
  return message.type === "terminal-data" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "output" in message.data &&
         typeof message.data.output === "string";
};

const isErrorMessage = (message: WebSocketMessage): message is WebSocketMessage & { data: { message: string } } => {
  return message.type === "error" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "message" in message.data &&
         typeof message.data.message === "string";
};

/**
 * WebSocket integration composable
 *
 * Handles WebSocket connection management, message processing,
 * and coordination between terminal state and xterm integration.
 */
export function useTerminalWebSocket(
  state: TerminalState,
  xterm: Ref<TerminalXterm | undefined>,
  props: TerminalProps,
  emit: (event: string, ...args: unknown[]) => void,
) {
  const ws = ref<WebSocket>();

  /**
   * Send WebSocket message
   */
  const sendMessage = (message: WebSocketMessage | TerminalMessage) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      logger.warn("Attempted to send message on closed WebSocket");
      return;
    }

    try {
      ws.value.send(JSON.stringify(message));
    } catch (error) {
      logger.error("Failed to send WebSocket message", error, { message });
    }
  };

  /**
   * Cleanup WebSocket connection
   */
  const cleanup = () => {
    if (ws.value) {
      ws.value.close();
      ws.value = undefined;
    }

    state.resetState();
    logger.info("WebSocket cleanup completed");
  };

  /**
   * Disconnect from WebSocket
   */
  const disconnect = () => {
    if (!state.isConnected.value) {
      logger.warn("Disconnect attempted while not connected");
      return;
    }

    if (ws.value && state.terminalId.value) {
      // Send destroy message
      const message: WebSocketMessage = {
        type: "terminal-destroy",
        terminalId: state.terminalId.value,
        data: {},
        timestamp: new Date(),
      };

      sendMessage(message);
    }

    cleanup();
  };

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "terminal-created":
        if (isTerminalCreatedMessage(message)) {
          state.setConnectionState("connected");
          state.setTerminalId(message.terminalId);

          // Focus terminal after a short delay to ensure it's ready
          setTimeout(() => {
            xterm.value?.focusTerminal();
          }, 100);

          emit("connected", message.terminalId);
          logger.info("Terminal created", { terminalId: message.terminalId });
        }
        break;

      case "terminal-data":
        if (isTerminalDataMessage(message)) {
          xterm.value?.writeData(message.data.output);
        }
        break;

      case "terminal-exit":
        xterm.value?.writeData("\r\n\x1b[31mTerminal process exited\x1b[0m\r\n");
        setTimeout(() => {
          disconnect();
        }, 1000);
        break;

      case "terminal-destroyed":
        disconnect();
        break;

      case "error": {
        const errorMessage = isErrorMessage(message) ? message.data.message : "Terminal error";
        logger.error("Terminal error received", message.data);
        state.setCustomError(errorMessage);
        emit("error", errorMessage);
        break;
      }

      default:
        logger.warn("Unknown WebSocket message type", { type: message.type });
    }
  };

  /**
   * Setup WebSocket event handlers
   */
  const setupWebSocketEventHandlers = () => {
    if (!ws.value) return;

    ws.value.onopen = () => {
      logger.info("WebSocket connected");

      // Request terminal creation
      const message: WebSocketMessage = {
        type: "terminal-create",
        data: {
          cols: props.cols || 100,
          rows: props.rows || 30,
          cwd: props.cwd || (typeof process !== "undefined" && process.cwd?.() || "/"),
        },
        timestamp: new Date(),
      };

      sendMessage(message);
    };

    ws.value.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        logger.error("Invalid WebSocket message received", error, {
          component: "Terminal",
          action: "message",
          data: event.data,
        });
      }
    };

    ws.value.onclose = () => {
      logger.info("WebSocket connection closed");
      state.setConnectionState("disconnected");
      emit("disconnected");
    };

    ws.value.onerror = (error) => {
      logger.error("WebSocket connection error", error);
      state.setCustomError("Connection error");
      emit("error", "WebSocket connection error");
    };
  };

  /**
   * Connect to WebSocket terminal service
   */
  const connect = async () => {
    if (state.isConnecting.value || state.isConnected.value) {
      logger.warn("Connect attempted while already connecting or connected");
      return;
    }

    state.setConnectionState("connecting");

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal`;

      ws.value = new WebSocket(wsUrl);

      setupWebSocketEventHandlers();

      logger.info("WebSocket connection initiated", { url: wsUrl });
    } catch (error) {
      logger.error("Failed to initiate WebSocket connection", error);
      state.setCustomError("Failed to connect to terminal");
      emit("error", "Failed to connect to terminal");
    }
  };

  /**
   * Send terminal input data
   */
  const sendTerminalData = (data: string) => {
    if (!state.isConnected.value || !state.terminalId.value) {
      logger.warn("Attempted to send terminal data while not connected");
      return;
    }

    const message: TerminalMessage = {
      type: "terminal-data",
      terminalId: state.terminalId.value,
      data: { input: data },
      timestamp: new Date(),
    };

    sendMessage(message);
  };

  /**
   * Send terminal resize event
   */
  const sendTerminalResize = (size: TerminalSize) => {
    if (!state.isConnected.value || !state.terminalId.value) {
      logger.warn("Attempted to send terminal resize while not connected");
      return;
    }

    const message: WebSocketMessage = {
      type: "terminal-resize",
      terminalId: state.terminalId.value,
      data: { cols: size.cols, rows: size.rows },
      timestamp: new Date(),
    };

    sendMessage(message);
  };

  /**
   * Setup terminal event handlers for WebSocket integration
   */
  const setupTerminalEventHandlers = () => {
    // Handle terminal input
    xterm.value?.setOnDataCallback((data: string) => {
      sendTerminalData(data);
    });

    // Handle terminal resize
    xterm.value?.setOnResizeCallback((size: TerminalSize) => {
      sendTerminalResize(size);
    });
  };

  return {
    // State
    ws,

    // Methods
    connect,
    disconnect,
    sendMessage,
    sendTerminalData,
    sendTerminalResize,
    setupTerminalEventHandlers,
    cleanup,
  };
}

export type TerminalWebSocket = ReturnType<typeof useTerminalWebSocket>;