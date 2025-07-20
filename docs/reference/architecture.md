# Architecture Overview

**System architecture and component relationships**

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                        │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Vue Components │  │  Composables │  │  Pinia Stores   │ │
│  │                 │  │              │  │                 │ │
│  │ • Terminal.vue  │  │ • useTerminal│  │ • terminalMgr   │ │
│  │ • CreateModal   │  │ • useWebSocket│  │ • settings      │ │
│  │ • StatusBar     │  │ • useGitRepo │  │ • gitRepo       │ │
│  └─────────────────┘  └──────────────┘  └─────────────────┘ │
│           │                     │                     │     │
│           └─────────────────────┼─────────────────────┘     │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │            WebSocket / HTTP          │
              └───────────────────┼───────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                    Nuxt Server (SSR + API)                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   API Routes    │  │   Services   │  │   WebSocket     │ │
│  │                 │  │              │  │                 │ │
│  │ • /api/health   │  │ • terminal   │  │ • /api/ws/      │ │
│  │ • /api/terminals│  │ • git        │  │   terminal      │ │
│  │ • /api/git/*    │  │ • settings   │  │                 │ │
│  └─────────────────┘  └──────────────┘  └─────────────────┘ │
│           │                     │                     │     │
│           └─────────────────────┼─────────────────────┘     │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │              OS Layer               │
              └───────────────────┼───────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────┐
│                System Resources                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   node-pty      │  │  File System │  │  Git Repos      │ │
│  │                 │  │              │  │                 │ │
│  │ • bash/cmd      │  │ • settings   │  │ • local repos   │ │
│  │ • shell procs   │  │ • logs       │  │ • worktrees     │ │
│  │ • PTY devices   │  │ • temp files │  │ • branches      │ │
│  └─────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 Component Layers

### 1. Presentation Layer (Vue Components)
**Location**: `components/`

- **Terminal.vue** - Main terminal interface with xterm.js integration
- **CreateTerminalModal.vue** - Terminal creation form
- **TerminalTabs.vue** - Multi-terminal tab management
- **StatusBar.vue** - System resource monitoring
- **GitRepositorySelector.vue** - Git repository selection

**Responsibilities**:
- User interface rendering
- User interaction handling
- State display and updates
- Component lifecycle management

### 2. Logic Layer (Composables)
**Location**: `composables/`

- **useTerminalState.ts** - Terminal connection management
- **useWebSocket.ts** - WebSocket communication
- **useGitRepository.ts** - Git repository operations
- **useSavedDirectories.ts** - Directory preferences
- **useSystemResources.ts** - System monitoring

**Responsibilities**:
- Business logic implementation
- State management coordination
- API communication
- Cross-component functionality

### 3. State Layer (Pinia Stores)
**Location**: `stores/`

- **terminalManager.ts** - Multi-terminal state
- **settings.ts** - User preferences
- **gitRepository.ts** - Git state management

**Responsibilities**:
- Centralized state management
- State persistence
- Cross-tab synchronization
- State transformation

### 4. API Layer (Nitro Routes)
**Location**: `server/api/`

- **health.get.ts** - Health check endpoint
- **terminals/[id].{get,delete}.ts** - Terminal CRUD operations
- **terminals/index.{get,post}.ts** - Terminal listing/creation
- **git/validate.post.ts** - Git repository validation
- **ws/terminal.ts** - WebSocket handler

**Responsibilities**:
- HTTP request handling
- Input validation
- Business logic coordination
- Response formatting

### 5. Service Layer
**Location**: `server/services/`

- **terminal.ts** - Terminal process management
- **git.ts** - Git operations
- **settings.ts** - Configuration management

**Responsibilities**:
- Core business logic
- External system integration
- Resource management
- Error handling

### 6. Infrastructure Layer
**Location**: `utils/`, config files

- **logger.ts** - Structured logging
- **validation.ts** - Input validation utilities
- **memfs setup** - Test file system
- **CSS tokens** - Design system foundation

**Responsibilities**:
- Cross-cutting concerns
- Utility functions
- Configuration management
- Development tooling

## 🔄 Data Flow Patterns

### Terminal Creation Flow
```
1. User clicks "Create Terminal" button
   └── CreateTerminalModal.vue

2. Form submission
   └── useTerminalApi.createTerminal()

3. HTTP POST request
   └── /api/terminals → terminal.post.ts

4. Service layer processing
   └── terminalService.createTerminal()

5. PTY process creation
   └── node-pty.spawn()

6. State updates
   └── terminalManagerStore.addTerminal()

7. UI updates
   └── Terminal.vue renders new terminal
```

### WebSocket Communication Flow
```
1. Component mounts
   └── Terminal.vue → onMounted()

2. WebSocket connection
   └── useWebSocket.connect()

3. Message handling
   ├── Client → Server: terminal-input
   ├── Server → Client: terminal-output
   └── Server → Client: terminal-status

4. State synchronization
   └── Composables update component state

5. UI updates
   └── Reactive state triggers re-renders
```

### Git Repository Integration Flow
```
1. User selects repository
   └── GitRepositorySelector.vue

2. Repository validation (Phase 2A: Client-side)
   └── useGitRepository.validateRepository()

3. Directory saving
   └── useSavedDirectories.addDirectory()

4. Terminal creation with context
   └── terminalService.create({ workingDirectory })

5. Future Phase 2B: Server-side git operations
   └── /api/git/* endpoints
```

## 🎯 Phase-Based Architecture

### Phase 2A Implementation (Current)
- ✅ **Client-side git validation** - Basic repository detection
- ✅ **localStorage persistence** - Temporary saved directories
- ✅ **Terminal UI integration** - Git-aware terminal creation
- ✅ **Manual repository selection** - File system browsing

### Phase 2B Implementation (Future)
- 🔄 **Server-side git operations** - Full git command integration
- 🔄 **Settings service** - Replace localStorage with proper persistence
- 🔄 **Worktree management** - Branch-specific working directories
- 🔄 **Automatic git detection** - Smart repository discovery

## 🔐 Security Architecture

### Input Validation Layers
1. **Client-side validation** - Immediate feedback and UX
2. **API route validation** - Server-side input sanitization
3. **Service layer validation** - Business rule enforcement
4. **System-level protection** - OS and file system security

### Security Boundaries
```
Internet
    │
    ▼
┌─────────────────┐
│   Nuxt Server   │ ← Validates all inputs
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Services      │ ← Enforces business rules
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ OS/File System  │ ← System-level protections
└─────────────────┘
```

### Terminal Security
- **Path sanitization** - Prevent directory traversal
- **Command filtering** - Block dangerous operations
- **Resource limits** - CPU and memory constraints
- **Process isolation** - Separate PTY processes

## 📊 Performance Architecture

### Frontend Performance
- **Component lazy loading** - Dynamic imports for large components
- **State optimization** - Efficient reactive updates
- **Bundle splitting** - Separate vendor and app code
- **CSS optimization** - Vanilla Extract for atomic CSS

### Backend Performance
- **Connection pooling** - Efficient WebSocket management
- **Process management** - Terminal lifecycle optimization
- **Memory monitoring** - Automatic cleanup of inactive terminals
- **Caching strategies** - Static asset and API response caching

### Resource Management
```
System Resources
├── CPU Cores: Reserve 25% for system
├── Memory: Monitor per-terminal usage
└── File Handles: Cleanup on terminal close

Terminal Limits
├── Max Terminals: Based on CPU cores
├── Inactive Timeout: 30 minutes
└── Resource Monitoring: Real-time tracking
```

## 🧪 Testing Architecture

### Test Layer Distribution
```
Unit Tests (20%)
├── Utility functions
├── Validation logic
└── Pure computations

Integration Tests (60%)
├── Component behavior
├── Store interactions
├── API endpoints
└── Service coordination

End-to-End Tests (20%)
├── Complete user journeys
├── WebSocket communication
└── Terminal functionality
```

### Test Environment Setup
- **Mocked externals** - node-pty, @xterm/*, WebSocket
- **Real internals** - Services, components, business logic
- **memfs integration** - In-memory file system for tests
- **Global setup** - Consistent mock configuration

## 🔧 Development Architecture

### Build Pipeline
```
Source Code
    │
    ▼ TypeScript Compilation
Type-checked Code
    │
    ▼ Vue SFC Processing
Component Code
    │
    ▼ Vanilla Extract CSS
Styled Components
    │
    ▼ Nitro Server Build
Server Bundle
    │
    ▼ Client Bundle
Production Build
```

### Quality Gates
```
Code Changes
    │
    ▼ ESLint
Lint Validation
    │
    ▼ TypeScript
Type Checking
    │
    ▼ Vitest
Test Execution
    │
    ▼ Build Process
Production Readiness
```

## 🗂️ File Organization Principles

### Domain-Driven Structure
```
/components
├── /terminal          # Terminal-specific components
├── /git              # Git-related components  
├── /ui               # Reusable UI components
└── /layout           # Layout components

/composables
├── use*Terminal*     # Terminal functionality
├── use*Git*          # Git functionality
└── use*System*       # System utilities

/stores
├── terminalManager   # Terminal state
├── gitRepository     # Git state
└── settings          # User preferences
```

### Co-location Strategy
- Tests next to source files
- Styles next to components
- Types close to usage
- Documentation with implementation

---

**🔗 Related Documentation:**
- **Implementation Guides** → `docs/implementation/`
- **Development Standards** → `docs/standards/`
- **Code Patterns** → `docs/reference/code-patterns.md`