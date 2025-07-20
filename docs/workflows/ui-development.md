# UI/UX Development Workflow

**Reference guide for design system, theming, and user interface development**

## Quick UI Development Checklist

- [ ] Design system components checked first (`components/ui/`)
- [ ] CSS architecture planned (Vanilla Extract)
- [ ] Theme variables defined and tested
- [ ] Responsive design considered
- [ ] Accessibility requirements addressed

## Design System Workflow (CRITICAL)

### Component Hierarchy (MANDATORY)
**Always follow this hierarchy when implementing UI elements:**

1. **FIRST** → Check `~/components/ui/` for existing components
2. **SECOND** → Extend internal design system if gap exists  
3. **LAST** → Use external library components only as foundation within internal components

### Forbidden Patterns
```typescript
// ❌ FORBIDDEN - Direct external UI usage in application components
import { UButton } from "#components";
import { UModal } from "@nuxt/ui";

// ❌ FORBIDDEN - Mixing internal and external components
<AppButton>Internal</AppButton>
<UButton>External</UButton> <!-- Inconsistent! -->
```

### Correct Patterns
```typescript
// ✅ CORRECT - Use internal design system components
import AppButton from "~/components/ui/AppButton.vue";
import AppModal from "~/components/ui/AppModal.vue";

// ✅ CORRECT - Consistent internal design system usage
<AppButton @click="handleAction">Action</AppButton>
<AppModal v-model="showModal">Content</AppModal>
```

## CSS Architecture & Theming

### Vanilla Extract as Primary System
- **MUST use Vanilla Extract** for all new CSS
- **NO scoped styles** except during migration periods
- **CSS custom properties** for theming and dynamic values
- **Type-safe styling** with TypeScript integration

### Theme System Architecture
**Plan CSS hierarchy upfront:**
```
Base theme → System preference → Manual override
```

**CSS Variable System:**
```css
/* Base palette */
--color-primary-50: #eff6ff;
--color-primary-500: #3b82f6;
--color-primary-900: #1e3a8a;

/* Semantic colors */
--color-background: var(--color-neutral-50);
--color-text: var(--color-neutral-900);
--color-accent: var(--color-primary-500);

/* Component-specific */
--button-background: var(--color-accent);
--button-text: var(--color-background);
```

### CSS Specificity Guidelines
- **Never use `!important`** for theming
- **Use `:not()` selectors** to prevent conflicts
- **Manual theme classes** should have higher specificity than media queries
- **Structure CSS to naturally cascade** without forcing

## Component Development Patterns

### New Component Creation
**When creating new design system components:**
- **MUST use `App*` prefix** (AppButton, AppModal, etc.)
- **MUST update design system showcase** (`/design-system` page)
- **MUST follow established API patterns** and prop naming conventions
- **MUST support all standard variants** (size, variant, disabled, loading)

### Component API Standards
```typescript
// ✅ Standard component interface
interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

// ✅ Consistent event patterns
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:modelValue': [value: any];
}>();
```

### Terminal UI Specific Guidelines

#### xterm.js Integration
- **Hide helper elements visually** while preserving functionality
- **Use `opacity: 0` and positioning** instead of `display: none`
- **Preserve keyboard input functionality** by keeping elements in DOM
- **Terminal should maintain dark theme** for optimal readability

#### Terminal Container Patterns
```css
/* ✅ Single container approach */
.terminal-container {
  width: 100%;
  height: 100%;
  background: var(--terminal-background);
  border: 1px solid var(--terminal-border);
}

/* ❌ Avoid double-container styling */
.terminal-section + .terminal-container {
  /* Causes visual gaps */
}
```

## Responsive Design & Accessibility

### Responsive Breakpoints
```typescript
// Standard breakpoint system
const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
```

### Accessibility Requirements
- **Semantic HTML** → Use proper heading hierarchy, landmarks
- **Keyboard navigation** → All interactive elements accessible via keyboard
- **ARIA labels** → Screen reader support for complex components
- **Color contrast** → Meet WCAG 2.1 AA standards
- **Focus indicators** → Visible focus states for all interactive elements

## Testing UI Components

### Visual Testing Strategy
- **Component showcase pages** → `/design-system` for visual verification
- **Theme testing pages** → `/theme-test` with manual toggles
- **Cross-browser testing** → Verify in different browsers and devices
- **Responsive testing** → Test all breakpoints and viewport sizes

### Component Testing Patterns
```typescript
// ✅ Test component behavior, not implementation
describe('AppButton', () => {
  it('should emit click event when clicked', async () => {
    const wrapper = mount(AppButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('should show loading state correctly', async () => {
    const wrapper = mount(AppButton, { props: { loading: true } });
    expect(wrapper.find('.loading-indicator').exists()).toBe(true);
  });
});
```

## Performance Considerations

### CSS Performance
- **Efficient selectors** → Avoid deeply nested selectors
- **Minimal specificity** → Use class selectors over complex combinations
- **CSS custom properties** → Better than runtime style calculations
- **Tree shaking** → Vanilla Extract removes unused styles

### Component Performance
- **Lazy loading** → Use `defineAsyncComponent` for large components
- **Virtual scrolling** → For large lists or terminal output
- **Debounced interactions** → For frequent user interactions
- **Memory cleanup** → Remove event listeners and observers

## Design System Quality Gates

### Pre-commit Checks
- **External component usage audit**:
  ```bash
  grep -r "UButton\|UModal" components/ --exclude-dir=ui
  ```
- **Design system showcase updated** → New components documented
- **All quality gates pass** → `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

### Component Review Criteria
- ✅ **Design system compliance** → Uses `App*` components
- ✅ **CSS architecture** → Vanilla Extract usage
- ✅ **Theme integration** → Supports light/dark modes
- ✅ **Accessibility** → Keyboard navigation and ARIA support
- ✅ **Responsive design** → Works across all breakpoints

## Common UI Development Issues

### Theme System Problems
- **CSS variables not updating** → Check CSS custom property inheritance
- **Theme toggle not working** → Verify JavaScript theme switching logic
- **Inconsistent colors** → Ensure semantic color variables used consistently

### Component Integration Issues
- **External components mixed in** → Replace with design system components
- **CSS conflicts** → Check specificity and cascade order
- **Props not working** → Verify TypeScript interfaces and prop validation

### Performance Issues
- **Large bundle sizes** → Check for unused CSS or component imports
- **Slow rendering** → Profile component re-renders and optimizations
- **Memory leaks** → Verify cleanup in component lifecycle hooks

---

**🔗 Related Documentation:**
- **Design System Standards** → `docs/standards/design-system.md`
- **CSS/Styling Standards** → `docs/standards/css-styling.md`  
- **Component Standards** → `docs/standards/components.md`
- **Feature Development** → `docs/workflows/feature-development.md`