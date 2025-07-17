<template>
  <div class="theme-test">
    <ThemeControls
      :is-dark-mode="isDarkMode"
      :toggle-theme="toggleTheme"
      :system-preference="systemPreference"
    />

    <main class="theme-main">
      <section class="demo-section">
        <h2>Color Adaptation</h2>
        <div class="color-grid">
          <div class="color-demo primary">
            <span>Primary</span>
            <small>{{ isDarkMode ? 'Lighter in dark' : 'Vibrant in light' }}</small>
          </div>
          <div class="color-demo surface">
            <span>Surface</span>
            <small>{{ isDarkMode ? 'Dark surface' : 'Light surface' }}</small>
          </div>
          <div class="color-demo text">
            <span>Text</span>
            <small>{{ isDarkMode ? 'Light text' : 'Dark text' }}</small>
          </div>
        </div>
      </section>

      <ButtonShowcase />
      <CardShowcase />
      <TerminalSection />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useThemeSettings } from "~/composables/useSettings";

import ThemeControls from "~/components/theme/ThemeControls.vue";
import ButtonShowcase from "~/components/theme/ButtonShowcase.vue";
import CardShowcase from "~/components/theme/CardShowcase.vue";
import TerminalSection from "~/components/theme/TerminalSection.vue";

const { isDarkMode, toggleTheme, systemPreference } = useThemeSettings();
</script>

<style scoped>
@import '~/assets/css/theme-test.css';
</style>
