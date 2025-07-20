# Development Standards Documentation

**Version:** 1.0  
**Date:** 2025-07-16  
**Status:** Active

## Overview

This directory contains the comprehensive development standards for the AI-Controller project. All standards documents follow RFC 2119 conventions and establish mandatory requirements for code quality, consistency, and maintainability.

### RFC 2119 Compliance

All standards documents in this directory use RFC 2119 key words to indicate requirement levels:

- **MUST** / **REQUIRED** / **SHALL**: Absolute requirements
- **MUST NOT** / **SHALL NOT**: Absolute prohibitions  
- **SHOULD** / **RECOMMENDED**: Strong recommendations
- **SHOULD NOT**: Strong discouragements
- **MAY** / **OPTIONAL**: Truly optional features

## Standards Documents Index

### 1. [TypeScript Standards](./typescript.md)
**Focus:** Type safety, interface design, and strict TypeScript practices

**Key Requirements:**
- Zero `any` tolerance - all types must be explicit
- Strict TypeScript configuration with enhanced flags
- Comprehensive interfaces for external libraries
- Type guards for runtime validation
- Proper Vue 3 + TypeScript integration

**Quick Reference:**
```typescript
// ✅ Correct - Explicit interfaces
interface XTerminalInstance {
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
}

// ❌ Forbidden - Any types
const terminal: any = new Terminal();
```

### 2. [Component Standards](./components.md)
**Focus:** Vue 3 component architecture and Composition API patterns

**Key Requirements:**
- Single File Component (SFC) format with TypeScript
- Composition API with proper type safety
- External library integration with explicit interfaces
- Comprehensive testing with 80% minimum coverage
- Performance optimization and memory management

**Quick Reference:**
```vue
<script setup lang="ts">
// Required structure
const props = defineProps<Props>();
const emit = defineEmits<EmitEvents>();
// Component logic
defineExpose({ publicAPI });
</script>
```

### 3. [API/Server Standards](./api-server.md)
**Focus:** Server-side development with Nitro framework

**Key Requirements:**
- Nitro API route patterns and conventions
- WebSocket handler implementation standards
- Service layer architecture with proper lifecycle management
- Comprehensive error handling and logging
- Security standards for input validation and process management

**Quick Reference:**
```typescript
// API Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 4. [Testing Standards](./testing.md)
**Focus:** Comprehensive testing strategy with minimal mocking

**Key Requirements:**
- Integration testing over unit testing
- Minimal mocking philosophy (only external dependencies)
- 80% minimum code coverage with per-file enforcement
- User journey testing patterns
- Vitest framework with proper setup

**Quick Reference:**
```typescript
// ✅ Mock only external dependencies
vi.mock("@xterm/xterm", () => ({ /* mock */ }));

// ❌ Don't mock internal code
vi.mock("./services/terminal"); // Forbidden
```

### 5. [CSS/Styling Standards](./css-styling.md)
**Focus:** Styling architecture with vanilla-extract and theming

**Key Requirements:**
- Vanilla-extract as primary CSS system
- CSS custom properties for runtime theming
- Elimination of scoped styles in favor of type-safe CSS
- Comprehensive theming support (light/dark modes)
- Performance-optimized styling patterns

**Quick Reference:**
```typescript
// ✅ Vanilla-extract pattern
export const styles = style({
  color: theme.colors.primary,
  backgroundColor: "var(--color-background)",
});
```

### 6. [Design System Standards](./design-system.md)
**Focus:** Design system architecture and component usage hierarchy

**Key Requirements:**
- Design system first approach - always check internal components before external
- Internal design system components (`App*` prefix) over external UI libraries
- Consistent component APIs and prop patterns
- Comprehensive design system showcase documentation
- Proper external library integration patterns

**Quick Reference:**
```typescript
// ✅ Correct - Use internal design system
import AppButton from "~/components/ui/AppButton.vue";

// ❌ Forbidden - Direct external usage
import { UButton } from "#components";
```

## Quick Reference Guide

### RFC 2119 Keywords Summary

| Keyword | Meaning | Usage |
|---------|---------|--------|
| **MUST** | Absolute requirement | Non-negotiable standards |
| **MUST NOT** | Absolute prohibition | Forbidden practices |
| **SHOULD** | Strong recommendation | Best practices |
| **SHOULD NOT** | Strong discouragement | Avoid unless justified |
| **MAY** | Optional | Implementer choice |

### Common Patterns Across Standards

#### Type Safety Requirements
- Zero `any` types throughout codebase
- Explicit interfaces for external libraries
- Type guards for runtime validation
- Strict TypeScript configuration

#### Testing Requirements
- 80% minimum code coverage (per file)
- Integration testing over unit testing
- Mock only external dependencies
- 100% test success rate

#### Error Handling Patterns
```typescript
try {
  // Operation
} catch (error) {
  logger.error("Operation failed", error, { context });
  emit("error", error instanceof Error ? error.message : "Unknown error");
}
```

#### Import Organization
```typescript
// 1. Vue core imports
import { ref, onMounted } from "vue";

// 2. Nuxt imports
import { useNuxtApp } from "nuxt/app";

// 3. Type imports
import type { ComponentProps } from "~/types";

// 4. Local imports
import { logger } from "~/utils/logger";
```

## Standards Compliance Checklist

### Before Committing Code

**Quality Gates (ALL MUST PASS):**
```bash
pnpm lint        # → 0 errors, 0 warnings
pnpm typecheck   # → 0 TypeScript errors
pnpm test        # → 100% test success rate
pnpm build       # → Successful production build
```

**Code Review Checklist:**
- [ ] TypeScript strict mode compliance
- [ ] No `any` types used
- [ ] Proper error handling implemented
- [ ] External library integration follows standards
- [ ] Design system usage follows hierarchy (internal components first)
- [ ] No direct external UI component usage in application code
- [ ] Design system showcase updated for new components
- [ ] Tests achieve 80%+ coverage
- [ ] Integration tests implemented
- [ ] Documentation updated

### Performance Standards
- API endpoints: Health checks < 10ms, Operations < 100ms
- Component lifecycle: Proper cleanup in `onUnmounted`
- Memory management: No leaks in long-running processes
- Bundle optimization: Vanilla-extract build-time optimization

## Integration with Development Workflow

### 1. Branch Management
- Always create feature branches from `main`
- Use descriptive branch names reflecting the work
- Follow established branching patterns

### 2. Development Process
```bash
# Start development
git checkout main
git pull origin main
git checkout -b feature/descriptive-name

# During development
pnpm dev          # Development server
pnpm test         # Run tests continuously
pnpm lint         # Fix linting issues
pnpm typecheck    # Verify TypeScript

# Before committing
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### 3. Code Review Process
- All code MUST pass quality gates
- Follow standards compliance checklist
- Review for architectural consistency
- Verify test coverage and quality

## Updating Standards

### When to Update Standards

Standards documents SHOULD be updated when:
- New technologies are adopted
- Patterns emerge from code review learnings
- Architecture decisions change
- Quality issues are identified

### Update Process

1. **Identify Need**: Document specific issues or improvements
2. **Propose Changes**: Create RFC-style proposal
3. **Team Review**: Discuss with development team
4. **Implementation**: Update relevant standards documents
5. **Communication**: Notify all developers of changes

### Versioning

Standards documents use semantic versioning:
- **Major (X.0)**: Breaking changes requiring code updates
- **Minor (X.Y)**: New requirements or clarifications
- **Patch (X.Y.Z)**: Corrections or minor improvements

## Getting Started for New Developers

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd ai-controller

# Install dependencies
pnpm install

# Rebuild native bindings (required for node-pty)
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
```

### 2. Development Tools
- **IDE**: VS Code with TypeScript, Vue, and ESLint extensions
- **Testing**: Vitest with coverage reporting
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with project configuration

### 3. First Steps
1. Read this README thoroughly
2. Review relevant standards documents for your work area
3. Set up development environment
4. Run quality gates to ensure setup is correct
5. Start with small changes to familiarize yourself with patterns

### 4. Key Learning Resources
- [Project CLAUDE.md](../../CLAUDE.md) - Project-specific development workflow
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vue 3 Composition API Guide](https://vuejs.org/guide/composition-api-introduction.html)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vitest Documentation](https://vitest.dev/)

## Related Documentation

### 🔗 Navigation Hub
- **Getting Started** → [Project CLAUDE.md](../../CLAUDE.md) - Activity-based development guidance
- **Workflow Guides** → [docs/workflows/](../workflows/) - Step-by-step development processes
- **Implementation Guides** → [docs/implementation/](../implementation/) - Technical reference documentation
- **Troubleshooting** → [docs/troubleshooting/](../troubleshooting/) - Problem resolution guides
- **Quick Reference** → [docs/reference/](../reference/) - Fast lookup guides and patterns

### Technical Documentation Cross-References
- **TypeScript Patterns** → [Code Patterns Reference](../reference/code-patterns.md#vue-3-component-patterns)
- **Testing Implementation** → [Testing Guide](../implementation/testing.md#core-testing-philosophy)
- **CSS/Styling Patterns** → [Styling Guide](../implementation/styling.md#vanilla-extract-as-primary-css-system)
- **API Development** → [Backend Guide](../implementation/backend.md#api-development-patterns)

### Project Documentation
- [Package.json Scripts](../../package.json) - Available npm scripts
- [TypeScript Configuration](../../tsconfig.json) - TypeScript settings
- [Vitest Configuration](../../vitest.config.ts) - Test setup and coverage

### External References
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html) - Key words for use in RFCs
- [Vue 3 Style Guide](https://vuejs.org/style-guide/)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

## Support and Questions

### Getting Help
- Review relevant standards document first
- Check project CLAUDE.md for workflow guidance
- Consult team members for clarification
- Create issues for standards improvement suggestions

### Contributing to Standards
- Follow RFC 2119 conventions for requirement levels
- Provide rationale for all requirements
- Include practical examples
- Consider backward compatibility
- Document implementation guidelines

## Document History

- **v1.0 (2025-07-16)**: Initial comprehensive standards index
  - Created overview of all standards documents
  - Established RFC 2119 compliance framework
  - Added quick reference guides and checklists
  - Integrated with development workflow
