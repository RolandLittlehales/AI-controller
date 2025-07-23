<template>
  <div
    class="sidebar"
    :class="{ 'collapsed': isCollapsed, 'expanded': !isCollapsed }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Toggle button -->
    <button
      class="toggle-btn"
      :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="toggleCollapsed"
    >
      <UIcon
        :name="isCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
        class="toggle-icon"
      />
    </button>

    <!-- Sidebar content -->
    <div class="sidebar-content">
      <!-- Theme switcher -->
      <div
        class="sidebar-item"
        role="button"
        tabindex="0"
        :aria-label="`Switch theme. Current: ${themeLabel}`"
        data-test="theme-switcher"
        @click="cycleTheme"
        @keydown.enter="cycleTheme"
        @keydown.space.prevent="cycleTheme"
      >
        <UIcon :name="themeIcon" class="item-icon" />
        <span class="item-label">{{ themeLabel }}</span>
      </div>

      <!-- Terminal/Home link -->
      <NuxtLink
        to="/"
        class="sidebar-item"
        aria-label="Go to Terminal page"
        data-test="terminal-link"
      >
        <UIcon name="i-heroicons-command-line" class="item-icon" />
        <span class="item-label">Terminal</span>
      </NuxtLink>

      <!-- Design system link -->
      <NuxtLink
        to="/design-system"
        class="sidebar-item"
        aria-label="Go to Design System page"
        data-test="design-system-link"
      >
        <UIcon name="i-heroicons-swatch" class="item-icon" />
        <span class="item-label">Design System</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useThemeSettings } from "~/composables/useSettings";

// Collapsible state
const isCollapsed = ref(true);
let hoverTimeout: NodeJS.Timeout | null = null;

// Theme settings
const { theme, systemPreference, setTheme } = useThemeSettings();

// Theme display logic
const themeIcon = computed(() => {
  const currentTheme = theme.value || "system";
  switch (currentTheme) {
    case "light": return "i-heroicons-sun";
    case "dark": return "i-heroicons-moon";
    case "system": return "i-heroicons-computer-desktop";
    default: return "i-heroicons-computer-desktop";
  }
});

const themeLabel = computed(() => {
  const currentTheme = theme.value || "system";
  switch (currentTheme) {
    case "light": return "Light Theme";
    case "dark": return "Dark Theme";
    case "system": return `System (${systemPreference.value})`;
    default: return "System Theme";
  }
});

// Actions
const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value;
};

const cycleTheme = async () => {
  const themes = ["system", "light", "dark"] as const;
  const currentTheme = theme.value || "system";
  const currentIndex = themes.indexOf(currentTheme as typeof themes[number]);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  if (nextTheme) {
    await setTheme(nextTheme);
  }
};

// Hover behavior for collapsed state
const handleMouseEnter = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
};

const handleMouseLeave = () => {
  // Clear any existing timeout to prevent memory leaks
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
};

// Cleanup
onUnmounted(() => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
});
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-slow), box-shadow var(--transition-slow);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 48px;
}

.sidebar.collapsed:hover,
.sidebar.collapsed.expanded {
  width: 200px;
  box-shadow: var(--shadow-lg);
}

.sidebar.expanded {
  width: 200px;
}

.toggle-btn {
  position: absolute;
  top: var(--spacing-md);
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  z-index: 101;
}

.toggle-btn:hover {
  background-color: var(--color-surface-secondary);
  transform: scale(1.1);
  border-color: var(--color-primary);
}

.toggle-icon {
  width: 12px;
  height: 12px;
  color: var(--color-text-secondary);
  transition: transform var(--transition-normal);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg) 0;
  margin-top: 40px; /* Space for toggle button */
  gap: var(--spacing-xs);
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--transition-normal);
  min-height: 44px; /* Ensure consistent height */
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin-right: var(--spacing-sm);
}

.sidebar-item:hover {
  background-color: var(--color-surface-secondary);
}

.item-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: color var(--transition-normal);
}

.sidebar-item:hover .item-icon {
  color: var(--color-primary);
}

.item-label {
  margin-left: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--transition-slow);
}

/* Hide labels when collapsed and not hovering */
.sidebar.collapsed:not(:hover) .item-label {
  opacity: 0;
  pointer-events: none;
}

/* Ensure labels show on hover */
.sidebar.collapsed:hover .item-label {
  opacity: 1;
}

/* Active link styling */
.sidebar-item.router-link-active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.sidebar-item.router-link-active .item-icon {
  color: var(--color-primary);
}

/* Focus states for accessibility */
.sidebar-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.toggle-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>