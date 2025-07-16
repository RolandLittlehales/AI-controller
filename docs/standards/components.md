# Component Standards

**Status**: Draft  
**Version**: 1.0.0  
**Date**: 2025-07-16  
**Author**: AI-Controller Development Team

This document establishes mandatory standards for Vue 3 component development in the AI-Controller project. It follows RFC 2119 conventions for requirement levels.

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Script Setup Standards](#script-setup-standards)
4. [TypeScript Integration](#typescript-integration)
5. [Props and Emits](#props-and-emits)
6. [Component Lifecycle](#component-lifecycle)
7. [External Library Integration](#external-library-integration)
8. [Performance Standards](#performance-standards)
9. [Testing Requirements](#testing-requirements)
10. [File Organization](#file-organization)
11. [Styling Standards](#styling-standards)
12. [Accessibility Requirements](#accessibility-requirements)

## Overview

The AI-Controller project uses Vue 3 with TypeScript in strict mode. All components MUST follow these standards to ensure consistency, maintainability, and performance.

### Key Technologies
- Vue 3.5.17 with Composition API
- TypeScript with strict mode
- Nuxt 3.17.7 framework
- Nuxt UI 3.2.0 components
- Vanilla Extract for styling

## Component Architecture

### 2.1 Component Structure

All components MUST follow this structure:

```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Imports
// Type definitions
// Props and emits
// Reactive state
// Computed properties
// Methods
// Lifecycle hooks
// Public API (defineExpose)
</script>

<style scoped>
/* Component styles */
</style>
```

### 2.2 Single File Component Requirements

Components MUST:
- Use Single File Component (SFC) format
- Include all three sections: template, script, and style
- Use `<script setup lang="ts">` syntax
- Use `<style scoped>` for component-specific styles
- Include comprehensive JSDoc comments for complex components

Components SHOULD:
- Keep template logic minimal and readable
- Extract complex logic into composables
- Use semantic HTML elements
- Follow Vue 3 composition patterns

## Script Setup Standards

### 3.1 Import Organization

Imports MUST be organized in this order:

```typescript
// 1. Vue core imports
import { ref, computed, onMounted, onUnmounted } from "vue";

// 2. Nuxt imports
import { useNuxtApp } from "nuxt/app";

// 3. Type imports
import type { ComponentProps, EmitEvents } from "~/types";

// 4. Local imports
import { useCustomComposable } from "~/composables/useCustomComposable";
import { logger } from "~/utils/logger";

// 5. External library imports (with proper type definitions)
import { ExternalLibrary } from "external-library";
```

### 3.2 Type Definitions

For external libraries without proper TypeScript support, components MUST define explicit interfaces:

```typescript
// ✅ Good - Explicit interface for external library
interface XTerminalInstance {
  [key: string]: unknown;
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  focus(): void;
}

// ❌ Bad - Using any type
let terminal: any;
```

### 3.3 Dynamic Imports

For browser-only libraries, components MUST use dynamic imports:

```typescript
// ✅ Good - Dynamic import with proper typing
let Terminal: XTerminalConstructor;

async function initializeTerminal() {
  if (!Terminal) {
    const xterm = await import("@xterm/xterm");
    Terminal = xterm.Terminal as unknown as XTerminalConstructor;
  }
  
  terminal.value = new Terminal(config);
}
```

## TypeScript Integration

### 4.1 Type Safety Requirements

Components MUST:
- Use strict TypeScript mode
- Avoid `any` types - use proper interfaces instead
- Use type guards for runtime type checking
- Implement proper error handling with typed exceptions

```typescript
// ✅ Good - Type guard function
function isTerminalDataMessage(message: WebSocketMessage): message is WebSocketMessage & { data: { output: string } } {
  return message.type === "terminal-data" &&
         message.data !== null &&
         typeof message.data === "object" &&
         "output" in message.data &&
         typeof message.data.output === "string";
}

// ✅ Good - Typed error handling
try {
  await connectTerminal();
} catch (error) {
  logger.error("Terminal connection failed", error, { 
    component: "Terminal", 
    action: "connect" 
  });
  emit("error", error instanceof Error ? error.message : "Unknown error");
}
```

### 4.2 Browser Compatibility

Components MUST check for browser API availability:

```typescript
// ✅ Good - Browser API availability check
const cwd = props.cwd || (typeof process !== "undefined" && process.cwd?.() || "/");
```

## Props and Emits

### 5.1 Props Definition

Props MUST be defined with proper TypeScript interfaces:

```typescript
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
```

### 5.2 Emits Definition

Emits MUST be explicitly typed:

```typescript
const emit = defineEmits<{
  connected: [terminalId: string];
  disconnected: [];
  error: [message: string];
}>();
```

### 5.3 Props Validation

Components SHOULD validate props when runtime validation is needed:

```typescript
// For complex validation beyond TypeScript
const props = defineProps({
  config: {
    type: Object as PropType<TerminalConfig>,
    required: true,
    validator: (value: TerminalConfig) => {
      return value.rows > 0 && value.cols > 0;
    }
  }
});
```

## Component Lifecycle

### 6.1 Lifecycle Management

Components MUST properly manage their lifecycle:

```typescript
onMounted(async () => {
  await initializeComponent();
  if (props.autoConnect) {
    await connect();
  }
});

onUnmounted(() => {
  cleanup();
});
```

### 6.2 Cleanup Requirements

Components MUST implement proper cleanup:

```typescript
function cleanup() {
  // Close connections
  if (ws.value) {
    ws.value.close();
    ws.value = undefined;
  }
  
  // Dispose of resources
  if (terminal.value) {
    terminal.value.dispose();
    terminal.value = undefined;
  }
  
  // Remove event listeners
  window.removeEventListener("resize", handleResize);
  
  // Reset state
  isConnected.value = false;
}
```

## External Library Integration

### 7.1 Library Integration Standards

When integrating external libraries, components MUST:

1. **Define explicit interfaces** for library types
2. **Use dynamic imports** for browser-only libraries
3. **Implement proper error handling** for library failures
4. **Provide fallback behavior** when libraries fail to load

### 7.2 XTerm.js Integration Pattern

For xterm.js integration (reference pattern):

```typescript
// MUST import xterm.js CSS for proper rendering
import "@xterm/xterm/css/xterm.css";

// Type definitions
interface XTerminalConstructor {
  new (config: XTermOptions): XTerminalInstance;
}

interface XTerminalInstance {
  [key: string]: unknown;
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  focus(): void;
}

// Dynamic import with error handling
async function initializeTerminal() {
  try {
    if (!Terminal) {
      const xterm = await import("@xterm/xterm");
      Terminal = xterm.Terminal as unknown as XTerminalConstructor;
    }
    
    terminal.value = new Terminal(terminalConfig);
    terminal.value.open(terminalRef.value);
    
  } catch (error) {
    logger.error("Terminal initialization failed", error);
    emit("error", "Failed to initialize terminal");
  }
}
```

### 7.3 XTerm.js Styling Standards

When integrating xterm.js, components MUST:

1. **Import xterm.js CSS**: Always include `import "@xterm/xterm/css/xterm.css"` for proper rendering
2. **Container Sizing**: Terminal containers MUST have `width: 100%` and `height: 100%` to fill parent
3. **Natural Scrolling**: DO NOT constrain xterm scroll areas - let xterm.js handle scrolling naturally
4. **Single Container Design**: Avoid double-container styling patterns that cause visual gaps
5. **Preserve Visual Design**: When simplifying code, only change implementation, never visual appearance

**CSS Pattern for Terminal Containers:**
```css
.terminal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* Visual styling (background, borders, etc.) */
}

.terminal-content {
  flex: 1;
  min-height: 0;
  /* DO NOT add height constraints or overflow:hidden to xterm deep selectors */
}
```

**Anti-patterns to AVOID:**
```css
/* DON'T constrain xterm scroll areas */
.terminal-content :deep(.xterm-scroll-area) {
  max-height: 100% !important;  /* ❌ Prevents natural scrolling */
  overflow: hidden !important;   /* ❌ Prevents natural scrolling */
}

/* DON'T add height constraints to viewport */
.terminal-content :deep(.xterm-viewport) {
  height: 100% !important;      /* ❌ Prevents natural scrolling */
}
```

## Performance Standards

### 8.1 Lazy Loading

Components SHOULD implement lazy loading for:
- External libraries
- Heavy computations
- Large datasets
- Non-critical features

### 8.2 Reactive Performance

Components MUST:
- Use `readonly()` for exposed reactive values that shouldn't be modified
- Implement proper `nextTick()` usage for DOM updates
- Use `shallowRef()` for large objects that don't need deep reactivity

```typescript
// ✅ Good - Readonly exposure
defineExpose({
  connect,
  disconnect,
  isConnected: readonly(isConnected),
  terminalId: readonly(terminalId),
});

// ✅ Good - Proper nextTick usage
await nextTick();
fitAddon.value?.fit();
```

### 8.3 Memory Management

Components MUST:
- Clean up all event listeners in `onUnmounted`
- Dispose of heavy resources properly
- Avoid memory leaks in long-running processes

## Testing Requirements

### 9.1 Test Coverage

Components MUST achieve:
- **Minimum 80% code coverage** (statements, branches, functions, lines)
- **100% test success rate**
- **Integration test coverage** for user interactions

### 9.2 Testing Strategy

Components SHOULD be tested with:
- **User journey testing** over unit testing
- **Minimal mocking** - only external dependencies
- **Real component behavior** verification

### 9.3 Test Structure

```typescript
// ✅ Good - Integration test pattern
describe("Terminal Component", () => {
  it("should complete full terminal lifecycle", async () => {
    const wrapper = mount(Terminal, {
      props: { autoConnect: false }
    });
    
    // Test connection
    await wrapper.find(".connect-button").trigger("click");
    await nextTick();
    
    expect(wrapper.emitted("connected")).toBeTruthy();
    expect(wrapper.vm.isConnected).toBe(true);
    
    // Test disconnection
    await wrapper.find(".disconnect-button").trigger("click");
    await nextTick();
    
    expect(wrapper.emitted("disconnected")).toBeTruthy();
    expect(wrapper.vm.isConnected).toBe(false);
  });
});
```

## File Organization

### 10.1 Component Location

Components MUST be organized as:

```
components/
├── Terminal.vue           # Main components
├── theme/
│   ├── ThemeControls.vue  # Theme-related components
│   ├── ButtonShowcase.vue
│   └── CardShowcase.vue
└── ui/                    # Reusable UI components
    ├── Button.vue
    └── Modal.vue
```

### 10.2 Naming Conventions

Components MUST follow these naming rules:

- **File names**: PascalCase (e.g., `Terminal.vue`, `ThemeControls.vue`)
- **Component names**: PascalCase matching file name
- **Props**: camelCase (e.g., `autoConnect`, `terminalId`)
- **Events**: kebab-case (e.g., `terminal-connected`, `user-action`)
- **CSS classes**: kebab-case (e.g., `terminal-container`, `connect-button`)

### 10.3 Component Size

Components SHOULD:
- Stay under 500 lines when possible
- Extract complex logic into composables
- Split large components into smaller, focused components
- Use composition over inheritance

## Styling Standards

### 11.1 Scoped Styles

Components MUST:
- Use `<style scoped>` for component-specific styles
- Use CSS custom properties (variables) for theming
- Follow the established design system

```css
/* ✅ Good - Using CSS variables */
.terminal-container {
  background-color: var(--terminal-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* ✅ Good - Scoped styling */
.connect-button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  transition: all var(--transition-normal);
}
```

### 11.2 Deep Selectors

When styling child components, use `:deep()` selector:

```css
/* ✅ Good - Deep selector for external library styles */
.terminal-content :deep(.xterm-helpers) {
  opacity: 0 !important;
  position: absolute !important;
  left: -9999px !important;
}
```

### 11.3 Responsive Design

Components SHOULD:
- Use responsive units (rem, em, %)
- Implement mobile-first responsive design
- Use CSS Grid and Flexbox for layouts

## Accessibility Requirements

### 12.1 ARIA Standards

Components MUST:
- Include appropriate ARIA labels
- Implement keyboard navigation
- Provide screen reader support
- Follow WCAG 2.1 guidelines

```vue
<template>
  <button 
    :aria-pressed="isDarkMode" 
    class="theme-toggle-btn" 
    @click="toggleTheme"
  >
    <span v-if="isDarkMode">☀️ Light Mode</span>
    <span v-else>🌙 Dark Mode</span>
  </button>
</template>
```

### 12.2 Keyboard Navigation

Components MUST:
- Support standard keyboard shortcuts
- Implement focus management
- Provide visible focus indicators
- Handle Tab navigation properly

### 12.3 Color and Contrast

Components MUST:
- Meet WCAG color contrast requirements
- Support high contrast modes
- Avoid color-only information conveyance
- Provide alternative text for visual elements

## Quality Gates

Before component completion, ALL of the following MUST pass:

```bash
# Code quality checks
pnpm lint        # → 0 errors, 0 warnings
pnpm typecheck   # → 0 TypeScript errors
pnpm test        # → 100% test success rate
pnpm build       # → Successful production build
```

## Component Review Checklist

### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] No `any` types used
- [ ] Proper error handling implemented
- [ ] Browser API availability checked
- [ ] External library integration follows standards

### Performance
- [ ] Proper cleanup in `onUnmounted`
- [ ] Dynamic imports for browser-only libraries
- [ ] Reactive performance optimizations
- [ ] Memory leak prevention

### Testing
- [ ] 80%+ code coverage achieved
- [ ] Integration tests implemented
- [ ] User journey testing completed
- [ ] Minimal mocking strategy followed

### Accessibility
- [ ] ARIA labels implemented
- [ ] Keyboard navigation supported
- [ ] Screen reader compatibility
- [ ] Color contrast requirements met

### Documentation
- [ ] Component purpose documented
- [ ] Props and emits documented
- [ ] Complex logic explained
- [ ] Usage examples provided

## Conclusion

These standards ensure consistent, maintainable, and performant Vue 3 components throughout the AI-Controller project. All components MUST follow these guidelines, and exceptions require explicit documentation and team approval.

For questions or clarifications, refer to the project's CLAUDE.md file or consult with the development team.

---

**Document Status**: Living document - will be updated as the project evolves.