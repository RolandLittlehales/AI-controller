# TypeScript Standards for AI-Controller

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2025-07-16

## Table of Contents

1. [Introduction](#introduction)
2. [Scope](#scope)
3. [Standards Overview](#standards-overview)
4. [TypeScript Configuration](#typescript-configuration)
5. [Type Safety Requirements](#type-safety-requirements)
6. [Interface Design Standards](#interface-design-standards)
7. [External Library Integration](#external-library-integration)
8. [Vue 3 + TypeScript Integration](#vue-3--typescript-integration)
9. [Server-Side TypeScript (Nitro)](#server-side-typescript-nitro)
10. [Testing Standards](#testing-standards)
11. [Code Quality Gates](#code-quality-gates)
12. [Migration Guidelines](#migration-guidelines)
13. [Examples](#examples)
14. [References](#references)

## Introduction

This document establishes comprehensive TypeScript standards for the AI-Controller project to ensure type safety, maintainability, and consistency across the codebase. These standards address current type safety gaps and establish strict TypeScript development practices.

### Key Words

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## Scope

This document covers:
- TypeScript configuration and compiler settings
- Type safety requirements and best practices
- Interface design and external library typing
- Vue 3 Composition API with TypeScript
- Server-side TypeScript in Nitro environment
- Testing standards with TypeScript
- Code quality gates and migration guidelines

## Standards Overview

### Core Principles

1. **Zero `any` Tolerance**: All `any` types MUST be eliminated from the codebase
2. **Strict Type Safety**: TypeScript strict mode MUST be enabled with additional strictness flags
3. **Explicit Interfaces**: All external library integrations MUST use explicit TypeScript interfaces
4. **Type Guards**: Runtime type checking MUST be implemented using TypeScript type guards
5. **Consistent Patterns**: TypeScript patterns MUST be consistent across Vue components and server code

## TypeScript Configuration

### Required Configuration

The following TypeScript configuration MUST be maintained in `tsconfig.json`:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "useDefineForClassFields": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

### Rationale

- **`strict: true`**: Enables all strict type checking options
- **`noUncheckedIndexedAccess: true`**: Prevents accessing array/object properties without bounds checking
- **`exactOptionalPropertyTypes: true`**: Ensures optional properties cannot be explicitly set to `undefined`
- **`noImplicitAny: true`**: Prevents implicit `any` types
- **`isolatedModules: true`**: Required for Nuxt 3 and build optimization

### Additional Required Flags

The following flags MUST be enabled to enhance type safety:

- `noImplicitOverride`: Requires explicit `override` keyword for overridden methods
- `noImplicitReturns`: Ensures all code paths return a value
- `noFallthroughCasesInSwitch`: Prevents fall-through in switch statements
- `noUncheckedSideEffectImports`: Prevents side-effect imports without explicit intent

## Type Safety Requirements

### Elimination of `any` Types

All `any` types MUST be replaced with proper TypeScript interfaces or type assertions.

**❌ FORBIDDEN:**
```typescript
const terminal: any = new Terminal();
const data: any = message.data;
```

**✅ REQUIRED:**
```typescript
const terminal: XTerminalInstance = new Terminal(terminalConfig);
const data: WebSocketMessageData = message.data as WebSocketMessageData;
```

### Type Assertions

When type assertions are necessary, they MUST follow the `as unknown as TargetType` pattern for maximum type safety:

```typescript
// Correct type assertion pattern
const Terminal = xterm.Terminal as unknown as XTerminalConstructor;
const fitAddon = fitAddon.FitAddon as unknown as XTermFitAddonConstructor;
```

### Runtime Type Guards

All dynamic data MUST be validated using TypeScript type guards:

```typescript
// Required type guard pattern
function isTerminalDataMessage(message: WebSocketMessage): message is WebSocketMessage & { data: { output: string } } {
  return message.type === "terminal-data" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "output" in message.data &&
         typeof message.data.output === "string";
}

// Usage
if (isTerminalDataMessage(message)) {
  // message.data.output is now properly typed
  terminal.write(message.data.output);
}
```

### Browser Compatibility Checks

All browser-specific APIs MUST be checked for availability:

```typescript
// Required pattern for browser API usage
const cwd = props.cwd || (typeof process !== "undefined" && process.cwd?.() || "/");

// For file system operations
if (typeof window === "undefined") {
  // Server-side code
} else {
  // Browser-side code
}
```

## Interface Design Standards

### Comprehensive Interface Definition

All interfaces MUST be comprehensive and include all required properties:

```typescript
// Example: Complete interface for external library
interface XTerminalInstance {
  [key: string]: unknown; // Allow for additional properties
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  onResize(callback: (size: { cols: number; rows: number }) => void): void;
  focus(): void;
  loadAddon(addon: unknown): void;
}
```

### Interface Naming Conventions

1. **Interfaces**: PascalCase with descriptive names
2. **Generic Types**: Single uppercase letter or descriptive name
3. **Union Types**: Use `|` for simple unions, separate type for complex ones

```typescript
// Good interface naming
interface TerminalInstance {
  id: string;
  pty: IPty;
  metadata: Terminal;
  isActive: boolean;
}

// Good union type
type AgentStatus = "idle" | "running" | "stopped" | "error" | "restarting" | "initializing";
```

### Generic Types

Generic types SHOULD be used to maintain type safety across similar operations:

```typescript
// Generic API response type
interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Usage
const response: ApiResponse<Agent[]> = await fetchAgents();
```

### Array Destructuring with Underscore Pattern

When destructuring arrays where you need to skip elements, you MUST use underscore (`_`) as a placeholder for unused elements instead of leaving empty slots:

```typescript
// ❌ FORBIDDEN: Empty array destructuring slots
const [, secondItem] = someArray;
const [, , thirdItem] = someArray;

// ✅ REQUIRED: Use underscore for unused elements
const [_, secondItem] = someArray;
const [_, _, thirdItem] = someArray;
```

**Rationale**: 
- Improves code clarity by making skipped elements explicit
- Prevents accidental omission of commas in destructuring
- Aligns with the ESLint configuration that ignores underscore-prefixed variables

**Note**: The ESLint configuration has been updated to ignore variables starting with `_` in all contexts (args, vars, caught errors, and destructured arrays), so using `_` for unused destructured elements will not trigger unused variable warnings.

## External Library Integration

### xterm.js Integration

The xterm.js library MUST be typed using explicit interfaces as demonstrated in the current `Terminal.vue` component:

```typescript
// Required interface structure for xterm.js
interface XTerminalConstructor {
  new (config: XTermOptions): XTerminalInstance;
}

interface XTerminalInstance {
  [key: string]: unknown;
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  onResize(callback: (size: { cols: number; rows: number }) => void): void;
  focus(): void;
  loadAddon(addon: unknown): void;
}
```

### node-pty Integration

Server-side libraries MUST use proper TypeScript imports and types:

```typescript
// Correct import pattern
import { spawn } from "node-pty";
import type { IPty } from "node-pty";

// Service interface
export interface TerminalInstance {
  id: string;
  pty: IPty;
  metadata: Terminal;
  isActive: boolean;
}
```

### Dynamic Imports

Dynamic imports MUST be properly typed:

```typescript
// Required pattern for dynamic imports
async function initializeTerminal() {
  if (!Terminal) {
    const xterm = await import("@xterm/xterm");
    const fitAddon = await import("@xterm/addon-fit");
    
    Terminal = xterm.Terminal as unknown as XTerminalConstructor;
    FitAddon = fitAddon.FitAddon as unknown as XTermFitAddonConstructor;
  }
}
```

## Vue 3 + TypeScript Integration

### Composition API Standards

Vue 3 Composition API MUST use proper TypeScript integration:

```typescript
// Required script setup pattern
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, readonly } from "vue";
import type { WebSocketMessage, TerminalMessage } from "~/types";

// Props with proper typing
interface Props {
  cwd?: string;
  rows?: number;
  cols?: number;
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cwd: "",
  rows: 30,
  cols: 100,
  autoConnect: true,
});

// Emits with proper typing
const emit = defineEmits<{
  connected: [terminalId: string];
  disconnected: [];
  error: [message: string];
}>();
</script>
```

### Reactive References

All reactive references MUST be properly typed:

```typescript
// Required typing for refs
const terminalRef = ref<HTMLDivElement>();
const terminal = ref<XTerminalInstance>();
const isConnected = ref<boolean>(false);
const statusMessage = ref<string>("Terminal not connected");
```

### Component Exposure

Components MUST use `defineExpose` with proper typing:

```typescript
// Required expose pattern
defineExpose({
  connect,
  disconnect,
  isConnected: readonly(isConnected),
  terminalId: readonly(terminalId),
});
```

## Server-Side TypeScript (Nitro)

### Global Type Definitions

Server-side global types MUST be defined in `types/nitro.d.ts`:

```typescript
// Required global types for Nitro
interface WebSocketPeer {
  send: (data: string) => void;
  close: () => void;
}

interface WebSocketHandler {
  message: (peer: WebSocketPeer, message: string | Buffer) => void | Promise<void>;
  close?: (peer: WebSocketPeer) => void | Promise<void>;
  error?: (peer: WebSocketPeer, error: Error) => void | Promise<void>;
  open?: (peer: WebSocketPeer) => void | Promise<void>;
}

declare global {
  const defineEventHandler: typeof import("h3").defineEventHandler;
  const defineWebSocketHandler: (handler: WebSocketHandler) => unknown;
}
```

### API Route Typing

API routes MUST use proper TypeScript interfaces:

```typescript
// Required pattern for API routes
export default defineEventHandler(async (event) => {
  const response: ApiResponse<{ status: string; timestamp: Date }> = {
    success: true,
    data: {
      status: "ok",
      timestamp: new Date(),
    },
  };
  
  return response;
});
```

### Service Layer Typing

Service classes MUST use comprehensive TypeScript interfaces:

```typescript
// Required service interface pattern
export interface TerminalOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
}

export interface TerminalEventData {
  type: "data" | "exit";
  terminalId: string;
  data: {
    output?: string;
    exitCode?: number;
    signal?: number | undefined;
  };
  timestamp: Date;
}
```

## Testing Standards

### Test Type Safety

All tests MUST use proper TypeScript typing:

```typescript
// Required test typing pattern
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TerminalInstance, TerminalOptions } from "~/server/services/terminal";

describe("TerminalService", () => {
  let service: TerminalService;
  
  beforeEach(() => {
    service = new TerminalService();
  });

  it("should create terminal with proper typing", async () => {
    const options: TerminalOptions = {
      cols: 80,
      rows: 24,
      cwd: "/tmp",
    };
    
    const terminal: TerminalInstance = await service.createTerminal(options);
    
    expect(terminal.id).toBeDefined();
    expect(terminal.metadata.cols).toBe(80);
  });
});
```

### Mock Typing

Mocks MUST maintain proper TypeScript types:

```typescript
// Required mock typing in test/setup.ts
vi.mock("node-pty", () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    onData: vi.fn(),
    onExit: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  })),
}));
```

## Code Quality Gates

### Pre-commit Requirements

All code MUST pass the following TypeScript checks:

```bash
# Required to pass before commit
pnpm typecheck  # Must return 0 TypeScript errors
pnpm lint       # Must return 0 ESLint errors
pnpm test       # Must return 100% test success
```

### Coverage Requirements

TypeScript coverage MUST meet the following standards:
- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Build Requirements

All TypeScript code MUST build successfully:

```bash
pnpm build  # Must complete without TypeScript errors
```

## Migration Guidelines

### Gradual Migration Strategy

1. **Phase 1**: Enable strict TypeScript configuration
2. **Phase 2**: Eliminate all `any` types
3. **Phase 3**: Add comprehensive interfaces for external libraries
4. **Phase 4**: Implement type guards for runtime validation
5. **Phase 5**: Add comprehensive test coverage with proper typing

### Legacy Code Handling

Existing code with type issues MUST be migrated using this priority:

1. **High Priority**: Server-side code and API routes
2. **Medium Priority**: Vue components and composables
3. **Low Priority**: Test files and configuration

### Breaking Changes

Breaking changes to TypeScript interfaces MUST:
1. Be documented in a changelog
2. Include migration examples
3. Be communicated to all team members
4. Include automated migration scripts where possible

## Examples

### Complete Component Example

```typescript
// Terminal.vue - Complete TypeScript integration
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { WebSocketMessage, TerminalMessage } from "~/types";

// Proper interface definitions
interface XTerminalInstance {
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  focus(): void;
}

interface Props {
  cwd?: string;
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cwd: "",
  autoConnect: true,
});

const emit = defineEmits<{
  connected: [terminalId: string];
  error: [message: string];
}>();

// Properly typed reactive references
const terminalRef = ref<HTMLDivElement>();
const terminal = ref<XTerminalInstance>();
const isConnected = ref<boolean>(false);

// Type guard functions
function isTerminalDataMessage(message: WebSocketMessage): message is TerminalMessage {
  return message.type === "terminal-data" &&
         typeof message.data === "object" &&
         message.data !== null &&
         "output" in message.data;
}

// Proper error handling with types
async function connect(): Promise<void> {
  try {
    // Implementation with proper typing
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    emit("error", errorMessage);
  }
}
</script>
```

### Service Layer Example

```typescript
// terminal.ts - Complete service typing
import type { IPty } from "node-pty";

export interface TerminalOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
}

export interface TerminalInstance {
  id: string;
  pty: IPty;
  metadata: Terminal;
  isActive: boolean;
}

export class TerminalService {
  private terminals = new Map<string, TerminalInstance>();

  async createTerminal(options: TerminalOptions = {}): Promise<TerminalInstance> {
    // Implementation with proper typing
  }

  getTerminal(terminalId: string): TerminalInstance | undefined {
    return this.terminals.get(terminalId);
  }

  writeToTerminal(terminalId: string, data: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (!terminal || !terminal.isActive) {
      return false;
    }

    try {
      terminal.pty.write(data);
      return true;
    } catch (error) {
      logger.error("Failed to write to terminal", error, { terminalId });
      return false;
    }
  }
}
```

## References

1. [TypeScript Handbook](https://www.typescriptlang.org/docs/)
2. [Vue 3 TypeScript Guide](https://vuejs.org/guide/typescript/overview.html)
3. [Nuxt 3 TypeScript Documentation](https://nuxt.com/docs/guide/concepts/typescript)
4. [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
5. [Vitest TypeScript Integration](https://vitest.dev/guide/testing-types.html)
6. [RFC 2119 - Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)

---

**Document History:**
- v1.0 (2025-07-16): Initial comprehensive TypeScript standards document