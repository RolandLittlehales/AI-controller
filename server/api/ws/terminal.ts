// WebSocket handler - auto-imported by Nitro
import type { WebSocketMessage, TerminalMessage, ResizeMessage, WebSocketPeer } from '~/types';
import { terminalService } from '~/server/services/terminal';
import { logger } from '~/utils/logger';

// Store WebSocket peers for each terminal
const terminalPeers = new Map<string, WebSocketPeer>();

export default defineWebSocketHandler({
  async message(peer: WebSocketPeer, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString()) as WebSocketMessage;

      switch (data.type) {
        case 'terminal-create':
          await handleTerminalCreate(peer, data);
          break;

        case 'terminal-data':
          await handleTerminalInput(peer, data as TerminalMessage);
          break;

        case 'terminal-resize':
          await handleTerminalResize(peer, data as ResizeMessage);
          break;

        case 'terminal-destroy':
          await handleTerminalDestroy(peer, data);
          break;

        default:
          peer.send(JSON.stringify({
            type: 'error',
            data: { message: `Unknown message type: ${data.type}` }
          }));
      }
    } catch (error) {
      logger.error('WebSocket message processing failed', error, { handler: 'terminal-ws' });
      peer.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  },

  async close(peer: WebSocketPeer) {
    // Cleanup terminals when connection closes
    for (const [terminalId, terminalPeer] of terminalPeers.entries()) {
      if (terminalPeer === peer) {
        await terminalService.destroyTerminal(terminalId);
        terminalPeers.delete(terminalId);
      }
    }
  }
});

async function handleTerminalCreate(peer: WebSocketPeer, data: WebSocketMessage) {
  const { cols = 80, rows = 24, cwd = process.cwd() } = data.data || {};
  const colsNum = Number(cols) || 80;
  const rowsNum = Number(rows) || 24;
  const cwdStr = String(cwd || process.cwd());

  try {
    // Use TerminalService to create terminal
    const terminalInstance = await terminalService.createTerminal({
      cols: colsNum,
      rows: rowsNum,
      cwd: cwdStr
    });

    // Store peer for this terminal
    terminalPeers.set(terminalInstance.id, peer);

    // Setup event handler for terminal output
    terminalService.onTerminalEvent(terminalInstance.id, (eventData) => {
      if (terminalPeers.has(terminalInstance.id)) {
        const peer = terminalPeers.get(terminalInstance.id);

        if (eventData.type === 'data') {
          peer?.send(JSON.stringify({
            type: 'terminal-data',
            terminalId: terminalInstance.id,
            data: { output: eventData.data.output },
            timestamp: eventData.timestamp
          }));
        } else if (eventData.type === 'exit') {
          peer?.send(JSON.stringify({
            type: 'terminal-exit',
            terminalId: terminalInstance.id,
            data: eventData.data,
            timestamp: eventData.timestamp
          }));
          // Cleanup will be handled automatically by TerminalService
          terminalPeers.delete(terminalInstance.id);
        }
      }
    });

    // Send success response
    peer.send(JSON.stringify({
      type: 'terminal-created',
      terminalId: terminalInstance.id,
      data: {
        pid: terminalInstance.pty.pid,
        cols: terminalInstance.metadata.cols,
        rows: terminalInstance.metadata.rows,
        cwd: terminalInstance.metadata.cwd
      },
      timestamp: new Date()
    }));

  } catch (error) {
    logger.error('Terminal creation failed', error, { handler: 'terminal-create' });
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to create terminal' }
    }));
  }
}

async function handleTerminalInput(peer: WebSocketPeer, data: TerminalMessage) {
  const { terminalId } = data;
  const input = data.data.input;

  if (!terminalId || !input) {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Terminal ID and input are required' }
    }));
    return;
  }

  const success = terminalService.writeToTerminal(terminalId, input);
  if (!success) {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to write to terminal' }
    }));
  }
}

async function handleTerminalResize(peer: WebSocketPeer, data: ResizeMessage) {
  const { terminalId } = data;
  const { cols, rows } = data.data;

  if (!terminalId || !cols || !rows) {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Terminal ID, cols, and rows are required' }
    }));
    return;
  }

  const success = terminalService.resizeTerminal(terminalId, cols, rows);
  if (!success) {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to resize terminal' }
    }));
  }
}

async function handleTerminalDestroy(peer: WebSocketPeer, data: WebSocketMessage) {
  const { terminalId } = data;

  if (!terminalId) {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Terminal ID is required' }
    }));
    return;
  }

  const success = await terminalService.destroyTerminal(terminalId);
  terminalPeers.delete(terminalId);

  if (success) {
    peer.send(JSON.stringify({
      type: 'terminal-destroyed',
      terminalId,
      timestamp: new Date()
    }));
  } else {
    peer.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to destroy terminal' }
    }));
  }
}