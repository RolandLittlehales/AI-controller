# Setup Guide

This guide will help you set up the AI Agent Manager development environment.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 10.0.0 or higher (recommended: 10.13.1)
- **Git**: Version 2.30.0 or higher (for worktree support)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/RolandLittlehales/AI-controller.git
cd AI-controller
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Install pnpm (if not already installed)

```bash
npm install -g pnpm@10.13.1
```

## Development

### Start Development Server

```bash
pnpm dev
```

This will start the Nuxt development server at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
# Check for linting errors
pnpm lint

# Fix linting errors
pnpm lint:fix
```

## Project Structure

```
ai-agent-manager/
├── .nuxt/                    # Nuxt build output (generated)
├── .output/                  # Production build output (generated)
├── assets/                   # Static assets (images, fonts, etc.)
├── components/               # Vue components
├── composables/              # Vue composables
├── docs/                     # Documentation
│   ├── architecture/         # Architecture documentation
│   └── setup.md             # This file
├── pages/                    # Vue pages (file-based routing)
├── public/                   # Static files served at root
├── server/                   # Nitro server files
│   ├── api/                  # API routes
│   ├── services/             # Business logic services
│   └── ws/                   # WebSocket handlers
├── stores/                   # Pinia stores
├── styles/                   # Global styles (vanilla-extract)
├── types/                    # TypeScript type definitions
├── app.vue                   # Main app component
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Key Dependencies

### Core Framework
- **Nuxt 3.17.7**: Full-stack Vue.js framework
- **Vue 3.5.17**: Progressive JavaScript framework
- **TypeScript 5.8.3**: Static type checking

### Terminal & Communication
- **@xterm/xterm 5.5.0**: Terminal emulator for web
- **@xterm/addon-fit 0.10.0**: Auto-resize terminal addon
- **@xterm/addon-web-links 0.11.0**: Clickable links addon
- **socket.io 4.8.1**: Real-time bidirectional communication
- **node-pty 1.0.0**: Fork pseudoterminals in Node.js

### Git Integration
- **simple-git 3.28.0**: Git operations in Node.js

### State Management
- **pinia 3.0.3**: Vue state management
- **@pinia/nuxt 0.11.1**: Nuxt integration for Pinia

### Styling
- **@vanilla-extract/css 1.17.4**: Zero-runtime CSS-in-JS
- **@vanilla-extract/vite-plugin 5.1.0**: Vite integration
- **@nuxt/ui 3.2.0**: UI components for Nuxt

### Development Tools
- **ESLint 9.31.0**: JavaScript/TypeScript linting
- **Prettier 3.6.2**: Code formatting
- **@nuxt/eslint 1.5.2**: Nuxt ESLint integration

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Development
NUXT_PORT=3000
NUXT_HOST=localhost

# Terminal Configuration
TERMINAL_DEFAULT_SHELL=/bin/bash
TERMINAL_DEFAULT_COLS=80
TERMINAL_DEFAULT_ROWS=24

# Git Configuration
GIT_DEFAULT_BRANCH=main
GIT_WORKSPACE_PATH=./workspace

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## Development Workflow

1. **Start with main branch**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

4. **Push and create PR**:
   ```bash
   git push -u origin feature/your-feature-name
   gh pr create --title "Your PR title" --body "PR description"
   ```

## Troubleshooting

### Common Issues

1. **pnpm not found**:
   ```bash
   npm install -g pnpm@10.13.1
   ```

2. **TypeScript errors**:
   ```bash
   pnpm typecheck
   ```

3. **Dependency issues**:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

4. **Build errors**:
   ```bash
   rm -rf .nuxt .output
   pnpm build
   ```

### Port Already in Use

If port 3000 is already in use:

```bash
# Use different port
pnpm dev --port 3001

# Or set environment variable
NUXT_PORT=3001 pnpm dev
```

### Performance Issues

1. **Clear Nuxt cache**:
   ```bash
   rm -rf .nuxt
   pnpm dev
   ```

2. **Restart TypeScript service** (in VS Code):
   - Press `Ctrl+Shift+P`
   - Type "TypeScript: Restart TS Server"

## IDE Setup

### VS Code Extensions

Recommended extensions for development:

- **Vue - Official**: Vue 3 support
- **TypeScript Importer**: Auto import for TypeScript
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **GitLens**: Git integration
- **Auto Rename Tag**: Rename paired HTML/XML tags

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "vue.server.hybridMode": true
}
```

## Next Steps

After completing the setup:

1. Review the [Architecture Overview](./architecture/architecture-overview.md)
2. Check the [Implementation Plan](./architecture/implementation-plan.md)
3. Understand the [Tech Stack](./architecture/tech-stack.md)
4. Start with Phase 1.2: Basic Terminal Integration

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [architecture documentation](./architecture/)
3. Create an issue on GitHub