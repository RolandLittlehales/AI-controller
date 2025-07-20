# Backend Implementation Guide

**Technical reference for Nitro API development and server-side patterns**

## API Development Patterns

### Nitro Route Structure
```typescript
// server/api/terminal/create.post.ts
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validate input
    const validatedData = await validateTerminalCreationRequest(body);
    
    // Business logic
    const terminal = await createTerminal(validatedData);
    
    // Return structured response
    return {
      success: true,
      data: terminal,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Structured error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Terminal creation failed', { error, body });
    
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    });
  }
});
```

### Request Validation Patterns
```typescript
// Input validation with explicit types
interface TerminalCreationRequest {
  name: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
}

function validateTerminalCreationRequest(body: unknown): TerminalCreationRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const request = body as Record<string, unknown>;
  
  if (typeof request.name !== 'string' || request.name.trim().length === 0) {
    throw new Error('Terminal name is required');
  }
  
  return {
    name: request.name.trim(),
    workingDirectory: typeof request.workingDirectory === 'string' 
      ? request.workingDirectory 
      : undefined,
    environment: isValidEnvironment(request.environment) 
      ? request.environment 
      : undefined,
  };
}

function isValidEnvironment(env: unknown): env is Record<string, string> {
  return env != null && 
         typeof env === 'object' && 
         Object.values(env).every(val => typeof val === 'string');
}
```

## WebSocket Implementation

### WebSocket Handler Structure
```typescript
// server/api/ws/terminal.ts
export default defineWebSocketHandler({
  open(peer) {
    logger.info('WebSocket connection opened', { peerId: peer.id });
  },

  async message(peer, message) {
    try {
      const data = JSON.parse(message.text());
      
      switch (data.type) {
        case 'create-terminal':
          await handleCreateTerminal(peer, data);
          break;
        case 'terminal-input':
          await handleTerminalInput(peer, data);
          break;
        case 'resize-terminal':
          await handleResizeTerminal(peer, data);
          break;
        default:
          logger.warn('Unknown WebSocket message type', { type: data.type });
      }
    } catch (error) {
      logger.error('WebSocket message handling failed', { error, message });
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Message processing failed',
      }));
    }
  },

  close(peer) {
    logger.info('WebSocket connection closed', { peerId: peer.id });
    // Cleanup logic here
  },

  error(peer, error) {
    logger.error('WebSocket error', { error, peerId: peer.id });
  },
});
```

### WebSocket Message Patterns
```typescript
// Structured message types
interface WebSocketMessage {
  type: string;
  data?: unknown;
  terminalId?: string;
}

interface CreateTerminalMessage extends WebSocketMessage {
  type: 'create-terminal';
  data: {
    name: string;
    workingDirectory?: string;
  };
}

interface TerminalInputMessage extends WebSocketMessage {
  type: 'terminal-input';
  terminalId: string;
  data: string;
}

// Message handlers with proper typing
async function handleCreateTerminal(peer: Peer, message: CreateTerminalMessage): Promise<void> {
  try {
    const terminal = await terminalService.create(message.data);
    
    peer.send(JSON.stringify({
      type: 'terminal-created',
      terminalId: terminal.id,
      data: terminal,
    }));
    
    logger.info('Terminal created via WebSocket', { terminalId: terminal.id });
  } catch (error) {
    logger.error('Failed to create terminal', { error, data: message.data });
    
    peer.send(JSON.stringify({
      type: 'error',
      message: 'Failed to create terminal',
    }));
  }
}
```

## Service Layer Patterns

### Service Structure
```typescript
// server/services/terminal.ts
import { spawn } from 'node-pty';
import type { IPty } from 'node-pty';

interface Terminal {
  id: string;
  name: string;
  pty: IPty;
  workingDirectory: string;
  isActive: boolean;
  createdAt: Date;
}

class TerminalService {
  private terminals = new Map<string, Terminal>();

  async createTerminal(options: TerminalCreationOptions): Promise<Terminal> {
    try {
      const id = `terminal_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const pty = spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd: options.workingDirectory || process.cwd(),
        env: { ...process.env, ...options.environment },
      });

      const terminal: Terminal = {
        id,
        name: options.name,
        pty,
        workingDirectory: options.workingDirectory || process.cwd(),
        isActive: true,
        createdAt: new Date(),
      };

      this.terminals.set(id, terminal);
      
      logger.info('Terminal created', { 
        terminalId: id, 
        workingDirectory: terminal.workingDirectory 
      });
      
      return terminal;
    } catch (error) {
      logger.error('Failed to create terminal', { error, options });
      throw new Error('Terminal creation failed');
    }
  }

  getTerminal(id: string): Terminal | undefined {
    return this.terminals.get(id);
  }

  async destroyTerminal(id: string): Promise<void> {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      logger.warn('Attempted to destroy non-existent terminal', { terminalId: id });
      return;
    }

    try {
      terminal.pty.kill();
      this.terminals.delete(id);
      
      logger.info('Terminal destroyed', { terminalId: id });
    } catch (error) {
      logger.error('Failed to destroy terminal', { error, terminalId: id });
      throw error;
    }
  }
}

export const terminalService = new TerminalService();
```

### Error Handling in Services
```typescript
// Structured error handling with context
class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Usage in service methods
async function performOperation(data: unknown): Promise<Result> {
  try {
    // Service logic here
    return result;
  } catch (error) {
    // Enhanced error context
    throw new ServiceError(
      'Operation failed',
      'OPERATION_FAILED',
      { originalError: error, inputData: data }
    );
  }
}
```

## Database & File System Operations

### File System Operations with memfs in Tests
```typescript
// Production file operations
import { promises as fs } from 'fs';
import { join } from 'path';

class SettingsFileService {
  private readonly settingsDir = join(process.cwd(), 'settings');

  async loadSettings<T>(category: string): Promise<T> {
    try {
      const filePath = join(this.settingsDir, `${category}-settings.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const settings = JSON.parse(content) as T;
      
      logger.info('Settings loaded', { category, filePath });
      return settings;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.info('Settings file not found, loading defaults', { category });
        return this.loadDefaultSettings<T>(category);
      }
      
      logger.error('Failed to load settings', { error, category });
      throw error;
    }
  }

  async saveSettings<T>(category: string, settings: T): Promise<void> {
    try {
      await this.ensureSettingsDirectory();
      
      const filePath = join(this.settingsDir, `${category}-settings.json`);
      const content = JSON.stringify(settings, null, 2);
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      logger.info('Settings saved', { category, filePath });
    } catch (error) {
      logger.error('Failed to save settings', { error, category });
      throw error;
    }
  }

  private async ensureSettingsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.settingsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create settings directory', { error });
      throw error;
    }
  }
}
```

### Testing File Operations with memfs
```typescript
// test setup for file system operations
import { vol } from 'memfs';

beforeEach(() => {
  vol.reset(); // Reset in-memory filesystem
});

afterEach(() => {
  vol.reset(); // Clean up after each test
});

it('should save and load settings correctly', async () => {
  const service = new SettingsFileService();
  const testSettings = { theme: 'dark', language: 'en' };
  
  await service.saveSettings('ui', testSettings);
  const loadedSettings = await service.loadSettings('ui');
  
  expect(loadedSettings).toEqual(testSettings);
});
```

## Authentication & Security

### Input Sanitization
```typescript
import validator from 'validator';

function sanitizeTerminalName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Terminal name must be a non-empty string');
  }
  
  // Remove dangerous characters
  const sanitized = name
    .trim()
    .replace(/[<>"/\\|?*]/g, '') // Remove file system unsafe characters
    .substring(0, 100); // Limit length
  
  if (sanitized.length === 0) {
    throw new Error('Terminal name contains only invalid characters');
  }
  
  return sanitized;
}

function sanitizeWorkingDirectory(path: string): string {
  if (!path || typeof path !== 'string') {
    return process.cwd();
  }
  
  // Resolve path and prevent directory traversal
  const resolved = require('path').resolve(path);
  
  // Ensure path is within allowed directories
  const allowedPaths = [process.cwd(), '/tmp', '/home'];
  const isAllowed = allowedPaths.some(allowed => 
    resolved.startsWith(require('path').resolve(allowed))
  );
  
  if (!isAllowed) {
    logger.warn('Attempted access to restricted directory', { path: resolved });
    return process.cwd();
  }
  
  return resolved;
}
```

### Environment Variable Validation
```typescript
function validateEnvironmentVariables(env: Record<string, string>): Record<string, string> {
  const validated: Record<string, string> = {};
  const blacklist = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'];
  
  for (const [key, value] of Object.entries(env)) {
    // Check for sensitive data
    if (blacklist.some(blocked => key.toUpperCase().includes(blocked))) {
      logger.warn('Blocked sensitive environment variable', { key });
      continue;
    }
    
    // Validate key format
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      logger.warn('Invalid environment variable name', { key });
      continue;
    }
    
    // Sanitize value
    validated[key] = typeof value === 'string' ? value.trim() : String(value);
  }
  
  return validated;
}
```

## Performance & Monitoring

### Request Logging & Metrics
```typescript
export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const method = getMethod(event);
  const url = getRequestURL(event);
  
  logger.info('Request started', { method, url });
  
  try {
    const result = await handleRequest(event);
    
    const duration = Date.now() - startTime;
    logger.info('Request completed', { method, url, duration, statusCode: 200 });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : 500;
    
    logger.error('Request failed', { 
      method, 
      url, 
      duration, 
      statusCode, 
      error 
    });
    
    throw error;
  }
});
```

### Memory Management
```typescript
// Cleanup patterns for services
class TerminalService {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodic cleanup of inactive terminals
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveTerminals();
    }, 60000); // Every minute
  }

  private cleanupInactiveTerminals(): void {
    const now = Date.now();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [id, terminal] of this.terminals.entries()) {
      const inactiveTime = now - terminal.lastActivity.getTime();
      
      if (inactiveTime > maxInactiveTime) {
        logger.info('Cleaning up inactive terminal', { terminalId: id });
        this.destroyTerminal(id);
      }
    }
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
    
    // Clean up all terminals
    for (const id of this.terminals.keys()) {
      this.destroyTerminal(id);
    }
  }
}
```

## Testing Backend Services

### Service Testing Patterns
```typescript
describe('TerminalService', () => {
  let service: TerminalService;

  beforeEach(() => {
    service = new TerminalService();
  });

  afterEach(() => {
    service.shutdown();
  });

  it('should create terminal with valid options', async () => {
    const options = {
      name: 'Test Terminal',
      workingDirectory: '/tmp',
    };

    const terminal = await service.createTerminal(options);

    expect(terminal.id).toBeDefined();
    expect(terminal.name).toBe('Test Terminal');
    expect(terminal.workingDirectory).toBe('/tmp');
    expect(terminal.isActive).toBe(true);
  });

  it('should handle terminal creation errors', async () => {
    const invalidOptions = {
      name: '',
      workingDirectory: '/invalid/path',
    };

    await expect(service.createTerminal(invalidOptions))
      .rejects.toThrow('Terminal creation failed');
  });
});
```

### API Endpoint Testing
```typescript
describe('/api/terminal/create', () => {
  it('should create terminal successfully', async () => {
    const response = await $fetch('/api/terminal/create', {
      method: 'POST',
      body: {
        name: 'Test Terminal',
        workingDirectory: '/tmp',
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.id).toBeDefined();
    expect(response.data.name).toBe('Test Terminal');
  });

  it('should validate input and return error', async () => {
    await expect($fetch('/api/terminal/create', {
      method: 'POST',
      body: { name: '' },
    })).rejects.toThrow('Terminal name is required');
  });
});
```

---

**🔗 Related Documentation:**
- **API/Server Standards** → `docs/standards/api-server.md`
- **TypeScript Standards** → `docs/standards/typescript.md`
- **Testing Standards** → `docs/standards/testing.md`