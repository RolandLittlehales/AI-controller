<template>
  <div class="terminal-display">
    <div v-if="!activeTerminal" class="no-terminal">
      <div class="no-terminal-content">
        <div class="no-terminal-icon">💻</div>
        <h3 class="no-terminal-title">No Terminal Selected</h3>
        <p class="no-terminal-subtitle">
          Create a new terminal or select one from the sidebar to get started
        </p>
        <div class="no-terminal-actions">
          <AppButton
            variant="primary"
            size="lg"
            icon="i-heroicons-plus"
            :disabled="!canCreateTerminal"
            @click="createFirstTerminal"
          >
            Create First Terminal
          </AppButton>
        </div>
      </div>
    </div>

    <div v-else class="active-terminal">
      <div class="terminal-header">
        <div class="terminal-info">
          <h3 class="terminal-title">{{ activeTerminal.name }}</h3>
          <div class="terminal-badges">
            <span class="terminal-badge terminal-id">
              ID: {{ activeTerminal.id.slice(0, 8) }}
            </span>
            <span
              class="terminal-badge terminal-status"
              :class="`status-${activeTerminal.status}`"
            >
              {{ formatStatus(activeTerminal.status) }}
            </span>
            <span class="terminal-badge terminal-created">
              Created: {{ formatTime(activeTerminal.createdAt) }}
            </span>
          </div>
        </div>

        <div class="terminal-actions">
          <AppButton
            icon="i-heroicons-arrow-path"
            size="sm"
            variant="secondary"
            :disabled="activeTerminal.status === 'connecting'"
            title="Reconnect terminal"
            @click="reconnectTerminal"
          >
            Reconnect
          </AppButton>
          <AppButton
            icon="i-heroicons-x-mark"
            size="sm"
            variant="danger"
            title="Close terminal"
            @click="closeTerminal"
          >
            Close
          </AppButton>
        </div>
      </div>

      <div class="terminal-content">
        <div class="terminal-placeholder">
          <div class="placeholder-header">
            <h4 class="placeholder-title">Terminal Content Placeholder</h4>
            <p class="placeholder-subtitle">
              This is where xterm.js will be integrated in the next phase
            </p>
          </div>

          <div class="mock-terminal">
            <div class="mock-toolbar">
              <div class="mock-buttons">
                <span class="mock-button mock-button--close"/>
                <span class="mock-button mock-button--minimize"/>
                <span class="mock-button mock-button--maximize"/>
              </div>
              <div class="mock-title">{{ activeTerminal.name }}</div>
            </div>

            <div class="mock-content">
              <div class="mock-line">
                <span class="prompt">user@ai-controller:~$</span>
                <span class="command">echo "Hello from {{ activeTerminal.name }}"</span>
              </div>
              <div class="mock-line output">
                Hello from {{ activeTerminal.name }}
              </div>
              <div class="mock-line">
                <span class="prompt">user@ai-controller:~$</span>
                <span class="command">pwd</span>
              </div>
              <div class="mock-line output">
                /home/user/workspace
              </div>
              <div class="mock-line">
                <span class="prompt">user@ai-controller:~$</span>
                <span class="cursor">█</span>
              </div>
            </div>
          </div>

          <div class="placeholder-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Terminal ID:</span>
                <span class="info-value">{{ activeTerminal.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">{{ activeTerminal.status }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span class="info-value">{{ formatFullTime(activeTerminal.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Active:</span>
                <span class="info-value">{{ activeTerminal.isActive ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTerminalManagerStore } from "~/stores/terminalManager";
import AppButton from "~/components/ui/AppButton.vue";
import { logger } from "~/utils/logger";

/**
 * Terminal Display Component
 *
 * Main display area that shows:
 * - Empty state when no terminal is selected
 * - Active terminal information and placeholder content
 * - Terminal management controls (reconnect, close)
 * - Mock terminal interface as placeholder for xterm.js
 */

const terminalStore = useTerminalManagerStore();

// Computed properties
const activeTerminal = computed(() => terminalStore.getActiveTerminal);
const canCreateTerminal = computed(() => terminalStore.canCreateTerminal);

/**
 * Create the first terminal from the empty state
 */
const createFirstTerminal = (): void => {
  if (!canCreateTerminal.value) return;

  try {
    const terminalId = terminalStore.createTerminal("Terminal 1");
    terminalStore.setActiveTerminal(terminalId);

    // Simulate connection after creation
    setTimeout(() => {
      terminalStore.updateTerminalStatus(terminalId, "connected");
    }, 500);
  } catch (error) {
    logger.error("Failed to create first terminal", { error: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * Reconnect the active terminal
 */
const reconnectTerminal = (): void => {
  if (!activeTerminal.value) return;

  const terminalId = activeTerminal.value.id;
  terminalStore.updateTerminalStatus(terminalId, "connecting");

  // Simulate reconnection
  setTimeout(() => {
    terminalStore.updateTerminalStatus(terminalId, "connected");
  }, 1000);
};

/**
 * Close the active terminal
 */
const closeTerminal = (): void => {
  if (!activeTerminal.value) return;

  terminalStore.removeTerminal(activeTerminal.value.id);
};

/**
 * Format terminal status for display
 * @param status - Terminal status
 * @returns Formatted status string
 */
const formatStatus = (status: string): string => {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    default:
      return status;
  }
};

/**
 * Format timestamp for display
 * @param date - Date to format
 * @returns Formatted time string
 */
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Format full timestamp for detailed display
 * @param date - Date to format
 * @returns Formatted date/time string
 */
const formatFullTime = (date: Date): string => {
  return date.toLocaleString();
};
</script>

<style scoped>
.terminal-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  overflow: hidden;
}

/* Empty state styles */
.no-terminal {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.no-terminal-content {
  text-align: center;
  max-width: 400px;
}

.no-terminal-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.6;
}

.no-terminal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.no-terminal-subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: 1.5;
}

.no-terminal-actions {
  display: flex;
  justify-content: center;
}

/* Active terminal styles */
.active-terminal {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.terminal-info {
  flex: 1;
}

.terminal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.terminal-badges {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.terminal-badge {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  background-color: var(--color-muted);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.terminal-id {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.terminal-status.status-connecting {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.terminal-status.status-connected {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.terminal-status.status-disconnected {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.terminal-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Terminal content area */
.terminal-content {
  flex: 1;
  padding: var(--spacing-md);
  overflow: hidden;
}

.terminal-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.placeholder-header {
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.placeholder-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.placeholder-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Mock terminal */
.mock-terminal {
  flex: 1;
  background-color: #1a1a1a;
  border-radius: var(--radius-md);
  overflow: hidden;
  font-family: var(--font-mono);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mock-toolbar {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.mock-buttons {
  display: flex;
  gap: var(--spacing-xs);
  margin-right: var(--spacing-md);
}

.mock-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
}

.mock-button--close {
  background-color: #ff5f56;
}

.mock-button--minimize {
  background-color: #ffbd2e;
}

.mock-button--maximize {
  background-color: #27ca3f;
}

.mock-title {
  font-size: var(--font-size-sm);
  color: #b0b0b0;
}

.mock-content {
  padding: var(--spacing-md);
  color: #e0e0e0;
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.mock-line {
  margin-bottom: var(--spacing-xs);
}

.prompt {
  color: #00ff00;
  font-weight: var(--font-weight-medium);
}

.command {
  color: #ffffff;
  margin-left: var(--spacing-sm);
}

.output {
  color: #d0d0d0;
  margin-left: var(--spacing-lg);
}

.cursor {
  color: #ffffff;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Placeholder info */
.placeholder-info {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .terminal-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .terminal-actions {
    justify-content: flex-end;
  }

  .terminal-badges {
    order: -1;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>