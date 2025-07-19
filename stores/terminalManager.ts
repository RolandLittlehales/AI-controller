import { defineStore } from "pinia";
import { ref, readonly, computed } from "vue";
import { useSystemResources } from "~/composables/useSystemResources";

/**
 * Basic Terminal State Management Store
 *
 * Manages multiple terminal instances with:
 * - In-memory terminal tracking (no persistence yet)
 * - System resource limit enforcement
 * - Active terminal switching logic
 * - CRUD operations for terminals
 */

interface BasicTerminal {
  id: string;
  name: string;
  status: "connecting" | "connected" | "disconnected";
  isActive: boolean;
  createdAt: Date;
}

export const useTerminalManagerStore = defineStore("terminalManager", () => {
  const terminals = ref(new Map<string, BasicTerminal>());
  const activeTerminalId = ref<string | null>(null);
  const systemResources = useSystemResources();

  // Initialize system resources on store creation
  systemResources.detectSystemCapability();

  /**
   * Check if we can create another terminal based on system limits
   */
  const canCreateTerminal = computed(() =>
    terminals.value.size < systemResources.systemInfo.value.maxTerminals,
  );

  /**
   * Create a new terminal with unique ID and name
   * @param name - Display name for the terminal
   * @returns Terminal ID
   * @throws Error if terminal limit reached
   */
  const createTerminal = (name: string): string => {
    if (!canCreateTerminal.value) {
      throw new Error("Terminal limit reached");
    }

    // Generate unique terminal ID
    const terminalId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const terminal: BasicTerminal = {
      id: terminalId,
      name,
      status: "connecting",
      isActive: false,
      createdAt: new Date(),
    };

    terminals.value.set(terminalId, terminal);
    // Console logging for verification during development
    // eslint-disable-next-line no-console
    console.log(`Created terminal: ${terminalId} (${name})`);

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
        // eslint-disable-next-line no-console
        console.log(`Deactivated terminal: ${activeTerminalId.value}`);
      }
    }

    // Activate new terminal
    activeTerminalId.value = terminalId;
    if (terminalId) {
      const terminal = terminals.value.get(terminalId);
      if (terminal) {
        terminal.isActive = true;
        // eslint-disable-next-line no-console
        console.log(`Activated terminal: ${terminalId} (${terminal.name})`);
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
    // eslint-disable-next-line no-console
    console.log(`Removed terminal: ${terminalId} (${terminal.name})`);

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
      // eslint-disable-next-line no-console
      console.log(`Updated terminal ${terminalId} status to: ${status}`);
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

  return {
    // Readonly state
    terminals: readonly(terminals),
    activeTerminalId: readonly(activeTerminalId),

    // Computed properties
    canCreateTerminal,
    getAllTerminals,
    getActiveTerminal,
    terminalCount,

    // Actions
    createTerminal,
    setActiveTerminal,
    removeTerminal,
    updateTerminalStatus,
    getTerminal,
  };
});