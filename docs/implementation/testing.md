# Testing Implementation Guide

**Technical reference for writing effective tests with Vitest**

## Core Testing Philosophy

### Integration Over Unit Testing
- **Test user journeys** → Complete workflows, not isolated methods
- **Focus on behavior** → What users see and do, not internal implementation
- **Real component interactions** → Use actual components when possible
- **Minimal mocking** → Only mock external dependencies outside our control

### Minimal Mocking Approach (CRITICAL)

#### ✅ DO MOCK (External dependencies we don't control)
```typescript
// External system APIs
vi.mock('node-pty', () => ({ spawn: vi.fn() }));

// Browser APIs  
vi.mock('WebSocket', () => ({ 
  WebSocket: vi.fn(() => ({ send: vi.fn(), close: vi.fn() }))
}));

// Third-party libraries
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({ open: vi.fn(), write: vi.fn() }))
}));
```

#### ❌ DON'T MOCK (Internal code we control)
```typescript
// ❌ Internal services
// vi.mock('./services/terminal'); 

// ❌ Logger utility
// vi.mock('~/utils/logger');

// ❌ Vue components  
// vi.mock('./components/Terminal.vue');

// ❌ Business logic
// vi.mock('./composables/useTerminalState');
```

## Test Organization & Structure

### File Co-location (MANDATORY)
```
components/
├── Terminal.vue
├── Terminal.test.ts                    # ✅ Co-located
└── terminal/
    ├── TerminalHeader.vue  
    ├── TerminalHeader.test.ts          # ✅ Co-located
    ├── TerminalContent.vue
    └── TerminalContent.test.ts         # ✅ Co-located
```

### Test File Structure
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Mock external dependencies only
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should render with default props', () => {
      // Test implementation
    });
  });

  describe('user interactions', () => {
    it('should handle click events', async () => {
      // Test implementation
    });
  });

  describe('error handling', () => {
    it('should display error messages gracefully', () => {
      // Test implementation
    });
  });
});
```

## Component Testing Patterns

### Vue Component Testing
```typescript
import { mount } from '@vue/test-utils';

describe('TerminalComponent', () => {
  it('should initialize terminal on mount', async () => {
    const wrapper = mount(TerminalComponent, {
      props: {
        autoConnect: true,
      },
    });
    
    await wrapper.vm.$nextTick();
    
    // Test behavior, not implementation details
    expect(wrapper.find('.terminal-container').exists()).toBe(true);
    expect(wrapper.emitted('initialized')).toBeTruthy();
  });

  it('should emit events on user interaction', async () => {
    const wrapper = mount(TerminalComponent);
    
    await wrapper.find('.connect-button').trigger('click');
    
    expect(wrapper.emitted('connect')).toBeTruthy();
    const connectEvent = wrapper.emitted('connect')?.[0];
    expect(connectEvent).toBeDefined();
  });

  it('should handle props changes reactively', async () => {
    const wrapper = mount(TerminalComponent, {
      props: { isConnected: false },
    });
    
    await wrapper.setProps({ isConnected: true });
    
    expect(wrapper.find('.connection-status').text()).toContain('Connected');
  });
});
```

### Composable Testing
```typescript
import { useTerminalState } from './useTerminalState';

describe('useTerminalState', () => {
  it('should manage terminal connection state', () => {
    const { isConnected, terminalId, connect, disconnect } = useTerminalState();
    
    // Initial state
    expect(isConnected.value).toBe(false);
    expect(terminalId.value).toBeNull();
    
    // Test state changes
    connect('terminal-123');
    expect(isConnected.value).toBe(true);
    expect(terminalId.value).toBe('terminal-123');
    
    disconnect();
    expect(isConnected.value).toBe(false);
  });

  it('should handle connection errors', async () => {
    const { connect } = useTerminalState();
    
    // Test error handling
    await expect(connect('')).rejects.toThrow('Invalid terminal ID');
  });
});
```

### Store Testing (Pinia)
```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useTerminalManagerStore } from './terminalManager';

describe('useTerminalManagerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should create and manage terminals', () => {
    const store = useTerminalManagerStore();
    
    // Test store actions
    const terminalId = store.createTerminal('Test Terminal');
    expect(store.terminals).toHaveLength(1);
    expect(store.terminals[0].name).toBe('Test Terminal');
    
    // Test state mutations
    store.setActiveTerminal(terminalId);
    expect(store.activeTerminalId).toBe(terminalId);
    
    // Test cleanup
    store.removeTerminal(terminalId);
    expect(store.terminals).toHaveLength(0);
  });
});
```

## Advanced Testing Patterns

### Data-Driven Testing with `it.each`
```typescript
// ✅ Use .each for multiple data scenarios (2+ test cases)
it.each([
  { variant: 'primary', expectedClass: 'btn-primary' },
  { variant: 'secondary', expectedClass: 'btn-secondary' },
  { variant: 'danger', expectedClass: 'btn-danger' },
])('should render $variant variant with correct styling', ({ variant, expectedClass }) => {
  const wrapper = mount(AppButton, { 
    props: { variant: variant as any } 
  });
  
  expect(wrapper.classes()).toContain(expectedClass);
});

// ✅ System configuration testing
it.each([
  { cores: 16, expectedMax: 12, description: '16 cores → 12 max terminals' },
  { cores: 8, expectedMax: 6, description: '8 cores → 6 max terminals' },
  { cores: 4, expectedMax: 3, description: '4 cores → 3 max terminals' },
])('should calculate terminal limits correctly: $description', ({ cores, expectedMax }) => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { 
    value: cores, 
    configurable: true 
  });
  
  const result = calculateTerminalLimit();
  expect(result.maxTerminals).toBe(expectedMax);
});
```

### Async Testing Patterns
```typescript
describe('async operations', () => {
  it('should handle async component initialization', async () => {
    const wrapper = mount(AsyncComponent);
    
    // Wait for component to initialize
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(wrapper.vm.isInitialized).toBe(true);
  });

  it('should handle WebSocket message processing', async () => {
    const { handleMessage } = useWebSocket();
    
    const messagePromise = handleMessage('{"type": "test", "data": "hello"}');
    await expect(messagePromise).resolves.toBeUndefined();
  });
});
```

### Error Handling Testing
```typescript
describe('error handling', () => {
  it('should handle terminal initialization failures', async () => {
    // Mock terminal to throw error
    const mockTerminal = vi.fn(() => {
      throw new Error('Terminal init failed');
    });
    vi.mocked(Terminal).mockImplementation(mockTerminal);
    
    const wrapper = mount(TerminalComponent);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Terminal init failed');
  });

  it('should handle network connection errors', async () => {
    const { connect } = useWebSocket();
    
    // Simulate network error
    const mockWebSocket = vi.fn(() => {
      throw new Error('Connection failed');
    });
    global.WebSocket = mockWebSocket as any;
    
    await expect(connect()).rejects.toThrow('Connection failed');
  });
});
```

## Test Skipping Guidelines (CRITICAL)

### When Test Skipping is Acceptable
- ✅ **Server-side operations in client-side phases** (e.g., Phase 2A git operations)
- ✅ **Features explicitly deferred to future phases** with clear timeline
- ✅ **External system integration** when systems aren't available in test environment

### Test Skipping Requirements
```typescript
// ✅ Proper describe.skip usage
describe.skip('server-side git operations', () => {
  // Skip server-side tests in Phase 2A - git operations are client-side only for now
  // TODO: Enable these tests in Phase 2B Step 7 when server-side git operations are implemented
  // Also remove coverage exemption from vitest.config.ts at that time
  
  it('should validate git repository on server', async () => {
    // Server-side test implementation
  });
  
  it('should get available branches', async () => {
    // Server-side test implementation
  });
});
```

### Coverage Exemptions
```typescript
// vitest.config.ts
exclude: [
  // Temporary exclusions for Phase 2A - TODO: Remove in Phase 2B Step 7
  "composables/useGitRepository.ts", // Server-side git operations not implemented yet
  "composables/useSavedDirectories.ts", // Placeholder localStorage implementation
]
```

## Phase-Based Testing Strategy

### Phase 2A Testing Approach
```typescript
describe('Phase 2A placeholder behavior', () => {
  it('should handle localStorage operations gracefully', async () => {
    const { addSavedDirectory, getSavedDirectories, removeSavedDirectory } = useSavedDirectories();

    // These should all complete without throwing in Phase 2A
    await expect(addSavedDirectory({ name: 'Test', path: '/test' })).resolves.toBeUndefined();
    await expect(getSavedDirectories()).resolves.toEqual([]);
    await expect(removeSavedDirectory('test-id')).resolves.toBeUndefined();
  });

  it('should handle error conditions gracefully', async () => {
    const { getSavedDirectories } = useSavedDirectories();
    
    // Mock invalid JSON to test error handling
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    
    const result = await getSavedDirectories();
    expect(result).toEqual([]);
  });
});
```

## Testing Utilities & Setup

### Global Test Setup (`test/setup.ts`)
```typescript
import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Global mocks for external dependencies
vi.mock('node-pty', () => ({
  spawn: vi.fn(() => ({
    write: vi.fn(),
    kill: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    loadAddon: vi.fn(),
  })),
}));

// Vue Test Utils global configuration
config.global.stubs = {
  // Stub Nuxt UI components if needed
  UButton: true,
  UModal: true,
};
```

### Test Utilities
```typescript
// Test helper functions
export function createMockTerminal() {
  return {
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    loadAddon: vi.fn(),
  };
}

export function createMockWebSocket() {
  return {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
```

## Performance Testing

### Coverage Requirements
- **80% minimum** per file (statements, branches, functions, lines)
- **Focus on meaningful coverage** → Test important code paths
- **Avoid coverage gaming** → Don't write tests just to hit numbers

### Test Performance
```typescript
// ✅ Efficient test setup
describe('ComponentName', () => {
  let wrapper: VueWrapper;
  
  beforeEach(() => {
    wrapper = mount(ComponentName);
  });
  
  afterEach(() => {
    wrapper.unmount();
  });
  
  // Tests use shared wrapper instance
});
```

---

**🔗 Related Documentation:**
- **Testing Standards** → `docs/standards/testing.md`
- **Component Standards** → `docs/standards/components.md`
- **Test Issues Troubleshooting** → `docs/troubleshooting/test-issues.md`