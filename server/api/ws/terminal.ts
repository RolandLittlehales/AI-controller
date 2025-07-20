// WebSocket handler - auto-imported by Nitro
import type { WebSocketMessage, TerminalMessage, ResizeMessage, WebSocketPeer } from "~/types";
import { terminalService } from "~/server/services/terminal";
import { logger } from "~/utils/logger";
import { randomUUID } from "crypto";

// Store WebSocket peers for each terminal with metadata
interface PeerInfo {
  peer: WebSocketPeer;
  clientTerminalId: string;
  serverTerminalId?: string;
  workingDirectory?: string | undefined;
}

const terminalPeers = new Map<string, PeerInfo>();

export default defineWebSocketHandler({
  async open(peer: WebSocketPeer) {
    // Generate secure temporary ID for peer until terminal ID is established
    const tempId = randomUUID();

    // Store temporary peer info
    terminalPeers.set(tempId, {
      peer,
      clientTerminalId: tempId,
    });

    logger.info("WebSocket connection opened, awaiting terminal ID", {
      tempId,
      totalConnections: terminalPeers.size,
    });
  },

  async message(peer: WebSocketPeer, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString()) as WebSocketMessage;

      // Find peer info for this connection
      let peerInfo: PeerInfo | undefined;
      for (const [, info] of terminalPeers.entries()) {
        if (info.peer === peer) {
          peerInfo = info;
          break;
        }
      }

      if (!peerInfo) {
        logger.error("Message from unknown peer");
        peer.send(JSON.stringify({
          type: "error",
          data: { message: "Unknown connection" },
        }));
        return;
      }

      switch (data.type) {
        case "terminal-create":
          await handleTerminalCreate(peerInfo, data);
          break;

        case "terminal-data":
          await handleTerminalInput(peerInfo, data as TerminalMessage);
          break;

        case "terminal-resize":
          await handleTerminalResize(peerInfo, data as ResizeMessage);
          break;

        case "terminal-destroy":
          await handleTerminalDestroy(peerInfo, data);
          break;

        default:
          peer.send(JSON.stringify({
            type: "error",
            data: { message: `Unknown message type: ${data.type}` },
          }));
      }
    } catch (error) {
      logger.error("WebSocket message processing failed", error, { handler: "terminal-ws" });
      peer.send(JSON.stringify({
        type: "error",
        data: { message: "Invalid message format" },
      }));
    }
  },

  async close(peer: WebSocketPeer) {
    // Find and cleanup terminals for this peer with proper error handling
    const peerEntries = Array.from(terminalPeers.entries());

    for (const [clientTerminalId, peerInfo] of peerEntries) {
      if (peerInfo.peer === peer) {
        // Remove from map first to prevent concurrent access
        terminalPeers.delete(clientTerminalId);

        try {
          if (peerInfo.serverTerminalId) {
            await terminalService.destroyTerminal(peerInfo.serverTerminalId);
          }

          logger.info("Terminal WebSocket connection closed successfully", {
            clientTerminalId,
            serverTerminalId: peerInfo.serverTerminalId,
            totalConnections: terminalPeers.size,
          });
        } catch (error) {
          logger.error("Error during terminal cleanup", error, {
            clientTerminalId,
            serverTerminalId: peerInfo.serverTerminalId,
          });
        }
        break;
      }
    }
  },
});

async function handleTerminalCreate(peerInfo: PeerInfo, data: WebSocketMessage) {
  const { cols = 80, rows = 24, cwd } = data.data || {};
  const colsNum = Number(cols) || 80;
  const rowsNum = Number(rows) || 24;

  // Use working directory from URL parameter or fallback to message data or process.cwd()
  const cwdStr = String(peerInfo.workingDirectory || cwd || process.cwd());

  try {
    // Use TerminalService to create terminal
    const terminalInstance = await terminalService.createTerminal({
      cols: colsNum,
      rows: rowsNum,
      cwd: cwdStr,
    });

    // Update peer info with server terminal ID
    peerInfo.serverTerminalId = terminalInstance.id;

    // Setup event handler for terminal output
    terminalService.onTerminalEvent(terminalInstance.id, (eventData) => {
      const currentPeerInfo = terminalPeers.get(peerInfo.clientTerminalId);
      if (currentPeerInfo && currentPeerInfo.serverTerminalId === terminalInstance.id) {
        if (eventData.type === "data") {
          currentPeerInfo.peer.send(JSON.stringify({
            type: "terminal-data",
            terminalId: terminalInstance.id,
            data: { output: eventData.data.output },
            timestamp: eventData.timestamp,
          }));
        } else if (eventData.type === "exit") {
          currentPeerInfo.peer.send(JSON.stringify({
            type: "terminal-exit",
            terminalId: terminalInstance.id,
            data: eventData.data,
            timestamp: eventData.timestamp,
          }));
          // Cleanup will be handled automatically by TerminalService
          terminalPeers.delete(peerInfo.clientTerminalId);
        }
      }
    });

    // Send success response
    peerInfo.peer.send(JSON.stringify({
      type: "terminal-created",
      terminalId: terminalInstance.id,
      data: {
        pid: terminalInstance.pty.pid,
        cols: terminalInstance.metadata.cols,
        rows: terminalInstance.metadata.rows,
        cwd: terminalInstance.metadata.cwd,
      },
      timestamp: new Date(),
    }));

    logger.info("Terminal created successfully", {
      clientTerminalId: peerInfo.clientTerminalId,
      serverTerminalId: terminalInstance.id,
      cwd: cwdStr,
    });

  } catch (error) {
    logger.error("Terminal creation failed", error, {
      handler: "terminal-create",
      clientTerminalId: peerInfo.clientTerminalId,
    });
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Failed to create terminal" },
    }));
  }
}

async function handleTerminalInput(peerInfo: PeerInfo, data: TerminalMessage) {
  const { input } = data.data;

  if (!input) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Input is required" },
    }));
    return;
  }

  if (!peerInfo.serverTerminalId) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Terminal not created yet" },
    }));
    return;
  }

  const success = terminalService.writeToTerminal(peerInfo.serverTerminalId, input);
  if (!success) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Failed to write to terminal" },
    }));
  }
}

async function handleTerminalResize(peerInfo: PeerInfo, data: ResizeMessage) {
  const { cols, rows } = data.data;

  if (!cols || !rows) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Cols and rows are required" },
    }));
    return;
  }

  if (!peerInfo.serverTerminalId) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Terminal not created yet" },
    }));
    return;
  }

  const success = terminalService.resizeTerminal(peerInfo.serverTerminalId, cols, rows);
  if (!success) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Failed to resize terminal" },
    }));
  }
}

async function handleTerminalDestroy(peerInfo: PeerInfo, _data: WebSocketMessage) {
  if (!peerInfo.serverTerminalId) {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "No terminal to destroy" },
    }));
    return;
  }

  const success = await terminalService.destroyTerminal(peerInfo.serverTerminalId);

  if (success) {
    peerInfo.peer.send(JSON.stringify({
      type: "terminal-destroyed",
      terminalId: peerInfo.serverTerminalId,
      timestamp: new Date(),
    }));

    // Remove from peers map
    terminalPeers.delete(peerInfo.clientTerminalId);

    logger.info("Terminal destroyed successfully", {
      clientTerminalId: peerInfo.clientTerminalId,
      serverTerminalId: peerInfo.serverTerminalId,
    });
  } else {
    peerInfo.peer.send(JSON.stringify({
      type: "error",
      data: { message: "Failed to destroy terminal" },
    }));
  }
}