# Components

This folder contains reusable Vue components that make up the building blocks of the AI-controller application's user interface.

## What's here

- **UI components** - Reusable interface elements
- **Feature components** - Specific functionality components
- **Composite components** - Complex components built from smaller parts

## Current components

- **Terminal component** (`Terminal.vue`) - Interactive terminal interface with xterm.js integration

## Why you might work in this folder

- **New UI elements** - Create reusable components for the interface
- **Feature development** - Build components for new application features
- **Component refactoring** - Break down large components into smaller, reusable parts
- **Styling updates** - Modify component appearance and behavior
- **Accessibility improvements** - Enhance component accessibility
- **Performance optimization** - Optimize component rendering and reactivity

## Component patterns

- **Single File Components** - Vue SFC format with `<template>`, `<script>`, and `<style>`
- **Composition API** - Use Vue 3 Composition API for reactive logic
- **Props and events** - Clear component interfaces with TypeScript
- **Slot-based content** - Flexible content injection patterns
- **Nuxt UI integration** - Leverage Nuxt UI components for consistency

## Key considerations

- Components should be **reusable** and **composable**
- Use **TypeScript** for props, events, and internal logic
- Follow **Vue 3 best practices** and composition API patterns
- Implement **proper accessibility** (ARIA attributes, keyboard navigation)
- Use **Nuxt UI components** as building blocks when possible
- Keep components **focused** on a single responsibility

## Testing

- Write **component tests** using Vitest and Vue Testing Library
- Test **user interactions** and component behavior
- Mock **external dependencies** (APIs, services)
- Test **edge cases** and error scenarios

## Nuxt conventions

- Components are **auto-imported** in pages and other components
- Use **PascalCase** for component names
- Components can be **nested** in subdirectories for organization
- Global components should be **prefixed** to avoid naming conflicts