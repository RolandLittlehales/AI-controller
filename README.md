# AI Agent Manager

> Web application for managing multiple terminal-based AI instances with Git worktree isolation

## Quick Start

```bash
# Clone and install
git clone https://github.com/RolandLittlehales/AI-controller.git
cd AI-controller
pnpm install

# IMPORTANT: Rebuild native bindings
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
cd -

# Start development
pnpm dev
```

## Tech Stack

- **Nuxt 3** - Full-stack Vue framework
- **xterm.js** - Terminal emulation
- **node-pty** - Terminal process management  
- **Socket.IO** - Real-time communication
- **Vitest** - Testing framework
- **TypeScript** - Type safety

## Features

- **Multi-Terminal Management** - Spawn and manage multiple terminal instances
- **Git Worktree Integration** - Isolated development environments  
- **Real-time Communication** - WebSocket-based terminal I/O
- **Session Persistence** - Maintain sessions across refreshes

## Development

```bash
# Quality gates (must pass before commit)
pnpm test        # Run tests
pnpm lint        # Check linting
pnpm typecheck   # Check TypeScript
pnpm build       # Production build
```

## Documentation

See the `docs/` directory for comprehensive guides:
- [Setup Guide](docs/setup.md)
- [Architecture Overview](docs/architecture/architecture-overview.md)
- [Tech Stack Details](docs/architecture/tech-stack.md)
- [Dependencies Analysis](docs/architecture/dependencies.md)
- [Implementation Plan](docs/architecture/implementation-plan.md)

## License

[License information to be added]
