# Feature Development Workflow

**Reference guide for implementing new features from start to finish**

## Quick Checklist

- [ ] Branch created from `main` with descriptive name
- [ ] Requirements analyzed and clarified
- [ ] Standards referenced (`docs/standards/`)
- [ ] Design system components checked first
- [ ] Tests planned (integration-focused)
- [ ] Quality gates configured to run continuously

## Phase 1: Planning & Preparation

### Requirements Analysis
- **Think ultra deeply** about the requirements before proceeding
- **Ask for clarification** if anything seems missing or unclear
- Consider the current state of the codebase and context
- Understand the impact of proposed changes

### Solution Design
- **Reference development standards** → Check `docs/standards/` for applicable patterns
- Brainstorm multiple solutions that best fit requirements
- Keep solutions **KISS** (Keep It Simple, Stupid) and maintainable
- Ensure **design system compliance** → Check `components/ui/` first

### Technical Planning
- **Always include tests** - use Vitest testing framework
- Prefer **integration tests** over unit tests
- Plan to mock only external dependencies (minimal mocking philosophy)
- Identify which standards documents apply to your work

## Phase 2: Implementation

### Before You Code
- **Standards Check** → Review relevant `docs/standards/` documents:
  - Vue components → `docs/standards/components.md`
  - TypeScript → `docs/standards/typescript.md`
  - CSS/styling → `docs/standards/css-styling.md`
  - API/server → `docs/standards/api-server.md`

### Implementation Guidelines
- **Design System First** → Use internal `App*` components before external libraries
- **Type Safety** → Zero `any` tolerance, explicit interfaces everywhere
- **Error Handling** → Proper try-catch with logger integration
- **File Organization** → Co-locate tests next to source files

### Continuous Quality Assurance
Run quality gates continuously during development:
```bash
pnpm test        # 100% test success
pnpm lint        # 0 errors, 0 warnings
pnpm typecheck   # 0 TypeScript errors
pnpm build       # Successful production build
```

## Phase 3: Testing Strategy

### Test Planning
- **Focus on integration** → Test user journeys, not isolated methods
- **Minimal mocking** → Only mock external dependencies we don't control
- **Co-location** → Place tests next to source files: `component.vue` + `component.test.ts`
- **Coverage target** → 80% minimum per file

### Test Implementation
- **Mock external systems only**:
  - ✅ `@xterm/xterm`, `node-pty`, `WebSocket`, browser APIs
  - ❌ Internal services, logger, Vue components, business logic
- **Use real dependencies** where possible
- **Test error scenarios** with realistic error conditions

## Phase 4: Quality Gates (MANDATORY)

### Self Code Review
Perform thorough self-review focusing on:
- **Correctness** → Does it work as intended?
- **KISS compliance** → Is it as simple as possible?
- **Standards adherence** → Check against `docs/standards/README.md`
- **Type safety** → No `any` types, proper interfaces
- **Test coverage** → 80%+ with meaningful tests

### Final Quality Verification
**🚨 CRITICAL: ALL must return exit code 0 before commit:**
```bash
pnpm test        # 100% test success rate - NO failures allowed
pnpm lint        # 0 linting errors, 0 warnings
pnpm typecheck   # 0 TypeScript errors
pnpm build       # Successful production build
```

## Phase 5: Documentation & Cleanup

### Update Documentation
- **Update learnings** → Add insights to CLAUDE.md or relevant docs
- **Document new patterns** → Add to appropriate `docs/` modules
- **Update architecture docs** → If significant changes made

### Final Verification
- **Manual testing** → Verify feature works in browser
- **Integration testing** → Ensure no regressions in related features
- **Standards compliance** → Final check against standards checklist

## Common Feature Types & Standards

### Vue Component Features
- **Standards reference** → `docs/standards/components.md`
- **Design system** → `docs/standards/design-system.md`
- **CSS styling** → `docs/standards/css-styling.md`

### API/Server Features
- **Standards reference** → `docs/standards/api-server.md`
- **Error handling patterns** → Structured logging with context
- **WebSocket integration** → Follow established patterns

### Terminal Features
- **Terminal patterns** → Check existing terminal components
- **xterm.js integration** → Reference current implementations
- **Performance considerations** → Avoid memory leaks, proper cleanup

## Troubleshooting During Development

### Common Issues
- **Tests failing** → Check `docs/troubleshooting/test-issues.md`
- **TypeScript errors** → Look for `any` types, add proper interfaces
- **Build issues** → Verify imports and file paths
- **Design system conflicts** → Ensure `App*` components used correctly

### Getting Help
- **Standards questions** → `docs/standards/README.md`
- **Implementation patterns** → `docs/implementation/` guides
- **Architecture decisions** → `docs/reference/architecture.md`

---

**🔗 Related Documentation:**
- **Code Review Process** → `docs/workflows/code-review.md`
- **Implementation Guides** → `docs/implementation/`
- **Standards Reference** → `docs/standards/README.md`