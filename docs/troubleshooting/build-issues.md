# Build Issues Troubleshooting

**Quick resolution guide for build, lint, and TypeScript errors**

## Quick Diagnosis

### Build Failing
- **TypeScript errors** → Check for `any` types, missing interfaces
- **Import/export issues** → Verify file paths and module syntax
- **Dependency problems** → Check package.json and lockfile integrity
- **Nuxt configuration** → Verify nuxt.config.ts settings

### Lint Errors
- **ESLint rule violations** → Run `pnpm lint:fix` for auto-fixes
- **Trailing spaces** → Auto-fixable with `--fix` flag
- **Import order** → Use ESLint auto-fix or organize manually
- **Unused variables** → Remove or prefix with underscore

### TypeScript Errors
- **Missing type definitions** → Add explicit interfaces
- **`any` type usage** → Replace with proper types
- **Module resolution** → Check import paths and aliases
- **Type conflicts** → Verify interface compatibility

## Common TypeScript Issues

### Missing Interface Definitions
```typescript
// ❌ Using any type
function processTerminalData(data: any): any {
  return data.output;
}

// ✅ Explicit interface
interface TerminalData {
  id: string;
  output: string;
  timestamp: Date;
}

function processTerminalData(data: TerminalData): string {
  return data.output;
}
```

### External Library Types
```typescript
// ❌ Missing types for external libraries
const terminal = new Terminal(); // Type error

// ✅ Create interface for external library
interface XtermTerminal {
  open: (element: HTMLElement) => void;
  write: (data: string) => void;
  dispose: () => void;
}

// ✅ Type assertion with proper interface
const terminal = new Terminal() as unknown as XtermTerminal;
```

### Import Path Issues
```typescript
// ❌ Incorrect import paths
import { useTerminalState } from './useTerminalState'; // May not resolve
import Component from '../components/Component'; // Relative paths can break

// ✅ Use configured aliases
import { useTerminalState } from '~/composables/useTerminalState';
import Component from '~/components/Component';
```

## Build Configuration Issues

### Nuxt Configuration Problems
```typescript
// nuxt.config.ts - Common issues

export default defineNuxtConfig({
  // ❌ Missing TypeScript configuration
  typescript: {
    strict: true, // ✅ Add this for strict TypeScript
  },
  
  // ❌ Missing alias configuration
  alias: {
    '~': '.',
    '@': '.', // ✅ Ensure aliases are configured
  },
  
  // ❌ Missing CSS configuration
  css: [
    '@xterm/xterm/css/xterm.css', // ✅ Include required CSS
  ],
});
```

### Dependency Issues
```bash
# Common dependency problems and solutions

# ❌ Outdated lockfile
rm pnpm-lock.yaml
pnpm install

# ❌ Missing node-pty rebuild
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild

# ❌ Node version mismatch
node --version  # Check if version matches project requirements

# ❌ Package cache issues
pnpm store prune
pnpm install
```

## Lint Error Resolution

### Auto-Fixable Issues
```bash
# Fix most lint issues automatically
pnpm lint:fix

# Check specific files
pnpm lint components/Terminal.vue --fix

# Preview changes without applying
pnpm lint components/ --fix-dry-run
```

### Common Manual Fixes
```typescript
// ❌ Trailing spaces (auto-fixable)
const value = 'test';   // Extra spaces

// ✅ Clean code
const value = 'test';

// ❌ Unused variables
function processData(data: string, unusedParam: number) {
  return data.toUpperCase();
}

// ✅ Remove or prefix with underscore
function processData(data: string, _unusedParam: number) {
  return data.toUpperCase();
}

// ❌ Import order issues
import { ref } from 'vue';
import { logger } from '~/utils/logger';
import { computed } from 'vue';

// ✅ Organized imports
import { ref, computed } from 'vue';
import { logger } from '~/utils/logger';
```

## Module Resolution Issues

### Path Resolution Problems
```typescript
// ❌ Module not found errors
import { Terminal } from '@xterm/xterm'; // May fail in certain contexts

// ✅ Dynamic imports for problematic modules
const loadTerminal = async () => {
  const { Terminal } = await import('@xterm/xterm');
  return Terminal;
};

// ✅ Conditional imports for client-side only
if (process.client) {
  const { Terminal } = await import('@xterm/xterm');
}
```

### Nuxt Auto-Import Issues
```typescript
// ❌ Auto-import not working
const { $fetch } = useNuxtApp(); // May not be available

// ✅ Explicit import when auto-import fails
import { useNuxtApp } from '#app';
const { $fetch } = useNuxtApp();

// ✅ Or use direct fetch
const data = await $fetch('/api/endpoint');
```

## Performance Build Issues

### Bundle Size Problems
```bash
# Analyze bundle size
pnpm build:analyze

# Check for large dependencies
npx bundle-analyzer .nuxt/dist/client

# Check duplicate dependencies
pnpm why package-name
```

### Memory Issues During Build
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build

# Or in package.json scripts
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' nuxt build"
  }
}
```

## CSS Build Issues

### Vanilla Extract Problems
```typescript
// ❌ CSS not generating
import { style } from '@vanilla-extract/css';

export const button = style({}); // Empty style may not generate

// ✅ Include actual styles
export const button = style({
  padding: '0.5rem 1rem',
  backgroundColor: 'var(--color-primary)',
});
```

### Missing CSS Imports
```typescript
// ❌ CSS not loading
// Missing import in component

// ✅ Import CSS in component or globally
import '@xterm/xterm/css/xterm.css';

// ✅ Or add to nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@xterm/xterm/css/xterm.css',
  ],
});
```

## Environment-Specific Issues

### Development vs Production
```typescript
// ❌ Code that works in dev but fails in production
if (process.env.NODE_ENV === 'development') {
  // Development-only code
}

// ✅ Check for client/server context
if (process.client) {
  // Client-side only code
}

if (process.server) {
  // Server-side only code
}
```

### SSR Hydration Issues
```typescript
// ❌ Client/server mismatch
const isClient = typeof window !== 'undefined'; // Causes hydration issues

// ✅ Use Nuxt composables
const { $router } = useNuxtApp();

// ✅ Or use process flags
if (process.client) {
  // Client-side logic
}
```

## Debugging Build Issues

### Verbose Output
```bash
# Get detailed build information
pnpm build --verbose

# Check TypeScript compilation only
pnpm typecheck --verbose

# Lint with detailed output
pnpm lint --format=verbose
```

### Isolate Problems
```bash
# Test specific parts of the build
nuxt analyze  # Analyze bundle
nuxt info     # Show environment info
nuxt doctor   # Check for common issues
```

### Check Dependencies
```bash
# Verify all dependencies are installed
pnpm install --frozen-lockfile

# Check for peer dependency warnings
pnpm install --reporter=append-only

# Audit for security issues
pnpm audit
```

## Prevention Strategies

### Quality Gates Integration
```bash
# Always run all quality gates before commit
pnpm test && pnpm lint && pnpm typecheck && pnpm build
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm lint && pnpm typecheck"
    }
  }
}
```

### Continuous Integration
```yaml
# .github/workflows/ci.yml
- name: Quality Gates
  run: |
    pnpm test
    pnpm lint
    pnpm typecheck
    pnpm build
```

---

**🔗 Related Documentation:**
- **TypeScript Standards** → `docs/standards/typescript.md`
- **Test Issues** → `docs/troubleshooting/test-issues.md`
- **Development Workflow** → `docs/workflows/feature-development.md`