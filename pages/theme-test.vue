<template>
  <div class="theme-test" :class="{ 'dark-theme': isDarkMode }">
    <header class="theme-header">
      <h1 class="theme-title">Theme System Test</h1>
      <p class="theme-subtitle">Light & Dark Mode Demonstration</p>
      
      <div class="theme-controls">
        <UButton 
          :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          size="sm"
          data-testid="theme-toggle"
          @click="toggleTheme"
        >
          {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
        </UButton>
        
        <p class="system-note">
          System preference: 
          <span class="system-preference">{{ systemPreference }}</span>
        </p>
      </div>
    </header>

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

      <section class="demo-section">
        <h2>Components in Both Themes</h2>
        <div class="components-grid">
          <div class="component-demo">
            <h3>Buttons</h3>
            <div class="button-group">
              <UButton color="primary" size="xs">Primary</UButton>
              <UButton color="gray" size="xs">Secondary</UButton>
              <UButton color="red" size="xs">Error</UButton>
            </div>
          </div>
          
          <div class="component-demo">
            <h3>Cards</h3>
            <div class="card-demo">
              <h4>Sample Card</h4>
              <p>This card adapts to both light and dark themes automatically.</p>
              <span class="status-ready">Status: Ready</span>
            </div>
          </div>
        </div>
      </section>

      <section class="demo-section terminal-section">
        <h2>Terminal Component</h2>
        <p class="terminal-note">
          The terminal maintains its dark appearance for optimal readability in both themes.
        </p>
        <div class="terminal-wrapper">
          <Terminal :auto-connect="false" />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Terminal from '~/components/Terminal.vue'

// Theme test page for demonstrating light/dark mode switching

// Theme state
const isDarkMode = ref(false)

// System preference detection
const systemPreference = computed(() => {
  if (typeof window === 'undefined') return 'Unknown'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'
})

// Toggle theme
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
}

// Initialize theme based on system preference
onMounted(() => {
  if (typeof window !== 'undefined') {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
})
</script>

<style scoped>
.theme-test {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  transition: all var(--transition-slow);
}

.theme-header {
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-secondary) 100%);
  border-bottom: 1px solid var(--color-border);
}

.theme-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

.theme-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.theme-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.system-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.system-preference {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.theme-main {
  padding: var(--spacing-2xl);
}

.demo-section {
  background: var(--color-surface);
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
}

.demo-section h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-primary);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.color-demo {
  padding: var(--spacing-xl);
  border-radius: var(--radius-md);
  text-align: center;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.color-demo span {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.color-demo small {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.color-demo.primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.color-demo.surface {
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
}

.color-demo.text {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.component-demo h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.card-demo {
  background: var(--color-surface-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.card-demo h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.card-demo p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.status-ready {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.terminal-section {
  max-width: none;
}

.terminal-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  font-style: italic;
}

.terminal-wrapper {
  height: 400px;
}

/* Dark theme class for manual override */
.dark-theme {
  --color-primary: var(--color-lavender-400);
  --color-primary-hover: var(--color-lavender-200);
  --color-primary-light: var(--color-lavender-600);
  
  --color-background: #0f0f23;
  --color-surface: #1a1b2e;
  --color-surface-secondary: #252640;
  
  --color-border: var(--color-lavender-800);
  --color-border-light: var(--color-lavender-700);
  
  --color-text-primary: #e5e7eb;
  --color-text-secondary: #9ca3af;
  --color-text-on-primary: #1f2937;
  
  --color-success: #10b981;
  --color-warning: #fbbf24;
  --color-error: #ef4444;
  
  --terminal-bg: #1a1b2e;
  --terminal-header-bg: var(--color-surface-secondary);
  --terminal-text: #e5e7eb;
  --terminal-border: var(--color-border);
}
</style>