# AI Agent Manager

A powerful web application for managing multiple terminal-based AI instances with isolated Git worktrees and intelligent coordination capabilities.

## Overview

AI Agent Manager is a full-stack web application designed to streamline the management of multiple CLI-based AI tools (such as Claude Code, Cursor, and other terminal-based AI assistants). It provides a unified interface for spawning, monitoring, and coordinating AI agents while maintaining isolated development environments through Git worktrees.

## Key Features

### 🚀 Core Functionality
- **Multi-Terminal Management**: Spawn and manage multiple terminal instances simultaneously
- **Git Worktree Integration**: Automatic isolation of each AI agent in separate Git worktrees
- **Real-time Communication**: WebSocket-based terminal I/O for responsive interaction
- **Session Persistence**: Maintain terminal sessions across browser refreshes

### 🤖 AI Agent Coordination
- **Agent Dashboard**: Centralized view of all active AI agents and their status
- **Terminal Monitoring**: Real-time view of terminal output and activity
- **Process Management**: Start, stop, and restart AI agents with proper cleanup

### 📋 Phase 2 Features (Planned)
- **AI Manager Terminal**: Special terminal instance that can interact with other terminals
- **Cross-Terminal Communication**: Manager can read from and write to other terminal instances
- **Automated Coordination**: Intelligent orchestration of multiple AI agents

## Use Cases

- **Development Teams**: Coordinate multiple AI assistants working on different features
- **Code Review**: Run AI agents in parallel for comprehensive code analysis
- **Testing & QA**: Manage AI agents for automated testing and quality assurance
- **Project Management**: Oversee multiple AI agents handling different aspects of a project

## Tech Stack

- **Frontend**: Vue 3 + Nuxt 3 with TypeScript
- **Backend**: Nitro server with integrated WebSocket support
- **Terminal**: xterm.js for web-based terminal emulation
- **Process Management**: node-pty for spawning terminal processes
- **Git Integration**: simple-git for worktree management
- **Styling**: vanilla-extract for type-safe CSS-in-JS
- **State Management**: Pinia for Vue state management

## Architecture

The application uses a unified full-stack architecture with Nuxt 3, providing:
- Server-side terminal process management for reliability
- Real-time WebSocket communication for terminal I/O
- Git worktree isolation for each AI agent
- Type-safe development experience with TypeScript

## Quick Start

```bash
# Clone the repository
git clone https://github.com/RolandLittlehales/AI-controller.git
cd AI-controller

# Install dependencies (requires pnpm 10.0.0+)
pnpm install

# IMPORTANT: Rebuild native bindings for node-pty
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
cd -

# Start development server
pnpm dev
```

### Troubleshooting

If you encounter the error `Cannot find module '../build/Release/pty.node'`, you need to rebuild node-pty:
```bash
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
```

**Note:** We use `npm rebuild` here instead of `pnpm rebuild` because node-pty's build scripts specifically expect npm's rebuild behavior for compiling native bindings.

For detailed setup instructions, see the [Setup Guide](docs/setup.md).

## Documentation

Comprehensive documentation is available in the `docs/` directory:
- [Setup Guide](docs/setup.md) - Development environment setup
- [Architecture Overview](docs/architecture/architecture-overview.md)
- [Tech Stack Details](docs/architecture/tech-stack.md)
- [Implementation Plan](docs/architecture/implementation-plan.md)
- [Dependencies Analysis](docs/architecture/dependencies.md)

## Development Status

This project is currently in active development. See the [implementation plan](docs/architecture/implementation-plan.md) for detailed development phases and progress.

## Contributing

This project is designed to be developed primarily by AI agents. The architecture and documentation are optimized for AI-assisted development workflows.

## License

[License information to be added]
