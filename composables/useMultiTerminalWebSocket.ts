import { ref, readonly } from "vue";
import type { Ref } from "vue";
import type { WebSocketMessage, TerminalMessage } from "~/types";
import { logger } from "~/utils/logger";

/**
 * Multi-Terminal WebSocket Management
 *
 * Handles individual WebSocket connections per terminal with:
 * - Per-terminal connection lifecycle management
 * - Coordinated multi-terminal state management
 * - Git worktree working directory integration
 * - Isolated terminal input/output streams
 */

export interface TerminalConnection {
  terminalId: string;
  websocket: WebSocket | null;
  status: "connecting" | "connected" | "disconnected" | "error";
  lastActivity: Date;
  workingDirectory?: string | undefined;
  retryCount: number;
}

export interface MultiTerminalWebSocketOptions {
  terminalId: string;
  workingDirectory?: string | undefined;
  onOutput?: (output: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: TerminalConnection["status"]) => void;
  onConnected?: (terminalId: string) => void;
  onDisconnected?: () => void;
}

export interface TerminalConnectionManager {
  connection: Readonly<Ref<TerminalConnection>>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendInput: (input: string) => boolean;
  resize: (cols: number, rows: number) => boolean;
  reconnect: () => Promise<void>;
}

/**
 * Individual terminal WebSocket connection management
 */
export function useMultiTerminalWebSocket(options: MultiTerminalWebSocketOptions): TerminalConnectionManager {
  const connection = ref<TerminalConnection>({
    terminalId: options.terminalId,
    websocket: null,
    status: "disconnected",
    lastActivity: new Date(),
    workingDirectory: options.workingDirectory || undefined,
    retryCount: 0,
  });

  /**
   * Handle WebSocket connection opening
   */
  const handleConnectionOpen = () => {
    logger.info("Terminal WebSocket connected", { terminalId: options.terminalId });
    connection.value.status = "connected";
    connection.value.lastActivity = new Date();
    connection.value.retryCount = 0;

    options.onStatusChange?.(connection.value.status);

    // Request terminal creation with working directory
    const createMessage: WebSocketMessage = {
      type: "terminal-create",
      data: {
        cols: 100,
        rows: 30,
        cwd: options.workingDirectory || "/",
      },
      timestamp: new Date(),
    };

    logger.info("Sending terminal-create message", { 
      terminalId: options.terminalId, 
      message: createMessage 
    });

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    sendMessage(createMessage);
  };

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = (data: string) => {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      connection.value.lastActivity = new Date();

      switch (message.type) {
        case "terminal-created":
          if (message.terminalId) {
            logger.info("Terminal created successfully", {
              clientTerminalId: options.terminalId,
              serverTerminalId: message.terminalId,
            });
            options.onConnected?.(message.terminalId);
          }
          break;

        case "terminal-data":
          if (message.data && typeof message.data.output === "string") {
            options.onOutput?.(message.data.output);
          }
          break;

        case "terminal-exit":
          logger.info("Terminal process exited", { terminalId: options.terminalId });
          options.onOutput?.("\r\n\x1b[31mTerminal process exited\x1b[0m\r\n");
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          setTimeout(() => disconnect(), 1000);
          break;

        case "terminal-destroyed":
          logger.info("Terminal destroyed by server", { terminalId: options.terminalId });
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          disconnect();
          break;

        case "error": {
          const errorMsg = (typeof message.data?.message === "string" ? message.data.message : "Terminal error");
          logger.error("Terminal WebSocket error", {
            terminalId: options.terminalId,
            error: errorMsg,
          });
          options.onError?.(new Error(errorMsg));
          connection.value.status = "error";
          options.onStatusChange?.(connection.value.status);
          break;
        }

        default:
          logger.warn("Unknown WebSocket message type", {
            type: message.type,
            terminalId: options.terminalId,
          });
      }
    } catch (error) {
      logger.error("Failed to parse WebSocket message", {
        error,
        terminalId: options.terminalId,
        data,
      });
      options.onError?.(new Error("Invalid message format"));
    }
  };

  /**
   * Handle WebSocket errors
   */
  const handleError = (event: Event) => {
    logger.error("Terminal WebSocket error", {
      terminalId: options.terminalId,
      event,
      readyState: connection.value.websocket?.readyState,
    });
    connection.value.status = "error";
    options.onStatusChange?.(connection.value.status);
    options.onError?.(new Error("WebSocket connection error"));
  };

  /**
   * Handle WebSocket connection closing
   */
  const handleClose = (event: CloseEvent) => {
    logger.info("Terminal WebSocket closed", {
      terminalId: options.terminalId,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    connection.value.status = "disconnected";
    connection.value.websocket = null;
    options.onStatusChange?.(connection.value.status);
    options.onDisconnected?.();
  };

  /**
   * Send message to WebSocket
   */
  const sendMessage = (message: WebSocketMessage | TerminalMessage): boolean => {
    if (!connection.value.websocket || connection.value.websocket.readyState !== WebSocket.OPEN) {
      logger.warn("Cannot send message: WebSocket not connected", {
        terminalId: options.terminalId,
      });
      return false;
    }

    try {
      connection.value.websocket.send(JSON.stringify(message));
      connection.value.lastActivity = new Date();
      return true;
    } catch (error) {
      logger.error("Failed to send WebSocket message", {
        error,
        terminalId: options.terminalId,
        messageType: message.type,
      });
      return false;
    }
  };

  /**
   * Connect to WebSocket terminal service
   */
  const connect = async (): Promise<void> => {
    if (connection.value.status === "connecting" || connection.value.status === "connected") {
      logger.warn("Connect attempted while already connecting or connected", {
        terminalId: options.terminalId,
        status: connection.value.status,
      });
      return;
    }

    connection.value.status = "connecting";
    options.onStatusChange?.(connection.value.status);

    try {
      // Build WebSocket URL with terminal-specific parameters
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = new URL(`${protocol}//${window.location.host}/api/ws/terminal`);

      // Add terminal-specific parameters
      wsUrl.searchParams.set("terminalId", options.terminalId);
      if (options.workingDirectory) {
        wsUrl.searchParams.set("cwd", options.workingDirectory);
      }

      const ws = new WebSocket(wsUrl.toString());
      connection.value.websocket = ws;

      // Setup event handlers
      ws.onopen = handleConnectionOpen;
      ws.onmessage = (event) => handleMessage(event.data);
      ws.onerror = handleError;
      ws.onclose = handleClose;

      logger.info("WebSocket connection initiated", {
        terminalId: options.terminalId,
        url: wsUrl.toString(),
      });
    } catch (error) {
      logger.error("Failed to initiate WebSocket connection", {
        error,
        terminalId: options.terminalId,
      });
      connection.value.status = "error";
      options.onStatusChange?.(connection.value.status);
      options.onError?.(new Error("Failed to connect to terminal"));
    }
  };

  /**
   * Disconnect from WebSocket
   */
  const disconnect = (): void => {
    if (connection.value.websocket) {
      if (connection.value.status === "connected") {
        // Send terminal destroy message
        const destroyMessage: WebSocketMessage = {
          type: "terminal-destroy",
          terminalId: options.terminalId,
          data: {},
          timestamp: new Date(),
        };
        sendMessage(destroyMessage);
      }

      connection.value.websocket.close(1000, "Client disconnect");
      connection.value.websocket = null;
    }

    connection.value.status = "disconnected";
    options.onStatusChange?.(connection.value.status);
  };

  /**
   * Send terminal input data
   */
  const sendInput = (input: string): boolean => {
    if (connection.value.status !== "connected") {
      logger.warn("Cannot send input: terminal not connected", {
        terminalId: options.terminalId,
      });
      return false;
    }

    const message: TerminalMessage = {
      type: "terminal-data",
      terminalId: options.terminalId,
      data: { input },
      timestamp: new Date(),
    };

    return sendMessage(message);
  };

  /**
   * Send terminal resize event
   */
  const resize = (cols: number, rows: number): boolean => {
    if (connection.value.status !== "connected") {
      logger.warn("Cannot resize: terminal not connected", {
        terminalId: options.terminalId,
      });
      return false;
    }

    const message: WebSocketMessage = {
      type: "terminal-resize",
      terminalId: options.terminalId,
      data: { cols, rows },
      timestamp: new Date(),
    };

    return sendMessage(message);
  };

  /**
   * Reconnect with exponential backoff
   */
  const reconnect = async (): Promise<void> => {
    disconnect();

    connection.value.retryCount++;
    const delay = Math.min(1000 * Math.pow(2, connection.value.retryCount - 1), 10000);

    logger.info("Reconnecting terminal WebSocket", {
      terminalId: options.terminalId,
      retryCount: connection.value.retryCount,
      delay,
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    await connect();
  };

  return {
    connection: readonly(connection),
    connect,
    disconnect,
    sendInput,
    resize,
    reconnect,
  };
}

/**
 * Multi-terminal WebSocket coordination manager
 */
export function useMultiTerminalManager() {
  const connections = ref<Record<string, TerminalConnectionManager>>({});

  /**
   * Create a new terminal connection
   */
  const createConnection = (options: MultiTerminalWebSocketOptions): TerminalConnectionManager => {
    const connectionManager = useMultiTerminalWebSocket(options);
    connections.value[options.terminalId] = connectionManager;

    logger.info("Created terminal connection", { terminalId: options.terminalId });
    return connectionManager;
  };

  /**
   * Remove and disconnect a terminal connection
   */
  const removeConnection = (terminalId: string): void => {
    const connection = connections.value[terminalId];
    if (connection) {
      connection.disconnect();
      delete connections.value[terminalId];
      logger.info("Removed terminal connection", { terminalId });
    }
  };

  /**
   * Get existing connection
   */
  const getConnection = (terminalId: string): TerminalConnectionManager | undefined => {
    return connections.value[terminalId] as TerminalConnectionManager | undefined;
  };

  /**
   * Get all connection statuses
   */
  const getAllStatuses = (): Record<string, TerminalConnection["status"]> => {
    const statuses: Record<string, TerminalConnection["status"]> = {};
    for (const [terminalId, connectionManager] of Object.entries(connections.value)) {
      statuses[terminalId] = (connectionManager as unknown as TerminalConnectionManager).connection.value.status;
    }
    return statuses;
  };

  /**
   * Disconnect all terminals
   */
  const disconnectAll = (): void => {
    for (const connection of Object.values(connections.value)) {
      connection.disconnect();
    }
    connections.value = {};
    logger.info("Disconnected all terminal connections");
  };

  return {
    connections: readonly(connections),
    createConnection,
    removeConnection,
    getConnection,
    getAllStatuses,
    disconnectAll,
  };
}

export type MultiTerminalManager = ReturnType<typeof useMultiTerminalManager>;
export type MultiTerminalWebSocket = ReturnType<typeof useMultiTerminalWebSocket>;
