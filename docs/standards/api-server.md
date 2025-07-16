# API/Server Standards

**Version**: 1.0  
**Date**: 2025-07-16  
**Status**: Active

## 1. Introduction

This document establishes server-side development standards for the AI-Controller project, following RFC 2119 conventions. These standards ensure robust, secure, and maintainable server-side code using Nuxt 3's Nitro framework.

### 1.1 RFC 2119 Key Words

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

### 1.2 Scope

This document covers:
- Nitro API route patterns and conventions
- WebSocket handler implementation standards
- Service layer architecture requirements
- Error handling and logging standards
- Type safety requirements for server APIs
- Security considerations and best practices
- External process management (node-pty)

## 2. API Route Standards

### 2.1 File Structure and Naming

API routes **MUST** follow Nitro's file-based routing convention:

```
server/
├── api/
│   ├── health.get.ts          # GET /api/health
│   ├── agents/
│   │   ├── index.get.ts       # GET /api/agents
│   │   ├── index.post.ts      # POST /api/agents
│   │   └── [id].get.ts        # GET /api/agents/:id
│   └── ws/
│       └── terminal.ts        # WebSocket handler
└── services/
    └── terminal.ts            # Service layer
```

### 2.2 HTTP API Route Implementation

#### 2.2.1 Route Handler Structure

All HTTP API routes **MUST** use the `defineEventHandler` function:

```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  // Route implementation
});
```

#### 2.2.2 Request Handling

Routes **MUST** handle requests according to these patterns:

```typescript
// GET routes - query parameters
const query = getQuery(event);
const { page, limit } = query;

// POST/PUT routes - request body
const body = await readBody(event);
const validatedData = validateRequestBody(body);

// Path parameters
const id = getRouterParam(event, 'id');
```

#### 2.2.3 Response Format

All API responses **MUST** follow the `ApiResponse<T>` interface:

```typescript
interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Example implementation:

```typescript
export default defineEventHandler(async (event) => {
  try {
    const data = await someService.getData();
    return {
      success: true,
      data,
      message: "Data retrieved successfully"
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
      data: {
        success: false,
        error: error.message
      }
    });
  }
});
```

### 2.3 Error Handling in Routes

#### 2.3.1 HTTP Error Responses

Routes **MUST** use Nitro's `createError` utility for error responses:

```typescript
// Client errors (400-499)
throw createError({
  statusCode: 400,
  statusMessage: "Bad Request",
  data: {
    success: false,
    error: "Invalid request parameters"
  }
});

// Server errors (500-599)
throw createError({
  statusCode: 500,
  statusMessage: "Internal Server Error",
  data: {
    success: false,
    error: "An unexpected error occurred"
  }
});
```

#### 2.3.2 Error Logging

All errors **MUST** be logged before being returned:

```typescript
import { logger } from "~/utils/logger";

export default defineEventHandler(async (event) => {
  try {
    // Route logic
  } catch (error) {
    logger.error("API route failed", error, {
      route: event.node.req.url,
      method: event.node.req.method,
      timestamp: new Date().toISOString()
    });
    
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error"
    });
  }
});
```

## 3. WebSocket Handler Standards

### 3.1 WebSocket Handler Structure

WebSocket handlers **MUST** use the `defineWebSocketHandler` function:

```typescript
// server/api/ws/terminal.ts
export default defineWebSocketHandler({
  async message(peer: WebSocketPeer, message: string | Buffer) {
    // Message handling logic
  },
  
  async close(peer: WebSocketPeer) {
    // Connection cleanup logic
  }
});
```

### 3.2 Message Processing

#### 3.2.1 Message Format

All WebSocket messages **MUST** conform to the `WebSocketMessage` interface:

```typescript
interface WebSocketMessage {
  type: string;
  agentId?: string;
  terminalId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
```

#### 3.2.2 Message Validation

WebSocket handlers **MUST** validate incoming messages:

```typescript
async message(peer: WebSocketPeer, message: string | Buffer) {
  try {
    const data = JSON.parse(message.toString()) as WebSocketMessage;
    
    // Validate message type
    if (!data.type) {
      peer.send(JSON.stringify({
        type: "error",
        data: { message: "Message type is required" }
      }));
      return;
    }
    
    // Route to appropriate handler
    switch (data.type) {
      case "terminal-create":
        await handleTerminalCreate(peer, data);
        break;
      default:
        peer.send(JSON.stringify({
          type: "error",
          data: { message: `Unknown message type: ${data.type}` }
        }));
    }
  } catch (error) {
    logger.error("WebSocket message processing failed", error);
    peer.send(JSON.stringify({
      type: "error",
      data: { message: "Invalid message format" }
    }));
  }
}
```

### 3.3 Connection Management

#### 3.3.1 Peer Tracking

WebSocket handlers **SHOULD** maintain a registry of active connections:

```typescript
// Store WebSocket peers for each terminal
const terminalPeers = new Map<string, WebSocketPeer>();

// Register peer on connection
terminalPeers.set(terminalId, peer);

// Clean up on disconnection
async close(peer: WebSocketPeer) {
  for (const [terminalId, terminalPeer] of terminalPeers.entries()) {
    if (terminalPeer === peer) {
      await terminalService.destroyTerminal(terminalId);
      terminalPeers.delete(terminalId);
    }
  }
}
```

#### 3.3.2 Resource Cleanup

WebSocket handlers **MUST** implement proper resource cleanup:

```typescript
async close(peer: WebSocketPeer) {
  // Clean up associated resources
  await cleanupPeerResources(peer);
  
  // Log disconnection
  logger.info("WebSocket connection closed", {
    handler: "terminal-ws",
    timestamp: new Date().toISOString()
  });
}
```

## 4. Service Layer Architecture

### 4.1 Service Structure

Services **MUST** follow a consistent class-based pattern:

```typescript
export class ServiceName {
  private resources = new Map<string, Resource>();
  
  async createResource(options: CreateOptions): Promise<Resource> {
    // Implementation
  }
  
  getResource(id: string): Resource | undefined {
    // Implementation
  }
  
  async destroyResource(id: string): Promise<boolean> {
    // Implementation
  }
  
  async cleanup(): Promise<void> {
    // Implementation
  }
}

// Export singleton instance
export const serviceName = new ServiceName();
```

### 4.2 Resource Management

#### 4.2.1 Resource Lifecycle

Services **MUST** implement complete resource lifecycle management:

```typescript
export class TerminalService {
  async createTerminal(options: TerminalOptions): Promise<TerminalInstance> {
    const terminalId = uuidv4();
    const instance = await this.initializeTerminal(terminalId, options);
    
    this.terminals.set(terminalId, instance);
    this.setupEventHandlers(instance);
    
    return instance;
  }
  
  async destroyTerminal(terminalId: string): Promise<boolean> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return false;
    
    try {
      terminal.isActive = false;
      terminal.pty.kill();
      this.terminals.delete(terminalId);
      this.eventHandlers.delete(terminalId);
      return true;
    } catch (error) {
      logger.error("Failed to destroy terminal", error, { terminalId });
      return false;
    }
  }
}
```

#### 4.2.2 Event Handling

Services **SHOULD** implement event-driven architecture:

```typescript
export class TerminalService {
  private eventHandlers = new Map<string, (data: EventData) => void>();
  
  onTerminalEvent(terminalId: string, handler: (data: EventData) => void): void {
    this.eventHandlers.set(terminalId, handler);
  }
  
  offTerminalEvent(terminalId: string): void {
    this.eventHandlers.delete(terminalId);
  }
  
  private emitEvent(terminalId: string, eventData: EventData): void {
    const handler = this.eventHandlers.get(terminalId);
    if (handler) {
      handler(eventData);
    }
  }
}
```

### 4.3 Error Handling in Services

Services **MUST** implement comprehensive error handling:

```typescript
writeToTerminal(terminalId: string, data: string): boolean {
  const terminal = this.terminals.get(terminalId);
  if (!terminal || !terminal.isActive) {
    return false;
  }
  
  try {
    terminal.pty.write(data);
    return true;
  } catch (error) {
    logger.error("Failed to write to terminal", error, {
      terminalId,
      service: "TerminalService"
    });
    return false;
  }
}
```

## 5. Type Safety Requirements

### 5.1 TypeScript Configuration

Server code **MUST** use strict TypeScript configuration:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 5.2 Interface Definitions

#### 5.2.1 Request/Response Types

All API endpoints **MUST** define explicit types:

```typescript
// Request types
interface CreateTerminalRequest {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
}

// Response types
interface CreateTerminalResponse {
  terminalId: string;
  pid: number;
  cols: number;
  rows: number;
  cwd: string;
}

// API handler
export default defineEventHandler(async (event): Promise<ApiResponse<CreateTerminalResponse>> => {
  const body: CreateTerminalRequest = await readBody(event);
  // Implementation
});
```

### 5.3 External Library Types

#### 5.3.1 node-pty Integration

External libraries **MUST** have proper type definitions:

```typescript
import type { IPty } from "node-pty";

interface TerminalInstance {
  id: string;
  pty: IPty;
  metadata: Terminal;
  isActive: boolean;
}
```

### 5.4 WebSocket Type Safety

WebSocket handlers **MUST** use typed message interfaces:

```typescript
interface TypedWebSocketMessage<T = Record<string, unknown>> {
  type: string;
  data: T;
  timestamp: Date;
}

interface TerminalDataMessage extends TypedWebSocketMessage<{
  input?: string;
  output?: string;
}> {
  type: "terminal-data";
  terminalId: string;
}
```

## 6. Logging and Monitoring

### 6.1 Logger Standards

#### 6.1.1 Logger Usage

All server code **MUST** use the centralized logger:

```typescript
import { logger } from "~/utils/logger";

// Log levels
logger.debug("Debug information", { context: "optional" });
logger.info("Informational message", { context: "optional" });
logger.warn("Warning message", { context: "optional" });
logger.error("Error message", error, { context: "optional" });
```

#### 6.1.2 Log Context

Log messages **SHOULD** include relevant context:

```typescript
logger.info("Terminal created", {
  terminalId: terminal.id,
  pid: terminal.pty.pid,
  service: "TerminalService",
  timestamp: new Date().toISOString()
});
```

### 6.2 Error Logging

#### 6.2.1 Error Information

Error logs **MUST** include comprehensive information:

```typescript
try {
  // Risky operation
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "terminal-create",
    terminalId: terminalId,
    options: options,
    service: "TerminalService"
  });
}
```

### 6.3 Performance Monitoring

Services **SHOULD** log performance metrics:

```typescript
const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

logger.info("Operation completed", {
  operation: "terminal-create",
  duration: `${duration}ms`,
  success: true
});
```

## 7. Security Standards

### 7.1 Input Validation

#### 7.1.1 Request Validation

All user inputs **MUST** be validated:

```typescript
function validateTerminalOptions(options: unknown): TerminalOptions {
  if (typeof options !== 'object' || options === null) {
    throw new Error('Invalid options format');
  }
  
  const opts = options as Record<string, unknown>;
  
  return {
    cols: typeof opts.cols === 'number' ? opts.cols : 80,
    rows: typeof opts.rows === 'number' ? opts.rows : 24,
    cwd: typeof opts.cwd === 'string' ? opts.cwd : process.cwd(),
    shell: typeof opts.shell === 'string' ? opts.shell : getDefaultShell()
  };
}
```

#### 7.1.2 Path Sanitization

File paths **MUST** be sanitized:

```typescript
import { resolve, join } from 'path';

function sanitizePath(userPath: string): string {
  // Resolve to absolute path
  const resolvedPath = resolve(userPath);
  
  // Ensure path is within allowed directories
  const allowedPaths = ['/home', '/tmp', '/var/tmp'];
  const isAllowed = allowedPaths.some(allowed => 
    resolvedPath.startsWith(allowed)
  );
  
  if (!isAllowed) {
    throw new Error('Path not allowed');
  }
  
  return resolvedPath;
}
```

### 7.2 Process Security

#### 7.2.1 Environment Variables

Process environment **MUST** be controlled:

```typescript
const createSafeEnvironment = (userEnv: Record<string, string> = {}): Record<string, string> => {
  const safeEnv = {
    ...process.env,
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
  };
  
  // Filter dangerous environment variables
  const dangerousVars = ['PATH', 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH'];
  dangerousVars.forEach(key => {
    if (key in userEnv) {
      logger.warn(`Filtered dangerous environment variable: ${key}`);
      delete userEnv[key];
    }
  });
  
  return { ...safeEnv, ...userEnv };
};
```

#### 7.2.2 Process Limits

External processes **MUST** have resource limits:

```typescript
const pty = spawn(shell, [], {
  name: "xterm-color",
  cols,
  rows,
  cwd: sanitizedCwd,
  env: safeEnvironment,
  // Process limits
  uid: process.getuid?.(),
  gid: process.getgid?.()
});

// Set timeout for process operations
const timeout = setTimeout(() => {
  logger.warn("Process timeout, killing terminal", { terminalId });
  pty.kill('SIGTERM');
}, 30000);
```

### 7.3 WebSocket Security

#### 7.3.1 Connection Validation

WebSocket connections **SHOULD** be validated:

```typescript
export default defineWebSocketHandler({
  async open(peer: WebSocketPeer) {
    // Validate connection origin
    const origin = peer.request?.headers?.origin;
    if (origin && !isAllowedOrigin(origin)) {
      peer.close();
      return;
    }
    
    logger.info("WebSocket connection opened", {
      origin,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### 7.3.2 Rate Limiting

WebSocket messages **SHOULD** be rate-limited:

```typescript
const rateLimiter = new Map<WebSocketPeer, { count: number; reset: number }>();

async message(peer: WebSocketPeer, message: string | Buffer) {
  // Check rate limit
  const now = Date.now();
  const limit = rateLimiter.get(peer);
  
  if (limit && now < limit.reset) {
    if (limit.count >= 100) { // 100 messages per minute
      peer.send(JSON.stringify({
        type: "error",
        data: { message: "Rate limit exceeded" }
      }));
      return;
    }
    limit.count++;
  } else {
    rateLimiter.set(peer, { count: 1, reset: now + 60000 });
  }
  
  // Process message
}
```

## 8. External Process Management

### 8.1 node-pty Integration

#### 8.1.1 Process Creation

Terminal processes **MUST** be created securely:

```typescript
import { spawn } from "node-pty";

const createTerminalProcess = (options: TerminalOptions): IPty => {
  const safeOptions = {
    name: "xterm-color",
    cols: Math.max(1, Math.min(300, options.cols || 80)),
    rows: Math.max(1, Math.min(100, options.rows || 24)),
    cwd: sanitizePath(options.cwd || process.cwd()),
    env: createSafeEnvironment(options.env),
    uid: process.getuid?.(),
    gid: process.getgid?.()
  };
  
  return spawn(options.shell || getDefaultShell(), [], safeOptions);
};
```

#### 8.1.2 Process Monitoring

Terminal processes **MUST** be monitored:

```typescript
private setupTerminalEvents(instance: TerminalInstance): void {
  const { id, pty } = instance;
  
  // Monitor process health
  const healthCheck = setInterval(() => {
    if (!pty.pid) {
      logger.warn("Terminal process died unexpectedly", { terminalId: id });
      clearInterval(healthCheck);
      this.destroyTerminal(id);
    }
  }, 5000);
  
  // Handle process exit
  pty.onExit(({ exitCode, signal }) => {
    clearInterval(healthCheck);
    instance.isActive = false;
    
    logger.info("Terminal process exited", {
      terminalId: id,
      exitCode,
      signal,
      timestamp: new Date().toISOString()
    });
  });
}
```

### 8.2 Resource Management

#### 8.2.1 Process Cleanup

Process cleanup **MUST** be comprehensive:

```typescript
async destroyTerminal(terminalId: string): Promise<boolean> {
  const terminal = this.terminals.get(terminalId);
  if (!terminal) return false;
  
  try {
    terminal.isActive = false;
    
    // Graceful shutdown
    terminal.pty.kill('SIGTERM');
    
    // Force kill after timeout
    setTimeout(() => {
      if (terminal.pty.pid) {
        terminal.pty.kill('SIGKILL');
      }
    }, 5000);
    
    this.terminals.delete(terminalId);
    this.eventHandlers.delete(terminalId);
    
    return true;
  } catch (error) {
    logger.error("Failed to destroy terminal", error, { terminalId });
    return false;
  }
}
```

#### 8.2.2 Global Cleanup

Global cleanup **MUST** be implemented:

```typescript
// Process exit handlers
process.on("exit", () => {
  terminalService.cleanup();
});

process.on("SIGINT", async () => {
  await terminalService.cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await terminalService.cleanup();
  process.exit(0);
});
```

## 9. Testing Standards

### 9.1 Service Testing

Services **MUST** be thoroughly tested:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TerminalService } from '~/server/services/terminal';

describe('TerminalService', () => {
  let service: TerminalService;
  
  beforeEach(() => {
    service = new TerminalService();
  });
  
  afterEach(async () => {
    await service.cleanup();
  });
  
  it('should create terminal with valid options', async () => {
    const terminal = await service.createTerminal({
      cols: 80,
      rows: 24,
      cwd: '/tmp'
    });
    
    expect(terminal.id).toBeDefined();
    expect(terminal.isActive).toBe(true);
    expect(terminal.metadata.cols).toBe(80);
  });
});
```

### 9.2 API Testing

API routes **MUST** be integration tested:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('/api/health', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe('AI Agent Manager');
  });
});
```

### 9.3 WebSocket Testing

WebSocket handlers **SHOULD** be tested:

```typescript
import { describe, it, expect } from 'vitest';
import { WebSocketTestClient } from '~/test/utils/websocket';

describe('WebSocket Terminal Handler', () => {
  it('should handle terminal creation', async () => {
    const client = new WebSocketTestClient();
    await client.connect();
    
    const response = await client.sendAndWait({
      type: 'terminal-create',
      data: { cols: 80, rows: 24 }
    });
    
    expect(response.type).toBe('terminal-created');
    expect(response.terminalId).toBeDefined();
  });
});
```

## 10. Performance Standards

### 10.1 Response Time Requirements

API endpoints **SHOULD** meet performance targets:

- Health checks: < 10ms
- Terminal creation: < 100ms  
- Terminal operations: < 50ms
- WebSocket message processing: < 25ms

### 10.2 Resource Usage

Services **MUST** manage resource usage:

```typescript
// Monitor resource usage
const getResourceUsage = () => {
  const usage = process.memoryUsage();
  const stats = {
    memory: {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external
    },
    terminals: terminalService.getTerminalStats(),
    uptime: process.uptime()
  };
  
  return stats;
};
```

### 10.3 Scalability

Services **SHOULD** be designed for horizontal scaling:

```typescript
// Connection pooling
const connectionPool = new Map<string, Connection>();

// Resource sharing
const sharedResources = new Map<string, SharedResource>();

// Load balancing considerations
const distributeLoad = (request: Request) => {
  // Implementation for load distribution
};
```

## 11. Compliance and Governance

### 11.1 Code Review Requirements

All server code **MUST** pass:

- ESLint with no warnings
- TypeScript compilation with strict mode
- Security vulnerability scanning
- Performance benchmarking
- Integration testing

### 11.2 Documentation Requirements

Server APIs **MUST** be documented:

```typescript
/**
 * Creates a new terminal instance
 * @param options - Terminal configuration options
 * @returns Promise resolving to terminal instance
 * @throws Error if terminal creation fails
 */
async createTerminal(options: TerminalOptions): Promise<TerminalInstance> {
  // Implementation
}
```

### 11.3 Versioning

API versions **MUST** be maintained:

```typescript
// server/api/v1/terminals.post.ts
export default defineEventHandler(async (event) => {
  // V1 implementation
});

// server/api/v2/terminals.post.ts  
export default defineEventHandler(async (event) => {
  // V2 implementation
});
```

## 12. Migration and Deployment

### 12.1 Environment Configuration

Server configuration **MUST** be environment-aware:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    secretKey: process.env.SECRET_KEY,
    
    // Public (exposed to client)
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  }
});
```

### 12.2 Health Checks

Production deployments **MUST** include health checks:

```typescript
// server/api/health.get.ts
export default defineEventHandler(async () => {
  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    service: "AI Agent Manager",
    version: process.env.APP_VERSION || "0.1.0",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: await checkDatabase(),
      filesystem: await checkFilesystem(),
      processes: await checkProcesses()
    }
  };
  
  return health;
});
```

## 13. Conclusion

This document establishes comprehensive standards for server-side development in the AI-Controller project. All developers **MUST** follow these standards to ensure code quality, security, and maintainability.

For questions or clarifications, refer to the project's technical documentation or contact the development team.

---

**Document Control:**
- **Next Review Date**: 2025-10-16
- **Owner**: AI-Controller Development Team
- **Approved By**: Technical Lead
- **Distribution**: All server-side developers