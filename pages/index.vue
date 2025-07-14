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
import Terminal from '~/components/Terminal.vue'
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #f9fafb;
  color: #111827;
}

.header {
  padding: 2rem 1.5rem;
  text-align: center;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.header-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  gap: 2rem;
}

.welcome-section {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  background-color: white;
  padding: 3rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: #1f2937;
}

.features {
  margin-bottom: 2rem;
  text-align: left;
}

.features-text {
  margin-bottom: 1rem;
  color: #374151;
}

.features-list {
  list-style-type: disc;
  margin-left: 2rem;
  color: #374151;
}

.features-list-item {
  margin-bottom: 0.5rem;
}

.status {
  font-size: 0.875rem;
  color: #6b7280;
}

.status-ready {
  color: #059669;
  font-weight: 600;
}

.terminal-section {
  flex: 1;
  min-height: 400px;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.footer {
  padding: 1rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: white;
  border-top: 1px solid #e5e7eb;
}

.terminal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
  font-style: italic;
}
</style>