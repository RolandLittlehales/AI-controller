# Pages

This folder contains the application's pages, which define the routes and main content areas of the AI-controller application.

## What's here

- **Route pages** - Individual pages that map to application routes
- **Page components** - Vue components that represent full pages
- **Navigation structure** - File-based routing that defines the app's URL structure

## Current pages

- **Home page** (`index.vue`) - Main application page with terminal interface

## Why you might work in this folder

- **New routes** - Add new pages/routes to the application
- **Page layouts** - Modify how pages are structured and presented
- **Navigation flow** - Change how users move between pages
- **Page-specific features** - Add functionality that belongs to specific pages
- **SEO optimization** - Update meta tags, titles, and page-specific SEO
- **User experience** - Improve page interactions and user flows

## File-based routing

Nuxt 3 uses file-based routing where:
- `index.vue` → `/` (home page)
- `about.vue` → `/about`
- `users/index.vue` → `/users`
- `users/[id].vue` → `/users/:id` (dynamic route)

## Page patterns

- **Single File Components** - Vue SFC with `<template>`, `<script>`, `<style>`
- **Page metadata** - Use `definePageMeta()` for page configuration
- **Layout specification** - Define which layout to use for each page
- **Route parameters** - Access dynamic route parameters
- **Navigation guards** - Implement page-level navigation logic

## Key considerations

- Pages are **automatically routed** based on file structure
- Use **layouts** for consistent page structure
- Implement **proper SEO** with meta tags and structured data
- Handle **loading states** and **error scenarios**
- Follow **accessibility** guidelines for page content
- Use **Nuxt UI components** for consistent styling

## Page configuration

- **definePageMeta()** - Configure page layout, middleware, transitions
- **useSeoMeta()** - Set page-specific SEO metadata
- **useHead()** - Manage page head elements
- **Navigation** - Use `<NuxtLink>` for client-side navigation

## Testing

- Test **page rendering** and **user interactions**
- Test **routing** and **navigation** behavior
- Test **page-specific features** and **data loading**
- Mock **API calls** and **external dependencies**