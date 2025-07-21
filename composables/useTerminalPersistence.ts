import { ref, readonly } from "vue";
import type { BasicTerminal } from "~/stores/terminalManager";
import { logger } from "~/utils/logger";
import type { ApiResponse } from "~/types";

export interface PersistedTerminalState extends BasicTerminal {
  terminalId: string;
  lastActivity: Date;
  worktreePath?: string;
  branchName?: string;
  basePath?: string;
}

export interface TerminalStatesData {
  terminals: Record<string, PersistedTerminalState>;
  lastUpdate: string;
  version: string;
}

/**
 * Terminal State Persistence Composable
 *
 * Manages persisting and retrieving terminal state across app restarts.
 * Uses the settings API to store terminal information including worktree paths.
 */
export function useTerminalPersistence() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Get all persisted terminal states
   * @returns Map of terminal states keyed by terminal ID
   */
  const getAllTerminalStates = async (): Promise<Map<string, PersistedTerminalState>> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<TerminalStatesData>>("/api/settings/terminal-states");
      const states = new Map<string, PersistedTerminalState>();

      if (response && response.success && response.data?.terminals) {
        const data = response.data as TerminalStatesData;

        for (const [terminalId, state] of Object.entries(data.terminals)) {
          // Convert date strings back to Date objects
          states.set(terminalId, {
            ...state,
            createdAt: new Date(state.createdAt),
            lastActivity: new Date(state.lastActivity),
          });
        }
      }

      logger.debug("Loaded terminal states", { count: states.size });
      return states;
    } catch (err) {
      // If file doesn't exist, return empty map
      if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 404) {
        logger.debug("No terminal states file found, starting fresh");
        return new Map();
      }

      const errorMessage = err instanceof Error ? err.message : "Failed to load terminal states";
      error.value = errorMessage;
      logger.error("Failed to load terminal states", { error: err });
      return new Map();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Save terminal state to persistent storage
   * @param terminalId - Terminal identifier
   * @param state - Terminal state to persist
   */
  const saveTerminalState = async (terminalId: string, state: Partial<PersistedTerminalState>): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      // Get existing states
      const existingStates = await getAllTerminalStates();

      // Update or add the terminal state
      existingStates.set(terminalId, {
        ...state,
        terminalId,
        lastActivity: new Date(),
      } as PersistedTerminalState);

      // Save to settings API
      const payload: TerminalStatesData = {
        terminals: Object.fromEntries(existingStates),
        lastUpdate: new Date().toISOString(),
        version: "1.0.0",
      };

      const response = await $fetch<ApiResponse<TerminalStatesData>>("/api/settings/terminal-states", {
        method: "PUT",
        body: payload,
      });

      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to save terminal state");
      }

      logger.info("Terminal state saved", { terminalId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save terminal state";
      error.value = errorMessage;
      logger.error("Failed to save terminal state", { terminalId, error: err });
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Remove a terminal state from persistent storage
   * @param terminalId - Terminal identifier to remove
   */
  const removeTerminalState = async (terminalId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const states = await getAllTerminalStates();
      states.delete(terminalId);

      // Save updated states
      const payload: TerminalStatesData = {
        terminals: Object.fromEntries(states),
        lastUpdate: new Date().toISOString(),
        version: "1.0.0",
      };

      const response = await $fetch<ApiResponse<TerminalStatesData>>("/api/settings/terminal-states", {
        method: "PUT",
        body: payload,
      });

      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to remove terminal state");
      }

      logger.info("Terminal state removed", { terminalId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove terminal state";
      error.value = errorMessage;
      logger.error("Failed to remove terminal state", { terminalId, error: err });
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update last activity timestamp for a terminal
   * @param terminalId - Terminal identifier
   */
  const updateLastActivity = async (terminalId: string): Promise<void> => {
    try {
      const states = await getAllTerminalStates();
      const state = states.get(terminalId);

      if (state) {
        await saveTerminalState(terminalId, {
          ...state,
          lastActivity: new Date(),
        });
      }
    } catch (err) {
      // Don't throw on activity update failures
      logger.warn("Failed to update terminal activity", { terminalId, error: err });
    }
  };

  /**
   * Clear all terminal states (useful for testing or reset)
   */
  const clearAllTerminalStates = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const payload: TerminalStatesData = {
        terminals: {},
        lastUpdate: new Date().toISOString(),
        version: "1.0.0",
      };

      await $fetch<ApiResponse<TerminalStatesData>>("/api/settings/terminal-states", {
        method: "PUT",
        body: payload,
      });

      logger.info("All terminal states cleared");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to clear terminal states";
      error.value = errorMessage;
      logger.error("Failed to clear terminal states", { error: err });
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    saveTerminalState,
    getAllTerminalStates,
    removeTerminalState,
    updateLastActivity,
    clearAllTerminalStates,
    isLoading: readonly(isLoading),
    error: readonly(error),
  };
}