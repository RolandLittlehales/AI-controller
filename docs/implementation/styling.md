# CSS/Styling Implementation Guide

**Technical reference for Vanilla Extract and design system styling**

## Vanilla Extract as Primary CSS System

### Basic Vanilla Extract Patterns
```typescript
// styles/components/button.css.ts
import { style, styleVariants } from '@vanilla-extract/css';

export const buttonBase = style({
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'all 0.2s ease-in-out',
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  
  ':hover:not(:disabled)': {
    transform: 'translateY(-1px)',
  },
});

export const buttonVariants = styleVariants({
  primary: {
    backgroundColor: 'var(--color-primary-500)',
    color: 'var(--color-white)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'var(--color-primary-600)',
    },
  },
  secondary: {
    backgroundColor: 'var(--color-gray-200)',
    color: 'var(--color-gray-900)',
    
    ':hover:not(:disabled)': {
      backgroundColor: 'var(--color-gray-300)',
    },
  },
});

export const buttonSizes = styleVariants({
  sm: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
  md: { padding: '0.5rem 1rem', fontSize: '1rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
});
```

### Component Style Integration
```vue
<template>
  <button 
    :class="[
      buttonBase, 
      buttonVariants[variant], 
      buttonSizes[size],
      { [disabledStyle]: disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { buttonBase, buttonVariants, buttonSizes } from './button.css';

interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});
</script>
```

## CSS Custom Properties System

### Base Color Palette
```typescript
// styles/tokens/colors.css.ts
import { createGlobalTheme } from '@vanilla-extract/css';

export const colorTokens = createGlobalTheme(':root', {
  // Base palette
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Primary colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
});
```

### Semantic Color System
```typescript
// styles/tokens/semantic.css.ts
import { createGlobalTheme } from '@vanilla-extract/css';
import { colorTokens } from './colors.css';

export const semanticTokens = createGlobalTheme(':root', {
  color: {
    // Background colors
    background: colorTokens.white,
    surface: colorTokens.gray[50],
    
    // Text colors
    text: colorTokens.gray[900],
    textSecondary: colorTokens.gray[600],
    textMuted: colorTokens.gray[400],
    
    // Interactive colors
    primary: colorTokens.primary[500],
    primaryHover: colorTokens.primary[600],
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    
    // Border colors
    border: colorTokens.gray[200],
    borderFocus: colorTokens.primary[500],
  },
});
```

### Dark Theme Implementation
```typescript
// styles/themes/dark.css.ts
import { createTheme } from '@vanilla-extract/css';
import { semanticTokens } from '../tokens/semantic.css';

export const darkTheme = createTheme(semanticTokens, {
  color: {
    // Dark mode backgrounds
    background: '#0f172a',
    surface: '#1e293b',
    
    // Dark mode text
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    
    // Interactive colors (keep same for consistency)
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    
    // Status colors (adjusted for dark mode)
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    
    // Dark mode borders
    border: '#334155',
    borderFocus: '#3b82f6',
  },
});
```

## Theme System Architecture

### Theme Toggle Implementation
```typescript
// composables/useTheme.ts
import { ref, watch } from 'vue';
import { darkTheme } from '~/styles/themes/dark.css';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const theme = ref<Theme>('system');
  const isDark = ref(false);

  // System preference detection
  const systemPrefersDark = ref(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // Apply theme to document
  const applyTheme = (isDarkMode: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (isDarkMode) {
      document.documentElement.classList.add(darkTheme);
    } else {
      document.documentElement.classList.remove(darkTheme);
    }
  };

  // Watch for theme changes
  watch(
    [theme, systemPrefersDark],
    ([currentTheme, systemDark]) => {
      let shouldBeDark = false;
      
      switch (currentTheme) {
        case 'dark':
          shouldBeDark = true;
          break;
        case 'light':
          shouldBeDark = false;
          break;
        case 'system':
          shouldBeDark = systemDark;
          break;
      }
      
      isDark.value = shouldBeDark;
      applyTheme(shouldBeDark);
    },
    { immediate: true }
  );

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
    });
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem('theme-preference', newTheme);
  };

  // Load saved preference
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme-preference') as Theme;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      theme.value = saved;
    }
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    systemPrefersDark: readonly(systemPrefersDark),
    setTheme,
  };
}
```

### Theme-Aware Component Styling
```vue
<template>
  <div :class="containerStyles">
    <h1 :class="titleStyles">{{ title }}</h1>
    <p :class="descriptionStyles">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '~/composables/useTheme';
import { 
  container, 
  title, 
  description,
  darkVariant 
} from './component.css';

const { isDark } = useTheme();

const containerStyles = computed(() => [
  container,
  isDark.value && darkVariant.container,
]);

const titleStyles = computed(() => [
  title,
  isDark.value && darkVariant.title,
]);

const descriptionStyles = computed(() => [
  description,
  isDark.value && darkVariant.description,
]);
</script>
```

## Terminal-Specific Styling

### Terminal Container Patterns
```typescript
// styles/components/terminal.css.ts
import { style } from '@vanilla-extract/css';

export const terminalContainer = style({
  width: '100%',
  height: '100%',
  backgroundColor: '#1a1a1a', // Always dark for terminals
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  position: 'relative',
  
  // Ensure proper sizing for xterm.js
  selectors: {
    '& .xterm': {
      height: '100%',
    },
    '& .xterm-viewport': {
      overflow: 'hidden', // Let xterm handle scrolling
    },
    '& .xterm-scroll-area': {
      // Don't constrain xterm's scroll management
    },
  },
});

export const terminalHeader = style({
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const terminalContent = style({
  height: 'calc(100% - 60px)', // Account for header height
  position: 'relative',
});

// Hide xterm helper elements while preserving functionality
export const xtermHelpers = style({
  selectors: {
    '& .xterm-helper-textarea': {
      opacity: 0,
      position: 'absolute',
      left: '-9999px',
      // Don't use display: none - it breaks keyboard input
    },
  },
});
```

### Responsive Terminal Layouts
```typescript
// styles/layouts/terminal.css.ts
import { style } from '@vanilla-extract/css';

export const terminalGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '1rem',
  height: '100vh',
  
  '@media': {
    '(min-width: 768px)': {
      gridTemplateColumns: '250px 1fr',
    },
    '(min-width: 1024px)': {
      gridTemplateColumns: '300px 1fr',
    },
  },
});

export const terminalSidebar = style({
  backgroundColor: 'var(--color-surface)',
  borderRight: '1px solid var(--color-border)',
  padding: '1rem',
  overflow: 'auto',
  
  '@media': {
    '(max-width: 767px)': {
      display: 'none', // Hidden on mobile
    },
  },
});

export const terminalMain = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0, // Important for proper flex shrinking
});
```

## Performance Optimization

### CSS Performance Patterns
```typescript
// ✅ Efficient selector patterns
export const optimizedButton = style({
  // Use simple class selectors
  backgroundColor: 'var(--color-primary)',
  
  // Avoid deep nesting
  selectors: {
    '&:hover': { // Direct pseudo-selector
      backgroundColor: 'var(--color-primary-hover)',
    },
  },
});

// ❌ Avoid inefficient patterns
export const inefficientButton = style({
  selectors: {
    // Avoid complex descendant selectors
    '& .nested .deep .selector': {
      color: 'red',
    },
    // Avoid universal selectors
    '& *': {
      boxSizing: 'border-box',
    },
  },
});
```

### CSS Custom Property Optimization
```typescript
// ✅ Group related properties
export const spacing = createGlobalTheme(':root', {
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
});

// ✅ Use semantic naming
export const layout = createGlobalTheme(':root', {
  container: {
    maxWidth: '1200px',
    padding: '0 1rem',
  },
  header: {
    height: '4rem',
  },
});
```

## Animation & Transitions

### CSS Animation Patterns
```typescript
// styles/animations/transitions.css.ts
import { keyframes, style } from '@vanilla-extract/css';

// Keyframe animations
export const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const slideUp = keyframes({
  from: { 
    opacity: 0, 
    transform: 'translateY(1rem)' 
  },
  to: { 
    opacity: 1, 
    transform: 'translateY(0)' 
  },
});

// Animation styles
export const animated = style({
  animation: `${fadeIn} 0.2s ease-out`,
});

export const slideUpAnimation = style({
  animation: `${slideUp} 0.3s ease-out`,
});

// Transition utilities
export const smooth = style({
  transition: 'all 0.2s ease-in-out',
});

export const hoverScale = style({
  transition: 'transform 0.2s ease-in-out',
  
  ':hover': {
    transform: 'scale(1.05)',
  },
});
```

### Performance-Conscious Animations
```typescript
// ✅ GPU-accelerated properties
export const performantAnimation = style({
  // Use transform and opacity for best performance
  transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
  
  ':hover': {
    transform: 'translateY(-2px)', // GPU-accelerated
    opacity: 0.9,
  },
});

// ❌ Avoid animating expensive properties
export const expensiveAnimation = style({
  transition: 'width 0.3s, height 0.3s, background-color 0.3s',
  // These cause layout recalculation
});
```

## Accessibility in CSS

### Focus States
```typescript
export const accessibleButton = style({
  // Visible focus indicator
  ':focus-visible': {
    outline: '2px solid var(--color-primary)',
    outlineOffset: '2px',
  },
  
  // Remove default outline
  ':focus': {
    outline: 'none',
  },
});

export const skipLink = style({
  position: 'absolute',
  top: '-40px',
  left: '6px',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  padding: '8px',
  textDecoration: 'none',
  borderRadius: '4px',
  
  ':focus': {
    top: '6px',
  },
});
```

### High Contrast & Reduced Motion
```typescript
export const accessible = style({
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none',
    },
    '(prefers-contrast: high)': {
      border: '2px solid currentColor',
    },
  },
});
```

## Testing CSS Implementation

### Visual Regression Testing
```typescript
// Component showcase for visual testing
describe('Button component styles', () => {
  it('should render all variants correctly', () => {
    const variants = ['primary', 'secondary', 'danger'];
    const sizes = ['sm', 'md', 'lg'];
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        const wrapper = mount(AppButton, {
          props: { variant, size },
          slots: { default: 'Test Button' },
        });
        
        expect(wrapper.classes()).toContain(`button-${variant}`);
        expect(wrapper.classes()).toContain(`button-${size}`);
      });
    });
  });
});
```

### CSS Class Testing
```typescript
// Test CSS class application
it('should apply theme classes correctly', async () => {
  const { setTheme } = useTheme();
  
  setTheme('dark');
  await nextTick();
  
  expect(document.documentElement.classList.contains(darkTheme)).toBe(true);
  
  setTheme('light');
  await nextTick();
  
  expect(document.documentElement.classList.contains(darkTheme)).toBe(false);
});
```

---

**🔗 Related Documentation:**
- **CSS/Styling Standards** → `docs/standards/css-styling.md`
- **Design System Standards** → `docs/standards/design-system.md`
- **UI Development Workflow** → `docs/workflows/ui-development.md`