# Server

This folder contains the server-side code for the AI-controller application, built on Nuxt 3's Nitro backend.

## What's here

- **API routes** (`api/`) - REST and WebSocket endpoints
- **Services** (`services/`) - Business logic and core functionality
- **Plugins** - Server-side plugins and middleware (when added)

## Why you might work in this folder

- **Adding new API endpoints** - Create new routes in the `api/` directory
- **Implementing WebSocket handlers** - For real-time communication features
- **Building core services** - Business logic that needs to run on the server
- **Server-side data processing** - Terminal management, AI instance coordination
- **Background tasks** - Scheduled jobs, cleanup processes

## Key files

- Health check endpoint for monitoring
- WebSocket terminal handler for real-time terminal communication
- Terminal service for managing terminal instances

## Architecture

The server follows Nuxt 3's Nitro architecture with:
- File-based routing for API endpoints
- WebSocket support for real-time features
- Service layer separation for business logic
- TypeScript throughout for type safety