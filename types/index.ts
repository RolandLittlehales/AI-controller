// Core types for the AI Agent Manager

export interface Agent {
  id: string
  name: string
  type: 'claude-code' | 'cursor' | 'generic' | 'ai-manager'
  status: AgentStatus
  workingDirectory: string
  worktreeId: string
  terminalId: string
  createdAt: Date
  updatedAt: Date
  config: AgentConfig
}

export interface AgentConfig {
  command: string
  args: string[]
  env: Record<string, string>
  cwd: string
  shell: string
  autoRestart: boolean
  maxRestarts: number
  timeout: number
}

export type AgentStatus = 
  | 'idle'
  | 'running'
  | 'stopped'
  | 'error'
  | 'restarting'
  | 'initializing'

export interface Terminal {
  id: string
  agentId: string
  pid: number
  cols: number
  rows: number
  cwd: string
  shell: string
  createdAt: Date
  isActive: boolean
}

export interface Worktree {
  id: string
  agentId: string
  path: string
  branch: string
  repository: string
  isMain: boolean
  createdAt: Date
  lastUsed: Date
}

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  modified: string[]
  staged: string[]
  untracked: string[]
  conflicted: string[]
  isClean: boolean
}

export interface WebSocketMessage {
  type: 'terminal-data' | 'terminal-resize' | 'agent-status' | 'system-notification' | 'terminal-create' | 'terminal-created' | 'terminal-destroy' | 'terminal-destroyed' | 'terminal-exit' | 'error'
  agentId?: string
  terminalId?: string
  data: Record<string, unknown>
  timestamp: Date
}

export interface TerminalMessage extends WebSocketMessage {
  type: 'terminal-data'
  data: {
    output?: string
    input?: string
  }
}

export interface ResizeMessage extends WebSocketMessage {
  type: 'terminal-resize'
  data: {
    cols: number
    rows: number
  }
}

export interface AgentStatusMessage extends WebSocketMessage {
  type: 'agent-status'
  data: {
    status: AgentStatus
    message?: string
  }
}

export interface SystemNotification extends WebSocketMessage {
  type: 'system-notification'
  data: {
    level: 'info' | 'warning' | 'error'
    message: string
    details?: Record<string, unknown>
  }
}

// API Response types
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Store types
export interface AgentStore {
  agents: Agent[]
  activeAgent: Agent | null
  isLoading: boolean
  error: string | null
}

export interface TerminalStore {
  terminals: Terminal[]
  activeTerminal: Terminal | null
  isConnected: boolean
  error: string | null
}

export interface WorktreeStore {
  worktrees: Worktree[]
  activeWorktree: Worktree | null
  gitStatus: Record<string, GitStatus>
  isLoading: boolean
  error: string | null
}

// Configuration types
export interface AppConfig {
  maxAgents: number
  defaultShell: string
  defaultWorkspace: string
  terminalDefaults: {
    cols: number
    rows: number
    fontSize: number
    fontFamily: string
  }
  gitDefaults: {
    defaultBranch: string
    autoCommit: boolean
    autoFetch: boolean
  }
}

// WebSocket types
export interface WebSocketPeer {
  send: (data: string) => void
  close: () => void
}

// Utility types
export type CreateAgentInput = Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'terminalId' | 'worktreeId'>
export type UpdateAgentInput = Partial<Pick<Agent, 'name' | 'config' | 'status'>>
export type CreateWorktreeInput = Omit<Worktree, 'id' | 'createdAt' | 'lastUsed'>

// Event types
export interface AgentEvent {
  type: 'created' | 'updated' | 'deleted' | 'status_changed'
  agentId: string
  timestamp: Date
  data: Record<string, unknown>
}

export interface TerminalEvent {
  type: 'created' | 'destroyed' | 'data' | 'resize'
  terminalId: string
  timestamp: Date
  data: Record<string, unknown>
}

export interface WorktreeEvent {
  type: 'created' | 'deleted' | 'switched' | 'status_changed'
  worktreeId: string
  timestamp: Date
  data: Record<string, unknown>
}