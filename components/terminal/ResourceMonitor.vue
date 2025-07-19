<template>
  <div class="resource-monitor">
    <div class="resource-header">
      <h4 class="resource-title">System Resources</h4>
      <div class="resource-indicator" :class="getIndicatorClass()">
        {{ activeTerminals }}/{{ maxTerminals }}
      </div>
    </div>

    <div class="resource-details">
      <div class="resource-row">
        <span class="resource-label">Active Terminals:</span>
        <span class="resource-value">{{ activeTerminals }}</span>
      </div>
      <div class="resource-row">
        <span class="resource-label">Available Slots:</span>
        <span class="resource-value">{{ maxTerminals }}</span>
      </div>
      <div class="resource-row">
        <span class="resource-label">Total CPU Cores:</span>
        <span class="resource-value">{{ totalCores }}</span>
      </div>
    </div>

    <div class="resource-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${usagePercentage}%` }"
          :class="getProgressClass()"
        />
      </div>
      <span class="progress-text">
        {{ usagePercentage }}% of available slots
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSystemResources } from "~/composables/useSystemResources";
import { useTerminalManagerStore } from "~/stores/terminalManager";

/**
 * Resource Monitor Component
 *
 * Displays current terminal usage and system resource information:
 * - Real-time terminal count vs max capacity
 * - CPU core information
 * - Visual progress bar with color coding
 * - Dynamic usage percentage calculation
 */

const terminalStore = useTerminalManagerStore();
const systemResources = useSystemResources();

// Reactive computed properties
const activeTerminals = computed(() => terminalStore.terminalCount);
const maxTerminals = computed(() => systemResources.systemInfo.value.maxTerminals);
const totalCores = computed(() => systemResources.systemInfo.value.totalCores);
const usagePercentage = computed(() => {
  if (maxTerminals.value === 0) return 0;
  return Math.round((activeTerminals.value / maxTerminals.value) * 100);
});

/**
 * Get CSS class for resource indicator based on usage percentage
 * @returns CSS class name for indicator styling
 */
const getIndicatorClass = (): string => {
  const usage = usagePercentage.value;
  if (usage < 50) return "indicator-safe";
  if (usage < 80) return "indicator-warning";
  return "indicator-danger";
};

/**
 * Get CSS class for progress bar based on usage percentage
 * @returns CSS class name for progress bar styling
 */
const getProgressClass = (): string => {
  const usage = usagePercentage.value;
  if (usage < 50) return "progress-safe";
  if (usage < 80) return "progress-warning";
  return "progress-danger";
};

// Initialize system resources on component mount
onMounted(() => {
  systemResources.detectSystemCapability();
});
</script>

<style scoped>
.resource-monitor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.resource-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.resource-indicator {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.indicator-safe {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.indicator-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.indicator-danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.resource-details {
  margin-bottom: var(--spacing-sm);
}

.resource-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.resource-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.resource-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.resource-progress {
  margin-top: var(--spacing-sm);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-muted);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: var(--radius-sm);
}

.progress-safe {
  background-color: var(--color-success);
}

.progress-warning {
  background-color: var(--color-warning);
}

.progress-danger {
  background-color: var(--color-danger);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  display: block;
}
</style>