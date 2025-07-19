# Testing Standards for AI-Controller

**Version:** 1.1  
**Date:** July 19, 2025  
**Status:** Active

This document establishes comprehensive testing standards for the AI-Controller project, following RFC 2119 conventions for requirement levels.

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Framework Configuration](#testing-framework-configuration)  
3. [Minimal Mocking Philosophy](#minimal-mocking-philosophy)
4. [Test Organization and Structure](#test-organization-and-structure)
5. [Coverage Requirements](#coverage-requirements)
6. [Vue Component Testing](#vue-component-testing)
7. [Service Layer Testing](#service-layer-testing)
8. [Integration Testing](#integration-testing)
9. [WebSocket and Terminal Testing](#websocket-and-terminal-testing)
10. [Test Naming Conventions](#test-naming-conventions)
11. [Quality Gates](#quality-gates)
12. [Common Testing Patterns](#common-testing-patterns)

## Introduction

The AI-Controller project employs a comprehensive testing strategy focused on integration testing, minimal mocking, and user journey validation. This document defines the standards that **MUST** be followed to ensure high-quality, maintainable tests that provide confidence in the codebase.

### Key Principles

- **Integration over isolation**: Tests **SHOULD** verify real component interactions rather than isolated unit behavior
- **Minimal mocking**: Tests **MUST** only mock external dependencies outside our control
- **User journey focus**: Tests **SHOULD** validate complete user workflows
- **Coverage as guidance**: Tests **MUST** achieve 80% minimum coverage while prioritizing meaningful scenarios

## Testing Framework Configuration

### Vitest Configuration

The project **MUST** use Vitest as the primary testing framework with the following configuration:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        perFile: true,
      },
    },
  },
});
```

### Global Test Setup

All tests **MUST** use the global setup file at `test/setup.ts` for consistent mocking:

```typescript
// test/setup.ts - Example patterns
import { vi } from "vitest";

// Mock external browser libraries
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    // ... other terminal methods
  })),
}));

// Mock browser APIs
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

## Minimal Mocking Philosophy

### What MUST Be Mocked

Tests **MUST** mock only external dependencies outside our control:

#### ✅ Required Mocks

- **External system APIs**: `node-pty` (spawns real OS processes)
- **Browser APIs**: `WebSocket`, `window.location`, `matchMedia`, `process` global
- **Third-party libraries**: `@xterm/xterm`, `@xterm/addon-*` (browser terminal emulation)
- **Time/Date functions**: When testing specific timing behavior
- **Network requests**: To external services
- **Nuxt framework APIs**: `useCookie`, `useState`, `useNuxtApp`

#### ❌ What MUST NOT Be Mocked

- **Internal services**: Our own business logic and utilities
- **Logger utility**: Let it actually log during tests for debugging
- **Vue components**: Use real components when possible
- **Type definitions**: Interfaces and type structures
- **Internal business logic**: Service methods and functions we control

### Mock Implementation Standards

External dependency mocks **MUST** be:

```typescript
// ✅ Correct: Mock external library with realistic interface
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
  })),
}));

// ❌ Incorrect: Mocking internal service
vi.mock("./services/terminal"); // Don't do this
```

## Test Organization and Structure

### File Structure

Test files **MUST** follow this organization:

```
project-root/
├── test/
│   └── setup.ts              # Global test setup
├── components/
│   ├── Terminal.vue
│   └── Terminal.test.ts       # Component tests
├── server/services/
│   ├── terminal.ts
│   └── terminal.test.ts       # Service tests
├── composables/
│   ├── useTheme.ts
│   └── useTheme.test.ts       # Composable tests
└── utils/
    ├── logger.ts
    └── logger.test.ts         # Utility tests
```

### Test Structure Template

Each test file **MUST** follow this structure:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ComponentName", () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup resources
  });

  describe("Feature Group", () => {
    it("should describe specific behavior", () => {
      // Test implementation
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete user journey", () => {
      // Integration test
    });
  });

  describe("Error handling", () => {
    it("should handle error condition gracefully", () => {
      // Error scenario test
    });
  });
});
```

## Coverage Requirements

### Minimum Coverage Thresholds

All code **MUST** achieve minimum coverage thresholds:

- **Statements**: 80% minimum
- **Branches**: 80% minimum  
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Per-file enforcement**: `perFile: true`

### Coverage Exclusions

The following files **MAY** be excluded from coverage:

- Configuration files (`*.config.ts`, `*.config.js`)
- Type definitions (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Build artifacts (`dist/`, `.nuxt/`, `.output/`)
- Documentation (`docs/`)

### Coverage Quality Standards

High coverage **MUST** be achieved through:

- **Meaningful test scenarios**: Not just coverage for coverage's sake
- **User journey testing**: Complete workflows rather than isolated functions
- **Error path testing**: Verify error handling and edge cases
- **Integration testing**: Real component interactions

## Vue Component Testing

### Component Test Standards

Vue component tests **MUST** follow these patterns:

```typescript
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ComponentName from "./ComponentName.vue";

describe("ComponentName.vue", () => {
  let wrapper: ReturnType<typeof mount>;

  const mountOptions = {
    global: {
      stubs: {
        // Only stub Nuxt UI components if full Nuxt setup unavailable
        UButton: {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ["loading", "size", "color"],
          emits: ["click"],
        },
      },
    },
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("should render with expected elements", () => {
    wrapper = mount(ComponentName, mountOptions);
    
    expect(wrapper.find(".component-class").exists()).toBe(true);
  });

  it("should handle user interactions", async () => {
    wrapper = mount(ComponentName, mountOptions);
    
    await wrapper.find("button").trigger("click");
    
    expect(wrapper.emitted("click")).toBeTruthy();
  });
});
```

### Component Testing Requirements

Vue component tests **MUST**:

- Use `@vue/test-utils` for component mounting
- Test user interactions and behavior, not implementation details
- Verify component lifecycle (mount, update, unmount)
- Test prop validation and event emission
- Handle async operations with `nextTick()` and proper awaiting

Component tests **SHOULD**:

- Use minimal stubs for external UI libraries
- Focus on component behavior from user perspective
- Test integration with composables and services
- Verify error handling and edge cases

## Service Layer Testing

### Service Test Standards

Service layer tests **MUST** follow these patterns:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ServiceClass } from "./service";

// Mock only external dependencies
vi.mock("node-pty", () => ({
  spawn: vi.fn(() => ({
    pid: 1234,
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn(),
    onExit: vi.fn(),
  })),
}));

describe("ServiceClass", () => {
  let service: ServiceClass;

  beforeEach(() => {
    service = new ServiceClass();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe("Core functionality", () => {
    it("should perform primary operation", async () => {
      const result = await service.primaryMethod();
      expect(result).toBeDefined();
    });
  });

  describe("Error handling with real logger", () => {
    it("should handle and log errors properly", async () => {
      // Test error scenarios without mocking logger
      // Logger will actually log - useful for debugging
    });
  });
});
```

### Service Testing Requirements

Service tests **MUST**:

- Test with real internal dependencies (don't mock our own code)
- Mock only external system APIs (`node-pty`, file system, network)
- Verify error handling with actual logger output
- Test complete service lifecycle
- Use integration patterns for service-to-service communication

Service tests **SHOULD**:

- Test business logic flows
- Verify state management
- Test concurrent operations
- Handle cleanup and resource management

## Integration Testing

### Integration Test Philosophy

Integration tests **MUST** verify real component interactions:

```typescript
describe("ComponentName Integration", () => {
  describe("User Journey: Complete workflow", () => {
    it("should handle full create → use → cleanup flow", async () => {
      // 1. User creates resource
      const resource = await service.create(options);
      expect(resource.isActive).toBe(true);

      // 2. User performs operations
      const result = service.operate(resource.id, data);
      expect(result).toBe(true);

      // 3. User cleans up
      await service.destroy(resource.id);
      expect(service.get(resource.id)).toBeUndefined();
    });
  });
});
```

### Integration Test Requirements

Integration tests **MUST**:

- Test complete user workflows
- Verify cross-component communication
- Test real data flows
- Validate error propagation
- Test concurrent operations

Integration tests **SHOULD**:

- Focus on user journey scenarios
- Test system boundaries
- Verify performance characteristics
- Test with realistic data volumes

## WebSocket and Terminal Testing

### WebSocket Testing Standards

WebSocket tests **MUST** mock the WebSocket API:

```typescript
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};

global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket;

describe("WebSocket Integration", () => {
  it("should handle connection lifecycle", async () => {
    // Test connection establishment
    await component.connect();
    
    expect(WebSocket).toHaveBeenCalledWith("ws://localhost:3000/api/ws/terminal");
    
    // Test message sending
    component.sendMessage("test data");
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "input", data: "test data" })
    );
    
    // Test cleanup
    component.disconnect();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
```

### Terminal Testing Standards

Terminal tests **MUST** mock terminal libraries:

```typescript
// In test/setup.ts
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
  })),
}));

describe("Terminal Integration", () => {
  it("should handle terminal lifecycle", async () => {
    // Test terminal creation
    const terminal = await service.createTerminal();
    
    // Test terminal operations
    service.writeToTerminal(terminal.id, "ls -la\r");
    expect(terminal.pty.write).toHaveBeenCalledWith("ls -la\r");
    
    // Test cleanup
    await service.destroyTerminal(terminal.id);
    expect(terminal.pty.kill).toHaveBeenCalled();
  });
});
```

## Test Naming Conventions

### Test File Naming

Test files **MUST** follow these naming patterns:

- Component tests: `ComponentName.test.ts`
- Service tests: `serviceName.test.ts`
- Utility tests: `utilityName.test.ts`
- Integration tests: `featureName.integration.test.ts`

### Test Description Naming

Test descriptions **MUST** follow these patterns:

```typescript
describe("ComponentName", () => {
  describe("Feature group", () => {
    it("should describe expected behavior", () => {
      // Test implementation
    });
    
    it("should handle error condition gracefully", () => {
      // Error test
    });
  });
  
  describe("Integration scenarios", () => {
    it("should handle complete user journey: action → result → cleanup", () => {
      // Integration test
    });
  });
});
```

### Naming Requirements

Test names **MUST**:

- Use descriptive, behavior-focused language
- Start with "should" for test cases
- Include context about the scenario being tested
- Be readable as documentation

Test names **SHOULD**:

- Indicate the expected outcome
- Include relevant context (user actions, system state)
- Be specific enough to understand the test purpose
- Group related tests in logical `describe` blocks

## Quality Gates

### Pre-commit Quality Gates

All tests **MUST** pass these quality gates before commit:

```bash
# All commands must return 0 exit code
pnpm lint        # 0 errors, 0 warnings
pnpm typecheck   # 0 TypeScript errors
pnpm test        # 100% test success rate
pnpm build       # Successful production build
```

### Coverage Quality Gates

Coverage reports **MUST** meet these criteria:

- **Minimum thresholds**: 80% for all metrics (statements, branches, functions, lines)
- **Per-file enforcement**: Each file must meet thresholds individually
- **Meaningful coverage**: High coverage through integration tests, not trivial unit tests

### Test Performance Standards

Test execution **SHOULD** meet these performance criteria:

- **Unit tests**: < 100ms per test
- **Integration tests**: < 1000ms per test
- **Full test suite**: < 30 seconds total execution time
- **Coverage generation**: < 10 seconds additional time

## Common Testing Patterns

### Async Operation Testing

```typescript
it("should handle async operations", async () => {
  const result = await service.asyncOperation();
  
  expect(result).toBeDefined();
  expect(result.status).toBe("success");
});
```

### Error Handling Testing

```typescript
it("should handle errors gracefully", async () => {
  // Cause external dependency to fail
  vi.mocked(externalDependency).mockRejectedValue(new Error("Operation failed"));
  
  const result = await service.operation();
  
  expect(result).toBe(false);
  // Logger will actually log the error - useful for debugging
});
```

### Component Event Testing

```typescript
it("should emit events on user interaction", async () => {
  wrapper = mount(Component, mountOptions);
  
  await wrapper.find("button").trigger("click");
  
  expect(wrapper.emitted("click")).toBeTruthy();
  expect(wrapper.emitted("click")[0]).toEqual([expectedData]);
});
```

### State Management Testing

```typescript
it("should manage state correctly", async () => {
  const { state, updateState } = useComposable();
  
  expect(state.value).toBe(initialValue);
  
  updateState(newValue);
  
  expect(state.value).toBe(newValue);
});
```

### Resource Cleanup Testing

```typescript
it("should cleanup resources properly", async () => {
  const resource = await service.createResource();
  
  // Perform operations
  await service.useResource(resource.id);
  
  // Cleanup
  await service.destroyResource(resource.id);
  
  expect(service.getResource(resource.id)).toBeUndefined();
});
```

### Data-Driven Testing with .each (MANDATORY PATTERNS)

**Core Philosophy**: Tests **SHOULD** be WET (Write Everything Twice) for clarity, but **MUST** be DRY where execution steps are identical.

#### When to Use it.each and describe.each

**✅ MUST use `.each` for:**
- Pure data-driven tests where only input/expected values change
- Replacing manual `forEach` loops within test cases (anti-pattern)
- Repetitive execution patterns with different data sets
- Configuration testing (different system specs, usage levels, etc.)

**❌ MUST NOT use `.each` for:**
- Complex integration tests with unique setup/teardown
- Tests with case-specific assertions or validation logic
- Multi-step workflows where each step has different meaning
- Error scenarios that require specific context or setup

#### Data-Driven Component State Testing

```typescript
// ✅ CORRECT: Identical execution steps, different data
it.each([
  { terminalCount: 2, usage: 33, indicatorClass: "indicator-safe", description: "low usage (33%)" },
  { terminalCount: 4, usage: 67, indicatorClass: "indicator-warning", description: "medium usage (67%)" },
  { terminalCount: 5, usage: 83, indicatorClass: "indicator-danger", description: "high usage (83%)" },
])("should apply correct styling for $description", async ({ terminalCount, indicatorClass }: {
  terminalCount: number; 
  indicatorClass: string;
}) => {
  mockTerminalCount.value = terminalCount;
  
  const wrapper = mount(ResourceMonitor);
  await wrapper.vm.$nextTick();
  
  expect(wrapper.find(".resource-indicator").classes()).toContain(indicatorClass);
});
```

#### System Configuration Testing

```typescript
// ✅ CORRECT: Replace forEach anti-pattern
it.each([
  { cores: 16, expectedMax: 12, description: "16 cores → 12 max terminals (4 reserved)" },
  { cores: 12, expectedMax: 9, description: "12 cores → 9 max terminals (3 reserved)" },
  { cores: 6, expectedMax: 4, description: "6 cores → 4 max terminals (2 reserved, minimum)" },
])("should calculate 25% reservation correctly for $description", ({ cores, expectedMax }: {
  cores: number; 
  expectedMax: number;
}) => {
  Object.defineProperty(global.navigator, "hardwareConcurrency", {
    value: cores,
    writable: true,
  });
  
  const { detectSystemCapability } = useSystemResources();
  const result = detectSystemCapability();
  
  expect(result.totalCores).toBe(cores);
  expect(result.maxTerminals).toBe(expectedMax);
});
```

#### Anti-Patterns to Avoid

**❌ INCORRECT: Manual forEach in Tests**
```typescript
// ❌ BAD: Manual forEach loop - MUST be converted to it.each
it("should handle multiple configurations", () => {
  const testCases = [{ cores: 8 }, { cores: 16 }];
  testCases.forEach(({ cores }) => {
    // test logic here - THIS IS AN ANTI-PATTERN
  });
});
```

**❌ INCORRECT: Complex Integration Tests with .each**
```typescript
// ❌ BAD: Complex workflow doesn't belong in .each
it.each([...])("should handle terminal lifecycle", () => {
  const store = useTerminalManagerStore();
  const terminal1Id = store.createTerminal("Terminal 1");
  store.setActiveTerminal(terminal1Id);
  store.removeTerminal(terminal1Id);
  // Complex multi-step logic - keep as individual tests
});
```

#### describe.each for Test Suite Organization

**✅ Use `describe.each` when:**
- Testing same functionality across different configurations
- Multiple components with identical behavior patterns
- Cross-platform testing scenarios

```typescript
// ✅ CORRECT: Testing same component behavior across different props
describe.each([
  { variant: "primary", expectedClass: "btn-primary" },
  { variant: "secondary", expectedClass: "btn-secondary" },
])("AppButton with $variant variant", ({ variant, expectedClass }) => {
  it("should render with correct styling", () => {
    const wrapper = mount(AppButton, { props: { variant } });
    expect(wrapper.classes()).toContain(expectedClass);
  });
  
  it("should handle click events", () => {
    const wrapper = mount(AppButton, { props: { variant } });
    wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });
});
```

#### Quality Benefits

1. **Eliminates forEach Anti-Pattern**: No more manual loops within tests
2. **Improved Test Names**: Dynamic test descriptions show actual data
3. **Better Coverage Visibility**: Each data case appears as separate test
4. **Easier Debugging**: Failed tests show exact data that caused failure
5. **Enhanced Maintainability**: Adding new test cases is trivial

#### Decision Framework

**Ask yourself:**
- 🤔 **Are the execution steps identical?** → Use `.each`
- 🤔 **Do I have a `forEach` loop in my test?** → Convert to `.each`
- 🤔 **Is this testing different data inputs?** → Use `.each`
- 🤔 **Does each case need unique setup/assertions?** → Keep separate tests

**Remember**: **WET for complexity, DRY for execution patterns**

## Conclusion

This testing standards document establishes a comprehensive framework for testing the AI-Controller project. By following these standards, we ensure:

- **High code quality** through meaningful test coverage
- **Maintainable tests** that focus on user behavior
- **Confident refactoring** through integration testing
- **Rapid feedback** through efficient test execution
- **Clear documentation** through descriptive test names

All contributors **MUST** follow these standards to maintain the quality and reliability of the AI-Controller codebase.

---

**Document History:**
- v1.1 (2025-07-19): Added comprehensive data-driven testing patterns with .each standards
- v1.0 (2025-07-16): Initial standards document created