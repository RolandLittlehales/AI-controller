import { defineStore } from "pinia";
import { ref, readonly, computed } from "vue";
import { useSystemResources } from "~/composables/useSystemResources";
import { useGitRepository } from "~/composables/useGitRepository";
import { useMultiTerminalManager } from "~/composables/useMultiTerminalWebSocket";
import type { MultiTerminalManager } from "~/composables/useMultiTerminalWebSocket";

export interface GitTerminalInfo {
  hasWorktree: boolean;
  branchName?: string;
  worktreePath?: string;
  isTemporary?: boolean;
}

export interface BasicTerminal {
  id: string;
  name: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  isActive: boolean;
  createdAt: Date;
  git?: GitTerminalInfo;
  workingDirectory?: string;
}

export interface CreateTerminalOptions {
  name: string;
  branchName?: string;
  baseBranch?: string;
  useGit?: boolean;
  workingDirectory?: string;
}

/**
 * Terminal State Management Store with Git Integration
 *
 * Manages multiple terminal instances with:
 * - In-memory terminal tracking (no persistence yet)
 * - System resource limit enforcement
 * - Active terminal switching logic
 * - Git worktree integration for isolated development
 * - CRUD operations for terminals
 */
export const useTerminalManagerStore = defineStore("terminalManager", () => {
  const terminals = ref(new Map<string, BasicTerminal>());
  const activeTerminalId = ref<string | null>(null);
  const terminalOutputs = ref(new Map<string, string[]>());
  const systemResources = useSystemResources();
  const gitRepository = useGitRepository();
  const webSocketManager = useMultiTerminalManager();

  // Initialize system resources on store creation
  systemResources.detectSystemCapability();

  /**
   * Check if we can create another terminal based on system limits
   */
  const canCreateTerminal = computed(() =>
    terminals.value.size < systemResources.systemInfo.value.maxTerminals,
  );

  /**
   * Check if a terminal name already exists
   * @param name - Terminal name to check
   * @returns True if name is already in use
   */
  const isTerminalNameTaken = (name: string): boolean => {
    return Array.from(terminals.value.values()).some(terminal =>
      terminal.name.toLowerCase().trim() === name.toLowerCase().trim(),
    );
  };

  /**
   * Create a new terminal with unique ID and options
   * @param options - Terminal creation options
   * @returns Terminal ID
   * @throws Error if terminal limit reached or git operation fails
   */
  const createTerminal = (options: CreateTerminalOptions | string): string => {
    if (!canCreateTerminal.value) {
      throw new Error("Terminal limit reached");
    }

    // Handle legacy string parameter
    const terminalOptions: CreateTerminalOptions = typeof options === "string"
      ? { name: options, useGit: false }
      : options;

    // Check for duplicate names
    if (isTerminalNameTaken(terminalOptions.name)) {
      throw new Error(`Terminal name "${terminalOptions.name}" is already in use`);
    }

    // Generate unique terminal ID with consistent length
    const randomPart = Math.random().toString(36).substring(2, 8).padEnd(6, "0");
    const terminalId = `term_${Date.now()}_${randomPart}`;

    const terminal: BasicTerminal = {
      id: terminalId,
      name: terminalOptions.name,
      status: "connecting",
      isActive: false,
      createdAt: new Date(),
    };

    // Add git information if git is enabled and repository is available
    if (terminalOptions.useGit && gitRepository.repositoryInfo.value.isGitRepository) {
      const gitInfo: GitTerminalInfo = {
        hasWorktree: true,
        branchName: terminalOptions.branchName || `terminal-${terminalId}`,
        isTemporary: !terminalOptions.branchName, // Temporary if no specific branch provided
      };
      terminal.git = gitInfo;
    } else if (terminalOptions.useGit) {
      // User requested git but no repository available
      throw new Error("Git integration requested but not in a git repository");
    }

    // Set working directory
    if (terminalOptions.workingDirectory) {
      terminal.workingDirectory = terminalOptions.workingDirectory;
    }

    terminals.value.set(terminalId, terminal);

    return terminalId;
  };

  /**
   * Set active terminal and deactivate previous one
   * @param terminalId - ID of terminal to activate, or null to deactivate all
   */
  const setActiveTerminal = (terminalId: string | null): void => {
    // Deactivate previous active terminal
    if (activeTerminalId.value) {
      const prev = terminals.value.get(activeTerminalId.value);
      if (prev) {
        prev.isActive = false;
      }
    }

    // Activate new terminal
    activeTerminalId.value = terminalId;
    if (terminalId) {
      const terminal = terminals.value.get(terminalId);
      if (terminal) {
        terminal.isActive = true;
      }
    }
  };

  /**
   * Remove a terminal and handle active terminal switching
   * @param terminalId - ID of terminal to remove
   */
  const removeTerminal = (terminalId: string): void => {
    const terminal = terminals.value.get(terminalId);
    if (!terminal) return;

    terminals.value.delete(terminalId);

    // If removing active terminal, switch to next available
    if (activeTerminalId.value === terminalId) {
      const remaining = Array.from(terminals.value.keys());
      setActiveTerminal(remaining[0] || null);
    }
  };

  /**
   * Update terminal status
   * @param terminalId - ID of terminal to update
   * @param status - New status
   */
  const updateTerminalStatus = (terminalId: string, status: BasicTerminal["status"]): void => {
    const terminal = terminals.value.get(terminalId);
    if (terminal) {
      terminal.status = status;
    }
  };

  /**
   * Get terminal by ID
   * @param terminalId - ID of terminal to retrieve
   * @returns Terminal or undefined
   */
  const getTerminal = (terminalId: string): BasicTerminal | undefined => {
    return terminals.value.get(terminalId);
  };

  /**
   * Get all terminals as array
   * @returns Array of all terminals
   */
  const getAllTerminals = computed(() => Array.from(terminals.value.values()));

  /**
   * Get currently active terminal
   * @returns Active terminal or undefined
   */
  const getActiveTerminal = computed(() => {
    return activeTerminalId.value ? terminals.value.get(activeTerminalId.value) : undefined;
  });

  /**
   * Get terminal count
   * @returns Number of terminals
   */
  const terminalCount = computed(() => terminals.value.size);

  /**
   * Refresh git repository information via API call
   * @param basePath - Repository path to validate
   */
  const refreshGitRepository = async (basePath?: string): Promise<void> => {
    await gitRepository.validateRepository(basePath);
  };

  /**
   * Get available branches via API call
   * @returns Promise<string[]> List of branch names
   */
  const getAvailableBranches = async (): Promise<string[]> => {
    return await gitRepository.getAvailableBranches();
  };

  /**
   * Create terminal with WebSocket connection
   * @param options - Terminal creation options
   * @returns Promise<string> Terminal ID
   */
  const createTerminalWithWebSocket = async (options: CreateTerminalOptions): Promise<string> => {
    const terminalId = createTerminal(options);
    const terminal = terminals.value.get(terminalId);
    
    if (!terminal) {
      throw new Error("Failed to create terminal");
    }

    // Create WebSocket connection
    const connection = webSocketManager.createConnection({
      terminalId,
      workingDirectory: terminal.workingDirectory || options.workingDirectory,
      onOutput: (output) => handleTerminalOutput(terminalId, output),
      onError: (error) => handleTerminalError(terminalId, error),
      onStatusChange: (status) => updateTerminalStatus(terminalId, status),
      onConnected: (serverTerminalId) => handleTerminalConnected(terminalId, serverTerminalId),
      onDisconnected: () => handleTerminalDisconnected(terminalId)
    });

    // Start connection
    await connection.connect();
    
    return terminalId;
  };

  /**
   * Handle terminal output from WebSocket
   */
  const handleTerminalOutput = (terminalId: string, output: string): void => {
    const outputs = terminalOutputs.value.get(terminalId) || [];
    outputs.push(output);
    terminalOutputs.value.set(terminalId, outputs);
  };

  /**
   * Handle terminal error from WebSocket
   */
  const handleTerminalError = (terminalId: string, error: Error): void => {
    console.error(`Terminal ${terminalId} error:`, error);
    updateTerminalStatus(terminalId, "error");
  };

  /**
   * Handle terminal connected event
   */
  const handleTerminalConnected = (terminalId: string, serverTerminalId: string): void => {
    updateTerminalStatus(terminalId, "connected");
    console.info(`Terminal ${terminalId} connected with server ID ${serverTerminalId}`);
  };

  /**
   * Handle terminal disconnected event
   */
  const handleTerminalDisconnected = (terminalId: string): void => {
    updateTerminalStatus(terminalId, "disconnected");
  };

  /**
   * Send input to terminal
   * @param terminalId - Terminal ID
   * @param input - Input string
   * @returns Success status
   */
  const sendInput = (terminalId: string, input: string): boolean => {
    const connection = webSocketManager.getConnection(terminalId);
    return connection?.sendInput(input) || false;
  };

  /**
   * Get terminal output history
   * @param terminalId - Terminal ID
   * @returns Array of output strings
   */
  const getTerminalOutput = (terminalId: string): string[] => {
    return terminalOutputs.value.get(terminalId) || [];
  };

  /**
   * Remove terminal with proper cleanup
   * @param terminalId - Terminal ID
   */
  const removeTerminalWithCleanup = async (terminalId: string): Promise<void> => {
    const connection = webSocketManager.getConnection(terminalId);
    if (connection) {
      connection.disconnect();
      webSocketManager.removeConnection(terminalId);
    }
    
    // Clean up outputs
    terminalOutputs.value.delete(terminalId);
    
    // Remove from terminals map
    removeTerminal(terminalId);
  };

  return {
    // Readonly state
    terminals: readonly(terminals),
    activeTerminalId: readonly(activeTerminalId),

    // Git repository information
    gitRepository: gitRepository.repositoryInfo,

    // Computed properties
    canCreateTerminal,
    getAllTerminals,
    getActiveTerminal,
    terminalCount,

    // Validation
    isTerminalNameTaken,

    // Actions
    createTerminal,
    setActiveTerminal,
    removeTerminal,
    updateTerminalStatus,
    getTerminal,

    // Git actions
    refreshGitRepository,
    getAvailableBranches,

    // WebSocket actions
    createTerminalWithWebSocket,
    sendInput,
    getTerminalOutput,
    removeTerminalWithCleanup,
    webSocketManager,
  };
});