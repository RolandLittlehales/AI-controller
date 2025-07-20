# API Reference Guide

**Quick reference for all API endpoints and WebSocket communication**

## 🌐 REST API Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### Terminal Management

#### Create Terminal
```http
POST /api/terminals
Content-Type: application/json

{
  "name": "My Terminal",
  "workingDirectory": "/home/user",
  "environment": {
    "NODE_ENV": "development"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "terminal_1234567890_abc123",
    "name": "My Terminal",
    "workingDirectory": "/home/user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Get Terminal
```http
GET /api/terminals/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "terminal_1234567890_abc123",
    "name": "My Terminal",
    "status": "active",
    "workingDirectory": "/home/user",
    "lastActivity": "2024-01-01T00:00:00.000Z"
  }
}
```

#### List Terminals
```http
GET /api/terminals
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "terminal_1234567890_abc123",
      "name": "Terminal 1",
      "status": "active"
    },
    {
      "id": "terminal_1234567890_def456", 
      "name": "Terminal 2",
      "status": "idle"
    }
  ],
  "count": 2
}
```

#### Delete Terminal
```http
DELETE /api/terminals/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Terminal deleted successfully"
}
```

### Git Repository Operations (Phase 2B)

#### Validate Repository
```http
POST /api/git/validate
Content-Type: application/json

{
  "path": "/path/to/repository"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "hasWorktree": false,
    "currentBranch": "main",
    "remoteUrl": "https://github.com/user/repo.git"
  }
}
```

#### Get Branches
```http
GET /api/git/branches?path=/path/to/repo
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branches": ["main", "develop", "feature/new-feature"],
    "currentBranch": "main"
  }
}
```

#### Create Worktree
```http
POST /api/git/worktree
Content-Type: application/json

{
  "repositoryPath": "/path/to/repo",
  "branch": "feature/new-feature",
  "worktreePath": "/path/to/worktree"
}
```

## 🔌 WebSocket Communication

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws/terminal');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Message Format
All WebSocket messages follow this structure:
```typescript
interface WebSocketMessage {
  type: string;
  data?: unknown;
  terminalId?: string;
  timestamp?: string;
}
```

### Client → Server Messages

#### Create Terminal
```json
{
  "type": "create-terminal",
  "data": {
    "name": "New Terminal",
    "workingDirectory": "/home/user"
  }
}
```

#### Terminal Input
```json
{
  "type": "terminal-input",
  "terminalId": "terminal_1234567890_abc123",
  "data": "ls -la\n"
}
```

#### Resize Terminal
```json
{
  "type": "resize-terminal", 
  "terminalId": "terminal_1234567890_abc123",
  "data": {
    "cols": 80,
    "rows": 24
  }
}
```

#### Destroy Terminal
```json
{
  "type": "destroy-terminal",
  "terminalId": "terminal_1234567890_abc123"
}
```

### Server → Client Messages

#### Terminal Created
```json
{
  "type": "terminal-created",
  "terminalId": "terminal_1234567890_abc123",
  "data": {
    "id": "terminal_1234567890_abc123",
    "name": "New Terminal",
    "status": "active"
  }
}
```

#### Terminal Output
```json
{
  "type": "terminal-output",
  "terminalId": "terminal_1234567890_abc123", 
  "data": "user@host:~$ ls -la\ntotal 12\ndrwxr-xr-x 3 user user 4096 Jan  1 00:00 .\n"
}
```

#### Terminal Status
```json
{
  "type": "terminal-status",
  "terminalId": "terminal_1234567890_abc123",
  "data": {
    "status": "connected",
    "pid": 12345
  }
}
```

#### Error Messages
```json
{
  "type": "error",
  "message": "Terminal not found",
  "terminalId": "terminal_1234567890_abc123"
}
```

## 🔧 Client SDK Patterns

### HTTP Client Helper
```typescript
// utils/api.ts
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await $fetch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`);
    return response;
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await $fetch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data,
    });
    return response;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await $fetch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return response;
  }
}

export const apiClient = new ApiClient();
```

### WebSocket Client Helper
```typescript
// utils/websocket.ts
interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private messageHandlers = new Map<string, (data: any) => void>();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          logger.info('WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error('Failed to parse WebSocket message', { error });
          }
        };

        this.ws.onclose = () => {
          logger.info('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error', { error });
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.error('WebSocket not connected');
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  private handleMessage(message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    } else {
      logger.warn('No handler for message type', { type: message.type });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        logger.info('Attempting to reconnect WebSocket', { 
          attempt: this.reconnectAttempts 
        });
        this.connect();
      }, this.config.reconnectInterval);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### Terminal API Helper
```typescript
// composables/useTerminalApi.ts
export function useTerminalApi() {
  const createTerminal = async (options: TerminalCreateOptions): Promise<Terminal> => {
    try {
      const response = await apiClient.post<Terminal>('/terminals', options);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create terminal');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Terminal creation failed', { error, options });
      throw error;
    }
  };

  const getTerminal = async (terminalId: string): Promise<Terminal> => {
    try {
      const response = await apiClient.get<Terminal>(`/terminals/${terminalId}`);
      
      if (!response.success || !response.data) {
        throw new Error('Terminal not found');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get terminal', { error, terminalId });
      throw error;
    }
  };

  const deleteTerminal = async (terminalId: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/terminals/${terminalId}`);
      
      if (!response.success) {
        throw new Error('Failed to delete terminal');
      }
    } catch (error) {
      logger.error('Failed to delete terminal', { error, terminalId });
      throw error;
    }
  };

  return {
    createTerminal,
    getTerminal,
    deleteTerminal,
  };
}
```

## 🔍 Error Handling

### Standard Error Responses
```json
{
  "success": false,
  "error": {
    "code": "TERMINAL_NOT_FOUND",
    "message": "Terminal with ID 'xyz' not found",
    "statusCode": 404
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid request data
- `TERMINAL_NOT_FOUND` (404) - Terminal does not exist
- `TERMINAL_CREATION_FAILED` (500) - Failed to create terminal
- `WEBSOCKET_CONNECTION_FAILED` (500) - WebSocket connection error
- `INSUFFICIENT_RESOURCES` (503) - System resource limits exceeded

### Error Handling Pattern
```typescript
try {
  const terminal = await createTerminal(options);
  // Success handling
} catch (error) {
  if (error instanceof Error) {
    // Handle known error types
    switch (error.message) {
      case 'INSUFFICIENT_RESOURCES':
        showResourceLimitError();
        break;
      case 'TERMINAL_CREATION_FAILED':
        showTerminalCreationError();
        break;
      default:
        showGenericError(error.message);
    }
  } else {
    showGenericError('An unknown error occurred');
  }
}
```

---

**🔗 Related Documentation:**
- **Backend Implementation** → `docs/implementation/backend.md`
- **API/Server Standards** → `docs/standards/api-server.md`
- **Testing Implementation** → `docs/implementation/testing.md`