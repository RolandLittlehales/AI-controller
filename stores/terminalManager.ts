import { defineStore } from "pinia";
import { ref, readonly, computed } from "vue";
import { useSystemResources } from "~/composables/useSystemResources";
import { useGitRepository } from "~/composables/useGitRepository";

export interface GitTerminalInfo {
  hasWorktree: boolean;
  branchName?: string;
  worktreePath?: string;
  isTemporary?: boolean;
}

export interface BasicTerminal {
  id: string;
  name: string;
  status: "connecting" | "connected" | "disconnected";
  isActive: boolean;
  createdAt: Date;
  git?: GitTerminalInfo;
}

export interface CreateTerminalOptions {
  name: string;
  branchName?: string;
  baseBranch?: string;
  useGit?: boolean;
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
  const systemResources = useSystemResources();
  const gitRepository = useGitRepository();

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
  };
});