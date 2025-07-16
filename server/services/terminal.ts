import { spawn } from "node-pty";
import type { IPty } from "node-pty";
import { v4 as uuidv4 } from "uuid";
import type { Terminal } from "~/types";
import { logger } from "~/utils/logger";

export interface TerminalOptions {
  cols?: number
  rows?: number
  cwd?: string
  shell?: string
  env?: Record<string, string>
}

export interface TerminalInstance {
  id: string
  pty: IPty
  metadata: Terminal
  isActive: boolean
}

export interface TerminalEventData {
  type: "data" | "exit"
  terminalId: string
  data: {
    output?: string
    exitCode?: number
    signal?: number | undefined
  }
  timestamp: Date
}

export class TerminalService {
  private terminals = new Map<string, TerminalInstance>();
  private eventHandlers = new Map<string, (data: TerminalEventData) => void>();

  /**
   * Create a new terminal instance
   */
  async createTerminal(options: TerminalOptions = {}): Promise<TerminalInstance> {
    const terminalId = uuidv4();
    const {
      cols = 80,
      rows = 24,
      cwd = process.cwd(),
      shell = this.getDefaultShell(),
      env = {},
    } = options;

    const mergedEnv = {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      ...env,
    };

    const pty = spawn(shell, [], {
      name: "xterm-color",
      cols,
      rows,
      cwd,
      env: mergedEnv,
    });

    const metadata: Terminal = {
      id: terminalId,
      agentId: "", // Will be set when attached to agent
      pid: pty.pid,
      cols,
      rows,
      cwd,
      shell,
      createdAt: new Date(),
      isActive: true,
    };

    const instance: TerminalInstance = {
      id: terminalId,
      pty,
      metadata,
      isActive: true,
    };

    this.terminals.set(terminalId, instance);

    // Setup event handlers
    this.setupTerminalEvents(instance);

    return instance;
  }

  /**
   * Get terminal instance by ID
   */
  getTerminal(terminalId: string): TerminalInstance | undefined {
    return this.terminals.get(terminalId);
  }

  /**
   * Get all terminal instances
   */
  getAllTerminals(): TerminalInstance[] {
    return Array.from(this.terminals.values());
  }

  /**
   * Get active terminal instances
   */
  getActiveTerminals(): TerminalInstance[] {
    return this.getAllTerminals().filter(t => t.isActive);
  }

  /**
   * Write data to terminal
   */
  writeToTerminal(terminalId: string, data: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal || !terminal.isActive) {
      return false;
    }

    try {
      terminal.pty.write(data);
      return true;
    } catch (error) {
      logger.error("Failed to write to terminal", error, { terminalId, service: "TerminalService" });
      return false;
    }
  }

  /**
   * Resize terminal
   */
  resizeTerminal(terminalId: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal || !terminal.isActive) {
      return false;
    }

    try {
      terminal.pty.resize(cols, rows);
      terminal.metadata.cols = cols;
      terminal.metadata.rows = rows;
      return true;
    } catch (error) {
      logger.error("Failed to resize terminal", error, { terminalId, service: "TerminalService" });
      return false;
    }
  }

  /**
   * Destroy terminal instance
   */
  async destroyTerminal(terminalId: string): Promise<boolean> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    try {
      terminal.isActive = false;
      terminal.pty.kill();
      this.terminals.delete(terminalId);
      this.eventHandlers.delete(terminalId);
      return true;
    } catch (error) {
      logger.error("Failed to destroy terminal", error, { terminalId, service: "TerminalService" });
      return false;
    }
  }

  /**
   * Register event handler for terminal
   */
  onTerminalEvent(terminalId: string, handler: (data: TerminalEventData) => void): void {
    this.eventHandlers.set(terminalId, handler);
  }

  /**
   * Remove event handler for terminal
   */
  offTerminalEvent(terminalId: string): void {
    this.eventHandlers.delete(terminalId);
  }

  /**
   * Get terminal statistics
   */
  getTerminalStats() {
    const terminals = this.getAllTerminals();
    return {
      total: terminals.length,
      active: terminals.filter(t => t.isActive).length,
      inactive: terminals.filter(t => !t.isActive).length,
      processes: terminals.map(t => ({
        id: t.id,
        pid: t.pty.pid,
        isActive: t.isActive,
        createdAt: t.metadata.createdAt,
      })),
    };
  }

  /**
   * Cleanup all terminals
   */
  async cleanup(): Promise<void> {
    const terminals = Array.from(this.terminals.keys());
    await Promise.all(terminals.map(id => this.destroyTerminal(id)));
  }

  private setupTerminalEvents(instance: TerminalInstance): void {
    const { id, pty } = instance;

    // Handle data output
    pty.onData((data) => {
      const handler = this.eventHandlers.get(id);
      if (handler) {
        handler({
          type: "data",
          terminalId: id,
          data: { output: data },
          timestamp: new Date(),
        });
      }
    });

    // Handle terminal exit
    pty.onExit(({ exitCode, signal }) => {
      instance.isActive = false;
      const handler = this.eventHandlers.get(id);
      if (handler) {
        handler({
          type: "exit",
          terminalId: id,
          data: { exitCode, signal },
          timestamp: new Date(),
        });
      }

      // Auto-cleanup after exit
      setTimeout(() => {
        this.destroyTerminal(id);
      }, 1000);
    });
  }

  private getDefaultShell(): string {
    if (process.platform === "win32") {
      return process.env.COMSPEC || "cmd.exe";
    }
    return process.env.SHELL || "/bin/bash";
  }
}

// Export singleton instance
export const terminalService = new TerminalService();

// Cleanup on process exit
process.on("exit", () => {
  terminalService.cleanup();
});

process.on("SIGINT", async () => {
  await terminalService.cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await terminalService.cleanup();
  process.exit(0);
});