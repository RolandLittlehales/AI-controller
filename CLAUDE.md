# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-controller is a web application designed to manage multiple terminal-based AI instances. The project is currently in its initial stages with no implementation yet.

## Current State

As of current development, the project has significant implementation progress:

### ✅ Completed (Phase 1.1 - Project Setup)
- **Full Nuxt 3 project** with TypeScript configuration
- **Technology stack** implemented:
  - Nuxt 3.17.7 with Vue 3.5.17
  - TypeScript with strict mode
  - Nuxt UI 3.2.0 for components
  - Pinia for state management
  - Vanilla Extract for styling
  - ESLint + Prettier for code quality
  - xterm.js with addons for terminal functionality
  - node-pty for terminal backend
  - Socket.IO for WebSocket communication
  - Winston for logging
  - simple-git for Git operations

### ✅ Completed (Phase 1.2 - Basic Terminal Integration)
- **Terminal.vue component** with xterm.js integration
- **Terminal service** with node-pty backend
- **WebSocket communication** via Socket.IO for terminal I/O
- **Terminal lifecycle management** (spawn, destroy) implemented
- **Real-time terminal** input/output working
- **Basic terminal styling** with Nuxt UI components

### ✅ Build & Development Environment
- **Package scripts**: dev, build, lint, typecheck, preview
- **ESLint configuration** with Vue and TypeScript support
- **Project structure** with proper folder organization
- **Nitro API** with WebSocket support enabled
- **Type definitions** and interfaces defined

### ✅ Completed (Phase 1.2 - Basic Terminal Integration)
- **Fixed type errors** in Terminal.vue component
- **Added readonly utility** import from Vue
- **Aligned WebSocket message types** between frontend and backend
- **Added comprehensive tests** for terminal functionality
- **Fixed node-pty native bindings** issue

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

### 🚀 Ready for Phase 1.3
The project is ready to move to Phase 1.3 (Core API Development) with:
- Terminal WebSocket communication working
- Basic terminal functionality implemented
- Solid foundation for API expansion

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
- Build, test, and check types continuously as you implement
- Run tests and builds at every **main milestone** of the work
- Perform **sanity checks every 30 minutes**: test, types, verify you're on the correct path
- Ensure adherence to KISS, DRY/WET principles throughout

### 6. Final Review
- Once implementation is complete and confirmed working, perform a **self code review**
- Focus on:
  - **Correctness**: Does it work as intended?
  - **KISS**: Is it as simple as possible?
  - **YAGNI**: You Aren't Gonna Need It - no over-engineering
  - **DRY/WET**: Proper balance between DRY code and WET tests
  - **Nuance**: Are there subtle considerations addressed?
  - **General best practices**: Any other relevant quality factors

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

#### IMPORTANT: When asked to "update your learnings", it means update this CLAUDE.md file!

## Code Review & Quality Control Learnings

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
**BEFORE COMMITTING - ALL MUST PASS:**
- ✅ `pnpm lint` - 0 errors, 0 warnings
- ✅ `pnpm typecheck` - 0 TypeScript errors
- ✅ `pnpm test` - 100% test success rate
- ✅ Coverage > 80% (aim for 90%+)

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

### Code Review Success Metrics
- **Perfect Quality Score**: 0 lint warnings + 0 TypeScript errors + 100% test success
- **High Coverage**: >90% code coverage with meaningful tests
- **Clean Architecture**: KISS/DRY principles followed consistently
- **Production Ready**: Successful build with no blockers
- **UI/UX Verification**: Manual testing confirms visual changes work as designed
- **No CSS Anti-patterns**: No `!important`, proper specificity, semantic color usage