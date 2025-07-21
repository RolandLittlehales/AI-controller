<template>
  <div>
    <!-- Startup cleanup indicator (non-blocking, subtle) -->
    <Transition name="fade">
      <div v-if="showStartupIndicator" class="startup-indicator">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
        <span>Cleaning up...</span>
      </div>
    </Transition>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from "vue";
import { useStartupCleanup } from "~/composables/useStartupCleanup";
import { useTerminalManagerStore } from "~/stores/terminalManager";
import { CLEANUP_INDICATOR_HIDE_DELAY_MS } from "~/utils/constants";

// Global styles imported via nuxt.config.ts

// Basic head setup
useHead({
  title: "AI Agent Manager",
  meta: [
    { name: "description", content: "A powerful web application for managing multiple terminal-based AI instances" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
});

// Startup cleanup indicator
const showStartupIndicator = ref(false);
const { isRunning } = useStartupCleanup();

// Restore terminals on app startup
onMounted(async () => {
  const terminalStore = useTerminalManagerStore();

  // Restore terminals from persistence
  await terminalStore.restoreTerminalsFromPersistence();
});

// Watch cleanup status reactively and manage indicator
watchEffect(() => {
  if (isRunning.value && !showStartupIndicator.value) {
    showStartupIndicator.value = true;
  } else if (!isRunning.value && showStartupIndicator.value) {
    // Hide indicator after cleanup completes
    setTimeout(() => {
      showStartupIndicator.value = false;
    }, CLEANUP_INDICATOR_HIDE_DELAY_MS);
  }
});
</script>

<style scoped>
.startup-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border-secondary);
  border-radius: 6px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ui-text-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>