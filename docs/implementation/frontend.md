# Frontend Implementation Guide

**Technical reference for Vue 3 + TypeScript component development**

## Design System First (MANDATORY)

### Component Hierarchy Workflow
**ALWAYS follow this exact order when building UI:**

1. **Check `~/components/ui/`** → Look for existing `App*` components first
2. **Extend design system** → Create new `App*` component if gap exists  
3. **Use external as foundation** → Only use Nuxt UI as base inside `App*` components

### Quick Design System Check
```bash
# Check available internal components
ls components/ui/App*.vue

# Search for external component usage (should return minimal results)
grep -r "UButton\|UModal" components/ --exclude-dir=ui
```

## Vue 3 + TypeScript Patterns

### Component Structure Template
```vue
<template>
  <div :class="containerStyles">
    <!-- Template content -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { logger } from '~/utils/logger';

// Props with explicit TypeScript interfaces
interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

// Events with typed signatures
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:modelValue': [value: string];
}>();

// Reactive state
const isLoading = ref(false);
const internalState = ref<string>('');

// Computed properties
const containerStyles = computed(() => ({
  'component-primary': props.variant === 'primary',
  'component-disabled': props.disabled,
}));

// Lifecycle hooks
onMounted(() => {
  logger.debug('Component mounted');
});

onUnmounted(() => {
  logger.debug('Component unmounted');
  // Cleanup logic here
});
</script>

<style module>
/* Vanilla Extract styles imported separately */
</style>
```

### TypeScript Integration Best Practices

#### Interface Definitions
```typescript
// ✅ Explicit interfaces for props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

// ✅ Event type definitions
interface ComponentEmits {
  click: [event: MouseEvent];
  change: [value: string];
  'update:modelValue': [value: any];
}

// ✅ Composable return types
interface UseTerminalReturn {
  terminal: Ref<Terminal | null>;
  isConnected: Ref<boolean>;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

#### External Library Integration
```typescript
// ✅ Type definitions for external libraries
interface XtermTerminal {
  open: (element: HTMLElement) => void;
  write: (data: string) => void;
  dispose: () => void;
  // Add only properties you actually use
}

// ✅ Type guards for runtime validation
function isTerminalInstance(obj: unknown): obj is XtermTerminal {
  return obj != null && 
         typeof obj === 'object' && 
         'open' in obj && 
         'write' in obj;
}
```

## Component Development Patterns

### Composition API Patterns
```typescript
// ✅ Custom composables with proper typing
function useTerminalState() {
  const isConnected = ref(false);
  const terminalId = ref<string | null>(null);
  
  const connect = async (id: string): Promise<void> => {
    try {
      terminalId.value = id;
      isConnected.value = true;
      logger.info('Terminal connected', { terminalId: id });
    } catch (error) {
      logger.error('Failed to connect terminal', { error, terminalId: id });
      throw error;
    }
  };
  
  return {
    isConnected: readonly(isConnected),
    terminalId: readonly(terminalId),
    connect,
  };
}

// ✅ Using composables in components
const { isConnected, terminalId, connect } = useTerminalState();
```

### Event Handling Patterns
```typescript
// ✅ Typed event handlers
const handleButtonClick = (event: MouseEvent): void => {
  if (props.disabled) return;
  
  emit('click', event);
  logger.debug('Button clicked', { variant: props.variant });
};

// ✅ Async event handlers with error handling
const handleFormSubmit = async (event: Event): Promise<void> => {
  event.preventDefault();
  
  try {
    isLoading.value = true;
    await submitForm();
    emit('success');
  } catch (error) {
    logger.error('Form submission failed', { error });
    emit('error', error);
  } finally {
    isLoading.value = false;
  }
};
```

### State Management Patterns
```typescript
// ✅ Local component state
const localState = reactive({
  currentTab: 'overview',
  isExpanded: false,
  selectedItems: [] as string[],
});

// ✅ Store integration
import { useTerminalManagerStore } from '~/stores/terminalManager';
const terminalStore = useTerminalManagerStore();

// ✅ Computed properties for derived state
const hasActiveTerminals = computed(() => 
  terminalStore.terminals.length > 0
);
```

## Terminal Component Specific Patterns

### xterm.js Integration
```typescript
// ✅ Terminal instance management
interface TerminalInstance {
  terminal: Terminal;
  fitAddon: FitAddon;
  element: HTMLElement;
}

const terminalInstance = ref<TerminalInstance | null>(null);

const initializeTerminal = async (container: HTMLElement): Promise<void> => {
  try {
    const { Terminal } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');
    
    const terminal = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
      },
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(container);
    fitAddon.fit();
    
    terminalInstance.value = {
      terminal,
      fitAddon,
      element: container,
    };
    
    logger.info('Terminal initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize terminal', { error });
    throw error;
  }
};
```

### WebSocket Integration
```typescript
// ✅ WebSocket management with proper typing
interface WebSocketMessage {
  type: 'terminal-data' | 'terminal-created' | 'terminal-exit';
  terminalId: string;
  data?: string;
}

const websocket = ref<WebSocket | null>(null);

const handleWebSocketMessage = (event: MessageEvent): void => {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);
    
    switch (message.type) {
      case 'terminal-data':
        writeToTerminal(message.data || '');
        break;
      case 'terminal-created':
        handleTerminalCreated(message.terminalId);
        break;
      default:
        logger.warn('Unknown WebSocket message type', { type: message.type });
    }
  } catch (error) {
    logger.error('Failed to parse WebSocket message', { error });
  }
};
```

## Performance Optimization

### Component Optimization
```typescript
// ✅ Lazy loading for large components
const LazyTerminalComponent = defineAsyncComponent(() => 
  import('~/components/Terminal.vue')
);

// ✅ Computed properties for expensive operations
const processedData = computed(() => {
  return heavyDataProcessing(props.data);
});

// ✅ Debounced interactions
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);
```

### Memory Management
```typescript
// ✅ Cleanup in onUnmounted
onUnmounted(() => {
  // Clean up terminal instances
  if (terminalInstance.value) {
    terminalInstance.value.terminal.dispose();
    terminalInstance.value = null;
  }
  
  // Clean up WebSocket connections
  if (websocket.value) {
    websocket.value.close();
    websocket.value = null;
  }
  
  // Clean up event listeners
  window.removeEventListener('resize', handleResize);
  
  logger.debug('Component cleanup completed');
});
```

## Error Handling Patterns

### Component Error Boundaries
```vue
<template>
  <div v-if="error" class="error-boundary">
    <h3>Something went wrong</h3>
    <p>{{ error.message }}</p>
    <button @click="retry">Try Again</button>
  </div>
  <div v-else>
    <!-- Normal component content -->
  </div>
</template>

<script setup lang="ts">
const error = ref<Error | null>(null);

const retry = (): void => {
  error.value = null;
  // Reinitialize component
};

// Global error handler
onErrorCaptured((err: Error) => {
  error.value = err;
  logger.error('Component error captured', { error: err });
  return false; // Prevent error from propagating
});
</script>
```

### Async Operation Error Handling
```typescript
// ✅ Proper async error handling
const performAsyncOperation = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await someAsyncFunction();
    handleSuccess(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = new Error(errorMessage);
    logger.error('Async operation failed', { error: err });
  } finally {
    isLoading.value = false;
  }
};
```

## Testing Component Implementation

### Component Testing Strategy
```typescript
// ✅ Integration testing approach
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';

describe('TerminalComponent', () => {
  it('should initialize terminal on mount', async () => {
    const wrapper = mount(TerminalComponent);
    await wrapper.vm.$nextTick();
    
    // Test actual behavior, not implementation details
    expect(wrapper.find('.terminal-container').exists()).toBe(true);
    expect(wrapper.vm.isInitialized).toBe(true);
  });
  
  it('should handle connection errors gracefully', async () => {
    const wrapper = mount(TerminalComponent);
    
    // Simulate connection error
    await wrapper.vm.connect();
    
    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.find('.error-message').exists()).toBe(true);
  });
});
```

### Mock Strategy for Frontend Components
```typescript
// ✅ Mock only external dependencies
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// ❌ Don't mock internal composables
// vi.mock('./composables/useTerminalState'); // DON'T DO THIS
```

---

**🔗 Related Documentation:**
- **Component Standards** → `docs/standards/components.md`
- **Design System Standards** → `docs/standards/design-system.md`
- **TypeScript Standards** → `docs/standards/typescript.md`
- **UI Development Workflow** → `docs/workflows/ui-development.md`