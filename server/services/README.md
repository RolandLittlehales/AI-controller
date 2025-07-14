# Server Services

This folder contains the business logic and core functionality services for the AI-controller application.

## What's here

- **Core business logic** - Services that handle application functionality
- **Data processing** - Terminal management, AI instance coordination
- **Integration services** - External API connections and data transformations
- **Background tasks** - Scheduled jobs, cleanup processes

## Current services

- **Terminal service** (`terminal.ts`) - Manages terminal instances using node-pty
- **Terminal tests** (`terminal.test.ts`) - Comprehensive test suite for terminal functionality

## Why you might work in this folder

- **Adding new features** - Create services for new application capabilities
- **Business logic changes** - Modify existing service functionality
- **Data processing** - Implement algorithms and data transformations
- **Integration work** - Connect with external APIs or databases
- **Performance optimization** - Refactor service logic for better performance
- **Testing** - Add or modify service tests

## Service patterns

- **Single responsibility** - Each service handles one domain area
- **Dependency injection** - Services can depend on other services
- **Error handling** - Proper error boundaries and logging
- **Testability** - Services are designed to be easily testable
- **Type safety** - Full TypeScript coverage with interfaces

## Key considerations

- Services should be **stateless** where possible
- Use **dependency injection** for service composition
- Implement proper **error handling** and logging
- Follow **SOLID principles** for maintainable code
- Write **comprehensive tests** for all service functionality

## Testing

- Use **Vitest** for testing framework
- Focus on **integration tests** over unit tests
- Mock only **external dependencies** (APIs, databases)
- Test **error scenarios** and edge cases