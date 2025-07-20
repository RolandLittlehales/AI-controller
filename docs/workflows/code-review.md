# Code Review Workflow

**Reference guide for conducting and receiving effective code reviews**

## Reviewer Quick Checklist

- [ ] Quality gates passed (test/lint/typecheck/build)
- [ ] Standards compliance verified
- [ ] Architecture consistency checked
- [ ] Security considerations reviewed
- [ ] Performance implications assessed

## Pre-Review: Quality Gates Verification

### Mandatory Quality Checks
**Before reviewing any code, verify ALL quality gates pass:**
```bash
pnpm test        # → 100% test success rate
pnpm lint        # → 0 errors, 0 warnings
pnpm typecheck   # → 0 TypeScript errors
pnpm build       # → Successful production build
```

**If quality gates fail:**
- ❌ **STOP** → Do not proceed with review
- 🔄 **Request fixes** → All quality gates must pass first
- 📋 **Document issues** → Help author understand what needs fixing

## Review Areas by File Type

### Vue Component Files (`.vue`)
- **Design system usage** → Check `App*` components used before external libraries
- **Component patterns** → Verify Composition API with TypeScript integration
- **Template structure** → Ensure semantic HTML and accessibility
- **Style compliance** → Vanilla Extract usage, no scoped styles
- **Props/events** → Proper TypeScript interfaces and validation

### TypeScript Files (`.ts`)
- **Type safety** → Zero `any` tolerance, explicit interfaces everywhere
- **Error handling** → Proper try-catch with logger integration
- **Import patterns** → Clean, organized imports with proper paths
- **Code organization** → KISS principle, maintainable structure
- **Business logic** → Clear, testable functions

### Test Files (`.test.ts`)
- **Testing approach** → Integration-focused over unit testing
- **Mocking strategy** → Only external dependencies mocked
- **Coverage quality** → Meaningful tests, not just coverage numbers
- **Test organization** → Clear describe blocks and test names
- **Error scenarios** → Edge cases and error conditions tested

### CSS/Style Files
- **Vanilla Extract usage** → Primary CSS system compliance
- **Design system integration** → CSS custom properties used correctly
- **Performance** → Efficient selectors, no redundant styles
- **Responsive design** → Proper breakpoint usage
- **Theming support** → Dark/light mode compatibility

## Senior Developer Review Process

### Code Quality Assessment
- **Correctness** → Does the code work as intended?
- **KISS compliance** → Is it as simple as possible?
- **YAGNI principle** → You Aren't Gonna Need It - no over-engineering
- **Standards adherence** → Check against `docs/standards/README.md`
- **Maintainability** → Will this be easy to change in the future?

### Architecture Review
- **Pattern consistency** → Follows established project patterns
- **Dependency management** → Appropriate use of external libraries
- **Performance implications** → No obvious performance regressions
- **Security considerations** → No exposed secrets or vulnerabilities
- **Integration impact** → How does this affect other parts of the system?

### Testing Review
- **Test strategy** → Integration tests covering user journeys
- **Mock appropriateness** → Only external dependencies mocked
- **Coverage quality** → Tests cover meaningful scenarios
- **Error handling** → Edge cases and error conditions tested
- **Test maintainability** → Tests will be easy to update

## Common Review Patterns

### Approval Criteria
- ✅ **Quality gates pass** → All automated checks successful
- ✅ **Standards compliance** → Follows project standards
- ✅ **Architecture consistency** → Fits with existing patterns
- ✅ **Test quality** → Appropriate test coverage and strategy
- ✅ **Code quality** → KISS, maintainable, well-structured

### Request Changes Criteria
- ❌ **Quality gates fail** → Must be fixed before approval
- ❌ **Standards violations** → TypeScript `any` usage, wrong patterns
- ❌ **Architecture inconsistency** → Doesn't fit established patterns
- ❌ **Poor test strategy** → Missing tests or inappropriate mocking
- ❌ **Security issues** → Exposed secrets, vulnerabilities

### Common Feedback Areas

#### TypeScript Issues
- **`any` type usage** → Request proper interfaces
- **Missing type definitions** → Add explicit types for clarity
- **Inconsistent patterns** → Follow established TypeScript conventions

#### Testing Issues
- **Over-mocking** → Only mock external dependencies
- **Missing integration tests** → Add user journey tests
- **Poor test names** → Use descriptive test descriptions

#### Component Issues
- **External component usage** → Use `App*` components instead
- **Missing TypeScript integration** → Add proper prop types
- **CSS inconsistencies** → Follow Vanilla Extract patterns

## Review Communication

### Constructive Feedback Patterns
- **Be specific** → Reference exact lines and suggest alternatives
- **Explain rationale** → Include why change is needed
- **Reference standards** → Link to relevant documentation
- **Offer solutions** → Don't just identify problems

### Example Feedback Templates
```
// TypeScript Issue
"Line 42: Avoid `any` type. Consider creating an interface for this object:
interface UserData { id: string; name: string; }
See: docs/standards/typescript.md#zero-any-tolerance"

// Testing Issue  
"Lines 15-20: Consider mocking only the external API here rather than the entire service.
See: docs/standards/testing.md#minimal-mocking-approach"

// Design System Issue
"Line 8: Use AppButton instead of UButton for consistency.
See: docs/standards/design-system.md#component-hierarchy"
```

## Post-Review Actions

### For Authors
- **Address all feedback** → Fix requested changes promptly
- **Ask for clarification** → If feedback is unclear
- **Re-run quality gates** → Ensure all checks still pass
- **Update documentation** → If new patterns established

### For Reviewers
- **Re-review promptly** → Don't block progress unnecessarily
- **Verify fixes** → Ensure requested changes implemented correctly
- **Approve when ready** → Clear approval when all criteria met

## Phase-Specific Review Considerations

### Phase 2A Context
- **Client-side focus** → Server-side operations may be placeholders
- **localStorage usage** → Acceptable as temporary solution
- **Test skipping** → Acceptable with proper documentation and TODO

### Future Phase Preparation
- **Technical debt documentation** → Note areas for future improvement
- **Architecture evolution** → Consider how changes support future phases
- **Standards evolution** → Update standards if new patterns emerge

---

**🔗 Related Documentation:**
- **Feature Development** → `docs/workflows/feature-development.md`
- **Standards Reference** → `docs/standards/README.md`
- **Quality Gates** → CLAUDE.md#quality-gates