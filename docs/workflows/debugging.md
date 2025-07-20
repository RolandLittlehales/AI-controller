# Debugging Workflow

**Reference guide for systematic debugging and problem resolution**

## Quick Debugging Checklist

- [ ] Quality gates status checked (test/lint/typecheck/build)
- [ ] Error messages and stack traces collected
- [ ] Browser developer tools consulted
- [ ] Recent changes reviewed
- [ ] Similar patterns in codebase examined

## Debugging by Problem Type

### Test Failures
→ **See detailed guide:** `docs/troubleshooting/test-issues.md`

**Quick diagnosis:**
- **All tests failing** → Global setup issue in `test/setup.ts`
- **Specific component tests** → Mock configuration problems
- **Flaky tests** → Timing/lifecycle issues
- **Coverage failures** → Missing test coverage or exemptions

### Build/Compilation Errors
→ **See detailed guide:** `docs/troubleshooting/build-issues.md`

**Quick diagnosis:**
- **TypeScript errors** → Look for `any` types, missing interfaces
- **Import errors** → Check file paths and export statements
- **Dependency issues** → Verify package.json and lockfile
- **Build process failures** → Check build configuration

### Runtime Errors

#### Frontend/Component Issues
**Browser console investigation:**
```javascript
// Check component mounting
console.log('Component mounted:', this.$el);

// Check reactive data
console.log('Reactive state:', toRaw(state));

// Check props and events
console.log('Props received:', props);
```

**Common Vue 3 issues:**
- **Composition API setup** → Check `setup()` return values
- **Reactivity issues** → Verify `ref()` vs `reactive()` usage
- **Component lifecycle** → Check mounting/unmounting order
- **Template references** → Verify template ref bindings

#### Backend/API Issues
**Server-side investigation:**
```bash
# Check server logs
pnpm dev  # Watch console output

# Check WebSocket connections
# Browser DevTools → Network → WS tab

# Check API responses
# Browser DevTools → Network → Fetch/XHR tab
```

**Common server issues:**
- **WebSocket connection failures** → Check server startup and ports
- **API endpoint errors** → Verify route definitions and handlers
- **Database/storage issues** → Check file system permissions
- **Service initialization** → Check dependency injection order

### Styling/CSS Issues

#### Vanilla Extract Debugging
**Check CSS generation:**
```bash
# Inspect generated CSS classes
pnpm dev  # Check browser DevTools → Elements → Computed styles

# Check CSS custom properties
# Browser DevTools → Elements → Computed → filter by "--"
```

**Common styling issues:**
- **CSS not applying** → Check class name generation
- **Theme not working** → Verify CSS custom property values
- **Layout problems** → Check flex/grid container properties
- **Responsive issues** → Test different viewport sizes

#### Design System Debugging
**Component hierarchy check:**
- **External components used** → Replace with `App*` components
- **Missing design system components** → Create or request creation
- **Styling conflicts** → Check CSS specificity and cascade

## Systematic Debugging Process

### 1. Problem Identification
- **Reproduce the issue** → Create minimal reproduction case
- **Document symptoms** → What exactly is happening vs expected
- **Check error messages** → Full stack traces and error details
- **Review recent changes** → Git history and diff analysis

### 2. Information Gathering
- **Browser DevTools** → Console, Network, Elements, Sources tabs
- **Server logs** → Backend console output and error logs
- **Quality gates** → Which gates are failing and why
- **Environment** → Development vs production differences

### 3. Hypothesis Formation
- **Recent changes impact** → What changed that could cause this?
- **Similar patterns** → Have we seen this before in the codebase?
- **External dependencies** → Could third-party libraries be involved?
- **Configuration issues** → Environment or build configuration problems?

### 4. Systematic Testing
- **Isolate the problem** → Remove complexity until issue disappears
- **Test hypotheses** → One change at a time
- **Use debugging tools** → Breakpoints, console logs, Vue DevTools
- **Check similar code** → How do working examples differ?

### 5. Solution Implementation
- **Minimal fix first** → Smallest change that resolves the issue
- **Test the fix** → Verify problem is actually resolved
- **Check for regressions** → Ensure fix doesn't break other functionality
- **Add preventive measures** → Tests or safeguards to prevent recurrence

## Debugging Tools & Techniques

### Browser DevTools
- **Console** → Error messages, custom logging, REPL
- **Sources** → Breakpoints, step debugging, variable inspection
- **Network** → API calls, WebSocket messages, resource loading
- **Elements** → DOM inspection, CSS debugging, computed styles
- **Vue DevTools** → Component tree, reactive data, events

### Terminal/Command Line
```bash
# Run specific test file
pnpm test components/Terminal.test.ts

# Run tests with debugging output
pnpm test --reporter=verbose

# Check TypeScript compilation only
pnpm typecheck

# Lint specific files
pnpm lint components/Terminal.vue
```

### Code-Based Debugging
```typescript
// Temporary debugging in components
console.log('Debug point reached', { data: someData });
debugger; // Breakpoint for DevTools

// Logger-based debugging (preferred)
import { logger } from '~/utils/logger';
logger.debug('Component state', { state: toRaw(state) });
```

### Vue 3 Specific Debugging
```typescript
// Check reactive references
import { toRaw } from 'vue';
console.log('Raw data:', toRaw(reactiveData));

// Check component lifecycle
onMounted(() => console.log('Component mounted'));
onUnmounted(() => console.log('Component unmounted'));

// Check watchers
watch(someRef, (newVal, oldVal) => {
  console.log('Value changed:', { from: oldVal, to: newVal });
});
```

## Prevention Strategies

### Code Quality
- **Run quality gates continuously** → Catch issues early
- **Use TypeScript strictly** → Prevent runtime type errors
- **Write integration tests** → Catch interaction problems
- **Follow standards** → Consistent patterns reduce bugs

### Development Practices
- **Small, focused commits** → Easier to isolate problem changes
- **Feature flags** → Safely deploy incomplete features
- **Error boundaries** → Graceful degradation of component failures
- **Logging strategy** → Structured logging for production debugging

### Architecture Patterns
- **Error handling** → Consistent try-catch with logger integration
- **Input validation** → Validate data at boundaries
- **Defensive programming** → Handle edge cases and invalid states
- **Separation of concerns** → Easier to isolate problems

## Common Bug Patterns

### TypeScript Issues
- **Runtime type mismatches** → Add proper type guards
- **`any` type usage** → Replace with explicit interfaces
- **Missing null checks** → Add optional chaining and null checks

### Vue Component Issues
- **Lifecycle timing** → Use appropriate lifecycle hooks
- **Prop mutations** → Use events instead of direct prop changes
- **Memory leaks** → Clean up watchers and event listeners

### Testing Issues
- **Flaky tests** → Add proper async handling and timeouts
- **Over-mocking** → Mock only external dependencies
- **Missing edge cases** → Test error conditions and boundary values

---

**🔗 Related Documentation:**
- **Test Issues** → `docs/troubleshooting/test-issues.md`
- **Build Issues** → `docs/troubleshooting/build-issues.md`
- **Standards Reference** → `docs/standards/README.md`