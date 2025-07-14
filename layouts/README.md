# Layouts

This folder contains Vue layout components that define the overall structure and presentation of pages in the AI-controller application.

## What's here

- **Layout components** - Reusable page structures
- **Common UI elements** - Headers, footers, sidebars, navigation
- **Page templates** - Different layout patterns for different page types

## Current layouts

- **Default layout** (`default.vue`) - Main application layout with common elements

## Why you might work in this folder

- **Consistent UI structure** - Modify the overall application layout
- **Navigation changes** - Update headers, sidebars, or navigation menus
- **Global components** - Add elements that appear across multiple pages
- **Responsive design** - Adjust layout for different screen sizes
- **Theme modifications** - Change overall styling and appearance
- **New page types** - Create specialized layouts for different content types

## Layout patterns

- **Shared elements** - Common headers, footers, navigation
- **Slot-based content** - Pages inject content into layout slots
- **Reactive design** - Layouts adapt to screen size and device
- **Consistent styling** - Unified design system across layouts

## Key considerations

- Layouts wrap **all pages** that use them
- Use **slots** for flexible content injection
- Keep layouts **lightweight** and focused on structure
- Implement **responsive design** for mobile compatibility
- Follow **accessibility** best practices
- Use **Nuxt UI components** for consistency

## Nuxt conventions

- Layout files are **auto-imported**
- Default layout (`default.vue`) is used when no layout is specified
- Pages can specify layouts using `definePageMeta({ layout: 'custom' })`
- Layouts can be **nested** for complex page structures