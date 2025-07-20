# Standards Quick Reference

**Fast lookup guide for development standards and requirements**

## 🚀 Quality Gates (MANDATORY - ALL MUST PASS)

```bash
# These commands MUST ALL return success (exit code 0):
pnpm test        # ✅ 100% test success rate - ZERO failures allowed
pnpm lint        # ✅ 0 linting errors, 0 warnings  
pnpm typecheck   # ✅ 0 TypeScript errors
pnpm build       # ✅ Successful production build
```

**🚨 CRITICAL:** If ANY quality gate fails, work is NOT complete. Fix ALL failures immediately.

## 📝 TypeScript Standards

### Zero `any` Tolerance
```typescript
// ❌ FORBIDDEN
function process(data: any): any {
  return data.output;
}

// ✅ REQUIRED
interface TerminalData {
  id: string;
  output: string;
}

function process(data: TerminalData): string {
  return data.output;
}
```

### External Library Types
```typescript
// ✅ Create explicit interfaces
interface XtermTerminal {
  open: (element: HTMLElement) => void;
  write: (data: string) => void;
  dispose: () => void;
}

const terminal = new Terminal() as unknown as XtermTerminal;
```

## 🧪 Testing Standards

### Minimal Mocking Philosophy
```typescript
// ✅ DO MOCK (External dependencies)
vi.mock('node-pty');
vi.mock('@xterm/xterm');
vi.mock('WebSocket');

// ❌ DON'T MOCK (Internal code)
// vi.mock('./services/terminal');
// vi.mock('~/utils/logger');
// vi.mock('./components/Terminal.vue');
```

### Test Organization
- **ALWAYS** co-locate tests: `Component.vue` → `Component.test.ts`
- **NEVER** use separate test directories
- **Coverage**: 80% minimum per file

### Test Skipping Requirements
```typescript
// ✅ Only skip with strong reason and TODO
describe.skip('server-side operations', () => {
  // TODO: Enable in Phase 2B Step 7 when server-side operations implemented
  it('should validate git repository', () => {});
});
```

## 🎨 CSS/Styling Standards

### Vanilla Extract as Primary System
```typescript
// ✅ REQUIRED - Use vanilla-extract
import { style } from '@vanilla-extract/css';

export const button = style({
  padding: '0.5rem 1rem',
  backgroundColor: 'var(--color-primary)',
});
```

### Design System Hierarchy
1. **FIRST**: Use internal design system (`AppButton`, `AppModal`)
2. **SECOND**: Extend internal design system if gap exists  
3. **LAST**: Use external library components only as foundation

```typescript
// ✅ CORRECT
import AppButton from "~/components/ui/AppButton.vue";

// ❌ FORBIDDEN in application components
import { UButton } from "#components";
```

## 🔧 Component Standards

### Vue 3 Composition API (MANDATORY)
```typescript
// ✅ REQUIRED pattern
<script setup lang="ts">
interface Props {
  terminalId: string;
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoConnect: false,
});

const emit = defineEmits<{
  connected: [terminalId: string];
  error: [error: Error];
}>();
</script>
```

### Component Lifecycle
```typescript
// ✅ Proper cleanup
onUnmounted(() => {
  if (terminal) {
    terminal.dispose();
  }
  if (websocket) {
    websocket.close();
  }
});
```

## 🌐 API/Server Standards

### Structured Error Handling
```typescript
// ✅ REQUIRED pattern
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const result = await processRequest(body);
    
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Request failed', { error, body });
    
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

### Input Validation
```typescript
// ✅ REQUIRED - Explicit validation
function validateInput(body: unknown): ValidatedType {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  // Explicit type checking and sanitization
  const request = body as Record<string, unknown>;
  
  return {
    // Validated and sanitized fields
  };
}
```

## 📚 Documentation Standards

### JSDoc Requirements
```typescript
/**
 * Terminal State Management Store
 * 
 * Manages multiple terminal instances with:
 * - In-memory terminal tracking
 * - System resource limit enforcement
 * 
 * @returns Store instance with terminal management methods
 */
export const useTerminalManagerStore = defineStore("terminalManager", () => {
  // Implementation
});
```

### Code Comments
- **NEVER** add comments unless explicitly requested
- **JSDoc** for public APIs and complex business logic
- **TODO comments** for temporary code and deferred features

## 🔍 Code Quality Standards

### KISS Principles
- Simple, clear interfaces over complex abstractions
- Explicit types over `any` types
- Direct imports over complex auto-import chains

### DRY vs WET Balance
- **DRY**: Application code - don't repeat yourself
- **WET**: Tests - write everything twice for clarity

### Performance Requirements
- **Build time**: < 30 seconds for production build
- **Test execution**: < 2 minutes for full test suite
- **Bundle size**: Monitor and optimize large dependencies

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality  
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # TypeScript type checking

# Testing
pnpm test             # Run all tests
pnpm test:ui          # Run tests with UI
```

## 🔄 Git & Branch Management

### Branch Workflow
- **ALWAYS** create feature branches off `main`
- **NEVER** commit directly to `main`
- Use descriptive branch names: `feature/phase-2a-git-integration`

### Quality Gates Before Commit
```bash
# ALL must pass before any commit
pnpm test && pnpm lint && pnpm typecheck && pnpm build
```

## 🚫 Anti-Patterns to Avoid

### TypeScript Anti-Patterns
```typescript
// ❌ FORBIDDEN
const data: any = response.data;
function process(input: any): any { }

// ❌ DEPRECATED FUNCTIONS
const id = Math.random().toString(36).substr(2, 6); // Use substring()
```

### CSS Anti-Patterns
```typescript
// ❌ FORBIDDEN
const style = {
  color: 'red !important', // Never use !important
};

// ❌ FORBIDDEN - Scoped styles (except during migration)
<style scoped>
.component { }
</style>
```

### Testing Anti-Patterns
```typescript
// ❌ FORBIDDEN - Over-mocking
vi.mock('./services/terminal');
vi.mock('~/utils/logger');

// ❌ FORBIDDEN - Manual forEach in tests (use it.each)
testCases.forEach(testCase => {
  // Convert to it.each instead
});
```

## 📖 Reference Links

- **Detailed Standards** → `docs/standards/`
- **Implementation Guides** → `docs/implementation/`
- **Troubleshooting** → `docs/troubleshooting/`
- **Development Workflows** → `docs/workflows/`

---

**Remember**: Quality gates are MANDATORY. If any fail, work is not complete.