# Test Issues Troubleshooting

**Quick resolution guide for common testing problems**

## Quick Diagnosis Tree

### All Tests Failing
- **Global setup issue** → Check `test/setup.ts` for configuration errors
- **Mock configuration** → Verify vi.mock() statements are correct
- **Environment setup** → Check Node.js version and dependencies

### Specific Component Tests Failing
- **Component mounting** → Check props, slots, and component imports
- **Mock timing** → Add `await nextTick()` or `await flushPromises()`
- **External library mocks** → Verify third-party library mocks

### Flaky/Intermittent Failures
- **Timing issues** → Add proper async/await handling
- **State cleanup** → Ensure beforeEach/afterEach cleanup
- **Race conditions** → Use proper test synchronization

### Coverage Failures
- **Missing test coverage** → Add tests for uncovered code paths
- **Coverage exemptions** → Check vitest.config.ts exclude list
- **Phase-specific exemptions** → Verify temporary exclusions are documented

## Common Mock Issues

### External Library Mocking Problems
```typescript
// ❌ Common mistake - incorrect mock structure
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(), // Missing implementation
}));

// ✅ Correct approach - proper mock implementation
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    loadAddon: vi.fn(),
  })),
}));
```

### Browser API Mocking
```typescript
// ✅ Mock WebSocket properly
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};

Object.defineProperty(global, 'WebSocket', {
  value: vi.fn(() => mockWebSocket),
  writable: true,
});

// ✅ Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});
```

### Vue Component Mock Issues
```typescript
// ❌ Don't mock internal Vue components
// vi.mock('./components/Terminal.vue'); 

// ✅ Mock external UI libraries when needed
vi.mock('#components', () => ({
  UButton: {
    template: '<button><slot /></button>',
  },
  UModal: {
    template: '<div><slot /></div>',
  },
}));
```

## Component Testing Issues

### Component Mounting Problems
```typescript
// ❌ Missing required props
const wrapper = mount(TerminalComponent); // May fail if props required

// ✅ Provide required props
const wrapper = mount(TerminalComponent, {
  props: {
    terminalId: 'test-123',
    autoConnect: false,
  },
});

// ✅ Use realistic prop values
const wrapper = mount(CreateTerminalModal, {
  props: {
    modelValue: true, // Modal is open
    savedDirectories: [],
  },
});
```

### Async Component Testing
```typescript
// ❌ Not waiting for async operations
it('should initialize terminal', () => {
  const wrapper = mount(TerminalComponent);
  expect(wrapper.vm.isInitialized).toBe(true); // May fail
});

// ✅ Proper async testing
it('should initialize terminal', async () => {
  const wrapper = mount(TerminalComponent);
  await wrapper.vm.$nextTick();
  await flushPromises(); // Wait for all promises
  
  expect(wrapper.vm.isInitialized).toBe(true);
});

// ✅ Helper for flushing promises
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
```

### Event Testing Issues
```typescript
// ❌ Not waiting for events to process
it('should emit click event', () => {
  const wrapper = mount(AppButton);
  wrapper.trigger('click');
  expect(wrapper.emitted('click')).toBeTruthy(); // May fail
});

// ✅ Proper event testing
it('should emit click event', async () => {
  const wrapper = mount(AppButton);
  await wrapper.trigger('click');
  
  expect(wrapper.emitted('click')).toBeTruthy();
  expect(wrapper.emitted('click')?.[0]).toBeDefined();
});
```

## Testing Environment Issues

### Import/Module Resolution
```typescript
// ❌ Import path issues
import { useTerminalState } from './useTerminalState'; // May not resolve

// ✅ Use proper aliases in tests
import { useTerminalState } from '~/composables/useTerminalState';

// ✅ Or relative paths when appropriate
import { useTerminalState } from '../composables/useTerminalState';
```

### Global Setup Problems
```typescript
// test/setup.ts - Common issues and solutions

// ❌ Missing global mocks
// Tests may fail because external dependencies aren't mocked

// ✅ Comprehensive global setup
import { vi } from 'vitest';

// Mock external systems globally
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
  })),
}));

// Mock browser APIs
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  },
  writable: true,
});
```

## Specific Framework Issues

### Nuxt/Vue 3 Testing Problems
```typescript
// ❌ Missing Nuxt context
const { $fetch } = useNuxtApp(); // May fail in tests

// ✅ Mock Nuxt composables when needed
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn(),
  }),
}));

// ✅ Or test without Nuxt-specific features
// Focus on pure Vue component logic
```

### Pinia Store Testing
```typescript
// ❌ Not setting up Pinia properly
const store = useTerminalManagerStore(); // May fail

// ✅ Proper Pinia test setup
import { setActivePinia, createPinia } from 'pinia';

beforeEach(() => {
  setActivePinia(createPinia());
});

it('should manage store state', () => {
  const store = useTerminalManagerStore();
  // Test store logic
});
```

## Coverage Issues

### Missing Coverage
```typescript
// ❌ Uncovered error paths
function processData(data: unknown) {
  if (!data) {
    throw new Error('Data required'); // Not tested
  }
  return processValidData(data);
}

// ✅ Test error conditions
it('should throw error for invalid data', () => {
  expect(() => processData(null)).toThrow('Data required');
  expect(() => processData(undefined)).toThrow('Data required');
});
```

### Coverage Exemptions
```typescript
// vitest.config.ts - Proper exemption documentation
exclude: [
  // Temporary exclusions for Phase 2A - TODO: Remove in Phase 2B Step 7
  "composables/useGitRepository.ts", // Server-side git operations not implemented yet
  "composables/useSavedDirectories.ts", // Placeholder localStorage implementation, full testing in Phase 2B
]
```

## Performance Issues

### Slow Test Execution
```typescript
// ❌ Inefficient test setup
describe('Component tests', () => {
  it('test 1', () => {
    const heavySetup = createExpensiveSetup(); // Repeated work
  });
  
  it('test 2', () => {
    const heavySetup = createExpensiveSetup(); // Duplicated
  });
});

// ✅ Shared test setup
describe('Component tests', () => {
  let sharedSetup: SetupType;
  
  beforeEach(() => {
    sharedSetup = createExpensiveSetup(); // Done once per test
  });
  
  it('test 1', () => {
    // Use sharedSetup
  });
  
  it('test 2', () => {
    // Use sharedSetup
  });
});
```

### Memory Leaks in Tests
```typescript
// ❌ Not cleaning up after tests
let wrapper: VueWrapper;

it('should work', () => {
  wrapper = mount(Component);
  // No cleanup - memory leak
});

// ✅ Proper cleanup
afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
  vi.clearAllMocks();
  vi.resetAllMocks();
});
```

## Test Debugging Strategies

### Debug Individual Tests
```bash
# Run specific test file
pnpm test components/Terminal.test.ts

# Run with debugging output
pnpm test --reporter=verbose

# Run single test by name
pnpm test --grep="should initialize terminal"
```

### Debug Mock Issues
```typescript
// Add debugging to mocks
vi.mock('@xterm/xterm', () => {
  console.log('Mock @xterm/xterm called');
  return {
    Terminal: vi.fn(() => {
      console.log('Mock Terminal constructor called');
      return {
        open: vi.fn(() => console.log('Mock terminal.open called')),
        write: vi.fn(() => console.log('Mock terminal.write called')),
      };
    }),
  };
});
```

### Debug Component State
```typescript
it('should debug component state', async () => {
  const wrapper = mount(Component);
  
  // Debug component data
  console.log('Component data:', wrapper.vm.$data);
  console.log('Component props:', wrapper.props());
  console.log('Component emitted:', wrapper.emitted());
  
  // Debug DOM
  console.log('Component HTML:', wrapper.html());
});
```

## Prevention Strategies

### Robust Test Patterns
```typescript
// ✅ Defensive test writing
describe('TerminalComponent', () => {
  let wrapper: VueWrapper;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any global state
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null as any;
    }
    vi.resetAllMocks();
  });
  
  it('should handle all component states', async () => {
    wrapper = mount(TerminalComponent, {
      props: { /* realistic props */ },
    });
    
    // Wait for initialization
    await wrapper.vm.$nextTick();
    await flushPromises();
    
    // Test multiple states
    expect(wrapper.vm.isInitialized).toBe(true);
    
    // Test interaction
    await wrapper.find('.connect-button').trigger('click');
    expect(wrapper.emitted('connect')).toBeTruthy();
  });
});
```

### Test Quality Checklist
- [ ] All external dependencies mocked properly
- [ ] Async operations handled with proper awaiting
- [ ] Component cleanup in afterEach hooks
- [ ] Error conditions tested
- [ ] Realistic test data used
- [ ] No test interdependencies
- [ ] Clear, descriptive test names

---

**🔗 Related Documentation:**
- **Testing Implementation Guide** → `docs/implementation/testing.md`
- **Testing Standards** → `docs/standards/testing.md`
- **Build Issues** → `docs/troubleshooting/build-issues.md`