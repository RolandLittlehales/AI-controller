<script setup lang="ts">
import { watch, onMounted } from "vue";
import { useThemeSettings } from "~/composables/useSettings";
import AppSidebar from "~/components/ui/AppSidebar.vue";

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
  <div class="layout-container">
    <AppSidebar />
    <div class="main-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin-left: 48px; /* Default collapsed sidebar width */
  transition: margin-left 0.3s ease;
  overflow: auto;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0; /* No margin on mobile, sidebar will overlay */
  }
}
</style>
