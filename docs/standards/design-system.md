# Design System Standards

**Status**: Draft  
**Version**: 1.0.0  
**Date**: 2025-07-19  
**Author**: AI-Controller Development Team

This document establishes mandatory standards for design system development and usage in the AI-Controller project. It follows RFC 2119 conventions for requirement levels.

## Table of Contents

1. [Overview](#overview)
2. [Design System Architecture](#design-system-architecture)
3. [Component Usage Hierarchy](#component-usage-hierarchy)
4. [Internal Component Standards](#internal-component-standards)
5. [External Library Integration](#external-library-integration)
6. [Design System Extension](#design-system-extension)
7. [Showcase Requirements](#showcase-requirements)
8. [Quality Gates](#quality-gates)

## Overview

The AI-Controller project uses a comprehensive design system that serves as the single source of truth for UI components and visual consistency. All application code MUST use internal design system components rather than external UI library components directly.

### Key Principles

- **Design System First**: Always check internal design system before using external components
- **Consistency**: All UI elements MUST follow established design patterns
- **Extensibility**: Design system MUST be easily extensible for new requirements
- **Performance**: Components MUST be optimized for production use
- **Accessibility**: All components MUST meet WCAG 2.1 standards

## Design System Architecture

### 2.1 Component Organization

The design system MUST be organized in this structure:

```
components/
├── ui/                           # Design System Components
│   ├── AppButton.vue            # Base button component
│   ├── AppModal.vue             # Base modal component
│   ├── AppAccordion.vue         # Base accordion component
│   └── AppCard.vue              # Base card component
├── theme/                       # Theme-specific components
│   ├── ThemeControls.vue        # Theme switching interface
│   └── ThemeShowcase.vue        # Theme demonstration
└── [feature]/                   # Feature-specific components
    ├── Terminal.vue             # Feature components
    └── TerminalSidebar.vue      # Feature sub-components
```

### 2.2 Naming Conventions

Components MUST follow these naming standards:

- **Design System Components**: `App` prefix (e.g., `AppButton`, `AppModal`)
- **Theme Components**: `Theme` prefix (e.g., `ThemeControls`)
- **Feature Components**: Descriptive names without prefix (e.g., `Terminal`, `TerminalSidebar`)

## Component Usage Hierarchy

### 3.1 Usage Priority Order

When implementing UI elements, developers MUST follow this hierarchy:

1. **FIRST**: Check internal design system (`~/components/ui/`)
2. **SECOND**: Extend internal design system if gap exists
3. **LAST**: Use external library components only as foundation within internal components

### 3.2 Forbidden Patterns

Application components MUST NOT:

```typescript
// ❌ FORBIDDEN - Direct external UI usage in application components
import { UButton } from "#components";
import { UModal } from "@nuxt/ui";
import { UAccordion } from "#components";

// ❌ FORBIDDEN - Mixing internal and external components
<template>
  <AppButton>Internal</AppButton>
  <UButton>External</UButton> <!-- Inconsistent! -->
</template>

// ❌ FORBIDDEN - External components with custom styling
<template>
  <UButton class="custom-button-style">Styled External</UButton>
</template>
```

### 3.3 Correct Patterns

```typescript
// ✅ CORRECT - Use internal design system components
import AppButton from "~/components/ui/AppButton.vue";
import AppModal from "~/components/ui/AppModal.vue";

// ✅ CORRECT - Consistent internal design system usage
<template>
  <AppButton @click="handleAction">Click Me</AppButton>
  <AppModal v-model="showModal">Modal Content</AppModal>
</template>
```

## Internal Component Standards

### 4.1 Component API Design

Internal design system components MUST:

- **Provide consistent APIs** across all components
- **Support all necessary variants** for the design system
- **Include proper TypeScript interfaces** for all props and emits
- **Follow established prop naming conventions**

### 4.2 Required Props and Variants

All design system components MUST support:

```typescript
interface BaseComponentProps {
  // Size variants
  size?: "xs" | "sm" | "md" | "lg";
  
  // Visual variants  
  variant?: "primary" | "secondary" | "danger";
  
  // State modifiers
  disabled?: boolean;
  loading?: boolean;
  
  // Layout modifiers (where applicable)
  block?: boolean;
}
```

### 4.3 Button Component Requirements

The `AppButton` component MUST support:

```typescript
interface AppButtonProps extends BaseComponentProps {
  // Icon support
  icon?: string;
  trailingIcon?: string;
  
  // Additional variants
  variant?: "primary" | "secondary" | "danger";
  
  // Button-specific props
  type?: "button" | "submit" | "reset";
}
```

## External Library Integration

### 5.1 Integration Standards

When external libraries MUST be used as foundation (within internal design system components):

1. **Isolate usage** to design system components only
2. **Create consistent APIs** that match internal patterns
3. **Add enhanced functionality** that serves project needs
4. **Maintain backward compatibility** when updating external dependencies

### 5.2 Wrapper Component Pattern

```typescript
// ✅ GOOD - Internal component that enhances/wraps external library
// File: ~/components/ui/AppAccordion.vue
<template>
  <UAccordion v-bind="accordionProps" @update:open="handleUpdate">
    <slot />
  </UAccordion>
</template>

<script setup lang="ts">
// Internal component that enhances/wraps external library
import { UAccordion } from "#components";

interface Props {
  items: AccordionItem[];
  multiple?: boolean;
  variant?: "default" | "ghost" | "soft";
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  variant: "default",
});

// Transform props to match internal design patterns
const accordionProps = computed(() => ({
  items: props.items,
  multiple: props.multiple,
  // Add internal design system enhancements
  class: `app-accordion app-accordion--${props.variant}`,
}));
</script>
```

## Design System Extension

### 6.1 Extension Requirements

When extending the design system, components MUST:

1. **Create internal wrapper component** rather than using external components directly
2. **Follow established naming conventions** (App* prefix for base components)
3. **Implement consistent API patterns** matching existing design system components
4. **Update design system showcase** immediately upon creation
5. **Document usage patterns** and component variations

### 6.2 Extension Process

1. **Identify Need**: Document specific UI requirement
2. **Design API**: Create TypeScript interface following established patterns
3. **Implement Component**: Build wrapper around external library (if needed)
4. **Update Showcase**: Add component to design system demonstration page
5. **Document Usage**: Add examples and guidelines
6. **Quality Gates**: Ensure all tests pass and standards are met

### 6.3 Component Migration

When migrating existing external component usage:

1. **Audit current usage** of external components
2. **Create internal wrapper** component following design system patterns
3. **Update all import statements** to use internal components
4. **Test visual consistency** and functionality
5. **Update design system showcase** with new patterns

**Migration Checklist:**
- [ ] External component usage identified
- [ ] Internal design system component created
- [ ] All application imports updated
- [ ] Visual consistency verified
- [ ] Design system showcase updated
- [ ] Quality gates passing

## Showcase Requirements

### 7.1 Design System Documentation

Components MUST be documented in the design system showcase (`/design-system` page) when:

1. **Creating new base components** (App* components)
2. **Adding new component patterns** or variations
3. **Implementing new UI interactions** or behaviors
4. **Establishing new design tokens** or styling patterns

### 7.2 Showcase Documentation Pattern

```vue
<!-- Add to pages/design-system.vue -->
<section class="test-card new-component-demo">
  <h3>AppAccordion Component</h3>
  
  <!-- Variants -->
  <div class="component-container">
    <h4>Variants</h4>
    <AppAccordion
      v-for="variant in ACCORDION_VARIANTS"
      :key="variant.variant"
      :variant="variant.variant"
      :items="variant.items"
    />
  </div>
  
  <!-- States -->
  <div class="component-container">
    <h4>States</h4>
    <AppAccordion :items="items" multiple />
    <AppAccordion :items="items" disabled />
  </div>
</section>
```

### 7.3 Required Showcase Sections

Each component MUST demonstrate:

- **All size variants** (xs, sm, md, lg)
- **All visual variants** (primary, secondary, danger, etc.)
- **All state variations** (normal, loading, disabled)
- **Interactive behaviors** (hover, focus, active states)
- **Icon integrations** (where applicable)
- **Layout variations** (block, inline, etc.)

## Quality Gates

### 8.1 Pre-Commit Quality Checks

Before committing design system changes, verify:

```bash
# Check for external UI component usage outside design system
grep -r "UButton\|UModal\|UAccordion" components/ --exclude-dir=ui
# Should return no results (except in design system components)

# Verify design system showcase is updated
# Check that /design-system page includes new components

# Ensure consistent component APIs
# New components should match established patterns
```

### 8.2 Component Quality Standards

All design system components MUST:

- **Pass all quality gates**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Achieve 80%+ test coverage** with meaningful integration tests
- **Support all required variants** and states
- **Include comprehensive TypeScript interfaces**
- **Follow accessibility standards** (WCAG 2.1)
- **Be documented in design system showcase**

### 8.3 Performance Requirements

Design system components MUST:

- **Load efficiently** with minimal bundle impact
- **Render quickly** without performance bottlenecks
- **Support tree-shaking** for unused variants
- **Use CSS variables** for dynamic theming
- **Avoid runtime style calculations** where possible

## Design System Governance

### 9.1 Change Management

Design system changes MUST follow this process:

1. **Proposal**: Document need and approach
2. **Design Review**: Ensure consistency with existing patterns
3. **Implementation**: Build following all standards
4. **Testing**: Comprehensive test coverage
5. **Documentation**: Update showcase and guidelines
6. **Communication**: Notify team of changes

### 9.2 Breaking Changes

Breaking changes to design system components:

- **MUST be avoided** when possible
- **MUST include migration guide** when necessary
- **MUST be communicated** to all developers
- **MUST maintain backward compatibility** for at least one release cycle

### 9.3 Design Token Management

Design tokens (CSS variables) MUST:

- **Follow naming conventions** (--color-*, --spacing-*, --font-*)
- **Be documented** in design system showcase
- **Support theme variations** (light/dark modes)
- **Be centrally managed** in theme configuration
- **Maintain semantic meaning** across themes

## Conclusion

These design system standards ensure consistent, maintainable, and scalable UI development throughout the AI-Controller project. All components MUST follow these guidelines, and exceptions require explicit documentation and team approval.

The design system serves as the foundation for all UI development and MUST be treated as a critical project asset requiring careful governance and quality control.

---

**Document Status**: Living document - will be updated as the design system evolves.