<template>
  <div class="terminal-sidebar">
    <ResourceMonitor />

    <div class="sidebar-header">
      <h3 class="sidebar-title">Terminals</h3>
      <AppButton
        icon="i-heroicons-plus"
        size="sm"
        variant="primary"
        :disabled="!canCreateTerminal"
        :title="getCreateButtonTitle()"
        @click="showCreateModal = true"
      >
        New
      </AppButton>
    </div>

    <div class="terminal-list">
      <div
        v-for="terminal in terminalList"
        :key="terminal.id"
        :class="[
          'terminal-item',
          { 'terminal-item--active': terminal.isActive }
        ]"
        @click="setActiveTerminal(terminal.id)"
      >
        <div class="terminal-header">
          <span class="terminal-name">{{ terminal.name }}</span>
          <div class="terminal-controls">
            <span :class="`status-${terminal.status}`" class="status-dot" />
            <AppButton
              icon="i-heroicons-x-mark"
              size="xs"
              variant="secondary"
              :title="`Close ${terminal.name}`"
              @click.stop="removeTerminal(terminal.id)"
            />
          </div>
        </div>

        <div class="terminal-meta">
          <span class="terminal-id">{{ terminal.id.slice(0, 8) }}</span>
          <span class="created-time">{{ formatTime(terminal.createdAt) }}</span>
          <span v-if="terminal.git?.hasWorktree" class="git-info" :title="`Git: ${terminal.git.branchName}`">
            🌿 {{ terminal.git.branchName }}
          </span>
        </div>
      </div>

      <!-- Empty state when no terminals -->
      <div v-if="terminalList.length === 0" class="empty-state">
        <div class="empty-icon">⚡</div>
        <p class="empty-text">No terminals created yet</p>
        <p class="empty-subtitle">Click "New" to create your first terminal</p>
      </div>
    </div>

    <!-- Terminal Creation Modal -->
    <CreateTerminalModal
      v-model="showCreateModal"
      @terminal-created="handleTerminalCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useTerminalManagerStore } from "~/stores/terminalManager";
import ResourceMonitor from "./ResourceMonitor.vue";
import CreateTerminalModal from "./CreateTerminalModal.vue";
import AppButton from "~/components/ui/AppButton.vue";

/**
 * Terminal Sidebar Component
 *
 * Provides a sidebar interface for terminal management:
 * - Resource monitoring display
 * - Terminal creation with system limit enforcement
 * - Terminal list with switching capabilities
 * - Terminal removal controls
 * - Visual status indicators
 */

const terminalStore = useTerminalManagerStore();

// Local state
const showCreateModal = ref(false);

// Computed properties
const terminalList = computed(() => Array.from(terminalStore.getAllTerminals));
const canCreateTerminal = computed(() => terminalStore.canCreateTerminal);

/**
 * Handle terminal creation from modal
 * @param terminalId - ID of the created terminal
 */
const handleTerminalCreated = (terminalId: string): void => {
  // Simulate brief connection delay for better UX
  setTimeout(() => {
    terminalStore.updateTerminalStatus(terminalId, "connected");
  }, 500);
};

/**
 * Set the active terminal
 * @param terminalId - ID of terminal to activate
 */
const setActiveTerminal = (terminalId: string): void => {
  terminalStore.setActiveTerminal(terminalId);
};

/**
 * Remove a terminal with confirmation for safety
 * @param terminalId - ID of terminal to remove
 */
const removeTerminal = (terminalId: string): void => {
  const terminal = terminalStore.getTerminal(terminalId);
  if (!terminal) return;

  // In the future, we might want to add a confirmation dialog for active terminals
  // For now, allow immediate removal
  terminalStore.removeTerminal(terminalId);
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
 * Get tooltip text for create button based on current state
 * @returns Tooltip text
 */
const getCreateButtonTitle = (): string => {
  if (!canCreateTerminal.value) {
    return `Maximum terminals reached (${terminalStore.terminalCount}/limit)`;
  }
  return "Create new terminal";
};
</script>

<style scoped>
.terminal-sidebar {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 250px;
  max-width: 400px;
  height: 100%;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.sidebar-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.terminal-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.terminal-item {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.terminal-item:hover {
  background-color: var(--color-surface);
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.terminal-item--active {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
}

.terminal-item--active .terminal-name {
  color: var(--color-primary-dark);
  font-weight: var(--font-weight-semibold);
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.terminal-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-connecting {
  background-color: var(--color-warning);
  animation: pulse 2s infinite;
}

.status-connected {
  background-color: var(--color-success);
}

.status-disconnected {
  background-color: var(--color-danger);
}

.terminal-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.terminal-id {
  font-family: var(--font-mono);
  background-color: var(--color-muted);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.created-time {
  font-size: var(--font-size-xs);
}

.git-info {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-success-light);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.empty-subtitle {
  font-size: var(--font-size-xs);
  margin: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .terminal-sidebar {
    width: 250px;
    min-width: 200px;
  }

  .sidebar-header {
    padding: var(--spacing-sm);
  }

  .terminal-list {
    padding: var(--spacing-xs);
  }
}
</style>