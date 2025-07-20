# Code Patterns Reference

**Common patterns and examples for consistent code implementation**

## 🧩 Vue 3 Component Patterns

### Basic Component Structure
```vue
<template>
  <div :class="containerClasses">
    <h2 :class="titleClasses">{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { containerStyle, titleStyle } from './component.css';

interface Props {
  title: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
});

const emit = defineEmits<{
  action: [data: string];
  error: [error: Error];
}>();

const containerClasses = computed(() => [
  containerStyle,
  `variant-${props.variant}`,
  `size-${props.size}`,
]);

const titleClasses = computed(() => [
  titleStyle,
  `title-${props.variant}`,
]);
</script>
```

### Component with Lifecycle Management
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const terminal = ref<XtermTerminal | null>(null);
const websocket = ref<WebSocket | null>(null);
const isConnected = ref(false);

onMounted(async () => {
  try {
    await initializeTerminal();
    await connectWebSocket();
  } catch (error) {
    logger.error('Component initialization failed', { error });
    emit('error', error instanceof Error ? error : new Error('Unknown error'));
  }
});

onUnmounted(() => {
  // Cleanup resources
  if (terminal.value) {
    terminal.value.dispose();
  }
  if (websocket.value) {
    websocket.value.close();
  }
});

const initializeTerminal = async (): Promise<void> => {
  // Implementation
};

const connectWebSocket = async (): Promise<void> => {
  // Implementation
};
</script>
```

## 🎯 Composable Patterns

### State Management Composable
```typescript
// composables/useTerminalState.ts
import { ref, computed, readonly } from 'vue';

interface TerminalConnection {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
}

export function useTerminalState() {
  const connections = ref<Map<string, TerminalConnection>>(new Map());
  const activeTerminalId = ref<string | null>(null);

  const activeTerminal = computed(() => {
    if (!activeTerminalId.value) return null;
    return connections.value.get(activeTerminalId.value) || null;
  });

  const isConnected = computed(() => 
    activeTerminal.value?.status === 'connected'
  );

  const connect = async (terminalId: string): Promise<void> => {
    try {
      const connection: TerminalConnection = {
        id: terminalId,
        status: 'connecting',
        lastActivity: new Date(),
      };
      
      connections.value.set(terminalId, connection);
      
      // Connection logic here
      
      connection.status = 'connected';
      activeTerminalId.value = terminalId;
      
      logger.info('Terminal connected', { terminalId });
    } catch (error) {
      const connection = connections.value.get(terminalId);
      if (connection) {
        connection.status = 'error';
      }
      
      logger.error('Terminal connection failed', { error, terminalId });
      throw error;
    }
  };

  const disconnect = (terminalId?: string): void => {
    const id = terminalId || activeTerminalId.value;
    if (!id) return;

    const connection = connections.value.get(id);
    if (connection) {
      connection.status = 'disconnected';
    }

    if (activeTerminalId.value === id) {
      activeTerminalId.value = null;
    }

    logger.info('Terminal disconnected', { terminalId: id });
  };

  return {
    // Read-only state
    connections: readonly(connections),
    activeTerminal,
    isConnected,
    
    // Actions
    connect,
    disconnect,
  };
}
```

### Resource Management Composable
```typescript
// composables/useSystemResources.ts
export function useSystemResources() {
  const cpuCores = ref(navigator.hardwareConcurrency || 4);
  const memoryGB = ref(0);
  
  const terminalLimit = computed(() => {
    // Reserve 25% of CPU cores for system
    const reservedCores = Math.max(1, Math.floor(cpuCores.value * 0.25));
    return Math.max(2, cpuCores.value - reservedCores);
  });

  const currentUsage = computed(() => {
    const activeCount = terminalManager.activeTerminalCount;
    return Math.round((activeCount / terminalLimit.value) * 100);
  });

  const canCreateTerminal = computed(() => 
    terminalManager.activeTerminalCount < terminalLimit.value
  );

  return {
    cpuCores: readonly(cpuCores),
    terminalLimit,
    currentUsage,
    canCreateTerminal,
  };
}
```

## 🏪 Pinia Store Patterns

### Domain-Specific Store
```typescript
// stores/terminalManager.ts
export const useTerminalManagerStore = defineStore('terminalManager', () => {
  // State
  const terminals = ref<Terminal[]>([]);
  const activeTerminalId = ref<string | null>(null);
  
  // Getters
  const activeTerminal = computed(() => 
    terminals.value.find(t => t.id === activeTerminalId.value) || null
  );
  
  const terminalCount = computed(() => terminals.value.length);
  
  // Actions
  const createTerminal = (name: string): string => {
    const terminal: Terminal = {
      id: `terminal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      status: 'idle',
      createdAt: new Date(),
    };
    
    terminals.value.push(terminal);
    
    logger.info('Terminal created', { terminalId: terminal.id, name });
    return terminal.id;
  };
  
  const removeTerminal = (terminalId: string): void => {
    const index = terminals.value.findIndex(t => t.id === terminalId);
    if (index === -1) {
      logger.warn('Attempted to remove non-existent terminal', { terminalId });
      return;
    }
    
    terminals.value.splice(index, 1);
    
    if (activeTerminalId.value === terminalId) {
      activeTerminalId.value = terminals.value.length > 0 
        ? terminals.value[0].id 
        : null;
    }
    
    logger.info('Terminal removed', { terminalId });
  };
  
  const setActiveTerminal = (terminalId: string): void => {
    const terminal = terminals.value.find(t => t.id === terminalId);
    if (!terminal) {
      logger.warn('Attempted to set non-existent terminal as active', { terminalId });
      return;
    }
    
    activeTerminalId.value = terminalId;
    logger.info('Active terminal changed', { terminalId });
  };
  
  return {
    // State
    terminals: readonly(terminals),
    activeTerminalId: readonly(activeTerminalId),
    
    // Getters
    activeTerminal,
    terminalCount,
    
    // Actions
    createTerminal,
    removeTerminal,
    setActiveTerminal,
  };
});
```

## 🌐 API Handler Patterns

### RESTful API Handler
```typescript
// server/api/terminals/[id].get.ts
export default defineEventHandler(async (event) => {
  try {
    const terminalId = getRouterParam(event, 'id');
    
    if (!terminalId || typeof terminalId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Terminal ID is required',
      });
    }
    
    const terminal = await terminalService.getTerminal(terminalId);
    
    if (!terminal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Terminal not found',
      });
    }
    
    return {
      success: true,
      data: terminal,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get terminal', { error, terminalId });
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error; // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
```

### WebSocket Message Handler
```typescript
// server/api/ws/terminal.ts
interface WebSocketMessage {
  type: string;
  data?: unknown;
  terminalId?: string;
}

export default defineWebSocketHandler({
  async message(peer, message) {
    try {
      const data = JSON.parse(message.text()) as WebSocketMessage;
      
      switch (data.type) {
        case 'terminal-input':
          await handleTerminalInput(peer, data);
          break;
          
        case 'terminal-resize':
          await handleTerminalResize(peer, data);
          break;
          
        default:
          logger.warn('Unknown WebSocket message type', { type: data.type });
          peer.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`,
          }));
      }
    } catch (error) {
      logger.error('WebSocket message handling failed', { error });
      
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Message processing failed',
      }));
    }
  },
});

async function handleTerminalInput(peer: Peer, message: WebSocketMessage): Promise<void> {
  if (!message.terminalId || typeof message.data !== 'string') {
    throw new Error('Invalid terminal input message');
  }
  
  const terminal = terminalService.getTerminal(message.terminalId);
  if (!terminal) {
    throw new Error('Terminal not found');
  }
  
  terminal.pty.write(message.data);
  
  peer.send(JSON.stringify({
    type: 'input-acknowledged',
    terminalId: message.terminalId,
  }));
}
```

## 🎨 CSS/Styling Patterns

### Vanilla Extract Component Styles
```typescript
// styles/components/button.css.ts
import { style, styleVariants } from '@vanilla-extract/css';

export const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  
  ':focus-visible': {
    outline: '2px solid var(--color-primary)',
    outlineOffset: '2px',
  },
});

export const buttonVariants = styleVariants({
  primary: {
    backgroundColor: 'var(--color-primary-500)',
    color: 'var(--color-white)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'var(--color-primary-600)',
      transform: 'translateY(-1px)',
    },
  },
  
  secondary: {
    backgroundColor: 'var(--color-gray-200)',
    color: 'var(--color-gray-900)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'var(--color-gray-300)',
    },
  },
});

export const buttonSizes = styleVariants({
  sm: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
});
```

### Theme System Pattern
```typescript
// styles/themes/dark.css.ts
import { createTheme } from '@vanilla-extract/css';
import { semanticTokens } from '../tokens/semantic.css';

export const darkTheme = createTheme(semanticTokens, {
  color: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    
    border: '#334155',
    borderFocus: '#3b82f6',
  },
});
```

## 🧪 Testing Patterns

### Component Test Pattern
```typescript
// components/Terminal.test.ts
describe('Terminal', () => {
  let wrapper: VueWrapper;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });
  
  it('should initialize with required props', async () => {
    wrapper = mount(Terminal, {
      props: {
        terminalId: 'test-123',
        autoConnect: false,
      },
    });
    
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.terminal-container').exists()).toBe(true);
    expect(wrapper.vm.terminalId).toBe('test-123');
  });
  
  it('should emit events on user interaction', async () => {
    wrapper = mount(Terminal, {
      props: { terminalId: 'test-123' },
    });
    
    await wrapper.find('.connect-button').trigger('click');
    
    expect(wrapper.emitted('connect')).toBeTruthy();
    const connectEvent = wrapper.emitted('connect')?.[0];
    expect(connectEvent).toEqual(['test-123']);
  });
});
```

### Service Test Pattern
```typescript
// services/terminal.test.ts
describe('TerminalService', () => {
  let service: TerminalService;
  
  beforeEach(() => {
    service = new TerminalService();
  });
  
  afterEach(() => {
    service.shutdown();
  });
  
  it('should create terminal with valid options', async () => {
    const options = {
      name: 'Test Terminal',
      workingDirectory: '/tmp',
    };
    
    const terminal = await service.createTerminal(options);
    
    expect(terminal.id).toBeDefined();
    expect(terminal.name).toBe('Test Terminal');
    expect(terminal.isActive).toBe(true);
  });
  
  it('should handle creation errors gracefully', async () => {
    const invalidOptions = { name: '' };
    
    await expect(service.createTerminal(invalidOptions))
      .rejects.toThrow('Terminal name is required');
  });
});
```

### Data-Driven Test Pattern
```typescript
it.each([
  { variant: 'primary', expectedClass: 'btn-primary' },
  { variant: 'secondary', expectedClass: 'btn-secondary' },
  { variant: 'danger', expectedClass: 'btn-danger' },
])('should render $variant variant correctly', ({ variant, expectedClass }) => {
  const wrapper = mount(AppButton, {
    props: { variant: variant as any },
    slots: { default: 'Test Button' },
  });
  
  expect(wrapper.classes()).toContain(expectedClass);
});
```

## 🔧 Utility Patterns

### Logger Utility
```typescript
// utils/logger.ts
interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
}

export const logger: Logger = {
  info: (message: string, context?: LogContext) => {
    console.info(`[INFO] ${message}`, context || '');
  },
  
  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context || '');
  },
  
  error: (message: string, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, context || '');
  },
  
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  },
};
```

### Validation Utilities
```typescript
// utils/validation.ts
export function isValidTerminalName(name: unknown): name is string {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.length <= 100 &&
         !/[<>"'/\\|?*]/.test(name);
}

export function sanitizePath(path: unknown): string {
  if (typeof path !== 'string') {
    return process.cwd();
  }
  
  return require('path').resolve(path.trim());
}

export function isValidEnvironment(env: unknown): env is Record<string, string> {
  return env != null && 
         typeof env === 'object' && 
         Object.values(env).every(val => typeof val === 'string');
}
```

---

**🔗 Related Documentation:**
- **Standards Quick Reference** → `docs/reference/standards-quick.md`
- **Implementation Guides** → `docs/implementation/`
- **Component Standards** → `docs/standards/components.md`