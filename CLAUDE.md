# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-controller is a web application designed to manage multiple terminal-based AI instances. The project is currently in its initial stages with no implementation yet.

## Current State

### 📁 Project Structure
```
/
├── components/Terminal.vue          # Main terminal component
├── server/
│   ├── api/health.get.ts           # Health check endpoint
│   ├── api/ws/terminal.ts          # WebSocket terminal handler
│   └── services/terminal.ts        # Terminal service backend
├── styles/                         # Vanilla Extract styles
├── types/index.ts                  # Type definitions
├── pages/index.vue                 # Main application page
├── layouts/default.vue             # Default layout
└── nuxt.config.ts                  # Nuxt configuration
```

## Development Workflow

When starting any new development work, follow this essential workflow:

### 1. Branch Management
- **Always** create a new branch off of main first before starting any work
- Use descriptive branch names that reflect the feature/task being worked on

### 2. Requirements Analysis
- Think **ultra deeply** about the requirements before proceeding
- If anything seems missing or unclear, **pause and ask** for clarification
- Consider the current state of the codebase before making changes
- Understand the context and impact of the proposed changes

### 3. Solution Design
- **Reference development standards**: Check `docs/standards/` for applicable patterns before designing
- Brainstorm multiple different solutions that would best fit the requirements
- Keep solutions **KISS** (Keep It Simple, Stupid) and **DRY** (Don't Repeat Yourself)
- Note: Tests should be **WET** (Write Everything Twice) for clarity and comprehensiveness
- **Always include tests** for any code written - use **Vitest** as the testing framework
- Prefer **integration tests** over unit tests
- **MUST** Mock only what's absolutely necessary (external APIs, etc.)

### 4. Solution Iteration
- Review each solution for correctness and fit
- If not correct enough, restart the solution loop
- Iterate until you find a truly good solution
- Don't settle for "good enough" - aim for the right solution

### 5. Implementation Process
- **Follow development standards**: Reference `docs/standards/` for all implementation patterns
- Build, test, and check types continuously as you implement
- Run tests and builds at every **main milestone** of the work
- Perform **sanity checks every 30 minutes**: test, types, verify you're on the correct path
- **Ensure standards compliance**: Check against `docs/standards/README.md` checklist
- Ensure adherence to KISS, DRY/WET principles throughout

### 6. Final Review & Quality Gates (CRITICAL - NON-NEGOTIABLE)
- Once implementation is complete and confirmed working, perform a **self code review**
- Focus on:
  - **Correctness**: Does it work as intended?
  - **KISS**: Is it as simple as possible?
  - **YAGNI**: You Aren't Gonna Need It - no over-engineering
  - **DRY/WET**: Proper balance between DRY code and WET tests
  - **Nuance**: Are there subtle considerations addressed?
  - **General best practices**: Any other relevant quality factors

### 7. MANDATORY QUALITY GATES (ABSOLUTE REQUIREMENT)
**🚨 CRITICAL: At the end of ANY piece of work, ALL quality gates MUST pass 100%. NO EXCEPTIONS.**

```bash
# ALL these commands MUST return success (exit code 0) before work is considered complete:
pnpm test        # 100% test success rate - ALL tests must pass
pnpm lint        # 0 linting errors, 0 warnings
pnpm typecheck   # 0 TypeScript errors
pnpm build       # Successful production build
```

**Why this is absolutely critical:**
- **Failing tests = broken functionality** - Users depend on working code
- **Lint errors = code quality issues** - Leads to bugs and maintenance nightmares
- **TypeScript errors = runtime failures** - Will crash in production
- **Build failures = deployment issues** - Code cannot be released

**Process:**
1. **NEVER** consider work "complete" until ALL quality gates pass
2. **NEVER** move to next task until current task has all quality gates passing
3. **ALWAYS** run quality gates at the end of each significant change
4. **ALWAYS** fix ALL failures before considering work done
5. **ALWAYS** update learnings if quality gates reveal systematic issues

**If quality gates fail:**
- **STOP immediately** and fix ALL failures
- **DO NOT** proceed to other tasks
- **DO NOT** consider work complete
- **DO NOT** make excuses about "minor" failures
- **FIX ALL ISSUES** until every gate passes 100%

## Build & Development Commands

The following commands are available for development:

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm generate         # Generate static site

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Run ESLint with auto-fix
pnpm typecheck        # Run TypeScript type checking

# Testing
pnpm test             # Run Vitest tests
pnpm test:ui          # Run Vitest with UI

# Package Management
pnpm install          # Install dependencies
pnpm postinstall      # Run Nuxt prepare (runs automatically)
```

### Important Setup Step

After running `pnpm install`, you MUST rebuild node-pty native bindings:
```bash
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
```

**Why npm rebuild instead of pnpm?** Even though we use pnpm as our package manager, rebuilding native bindings inside the node_modules directory requires npm rebuild because that's what node-pty's build scripts expect. The pnpm rebuild command works differently and won't properly compile the native bindings in nested directories.

This is required because node-pty has native bindings that must be compiled for your platform.

## Development Guidelines

### Technology Stack (Implemented)
- **Frontend**: Nuxt 3 + Vue 3 + TypeScript + Nuxt UI
- **Backend**: Nitro with WebSocket support
- **Terminal**: xterm.js + node-pty + Socket.IO
- **Styling**: Vanilla Extract + Nuxt UI components
- **State Management**: Pinia
- **Code Quality**: ESLint + Prettier + TypeScript strict mode

### Architecture Patterns
- **Component-based**: Vue 3 Composition API
- **Server-side**: Nitro API routes with WebSocket support
- **Real-time communication**: Socket.IO for terminal I/O
- **Type safety**: Full TypeScript coverage
- **Service layer**: Separate terminal service for business logic

### Current API Endpoints
- `GET /api/health` - Health check endpoint
- `WS /api/ws/terminal` - WebSocket terminal communication

### Testing Strategy (CRITICAL - FOLLOW THESE RULES)
- **Framework**: Vitest with coverage enabled (80% minimum per file)
- **Coverage Requirements**: 80% statements, branches, functions, lines (perFile: true)
- **Focus**: User journey testing over isolated unit tests
- **Philosophy**: Test integration flows rather than individual methods
- **Test Co-location**: Tests MUST be placed next to the files they test, not in separate folders

#### MINIMAL MOCKING APPROACH - ONLY MOCK WHAT'S ABSOLUTELY NECESSARY
**✅ DO MOCK (External dependencies outside our control):**
- External system APIs: `node-pty` (spawns real OS processes)
- Browser APIs: `WebSocket`, `window.location`, `process` global
- Third-party libraries: `@xterm/xterm`, `@xterm/addon-*` (browser terminal emulation)
- Time/Date functions when testing specific timing behavior
- Network requests to external services

**❌ DON'T MOCK (Internal code we control):**
- Our own services, utilities, and components
- Logger utility (let it actually log during tests)
- Type definitions and interfaces
- Vue components (use real components when possible)
- Internal business logic

#### When Testing Components
- Use `@vue/test-utils` with minimal stubs
- Only stub Nuxt UI components if full Nuxt test setup isn't available
- Test user interactions and component behavior, not implementation details
- Focus on what users see and do, not internal method calls

#### When Testing Services
- Test the service with real dependencies where possible
- Mock only external system calls (`node-pty`, file system, network)
- Verify that services call logger appropriately (don't mock logger)
- Test error handling with real error scenarios

#### User Journey Testing Examples
- **Terminal Lifecycle**: Create → Resize → Write → Destroy
- **Multi-terminal Management**: Create multiple → Use independently → Cleanup
- **Error Scenarios**: Handle write failures, resize failures, etc.
- **Integration Flows**: Component → WebSocket → Service → node-pty

#### ADVANCED TESTING PATTERNS - WET vs DRY Balance (CRITICAL - FOLLOW THESE PATTERNS)

**Core Philosophy**: Tests should be **WET (Write Everything Twice)** for clarity, but **DRY where execution steps are identical**.

##### When to Use `it.each` and `describe.each` (MANDATORY GUIDELINES)

**✅ ALWAYS use `.each` for:**
- **Pure data-driven tests** where only input/expected values change
- **Replacing manual `forEach` loops** within test cases (anti-pattern)
- **Repetitive execution patterns** with different data sets
- **Configuration testing** (different system specs, usage levels, etc.)

**❌ NEVER use `.each` for:**
- **Complex integration tests** with unique setup/teardown
- **Tests with case-specific assertions** or validation logic
- **Multi-step workflows** where each step has different meaning
- **Error scenarios** that require specific context or setup

##### Excellent `.each` Patterns (FOLLOW THESE EXAMPLES)

**Data-Driven Component State Testing:**
```typescript
// ✅ GOOD: Identical execution, different data
it.each([
  { terminalCount: 2, usage: 33, indicatorClass: "indicator-safe", description: "low usage (33%)" },
  { terminalCount: 4, usage: 67, indicatorClass: "indicator-warning", description: "medium usage (67%)" },
  { terminalCount: 5, usage: 83, indicatorClass: "indicator-danger", description: "high usage (83%)" },
])("should apply correct styling for $description", async ({ terminalCount, indicatorClass }) => {
  mockTerminalCount.value = terminalCount;
  const wrapper = mount(ResourceMonitor);
  await wrapper.vm.$nextTick();
  expect(wrapper.find(".resource-indicator").classes()).toContain(indicatorClass);
});
```

**System Configuration Testing:**
```typescript
// ✅ GOOD: Replace forEach anti-pattern
it.each([
  { cores: 16, expectedMax: 12, description: "16 cores → 12 max terminals (4 reserved)" },
  { cores: 12, expectedMax: 9, description: "12 cores → 9 max terminals (3 reserved)" },
  { cores: 6, expectedMax: 4, description: "6 cores → 4 max terminals (2 reserved, minimum)" },
])("should calculate 25% reservation correctly for $description", ({ cores, expectedMax }) => {
  Object.defineProperty(global.navigator, "hardwareConcurrency", { value: cores, writable: true });
  const result = detectSystemCapability();
  expect(result.maxTerminals).toBe(expectedMax);
});
```

##### Anti-Patterns to Avoid (NEVER DO THIS)

**❌ Manual forEach in Tests (ALWAYS CONVERT TO .each):**
```typescript
// ❌ BAD: Manual forEach loop - should be it.each
it("should handle multiple configurations", () => {
  const testCases = [{ cores: 8 }, { cores: 16 }];
  testCases.forEach(({ cores }) => {
    // test logic here - THIS IS AN ANTI-PATTERN
  });
});
```

**❌ Complex Integration Tests with .each:**
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

##### `describe.each` for Test Suite Organization

**✅ Use `describe.each` when:**
- Testing same functionality across different configurations
- Multiple components with identical behavior patterns
- Cross-browser or cross-platform testing scenarios

```typescript
// ✅ GOOD: Testing same component behavior across different props
describe.each([
  { variant: "primary", expectedClass: "btn-primary" },
  { variant: "secondary", expectedClass: "btn-secondary" },
])("AppButton with $variant variant", ({ variant, expectedClass }) => {
  it("should render with correct styling", () => {
    const wrapper = mount(AppButton, { props: { variant } });
    expect(wrapper.classes()).toContain(expectedClass);
  });
  
  it("should handle click events", () => {
    // Test click behavior for this variant
  });
});
```

##### Quality Benefits of Proper `.each` Usage

1. **Eliminates forEach Anti-Pattern**: No more manual loops within tests
2. **Improved Test Names**: Dynamic test descriptions show actual data
3. **Better Coverage Visibility**: Each data case appears as separate test
4. **Easier Debugging**: Failed tests show exact data that caused failure
5. **Enhanced Maintainability**: Adding new test cases is trivial

##### Key Decision Framework

**Ask yourself:**
- 🤔 **Are the execution steps identical?** → Use `.each`
- 🤔 **Do I have a `forEach` loop in my test?** → Convert to `.each`
- 🤔 **Is this testing different data inputs?** → Use `.each`
- 🤔 **Does each case need unique setup/assertions?** → Keep separate tests

**Remember**: **WET for complexity, DRY for execution patterns**

#### IMPORTANT: When asked to "update your learnings", it means update this CLAUDE.md file!

## File System Testing with memfs (CRITICAL - FOLLOW THIS APPROACH)

### Using memfs for File System Mocking
We use **memfs** to mock file system operations in tests. This approach provides:
- **In-memory file system** - Safe, fast, and isolated
- **No real file system interaction** - Tests are predictable and don't affect actual files
- **Realistic behavior** - memfs simulates real fs operations accurately

### Installation and Setup
```bash
pnpm install --save-dev memfs
```

Global setup in `test/setup.ts`:
```javascript
// Mock fs for server-side tests using memfs
vi.mock("fs", async () => {
  const memfs = await vi.importActual("memfs") as { fs: Record<string, unknown> };
  return {
    default: memfs.fs,
    ...memfs.fs,
  };
});

vi.mock("node:fs", async () => {
  const memfs = await vi.importActual("memfs") as { fs: Record<string, unknown> };
  return {
    default: memfs.fs,
    ...memfs.fs,
  };
});
```

### Test Pattern for File System Operations
```javascript
import { vol } from "memfs";

describe("Service Tests", () => {
  beforeEach(() => {
    vol.reset(); // Reset in-memory filesystem
  });

  afterEach(() => {
    vol.reset(); // Clean up after each test
  });

  it("should test file operations", async () => {
    // Setup: Create files in memory
    vol.fromJSON({
      "/path/to/file.json": JSON.stringify({ data: "test" }),
      "/path/to/directory": null, // Create directory
    });

    // Test your service
    const result = await yourService.loadData();
    
    // Verify results
    expect(result).toEqual({ data: "test" });
    
    // Verify file system state
    expect(vol.existsSync("/path/to/output.json")).toBe(true);
    const savedContent = vol.readFileSync("/path/to/output.json", "utf-8");
    expect(JSON.parse(savedContent)).toMatchObject({ expected: "data" });
  });
});
```

### Key Benefits of memfs Approach
1. **Isolation**: Each test runs with a clean file system
2. **Performance**: In-memory operations are fast
3. **Predictability**: No external file system dependencies
4. **Realistic**: Simulates real file system behavior including errors
5. **Coverage**: Enables testing of all file system code paths

## Testing Philosophy: Focus on Current Application State (CRITICAL)

### Test What Exists, Not What Should Exist
- **Write tests for the current implementation** - Don't test features that aren't implemented yet
- **Document current behavior** - Tests should reflect how the code actually works today
- **Expect current limitations** - If concurrency isn't implemented, tests should expect it to fail

### Example: Testing Concurrent Operations
```javascript
it("should fail concurrent write operations (not yet implemented)", async () => {
  // Setup concurrent operations
  const save1 = service.saveSettings({ theme: "light" });
  const save2 = service.saveSettings({ theme: "dark" });

  // Test current behavior - expect failures due to race conditions
  const results = await Promise.allSettled([save1, save2]);
  
  // Document current limitation
  const failedCount = results.filter(result => result.status === "rejected").length;
  expect(failedCount).toBeGreaterThan(0); // We expect failures
  
  // TODO: Implement proper concurrency handling
});
```

### Test Naming Convention
- Use descriptive names that reflect actual behavior
- Include "(not yet implemented)" for missing features
- Add TODO comments for future improvements

### Benefits of This Approach
1. **Accurate Documentation**: Tests serve as living documentation of current behavior
2. **Regression Detection**: Changes to current behavior will be caught
3. **Future Planning**: TODO comments and failing tests guide future development
4. **Realistic Expectations**: Stakeholders understand current limitations

#### IMPORTANT: When asked to "update your learnings", it means update this CLAUDE.md file!

## Development Standards (CRITICAL - FOLLOW THESE STANDARDS)

This project uses comprehensive RFC 2119-compliant development standards located in `docs/standards/`. These standards MUST be followed for all development work.

### 📋 Standards Reference
- **CSS/Styling Standards** (`docs/standards/css-styling.md`): MUST use vanilla-extract as primary CSS system
- **TypeScript Standards** (`docs/standards/typescript.md`): MUST maintain zero `any` tolerance and strict type safety
- **Testing Standards** (`docs/standards/testing.md`): MUST follow minimal mocking philosophy and integration testing
- **Component Standards** (`docs/standards/components.md`): MUST use Vue 3 Composition API with proper TypeScript integration
- **API/Server Standards** (`docs/standards/api-server.md`): MUST follow Nitro patterns with comprehensive error handling
- **Documentation Standards** (`docs/standards/documentation.md`): MUST maintain comprehensive documentation
- **Code Quality Standards** (`docs/standards/code-quality.md`): MUST pass all quality gates before commit

### 🔧 Key Standards Summary
- **MUST use vanilla-extract** for all CSS (no scoped styles except during migration)
- **MUST eliminate all `any` types** - use proper TypeScript interfaces
- **MUST achieve 80% test coverage** with integration-focused testing
- **MUST mock only external dependencies** (node-pty, @xterm/*, WebSocket, browser APIs)
- **MUST follow Vue 3 Composition API** patterns with proper lifecycle management
- **MUST use comprehensive error handling** with structured logging
- **MUST pass quality gates**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

### 📖 Standards Compliance
Before any commit, verify compliance with: `docs/standards/README.md#standards-compliance-checklist`

#### IMPORTANT: Standards Integration
- **When writing code**: Reference appropriate standards document first
- **When reviewing code**: Use standards as checklist for approval
- **When updating standards**: Update this CLAUDE.md file with key changes
- **When asked to "update your learnings"**: Update both this file and relevant standards

## Code Review & Quality Control Learnings

### Terminal Development & Scrolling Fix Learnings (CRITICAL - FOLLOW THESE PATTERNS)

#### Terminal Implementation Best Practices
1. **xterm.js CSS Import is Essential**: Always import `@xterm/xterm/css/xterm.css` for proper terminal rendering
2. **Container Sizing**: Terminal containers must have `width: 100%` and `height: 100%` to fill parent properly
3. **Natural Scrolling**: Remove CSS constraints on xterm scroll areas - let xterm.js handle scrolling naturally
4. **Single Container Design**: Avoid double-container styling (terminal-section + terminal-container) - causes visual gaps
5. **Preserve Visual Design**: When simplifying code, only change implementation, never change visual appearance

#### Key Terminal Scrolling Issues & Solutions
- **Problem**: Terminal content doesn't scroll when exceeding container height
- **Root Cause**: CSS constraints on `.xterm-scroll-area` and `.xterm-viewport` preventing natural scrolling
- **Solution**: Remove height constraints and overflow:hidden from xterm deep selectors
- **Test Method**: Use actual terminal commands to generate content exceeding container height

#### Terminal CSS Simplification Guidelines
- **DO**: Remove complex xterm scroll area constraints that cause scrolling issues
- **DON'T**: Change visual styling (gradients, colors, spacing) when simplifying
- **DO**: Keep all CSS classes that are actually used in the template
- **DON'T**: Remove CSS classes without checking template usage first
- **DO**: Use playwright browser testing to verify changes work visually

#### Container Layout Patterns
- **Terminal-section styling**: Should only provide basic layout (flex, height) - no background, padding, borders
- **Terminal-container styling**: Should handle all visual styling (background, borders, header styling)
- **Gap Prevention**: Single container approach prevents visual gaps between styled containers

#### KISS Principle Applied Correctly
- **Right Way**: Simplify implementation complexity while preserving exact visual appearance
- **Wrong Way**: Changing visual design when asked to simplify code complexity
- **Implementation vs. Design**: Never conflate code simplification with design changes
- **User Expectations**: "Simplify" means easier to maintain code, not different visual appearance

### Senior Developer Code Review Process (CRITICAL - FOLLOW THIS EXACT WORKFLOW)

When conducting code reviews or implementing quality improvements, follow this comprehensive workflow:

#### 1. Initial Assessment & Planning
- **Create comprehensive TODO list** using TodoWrite tool to track all improvements
- **Run parallel quality checks** immediately:
  - `pnpm lint` - Check ESLint issues
  - `pnpm typecheck` - Check TypeScript errors  
  - `pnpm test` - Check test status
- **Analyze results systematically** - categorize issues by severity and type
- **Set quality targets**: 0 lint warnings, 0 TypeScript errors, 100% test success, 80%+ coverage

#### 2. Type Safety & Code Quality (HIGH PRIORITY)
- **Eliminate ALL `any` types** - Replace with proper TypeScript interfaces
- **Create explicit interfaces** for external libraries (e.g., xterm.js interfaces)
- **Use proper type casting** with `as unknown as Type` pattern when necessary
- **Fix browser compatibility** issues (e.g., `process.cwd()` availability checks)
- **Add missing imports** and resolve auto-import issues

#### 3. Testing Strategy & Implementation
- **Global Mock Setup**: Use `test/setup.ts` for consistent mocking across all tests
- **Mock Hierarchy**:
  - ✅ **DO MOCK**: External APIs (`node-pty`, `@xterm/*`, `WebSocket`, browser APIs)
  - ❌ **DON'T MOCK**: Internal services, logger, Vue components, business logic
- **Test Patterns**:
  - **Integration tests** over unit tests
  - **User journey testing** (create → use → cleanup)
  - **Error scenario testing** with real error handling
  - **Component testing** with minimal stubs

#### 4. Nuxt3 Best Practices
- **File Organization**: 
  - `components/` - Reusable Vue components
  - `server/api/` - API endpoints with proper imports
  - `server/services/` - Business logic services
  - `types/` - Type definitions and interfaces
  - `utils/` - Utility functions
- **Auto-imports**: Use explicit imports for server APIs if auto-import fails
- **Type Definitions**: Create global type files (e.g., `types/nitro.d.ts`)

#### 5. Code Review Quality Gates
**BEFORE COMMITTING - ALL MUST PASS (see docs/standards/code-quality.md):**
- ✅ `pnpm lint` - 0 errors, 0 warnings
- ✅ `pnpm typecheck` - 0 TypeScript errors
- ✅ `pnpm test` - 100% test success rate
- ✅ Coverage > 80% (aim for 90%+)
- ✅ **Standards compliance**: Follow `docs/standards/README.md` checklist

#### 6. KISS & DRY Implementation
- **KISS (Keep It Simple, Stupid)**:
  - Simple, clear interfaces over complex abstractions
  - Explicit types over `any` types
  - Direct imports over complex auto-import chains
- **DRY (Don't Repeat Yourself)**:
  - Global test mocks in `test/setup.ts`
  - Shared type interfaces in `types/`
  - Reusable utility functions
- **WET Tests (Write Everything Twice)**:
  - Comprehensive test scenarios
  - Multiple test cases per function
  - Clear, descriptive test names

#### 7. Error Handling & Logging
- **Real Logger Integration**: Don't mock logger in tests - let it log for debugging
- **Proper Error Handling**: Try-catch with detailed error context
- **Browser Compatibility**: Check for API availability before using
- **Graceful Degradation**: Fallback values for missing APIs

#### 8. Test Debugging & Fixes
- **Common Test Issues**:
  - Mock timing problems → Add `await nextTick()` and timeouts
  - Component lifecycle issues → Wait for initialization
  - External library mocks → Use global setup vs individual mocks
- **Component Test Patterns**:
  - Mock external libraries in global setup
  - Test user interactions, not implementation details
  - Verify real component behavior and events

#### 9. Final Quality Verification
**The "Golden Standard" Checklist:**
```bash
# All must pass with perfect scores
pnpm lint        # → 0 errors, 0 warnings
pnpm typecheck   # → 0 TypeScript errors  
pnpm test        # → 100% test success rate
pnpm build       # → Successful production build
```

#### 10. Documentation & Knowledge Transfer
- **Update CLAUDE.md** with all learnings and process improvements
- **Document complex patterns** and architectural decisions
- **Create comprehensive README** sections for setup and troubleshooting
- **Add inline comments** for complex type casting or workarounds

### Key Quality Insights Learned

1. **Test Setup is Critical**: Global mocks prevent test inconsistencies and flaky failures
2. **TypeScript Strictness Pays Off**: Proper interfaces catch bugs early and improve maintainability  
3. **Integration Testing > Unit Testing**: Test user journeys and real component interactions
4. **Minimal Mocking Philosophy**: Only mock what you absolutely cannot control
5. **Lint-Driven Development**: Fix lint issues immediately - they indicate deeper problems
6. **Coverage is a Guide**: Aim for high coverage but focus on meaningful test scenarios
7. **Browser Compatibility**: Always check API availability in universal/browser code
8. **Component Testing**: Test behavior and user interactions, not internal implementation

### Console Logging & Logger Testing Best Practices (CRITICAL - FOLLOW THESE PATTERNS)

#### Never Use Console Directly in Code
- **ALWAYS** use the logger utility (`~/utils/logger`) instead of direct console calls
- **Replace** all `console.log`, `console.error`, `console.warn`, `console.info` with appropriate logger methods
- **Reason**: Logger provides structured logging, proper error handling, and can be mocked for testing

#### Logger Mocking in Tests (MANDATORY PATTERN)
```javascript
// In test files - ALWAYS mock the logger to prevent output pollution
vi.mock("~/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));
```

#### Logger Test Verification Patterns
```javascript
// Test that logger methods are called correctly
expect(logger.error).toHaveBeenCalledWith("Error message", { error: errorObject });
expect(logger.warn).toHaveBeenCalledWith("Warning message");
expect(logger.info).toHaveBeenCalledWith("Info message");

// For error logging - wrap error objects in context
logger.error("Failed to initialize", { error }); // ✅ Correct
logger.error("Failed to initialize", error);     // ❌ Incorrect
```

#### Test Output Cleanliness
- **Mock ALL logging** to prevent test output pollution
- **Tests should run silently** - no console output except test results
- **Verify log messages** rather than allowing them to pollute test output
- **Use structured logging** with context objects for better debugging

#### Logger Implementation Guidelines
- **Error Context**: Always wrap error objects in context: `{ error }`
- **Structured Data**: Use objects for complex data: `{ userId, action, timestamp }`
- **Consistent Messaging**: Use clear, descriptive messages
- **Appropriate Levels**: 
  - `error` for failures that need attention
  - `warn` for concerning but non-critical issues
  - `info` for important operational events
  - `debug` for development troubleshooting

#### Testing Logger Behavior
```javascript
// Test that errors are logged properly
it("should log initialization failures", async () => {
  mockService.init.mockRejectedValue(new Error("Init failed"));
  
  await service.initialize();
  
  expect(logger.error).toHaveBeenCalledWith(
    "Failed to initialize settings", 
    { error: new Error("Init failed") }
  );
});
```

#### Key Benefits of Logger Testing Pattern
1. **Silent Tests**: No output pollution during test runs
2. **Behavior Verification**: Confirm correct logging behavior  
3. **Structured Debugging**: Better error context and troubleshooting
4. **Production Ready**: Consistent logging patterns across codebase
5. **Maintainable**: Centralized logging logic that can be enhanced

### Test Organization Standards (CRITICAL - FOLLOW THESE PATTERNS)

#### Test Co-location (MANDATORY)
- **ALWAYS** place test files next to the source files they test
- **NEVER** use separate test directories (avoid `test/` folder pattern)
- **Naming Convention**: `{filename}.test.ts` or `{filename}.spec.ts`

#### Correct Test Structure
```
components/
├── Terminal.vue
├── Terminal.test.ts                    # ✅ Co-located with source
├── terminal/
│   ├── TerminalContent.vue
│   ├── TerminalContent.test.ts         # ✅ Co-located with source
│   ├── TerminalHeader.vue
│   └── TerminalHeader.test.ts          # ✅ Co-located with source
composables/
├── useSettings.ts
├── useSettings.test.ts                 # ✅ Co-located with source
├── useTerminalState.ts
└── useTerminalState.test.ts            # ✅ Co-located with source
```

#### Incorrect Test Structure (AVOID)
```
components/
├── Terminal.vue
└── terminal/
    ├── TerminalContent.vue
    └── TerminalHeader.vue
test/                                   # ❌ Separate test folder
├── components/
│   ├── Terminal.test.ts               # ❌ Separated from source
│   └── terminal/
│       ├── TerminalContent.test.ts    # ❌ Separated from source
│       └── TerminalHeader.test.ts     # ❌ Separated from source
└── composables/
    └── useSettings.test.ts            # ❌ Separated from source
```

#### Benefits of Test Co-location
1. **Easier Navigation**: Tests are immediately adjacent to the code they test
2. **Better Maintainability**: When updating code, tests are right there
3. **Clearer Structure**: No need to replicate directory structure in test folders
4. **Faster Development**: Shorter file paths and less context switching
5. **Refactoring Safety**: Moving files automatically moves their tests

#### Global Test Setup
- **Global setup files** can remain in `test/` directory (e.g., `test/setup.ts`)
- **Test utilities** can remain in `test/utils/` directory
- **Test configuration** stays in project root (e.g., `vitest.config.ts`)

#### Test Discovery
- Vitest automatically discovers tests with pattern: `**/*.{test,spec}.{js,ts,jsx,tsx}`
- No configuration changes needed when moving from separate folders to co-location
- All tests will be found regardless of location in the project

### UI/UX Development & Theming Best Practices

#### CSS Architecture & Design System Implementation
9. **Plan CSS Architecture First**: Design the theme system hierarchy upfront before implementation
   - Base theme → System preference → Manual override
   - Consider CSS specificity conflicts early
   - Map out how different theme sources interact

10. **Never Use `!important` for Theming**: Proper CSS specificity is always the correct solution
    - Use `:not()` selectors to prevent conflicts: `@media (prefers-color-scheme: dark) { :root:not(.light-theme) { ... } }`
    - Manual theme classes should have higher specificity than media queries
    - Structure CSS to naturally cascade without forcing

11. **Test Functionality Immediately**: Don't assume template logic equals working features
    - Test theme toggles actually change visual appearance, not just text
    - Verify CSS variables are properly overridden
    - Check both light and dark modes in different system preference scenarios

12. **CSS Variables Best Practices**:
    - Create comprehensive variable systems for typography, spacing, colors, transitions
    - Convert ALL hardcoded values to variables for consistency
    - Organize variables logically: base palette → semantic colors → component-specific

13. **Design System Organization**:
    - Create showcase pages (/design-system) to demonstrate all variables and components
    - Build theme testing pages (/theme-test) with manual toggles for QA
    - Move test content from HTML files to proper Vue components in pages directory

#### Terminal UI Specific Learnings
14. **xterm.js Integration**: Hide helper elements visually while preserving functionality
    - Use `opacity: 0` and `position: absolute` with negative positioning instead of `display: none`
    - Preserve keyboard input functionality by keeping elements in DOM
    - Terminal should maintain dark theme for optimal readability regardless of site theme

15. **Component Color Theory**: Apply semantic color meanings consistently
    - Disconnect buttons should not be red (not an error) - use theme colors instead
    - Use appropriate icons (X mark for disconnect, not stop circle)
    - Maintain visual hierarchy through color contrast

#### Git & Branch Management for UI Work
16. **Branch Hygiene & Large File Prevention**: Prevent large files from entering git history
    - **Use .gitignore proactively** for all binaries, installers, and large files (*.deb, *.dmg, *.exe, etc.)
    - Add patterns like `*.deb`, `google-chrome-stable*`, browser installers to .gitignore immediately
    - Much easier to prevent than to clean up git history after large files are committed
    - Remove large files (like browser installers) before they get committed if .gitignore missed them
    - Use git cherry-pick carefully to avoid bringing unwanted history
    - Create clean branches from main when git history gets polluted

17. **Quality Gates for UI Work**: All must pass before PR creation
    - ✅ ESLint: 0 errors, 0 warnings (auto-fix attribute ordering)
    - ✅ TypeScript: 0 compilation errors
    - ✅ Tests: 100% success rate with meaningful coverage
    - ✅ Visual verification: Actually test UI changes work as intended

#### Progressive Enhancement & Accessibility
18. **System Integration**: Respect user preferences while allowing manual control
    - Use `prefers-color-scheme` for automatic theme detection
    - Provide manual override capabilities
    - Show current system preference in UI for transparency

19. **Best Practices Mindset**: Always think "would this pass a senior developer's code review?"
    - Plan architecture before implementation
    - Avoid quick fixes that create technical debt
    - Test functionality immediately, don't assume logic equals working features
    - Use proper CSS patterns instead of forcing with anti-patterns

### Code Review Success Metrics (MANDATORY - ALL MUST PASS)
**🚨 CRITICAL: ALL quality gates MUST pass 100% before any work is considered complete:**

```bash
# These commands MUST ALL return success (exit code 0):
pnpm test        # ✅ 100% test success rate - ZERO failures allowed
pnpm lint        # ✅ 0 linting errors, 0 warnings
pnpm typecheck   # ✅ 0 TypeScript errors
pnpm build       # ✅ Successful production build
```

**Additional Success Metrics:**
- **Perfect Quality Score**: 0 lint warnings + 0 TypeScript errors + 100% test success
- **High Coverage**: >90% code coverage with meaningful tests
- **Clean Architecture**: KISS/DRY principles followed consistently
- **Production Ready**: Successful build with no blockers
- **UI/UX Verification**: Manual testing confirms visual changes work as designed
- **No CSS Anti-patterns**: No `!important`, proper specificity, semantic color usage

**ABSOLUTELY CRITICAL:** If ANY quality gate fails, the work is NOT complete. Fix ALL failures immediately.