<template>
  <div class="container">
    <header class="header">
      <h1 class="header-title">AI Agent Manager</h1>
      <p class="header-subtitle">A powerful web application for managing multiple terminal-based AI instances</p>
    </header>

    <main class="main">
      <div class="welcome-section">
        <h2 class="welcome-title">🚀 Welcome to AI Agent Manager</h2>

        <div class="features">
          <p class="features-text">This application helps you manage multiple CLI-based AI tools with:</p>
          <ul class="features-list">
            <li class="features-list-item">Multi-terminal management</li>
            <li class="features-list-item">Git worktree integration</li>
            <li class="features-list-item">Real-time communication</li>
            <li class="features-list-item">Session persistence</li>
          </ul>
        </div>

        <div class="status">
          <p>Version: 0.1.0</p>
          <p>Status: <span class="status-ready">Ready</span></p>
        </div>
      </div>

      <div class="terminal-section">
        <ClientOnly>
          <Terminal :auto-connect="true" />
          <template #fallback>
            <div class="terminal-loading">
              <p>Loading terminal...</p>
            </div>
          </template>
        </ClientOnly>
      </div>
    </main>

    <footer class="footer">
      <p>Built with Nuxt 3, TypeScript, and vanilla-extract</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Terminal from "~/components/Terminal.vue";
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.header {
  padding: var(--spacing-2xl) var(--spacing-xl);
  text-align: center;
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-secondary) 100%);
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

.header-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-2xl) var(--spacing-xl);
  gap: var(--spacing-2xl);
}

.welcome-section {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  background-color: var(--color-surface);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
}

.welcome-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
}

.features {
  margin-bottom: var(--spacing-2xl);
  text-align: left;
}

.features-text {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.features-list {
  list-style-type: disc;
  margin-left: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.features-list-item {
  margin-bottom: var(--spacing-sm);
}

.status {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.status-ready {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.terminal-section {
  flex: 1;
  min-height: 600px;
  height: 600px;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-secondary) 100%);
  border-top: 1px solid var(--color-border);
}

.terminal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>