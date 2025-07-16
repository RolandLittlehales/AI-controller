<template>
  <button :aria-pressed="isDarkMode" class="theme-toggle-btn" @click="toggleTheme">
    <span v-if="isDarkMode">☀️ Light Mode</span>
    <span v-else>🌙 Dark Mode</span>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";

const { isDarkMode, toggleTheme } = useTheme();

</script>

<style scoped>
.theme-toggle-btn {
  cursor: pointer;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: background var(--transition-fast);
}
.theme-toggle-btn:hover {
  background: var(--color-primary-hover);
}
</style>
