<template>
  <div class="container">
    <header class="header">
      <h1>AI Agent Manager</h1>
      <p>A powerful web application for managing multiple terminal-based AI instances</p>
    </header>

    <main class="main">
      <div class="welcome">
        <h2>🚀 Welcome to AI Agent Manager</h2>
        
        <div class="features">
          <p>This application helps you manage multiple CLI-based AI tools with:</p>
          <ul>
            <li>Multi-terminal management</li>
            <li>Git worktree integration</li>
            <li>Real-time communication</li>
            <li>Session persistence</li>
          </ul>
        </div>

        <div class="status">
          <p>Version: 0.1.0</p>
          <p>Status: <span class="status-ready">Ready</span></p>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>Built with Nuxt 3, TypeScript, and vanilla-extract</p>
    </footer>
  </div>
</template>

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

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.header p {
  font-size: 1.125rem;
  color: #6b7280;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.welcome {
  max-width: 600px;
  text-align: center;
  background-color: white;
  padding: 3rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.welcome h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: #1f2937;
}

.features {
  margin-bottom: 2rem;
  text-align: left;
}

.features p {
  margin-bottom: 1rem;
  color: #374151;
}

.features ul {
  list-style-type: disc;
  margin-left: 2rem;
  color: #374151;
}

.features li {
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

.footer {
  padding: 1rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: white;
  border-top: 1px solid #e5e7eb;
}
</style>