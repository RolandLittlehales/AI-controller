import { defineStore } from "pinia";
import { ref, readonly, computed } from "vue";
import { useSystemResources } from "~/composables/useSystemResources";
import { useGitRepository } from "~/composables/useGitRepository";
import { useMultiTerminalManager } from "~/composables/useMultiTerminalWebSocket";
import { useTerminalSettings } from "~/composables/useSettings";
import type { PersistedTerminalState } from "~/composables/useTerminalPersistence";
import { useTerminalPersistence } from "~/composables/useTerminalPersistence";
import { logger } from "~/utils/logger";
// import type { MultiTerminalManager } from "~/composables/useMultiTerminalWebSocket";

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
  const terminals = ref<Record<string, BasicTerminal>>({});
  const activeTerminalId = ref<string | null>(null);
  const terminalOutputs = ref<Record<string, string[]>>({});
  const systemResources = useSystemResources();
  const gitRepository = useGitRepository();
  const webSocketManager = useMultiTerminalManager();
  const terminalSettings = useTerminalSettings();
  const persistence = useTerminalPersistence();

  // Initialize system resources on store creation
  systemResources.detectSystemCapability();

  /**
   * Check if we can create another terminal based on system limits
   */
  const canCreateTerminal = computed(() =>
    Object.keys(terminals.value).length < systemResources.systemInfo.value.maxTerminals,
  );

  /**
   * Check if a terminal name already exists
   * @param name - Terminal name to check
   * @returns True if name is already in use
   */
  const isTerminalNameTaken = (name: string): boolean => {
    return Object.values(terminals.value).some(terminal =>
      terminal.name.toLowerCase().trim() === name.toLowerCase().trim(),
    );
  };

  /**
   * Create a new terminal with unique ID and options
   * @param options - Terminal creation options
   * @returns Promise<Terminal ID>
   * @throws Error if terminal limit reached, git operation fails, or server ID generation fails
   */
  const createTerminal = async (options: CreateTerminalOptions | string): Promise<string> => {
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

    // Generate unique terminal ID from server
    let terminalId: string;
    try {
      const response = await $fetch<{ success: boolean; data?: { terminalId: string }; error?: string }>("/api/terminals/generate-id", {
        method: "POST",
      });

      if (!response.success || !response.data?.terminalId) {
        throw new Error(response.error || "Failed to generate terminal ID");
      }

      ({ terminalId } = response.data);
    } catch (error) {
      throw new Error(`Failed to generate terminal ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

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

    terminals.value[terminalId] = terminal;

    return terminalId;
  };

  /**
   * Set active terminal and deactivate previous one
   * @param terminalId - ID of terminal to activate, or null to deactivate all
   */
  const setActiveTerminal = (terminalId: string | null): void => {
    // Deactivate previous active terminal
    if (activeTerminalId.value && terminals.value[activeTerminalId.value]) {
      const prevTerminalId = activeTerminalId.value;
      const prevTerminal = terminals.value[prevTerminalId];
      if (prevTerminal) {
        terminals.value[prevTerminalId] = {
          ...prevTerminal,
          isActive: false,
        };
      }
    }

    // Activate new terminal
    activeTerminalId.value = terminalId;
    if (terminalId && terminals.value[terminalId]) {
      const terminal = terminals.value[terminalId];
      if (terminal) {
        terminals.value[terminalId] = {
          ...terminal,
          isActive: true,
        };
      }
    }
  };

  /**
   * Remove a terminal and handle active terminal switching
   * @param terminalId - ID of terminal to remove
   */
  const removeTerminal = (terminalId: string): void => {
    const terminal = terminals.value[terminalId];
    if (!terminal) return;

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete terminals.value[terminalId];

    // If removing active terminal, switch to next available
    if (activeTerminalId.value === terminalId) {
      const remaining = Object.keys(terminals.value);
      setActiveTerminal(remaining[0] || null);
    }
  };

  /**
   * Update terminal status
   * @param terminalId - ID of terminal to update
   * @param status - New status
   */
  const updateTerminalStatus = (terminalId: string, status: BasicTerminal["status"]): void => {
    const terminal = terminals.value[terminalId];
    if (!terminal) return;

    terminals.value[terminalId] = {
      ...terminal,
      status,
    };

    // Update persistence with new status
    // Always persist as disconnected since terminals don't survive app restarts
    const persistStatus = status === "connected" ? "disconnected" : status;
    persistence.saveTerminalState(terminalId, {
      ...terminal,
      status: persistStatus,
      terminalId,
      lastActivity: new Date(),
    }).catch(error => {
      logger.warn("Failed to update terminal status in persistence", { terminalId, status, error });
    });
  };

  /**
   * Get terminal by ID
   * @param terminalId - ID of terminal to retrieve
   * @returns Terminal or undefined
   */
  const getTerminal = (terminalId: string): BasicTerminal | undefined => {
    return terminals.value[terminalId];
  };

  /**
   * Get all terminals as array
   * @returns Array of all terminals
   */
  const getAllTerminals = computed(() => Object.values(terminals.value));

  /**
   * Get currently active terminal
   * @returns Active terminal or undefined
   */
  const getActiveTerminal = computed(() => {
    return activeTerminalId.value ? terminals.value[activeTerminalId.value] : undefined;
  });

  /**
   * Get terminal count
   * @returns Number of terminals
   */
  const terminalCount = computed(() => Object.keys(terminals.value).length);

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
   * Handle terminal output from WebSocket with history limit management
   */
  const handleTerminalOutput = (terminalId: string, output: string): void => {
    if (!terminalOutputs.value[terminalId]) {
      terminalOutputs.value[terminalId] = [];
    }

    // Add new output
    terminalOutputs.value[terminalId].push(output);

    // Apply history limit from terminal config (default 3000 lines)
    const historyLimit = terminalSettings.getTerminalConfig().historyLimit || 3000;
    const outputHistory = terminalOutputs.value[terminalId];

    if (outputHistory.length > historyLimit) {
      // Remove excess lines from the beginning to maintain limit
      const excessLines = outputHistory.length - historyLimit;
      terminalOutputs.value[terminalId] = outputHistory.slice(excessLines);

      logger.debug("Terminal output history trimmed", {
        terminalId,
        removedLines: excessLines,
        currentLines: terminalOutputs.value[terminalId].length,
        limit: historyLimit,
      });
    }
  };

  /**
   * Handle terminal error from WebSocket
   */
  const handleTerminalError = (terminalId: string, error: Error): void => {
    logger.error(`Terminal ${terminalId} error:`, error);
    updateTerminalStatus(terminalId, "error");
  };

  /**
   * Handle terminal connected event
   */
  const handleTerminalConnected = (terminalId: string, serverTerminalId: string): void => {
    updateTerminalStatus(terminalId, "connected");
    logger.info(`Terminal ${terminalId} connected with server ID ${serverTerminalId}`);
  };

  /**
   * Handle terminal disconnected event
   */
  const handleTerminalDisconnected = (terminalId: string): void => {
    updateTerminalStatus(terminalId, "disconnected");
  };

  /**
   * Create terminal with WebSocket connection
   * @param options - Terminal creation options
   * @returns Promise<string> Terminal ID
   */
  const createTerminalWithWebSocket = async (options: CreateTerminalOptions): Promise<string> => {
    const terminalId = await createTerminal(options);
    const terminal = terminals.value[terminalId];

    if (!terminal) {
      throw new Error("Failed to create terminal");
    }

    // Create WebSocket connection
    const connection = webSocketManager.createConnection({
      terminalId,
      workingDirectory: terminal.workingDirectory || options.workingDirectory || undefined,
      onOutput: (output) => handleTerminalOutput(terminalId, output),
      onError: (error) => handleTerminalError(terminalId, error),
      onStatusChange: (status) => updateTerminalStatus(terminalId, status),
      onConnected: (serverTerminalId) => handleTerminalConnected(terminalId, serverTerminalId),
      onDisconnected: () => handleTerminalDisconnected(terminalId),
    });

    // Start connection
    await connection.connect();

    // Save terminal state to persistence
    try {
      const persistenceData: Partial<PersistedTerminalState> = {
        ...terminal,
        terminalId,
        lastActivity: new Date(),
        // Always persist as disconnected since terminals don't survive restarts
        status: "disconnected",
        // Only add properties if they have values
        ...(terminal.git?.worktreePath && { worktreePath: terminal.git.worktreePath }),
        ...(terminal.git?.branchName && { branchName: terminal.git.branchName }),
        ...(options.workingDirectory && { basePath: options.workingDirectory }),
      };

      await persistence.saveTerminalState(terminalId, persistenceData);
    } catch (error) {
      logger.warn("Failed to persist terminal state", { terminalId, error });
      // Don't fail terminal creation if persistence fails
    }

    return terminalId;
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
    return terminalOutputs.value[terminalId] || [];
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
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete terminalOutputs.value[terminalId];

    // Remove from terminals map
    removeTerminal(terminalId);

    // Remove from persistence
    try {
      await persistence.removeTerminalState(terminalId);
    } catch (error) {
      logger.warn("Failed to remove terminal state from persistence", { terminalId, error });
      // Don't fail terminal removal if persistence fails
    }
  };

  /**
   * Restore terminals from persistence (called on app startup)
   * Note: This only restores the terminal metadata, not the actual connections
   */
  const restoreTerminalsFromPersistence = async (): Promise<void> => {
    try {
      const persistedStates = await persistence.getAllTerminalStates();
      logger.info("Restoring terminals from persistence", { count: persistedStates.size });

      for (const [terminalId, state] of persistedStates) {
        // Only restore if terminal doesn't already exist
        if (!terminals.value[terminalId]) {
          const terminal: BasicTerminal = {
            id: state.id,
            name: state.name,
            status: "disconnected", // Always start as disconnected
            isActive: false,
            createdAt: new Date(state.createdAt),
          };

          // Only add optional properties if they exist
          if (state.git) {
            terminal.git = state.git;
          }
          if (state.workingDirectory) {
            terminal.workingDirectory = state.workingDirectory;
          }

          terminals.value[terminalId] = terminal;
          logger.debug("Restored terminal from persistence", { terminalId, name: terminal.name });
        }
      }
    } catch (error) {
      logger.error("Failed to restore terminals from persistence", { error });
    }
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

    // Terminal event handlers (exposed for reconnection logic)
    handleTerminalOutput,
    handleTerminalError,
    handleTerminalConnected,
    handleTerminalDisconnected,

    // Persistence actions
    restoreTerminalsFromPersistence,
    persistence,
  };
});