<script setup lang="ts">
import { watch, onMounted } from "vue";
import { useThemeSettings } from "~/composables/useSettings";

const { isDarkMode } = useThemeSettings();

// Initial class set on mount
onMounted(() => {
  const html = document.documentElement;
  html.classList.toggle("dark-theme", isDarkMode.value);
  html.classList.toggle("light-theme", !isDarkMode.value);
  // Watch for changes and update classes dynamically
  watch(isDarkMode, (newVal) => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    html.classList.toggle("dark-theme", newVal);
    html.classList.toggle("light-theme", !newVal);
  });
});

</script>

<template>
  <div class="full-height">
    <slot />
  </div>
</template>
