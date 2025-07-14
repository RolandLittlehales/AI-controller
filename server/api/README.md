# Server API

This folder contains all API endpoints for the AI-controller application, following Nuxt 3's file-based routing system.

## What's here

- **REST endpoints** - HTTP GET/POST/PUT/DELETE routes
- **WebSocket handlers** - Real-time communication endpoints
- **Health checks** - Application monitoring endpoints

## File structure

```
api/
├── health.get.ts          # Health check endpoint
└── ws/
    └── terminal.ts        # WebSocket terminal handler
```

## Why you might work in this folder

- **Adding new API endpoints** - Create new `.get.ts`, `.post.ts`, etc. files
- **Implementing WebSocket features** - Add handlers in the `ws/` directory
- **API versioning** - Organize endpoints by version or feature
- **Request/response handling** - Modify existing endpoint logic
- **Authentication** - Add auth middleware or protected routes

## Naming conventions

- **REST endpoints**: `[name].[method].ts` (e.g., `users.get.ts`, `auth.post.ts`)
- **WebSocket handlers**: `[name].ts` in the `ws/` directory
- **Middleware**: `[name].ts` for shared functionality

## Current endpoints

- `GET /api/health` - Application health status
- `WS /api/ws/terminal` - Terminal WebSocket communication

## Key patterns

- Each file exports a default handler function
- Use TypeScript interfaces for request/response types
- WebSocket handlers manage connection lifecycle
- Error handling follows Nuxt conventions