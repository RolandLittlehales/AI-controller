# Multi-Terminal Implementation Solutions Analysis

## Executive Summary

Four distinct architectural approaches have been analyzed for implementing multiple independent terminals in the AI-controller web application. Each solution addresses the core requirements but with different trade-offs in complexity, performance, isolation, and resource usage.

## Requirements Recap

- Multiple independent terminals with no cross-interaction
- Single active terminal (only one receives input at a time)
- Sidebar display with scrollable terminal list and small previews
- Create/delete terminal functionality with friendly names
- Memory leak prevention for long-lived terminals
- Output observation for future AI trigger logic
- Backend connection isolation per terminal

---

## Solution 1: Multiple WebSocket Connections
**Approach**: Each terminal has its own dedicated WebSocket connection

<details>
<summary><strong>Detailed Implementation</strong></summary>

### Architecture Overview
- **One WebSocket per terminal** for complete independence
- **Centralized terminal management** via Pinia store
- **Component-based UI** with sidebar and main display area
- **Output observation system** for trigger logic

### Key Components
1. **Terminal Manager Store** (`stores/terminalManager.ts`)
   - Manages all terminal instances and their state
   - Tracks active terminal and switching logic
   - Handles terminal creation/deletion lifecycle

2. **Multi-Terminal WebSocket Composable** (`composables/useMultiTerminalWebSocket.ts`)
   - Individual WebSocket management per terminal
   - Output observation hooks for trigger system
   - Connection state management and cleanup

3. **UI Components**
   - `TerminalSidebar.vue`: Terminal list with previews and controls
   - `MultiTerminalDisplay.vue`: Main container with active terminal
   - `TerminalInstance.vue`: Individual terminal with xterm.js

### Backend Changes
```typescript
// Enhanced WebSocket handler supporting multiple connections
const terminalConnections = new Map<string, {
  peer: WebSocketPeer
  terminalId: string
  createdAt: Date
  lastActivity: Date
}>()

// Individual terminal lifecycle management
// Stale connection cleanup
// Per-terminal event handling
```

### Memory Management
- WebSocket cleanup on component unmount
- xterm.js instance disposal
- Periodic stale connection cleanup
- Global cleanup on page unload

</details>

### ✅ Pros
- **True Independence**: Each terminal completely isolated
- **Simple Protocol**: No message routing complexity
- **Natural Scaling**: Linear resource usage per terminal
- **Easy Debug/Monitor**: Each connection traceable independently
- **Robust Failure Handling**: One terminal failure doesn't affect others
- **Direct Output Observation**: Native access to terminal streams

### ❌ Cons
- **Higher Resource Usage**: N WebSocket connections for N terminals
- **Connection Overhead**: TCP connection per terminal
- **Backend Complexity**: Managing multiple connections per client
- **Potential Rate Limiting**: Multiple connections might hit server limits

### 📊 Resource Profile
- **Memory**: High (each connection has buffers)
- **CPU**: Medium (connection management overhead)
- **Network**: High (multiple TCP connections)
- **Complexity**: Medium

---

## Solution 2: Shared Connection with Message Routing
**Approach**: Single WebSocket with message multiplexing and routing

<details>
<summary><strong>Detailed Implementation</strong></summary>

### Architecture Overview
- **Single WebSocket connection** with session-based routing
- **Message protocol** for terminal identification and isolation
- **Efficient resource usage** with shared infrastructure
- **Terminal session management** on both client and server

### Enhanced Protocol Design
```typescript
interface TerminalMessage {
  type: 'create' | 'data' | 'resize' | 'destroy' | 'status'
  sessionId: string  // Frontend terminal ID
  terminalId?: string  // Backend pty ID
  data: any
  timestamp: Date
}

// Session tracking on server
class TerminalSessionManager {
  private sessions = new Map<string, {
    ptyId: string
    metadata: TerminalMetadata
    lastActivity: Date
    bufferHistory: string[]
  }>()
}
```

### Message Routing System
```typescript
// Client-side message routing
class TerminalMessageRouter {
  private routingTable = new Map<string, TerminalHandler>()
  
  routeMessage(message: TerminalMessage) {
    const handler = this.routingTable.get(message.sessionId)
    if (handler) {
      handler.processMessage(message)
    }
  }
}

// Server-side multiplexing
class TerminalMultiplexer {
  private sessions = new Map<string, PtyProcess>()
  
  handleMessage(peer: WebSocketPeer, message: TerminalMessage) {
    const session = this.sessions.get(message.sessionId)
    // Route to appropriate pty process
  }
}
```

### Terminal Management
```typescript
// Shared connection with session isolation
export function useSharedTerminalConnection() {
  const sessions = ref(new Map<string, TerminalSession>())
  const router = new TerminalMessageRouter()
  
  const createSession = (sessionId: string) => {
    const session = new TerminalSession(sessionId)
    sessions.value.set(sessionId, session)
    router.registerHandler(sessionId, session)
    
    // Send create message
    sendMessage({
      type: 'create',
      sessionId,
      data: { cols: 80, rows: 24 }
    })
  }
}
```

### Output Monitoring Integration
```typescript
// Central output processing with session routing
class TerminalOutputMonitor {
  private triggers = new Map<string, OutputTrigger[]>()
  
  processSessionOutput(sessionId: string, output: string) {
    const sessionTriggers = this.triggers.get(sessionId) || []
    sessionTriggers.forEach(trigger => {
      if (trigger.pattern.test(output)) {
        trigger.callback(output, sessionId)
      }
    })
  }
}
```

</details>

### ✅ Pros
- **Resource Efficient**: 90% reduction in connection overhead
- **Scalable**: Can handle many terminals efficiently
- **Centralized Management**: Single connection state to manage
- **Lower Latency**: No connection establishment per terminal
- **Server-Friendly**: Reduced connection count
- **Message Queuing**: Can implement reliable delivery

### ❌ Cons
- **Protocol Complexity**: Message routing and session management
- **Single Point of Failure**: One connection failure affects all terminals
- **Message Ordering**: Need to handle out-of-order delivery
- **Debugging Complexity**: Harder to trace individual terminal issues
- **Head-of-Line Blocking**: One slow terminal can affect others

### 📊 Resource Profile
- **Memory**: Low (shared connection infrastructure)
- **CPU**: Medium (message routing overhead)
- **Network**: Low (single TCP connection)
- **Complexity**: High

---

## Solution 3: Iframe Isolation
**Approach**: Each terminal runs in its own iframe for complete process isolation

<details>
<summary><strong>Detailed Implementation</strong></summary>

### Architecture Overview
- **Complete iframe isolation** for maximum security
- **PostMessage communication** for cross-frame coordination
- **Separate terminal pages** loaded in each iframe
- **Preview generation** without full terminal rendering

### Core Components
```typescript
// Main terminal manager component
export default defineComponent({
  setup() {
    const iframes = ref(new Map<string, HTMLIFrameElement>())
    const terminals = ref(new Map<string, TerminalInfo>())
    
    const createTerminal = async (name?: string) => {
      const terminalId = generateId()
      const iframe = createTerminalIframe(terminalId)
      
      iframes.value.set(terminalId, iframe)
      terminals.value.set(terminalId, {
        id: terminalId,
        name: name || `Terminal ${terminals.value.size + 1}`,
        status: 'loading',
        iframe
      })
      
      return terminalId
    }
  }
})

// Terminal iframe page (/terminal-frame/:id)
export default defineComponent({
  setup() {
    const { params } = useRoute()
    const terminalId = params.id as string
    
    // Initialize xterm and WebSocket in iframe context
    const terminal = useTerminal()
    const connection = useWebSocket()
    
    // Setup parent communication
    const communicateWithParent = (data: any) => {
      parent.postMessage({
        type: 'terminal-event',
        terminalId,
        data
      }, '*')
    }
  }
})
```

### Cross-Frame Communication
```typescript
// Parent frame message handling
const handleIframeMessage = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  
  const { type, terminalId, data } = event.data
  
  switch (type) {
    case 'terminal-output':
      updateTerminalPreview(terminalId, data.output)
      processOutputTriggers(terminalId, data.output)
      break
      
    case 'terminal-status':
      updateTerminalStatus(terminalId, data.status)
      break
      
    case 'terminal-ready':
      markTerminalReady(terminalId)
      break
  }
}

// Iframe to parent communication
const sendToParent = (type: string, data: any) => {
  parent.postMessage({
    type,
    terminalId: currentTerminalId,
    data
  }, window.location.origin)
}
```

### Security & Sandboxing
```html
<!-- Secure iframe with restricted permissions -->
<iframe
  :src="`/terminal-frame/${terminal.id}`"
  :sandbox="[
    'allow-scripts',
    'allow-same-origin',
    'allow-forms'
  ].join(' ')"
  referrerpolicy="same-origin"
  loading="lazy"
/>
```

### Preview Generation
```typescript
// Efficient preview without full rendering
class TerminalPreviewGenerator {
  generatePreview(terminalId: string): TerminalPreview {
    const iframe = getTerminalIframe(terminalId)
    
    // Request preview data from iframe
    iframe.contentWindow?.postMessage({
      type: 'request-preview'
    }, '*')
    
    // Return cached preview while waiting for update
    return this.cachedPreviews.get(terminalId) || {
      lines: [],
      status: 'loading'
    }
  }
}
```

</details>

### ✅ Pros
- **Maximum Isolation**: Complete process separation
- **Security**: Sandboxed execution environment
- **True Independence**: One iframe crash doesn't affect others
- **Browser-Native**: Leverages browser's built-in isolation
- **Memory Protection**: OS-level process boundaries
- **Easy Debugging**: Each terminal in separate DevTools context

### ❌ Cons
- **Resource Heavy**: Full iframe overhead per terminal
- **Communication Complexity**: PostMessage coordination required
- **Preview Challenges**: Cross-frame data access limitations
- **Performance Impact**: Multiple iframe rendering contexts
- **Browser Limits**: Maximum iframe count restrictions
- **State Synchronization**: Complex cross-frame state management

### 📊 Resource Profile
- **Memory**: Very High (full iframe context per terminal)
- **CPU**: High (multiple rendering contexts)
- **Network**: Medium (individual connections per iframe)
- **Complexity**: High

---

## Solution 4: Web Worker Architecture
**Approach**: Web Workers handle terminal processing with UI thread coordination

<details>
<summary><strong>Detailed Implementation</strong></summary>

### Architecture Overview
- **Dedicated Web Worker per terminal** for processing isolation
- **Worker-to-UI communication** via message passing
- **Terminal logic in workers** with UI rendering in main thread
- **Shared worker pools** for resource efficiency

### Worker Architecture
```typescript
// Terminal Worker (public/workers/terminal-worker.js)
class TerminalWorker {
  constructor() {
    this.websocket = null
    this.outputBuffer = []
    this.triggers = new Map()
    
    self.onmessage = this.handleMessage.bind(this)
  }
  
  async connectTerminal(config) {
    this.websocket = new WebSocket(config.wsUrl)
    
    this.websocket.onmessage = (event) => {
      const output = event.data
      this.outputBuffer.push(output)
      
      // Process triggers in worker
      this.processTriggers(output)
      
      // Send to UI thread
      self.postMessage({
        type: 'terminal-output',
        data: { output }
      })
    }
  }
  
  processTriggers(output) {
    for (const [id, trigger] of this.triggers) {
      if (trigger.pattern.test(output)) {
        self.postMessage({
          type: 'trigger-match',
          data: { triggerId: id, match: output }
        })
      }
    }
  }
}

new TerminalWorker()
```

### Terminal Manager with Workers
```typescript
// Main thread terminal management
export function useTerminalManager() {
  const workers = ref(new Map<string, Worker>())
  const terminals = ref(new Map<string, TerminalState>())
  
  const createTerminal = async (config?: TerminalConfig) => {
    const terminalId = generateId()
    
    // Create dedicated worker
    const worker = new Worker('/workers/terminal-worker.js')
    workers.value.set(terminalId, worker)
    
    // Setup worker communication
    worker.onmessage = (event) => {
      handleWorkerMessage(terminalId, event.data)
    }
    
    // Initialize terminal in worker
    worker.postMessage({
      type: 'init-terminal',
      config: {
        terminalId,
        wsUrl: getWebSocketUrl(),
        ...config
      }
    })
    
    // Create UI state
    terminals.value.set(terminalId, {
      id: terminalId,
      name: config?.name || `Terminal ${terminals.value.size + 1}`,
      status: 'initializing',
      worker,
      outputBuffer: []
    })
    
    return terminalId
  }
  
  const destroyTerminal = async (terminalId: string) => {
    const worker = workers.value.get(terminalId)
    const terminal = terminals.value.get(terminalId)
    
    if (worker) {
      // Graceful worker shutdown
      worker.postMessage({ type: 'disconnect' })
      worker.terminate()
      workers.value.delete(terminalId)
    }
    
    if (terminal) {
      terminals.value.delete(terminalId)
    }
  }
}
```

### Output Monitoring in Workers
```typescript
// Worker-side output monitoring
class WorkerOutputMonitor {
  constructor() {
    this.triggers = new Map()
    this.outputHistory = []
  }
  
  registerTrigger(id, pattern, callback) {
    this.triggers.set(id, { pattern, callback })
  }
  
  processOutput(output) {
    this.outputHistory.push(output)
    
    // Keep history limited
    if (this.outputHistory.length > 1000) {
      this.outputHistory = this.outputHistory.slice(-500)
    }
    
    // Process triggers
    for (const [id, trigger] of this.triggers) {
      if (trigger.pattern.test(output)) {
        // Send trigger match to main thread
        self.postMessage({
          type: 'trigger-match',
          data: {
            triggerId: id,
            terminalId: this.terminalId,
            match: output,
            timestamp: new Date()
          }
        })
      }
    }
  }
}
```

### CPU Core Management & Resource Limits
```typescript
// System resource detection and management
export function useSystemResources() {
  const systemInfo = ref({
    totalCores: 0,
    reservedCores: 0,
    availableCores: 0,
    maxTerminals: 0,
    recommendedMaxTerminals: 0
  })
  
  const detectSystemCapability = () => {
    const totalCores = navigator.hardwareConcurrency || 4
    
    // Reserve 25% of cores (minimum 2) for system operations
    const reservedCores = Math.max(2, Math.ceil(totalCores * 0.25))
    const availableCores = totalCores - reservedCores
    const maxTerminals = Math.min(availableCores, 20) // Cap at 20 for sanity
    
    systemInfo.value = {
      totalCores,
      reservedCores,
      availableCores,
      maxTerminals,
      recommendedMaxTerminals: Math.min(maxTerminals, 10) // Conservative default
    }
    
    return systemInfo.value
  }
  
  const canCreateTerminal = (currentTerminalCount: number): boolean => {
    return currentTerminalCount < systemInfo.value.maxTerminals
  }
  
  const getResourceUsagePercentage = (currentTerminalCount: number): number => {
    return Math.round((currentTerminalCount / systemInfo.value.maxTerminals) * 100)
  }
  
  return {
    systemInfo: readonly(systemInfo),
    detectSystemCapability,
    canCreateTerminal,
    getResourceUsagePercentage
  }
}

// Enhanced terminal manager with CPU core limits
export function useTerminalManager() {
  const workers = ref(new Map<string, Worker>())
  const terminals = ref(new Map<string, TerminalState>())
  const systemResources = useSystemResources()
  
  // Initialize system detection
  onMounted(() => {
    systemResources.detectSystemCapability()
  })
  
  const createTerminal = async (config?: TerminalConfig) => {
    const currentCount = terminals.value.size
    
    // Check if we can create another terminal
    if (!systemResources.canCreateTerminal(currentCount)) {
      throw new Error(`Cannot create terminal: Maximum limit of ${systemResources.systemInfo.value.maxTerminals} terminals reached`)
    }
    
    const terminalId = generateId()
    
    // Create dedicated worker
    const worker = new Worker('/workers/terminal-worker.js')
    workers.value.set(terminalId, worker)
    
    // Setup worker communication with resource monitoring
    worker.onmessage = (event) => {
      handleWorkerMessage(terminalId, event.data)
    }
    
    // Initialize terminal in worker
    worker.postMessage({
      type: 'init-terminal',
      config: {
        terminalId,
        wsUrl: getWebSocketUrl(),
        cpuCore: currentCount, // Suggest which core to prefer
        ...config
      }
    })
    
    // Create UI state
    terminals.value.set(terminalId, {
      id: terminalId,
      name: config?.name || `Terminal ${terminals.value.size + 1}`,
      status: 'initializing',
      worker,
      outputBuffer: [],
      cpuUsage: 0,
      memoryUsage: 0,
      createdAt: new Date(),
      lastActivity: new Date()
    })
    
    return terminalId
  }
  
  // Computed values for UI
  const resourceStats = computed(() => ({
    activeTerminals: terminals.value.size,
    maxTerminals: systemResources.systemInfo.value.maxTerminals,
    totalCores: systemResources.systemInfo.value.totalCores,
    usagePercentage: systemResources.getResourceUsagePercentage(terminals.value.size),
    canCreateMore: systemResources.canCreateTerminal(terminals.value.size)
  }))
  
  return {
    terminals: readonly(terminals),
    workers: readonly(workers),
    resourceStats,
    createTerminal,
    destroyTerminal,
    systemResources
  }
}
```

### Resource Monitor UI Component
```vue
<!-- components/terminal/ResourceMonitor.vue -->
<template>
  <div class="resource-monitor">
    <div class="resource-header">
      <h4 class="resource-title">System Resources</h4>
      <div class="resource-indicator" :class="getIndicatorClass()">
        {{ resourceStats.activeTerminals }}/{{ resourceStats.maxTerminals }}
      </div>
    </div>
    
    <div class="resource-details">
      <div class="resource-row">
        <span class="resource-label">Active Terminals:</span>
        <span class="resource-value">{{ resourceStats.activeTerminals }}</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Available Cores:</span>
        <span class="resource-value">{{ resourceStats.maxTerminals }}</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Total CPU Cores:</span>
        <span class="resource-value">{{ resourceStats.totalCores }}</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Core Utilization:</span>
        <span class="resource-value">{{ resourceStats.usagePercentage }}%</span>
      </div>
    </div>
    
    <!-- Visual progress bar -->
    <div class="resource-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :class="getProgressClass()"
          :style="{ width: `${resourceStats.usagePercentage}%` }"
        />
      </div>
      <span class="progress-text">
        {{ resourceStats.usagePercentage }}% of available cores
      </span>
    </div>
    
    <!-- Warning when approaching limits -->
    <div v-if="resourceStats.usagePercentage > 80" class="resource-warning">
      ⚠️ Approaching core limit - consider closing unused terminals
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTerminalManager } from '~/composables/useTerminalManager'

const terminalManager = useTerminalManager()
const resourceStats = computed(() => terminalManager.resourceStats.value)

const getIndicatorClass = () => {
  const usage = resourceStats.value.usagePercentage
  if (usage < 50) return 'indicator-low'
  if (usage < 80) return 'indicator-medium'
  return 'indicator-high'
}

const getProgressClass = () => {
  const usage = resourceStats.value.usagePercentage
  if (usage < 50) return 'progress-safe'
  if (usage < 80) return 'progress-warning'
  return 'progress-danger'
}
</script>

<style scoped>
.resource-monitor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.resource-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.resource-indicator {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.indicator-low {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.indicator-medium {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.indicator-high {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.resource-details {
  margin-bottom: var(--spacing-sm);
}

.resource-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.resource-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.resource-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

.resource-progress {
  margin-bottom: var(--spacing-sm);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-muted);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-safe { background-color: var(--color-success); }
.progress-warning { background-color: var(--color-warning); }
.progress-danger { background-color: var(--color-danger); }

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.resource-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  text-align: center;
}
</style>
```

### Enhanced Sidebar with Resource Monitoring
```vue
<!-- Updated TerminalSidebar.vue header section -->
<template>
  <div class="terminal-sidebar">
    <!-- Resource Monitor -->
    <ResourceMonitor />
    
    <div class="sidebar-header">
      <h3 class="sidebar-title">Terminals</h3>
      <AppButton
        icon="i-heroicons-plus"
        size="sm"
        variant="primary"
        :disabled="!canCreateTerminal || isCreatingTerminal"
        @click="createNewTerminal"
        :title="getCreateButtonTitle()"
      >
        New
      </AppButton>
    </div>
    
    <!-- Terminal list... -->
  </div>
</template>

<script setup lang="ts">
// ... existing imports
import ResourceMonitor from './ResourceMonitor.vue'

const terminalManager = useTerminalManager()
const resourceStats = computed(() => terminalManager.resourceStats.value)
const canCreateTerminal = computed(() => resourceStats.value.canCreateMore)

const getCreateButtonTitle = (): string => {
  if (!canCreateTerminal.value) {
    return `Maximum terminals reached (${resourceStats.value.maxTerminals})`
  }
  return 'Create new terminal'
}

const createNewTerminal = async (): Promise<void> => {
  if (!canCreateTerminal.value) {
    // Show toast/notification about limit
    return
  }
  
  try {
    const terminalId = await terminalManager.createTerminal()
    if (terminalId) {
      terminalManager.setActiveTerminal(terminalId)
    }
  } catch (error) {
    // Handle limit exceeded error
    console.error('Failed to create terminal:', error.message)
  }
}
</script>
```

### Safe Stale Connection Cleanup Strategy

<details>
<summary><strong>Enhanced Cleanup Logic to Preserve Active Terminals</strong></summary>

```typescript
// Safe cleanup strategy that preserves active terminals
export function useSafeTerminalCleanup() {
  const terminalPersistence = useTerminalPersistence()
  const systemResources = useSystemResources()
  
  // Track terminal activity more granularly
  const trackTerminalActivity = (terminalId: string, activityType: 'input' | 'output' | 'api-call' | 'command') => {
    const terminal = terminals.value.get(terminalId)
    if (terminal) {
      terminal.lastActivity = new Date()
      terminal.activityHistory = terminal.activityHistory || []
      terminal.activityHistory.push({
        type: activityType,
        timestamp: new Date()
      })
      
      // Keep only last 50 activities for memory efficiency
      if (terminal.activityHistory.length > 50) {
        terminal.activityHistory = terminal.activityHistory.slice(-50)
      }
      
      // Persist terminal state for recovery
      terminalPersistence.saveTerminalState(terminalId, {
        name: terminal.name,
        lastActivity: terminal.lastActivity,
        status: terminal.status,
        agentType: terminal.agentType,
        claudeSessionId: terminal.claudeSessionId,
        workingDirectory: terminal.workingDirectory
      })
    }
  }
  
  // Determine if terminal is truly stale vs just quiet
  const isTerminalTrulyStale = (terminal: TerminalState): boolean => {
    const now = new Date()
    const lastActivity = terminal.lastActivity
    const timeSinceActivity = now.getTime() - lastActivity.getTime()
    
    // Conservative stale detection - only cleanup terminals that are:
    // 1. Disconnected (not just idle)
    // 2. Have no recent activity (6+ hours)
    // 3. Have no active agent sessions
    // 4. Are not the currently focused terminal
    
    const isDisconnected = terminal.status === 'disconnected' || terminal.status === 'error'
    const isVeryOld = timeSinceActivity > 6 * 60 * 60 * 1000 // 6 hours
    const hasNoAgent = !terminal.agentType || !terminal.claudeSessionId
    const isNotFocused = !terminal.isActive
    
    return isDisconnected && isVeryOld && hasNoAgent && isNotFocused
  }
  
  // Safe cleanup that preserves active terminals
  const performSafeCleanup = () => {
    const terminalsToCleanup: string[] = []
    
    for (const [terminalId, terminal] of terminals.value) {
      if (isTerminalTrulyStale(terminal)) {
        terminalsToCleanup.push(terminalId)
      }
    }
    
    // Only cleanup if we have clear stale terminals
    if (terminalsToCleanup.length > 0) {
      logger.info('Cleaning up stale terminals', { 
        count: terminalsToCleanup.length,
        terminals: terminalsToCleanup 
      })
      
      terminalsToCleanup.forEach(terminalId => {
        destroyTerminal(terminalId)
        terminalPersistence.removeTerminalState(terminalId)
      })
    }
  }
  
  // Startup cleanup using persisted state
  const performStartupCleanup = async () => {
    const persistedTerminals = await terminalPersistence.getAllTerminalStates()
    const currentConnections = new Set(Array.from(terminals.value.keys()))
    
    // Clean up orphaned persisted states that don't have active connections
    for (const [terminalId, persistedState] of persistedTerminals) {
      if (!currentConnections.has(terminalId)) {
        const timeSinceActivity = new Date().getTime() - persistedState.lastActivity.getTime()
        
        // Only remove persisted state if terminal has been inactive for 24+ hours
        if (timeSinceActivity > 24 * 60 * 60 * 1000) {
          logger.info('Removing orphaned terminal state', { terminalId })
          await terminalPersistence.removeTerminalState(terminalId)
        }
      }
    }
  }
  
  // Resource limit enforcement (only if absolutely necessary)
  const enforceResourceLimits = () => {
    const currentCount = terminals.value.size
    const maxAllowed = systemResources.systemInfo.value.maxTerminals
    
    // Only enforce if significantly over limit (emergency cleanup)
    if (currentCount > maxAllowed + 2) {
      logger.warn('Emergency cleanup: over terminal limit', { 
        current: currentCount, 
        max: maxAllowed 
      })
      
      // Sort by activity and status, prioritizing disconnected/error terminals
      const sortedTerminals = Array.from(terminals.value.values())
        .filter(t => !t.isActive) // Never cleanup active terminal
        .sort((a, b) => {
          // Prioritize disconnected terminals for cleanup
          if (a.status === 'disconnected' && b.status !== 'disconnected') return -1
          if (b.status === 'disconnected' && a.status !== 'disconnected') return 1
          
          // Then by last activity (oldest first)
          return a.lastActivity.getTime() - b.lastActivity.getTime()
        })
      
      const excessCount = currentCount - maxAllowed
      for (let i = 0; i < excessCount && i < sortedTerminals.length; i++) {
        const terminal = sortedTerminals[i]
        if (terminal && !terminal.isActive) {
          logger.warn('Emergency cleanup removing terminal', { 
            terminalId: terminal.id,
            status: terminal.status,
            lastActivity: terminal.lastActivity
          })
          destroyTerminal(terminal.id)
        }
      }
    }
  }
  
  return {
    trackTerminalActivity,
    isTerminalTrulyStale,
    performSafeCleanup,
    performStartupCleanup,
    enforceResourceLimits
  }
}

// Usage in terminal lifecycle
export function useTerminalLifecycle() {
  const cleanup = useSafeTerminalCleanup()
  
  // Initialize on app startup
  onMounted(async () => {
    await cleanup.performStartupCleanup()
  })
  
  // Conservative periodic cleanup - much less aggressive
  setInterval(() => {
    cleanup.performSafeCleanup()
    cleanup.enforceResourceLimits()
  }, 30 * 60 * 1000) // Every 30 minutes (not 5 minutes)
  
  // Track all terminal activities
  const registerActivityTracking = (terminalId: string) => {
    // Track input, output, API calls, commands
    websocket.addOutputObserver((output) => {
      cleanup.trackTerminalActivity(terminalId, 'output')
    })
    
    // Track user input
    const originalSendInput = websocket.sendInput
    websocket.sendInput = (input: string) => {
      cleanup.trackTerminalActivity(terminalId, 'input')
      return originalSendInput(input)
    }
  }
}
```

</details>

### Terminal Persistence and Session Tracking

<details>
<summary><strong>File System Storage for Terminal State</strong></summary>

```typescript
// composables/useTerminalPersistence.ts
export function useTerminalPersistence() {
  const settingsService = useSettingsService()
  
  interface PersistedTerminalState {
    terminalId: string
    name: string
    lastActivity: Date
    status: 'connected' | 'disconnected' | 'error' | 'connecting'
    agentType?: 'claude-code' | 'gemini-cli' | 'custom' | null
    claudeSessionId?: string
    workingDirectory?: string
    createdAt: Date
    activityPattern: {
      apiCallsPerHour: number
      commandsPerHour: number
      avgSessionLength: number
    }
  }
  
  const saveTerminalState = async (terminalId: string, state: Partial<PersistedTerminalState>) => {
    try {
      const existingStates = await getAllTerminalStates()
      
      const terminalState: PersistedTerminalState = {
        terminalId,
        name: state.name || `Terminal ${terminalId.slice(0, 8)}`,
        lastActivity: state.lastActivity || new Date(),
        status: state.status || 'connecting',
        agentType: state.agentType,
        claudeSessionId: state.claudeSessionId,
        workingDirectory: state.workingDirectory,
        createdAt: state.createdAt || new Date(),
        activityPattern: state.activityPattern || {
          apiCallsPerHour: 0,
          commandsPerHour: 0,
          avgSessionLength: 0
        }
      }
      
      existingStates.set(terminalId, terminalState)
      
      await settingsService.saveSettings('terminal-states', {
        terminals: Object.fromEntries(existingStates)
      })
      
    } catch (error) {
      logger.error('Failed to save terminal state', { error, terminalId })
    }
  }
  
  const getAllTerminalStates = async (): Promise<Map<string, PersistedTerminalState>> => {
    try {
      const saved = await settingsService.loadSettings('terminal-states')
      const states = new Map<string, PersistedTerminalState>()
      
      if (saved?.terminals) {
        for (const [terminalId, state] of Object.entries(saved.terminals)) {
          states.set(terminalId, {
            ...state as PersistedTerminalState,
            lastActivity: new Date(state.lastActivity),
            createdAt: new Date(state.createdAt)
          })
        }
      }
      
      return states
    } catch (error) {
      logger.error('Failed to load terminal states', { error })
      return new Map()
    }
  }
  
  const removeTerminalState = async (terminalId: string) => {
    try {
      const existingStates = await getAllTerminalStates()
      existingStates.delete(terminalId)
      
      await settingsService.saveSettings('terminal-states', {
        terminals: Object.fromEntries(existingStates)
      })
      
    } catch (error) {
      logger.error('Failed to remove terminal state', { error, terminalId })
    }
  }
  
  const getTerminalState = async (terminalId: string): Promise<PersistedTerminalState | null> => {
    const states = await getAllTerminalStates()
    return states.get(terminalId) || null
  }
  
  return {
    saveTerminalState,
    getAllTerminalStates,
    removeTerminalState,
    getTerminalState
  }
}
```

</details>
```

</details>

### ✅ Pros
- **Thread Isolation**: Terminal processing doesn't block UI
- **Scalable Performance**: Workers utilize multiple CPU cores
- **Independent Failures**: Worker crash doesn't affect UI or other terminals
- **Advanced Processing**: Complex terminal logic without UI impact
- **Memory Isolation**: Workers have separate memory spaces
- **AI-Ready**: Perfect for AI agent processing in background

### ❌ Cons
- **Worker Overhead**: Additional worker creation/management
- **Communication Latency**: Message passing between threads
- **Limited API Access**: Workers have restricted browser APIs
- **Complex State Sync**: Coordination between worker and UI state
- **Browser Support**: Some browsers limit concurrent workers
- **Debugging Difficulty**: Worker debugging is more complex

### 📊 Resource Profile
- **Memory**: Medium-High (worker contexts)
- **CPU**: Low (offloaded processing)
- **Network**: Medium (workers handle connections)
- **Complexity**: High

---

## Comparative Analysis

| Aspect | WebSocket Per Terminal | Shared Connection | Iframe Isolation | Web Workers |
|--------|----------------------|-------------------|------------------|-------------|
| **Resource Usage (API Agents)** | Low | Very Low | High | Low-Medium |
| **Implementation Complexity** | Medium | High | High | High |
| **API Agent Isolation** | Excellent | Medium | Very High | High |
| **API Concurrency** | Excellent | Poor | Good | Good |
| **Background Continuity** | Excellent | Good | Excellent | Excellent |
| **Debugging API Calls** | Easy | Hard | Medium | Medium |
| **Browser Compatibility** | Excellent | Excellent | Excellent | Good |
| **API Error Isolation** | Excellent | Poor | Excellent | Good |
| **Network Efficiency** | Good | Good | Poor | Good |
| **Memory Leak Risk** | Low | Low | Medium | Low |

## Recommendations (Updated for API-based AI Agents)

### 🥇 **OPTIMAL: Solution 1 - Multiple WebSocket Connections**

**Perfect for API-based AI agents (Claude Code, Gemini CLI, etc.):**

- **Ideal for API coordination** - Each terminal manages its own API sessions independently
- **Background agent continuity** - AI agents continue API calls regardless of terminal focus
- **Natural concurrency** - Multiple agents can make simultaneous API requests
- **Simple architecture** - Builds on existing WebSocket patterns without over-engineering
- **Easy debugging** - Each terminal's API interactions are isolated and traceable
- **Failure isolation** - One agent's API errors don't affect other running agents
- **Low resource overhead** - No heavy local processing, just I/O coordination

**Resource Profile for API Agents:**
- **CPU per terminal**: ~2-5% (just parsing and API coordination)
- **Memory per terminal**: ~10-50MB (WebSocket buffers + API state)
- **Can easily handle 15-20 terminals** on developer machines

### 🥈 **Alternative: Solution 4 - Web Workers (if complex processing needed)**

**Consider if you add heavy local processing later:**
- **Over-engineered** for simple API coordination
- **Good isolation** but complexity not justified for API-only agents
- **Future-proof** if you later add local model inference or heavy processing

### 🥉 **Reduced Priority: Solution 2 - Shared Connection**

**API coordination challenges make this less attractive:**
- **Head-of-line blocking** - One slow API response can delay others
- **Complex routing** - Harder to match API requests/responses to correct agents
- **Debugging difficulty** - Harder to trace which agent made which API call
- **Still viable** but other solutions offer better API agent support

### ❌ **Not Recommended: Solution 3 - Iframe Isolation**

**Resource overhead still problematic:**
- **Too heavy** even for API agents - full iframe per terminal
- **Communication complexity** outweighs benefits for API coordination
- **Browser limits** become problematic at 10+ terminals

---

## API-based Agent Implementation Examples

### Background Agent Continuity in Practice

<details>
<summary><strong>Scenario: Multiple AI Agents Running Simultaneously</strong></summary>

```typescript
// Example: Real-world API agent coordination
const activeTerminals = {
  'terminal-1': {
    agent: 'claude-code',
    status: 'analyzing',
    focus: false, // Background terminal
    currentTask: 'Code review of auth module',
    apiActivity: {
      lastRequest: '2s ago',
      pendingRequests: 1,
      requestsPerMinute: 12,
      avgResponseTime: '1.2s'
    },
    output: [
      '🔍 Analyzing authentication patterns...',
      '📝 Found potential security issue in login.ts:47',
      '⏳ Generating detailed report...'
    ]
  },
  
  'terminal-2': {
    agent: 'gemini-cli',
    status: 'generating',
    focus: false, // Background terminal
    currentTask: 'Writing unit tests for payment service',
    apiActivity: {
      lastRequest: '5s ago',
      pendingRequests: 2,
      requestsPerMinute: 8,
      avgResponseTime: '2.1s'
    },
    output: [
      '🧪 Generating test cases for PaymentService...',
      '✅ Created 15 test scenarios',
      '🔄 Adding edge case tests...'
    ]
  },
  
  'terminal-3': {
    agent: 'user-interactive',
    status: 'focused',
    focus: true, // Currently receiving user input
    currentTask: 'Manual debugging session',
    apiActivity: null, // No AI agent running
    output: [
      '$ npm test',
      'Running tests...',
      '> 25 passing, 2 failing'
    ]
  }
}
```

### Key Benefits Demonstrated:

1. **True Background Execution**: Terminals 1 & 2 continue API processing while user focuses on terminal 3
2. **Independent API Sessions**: Each agent maintains its own API state and rate limits
3. **Concurrent Processing**: Multiple AI agents can work simultaneously without blocking
4. **Isolated Failures**: If Claude Code hits rate limit, Gemini CLI continues unaffected

</details>

<details>
<summary><strong>API Agent WebSocket Implementation</strong></summary>

```typescript
// composables/useAPIAgentTerminal.ts
export function useAPIAgentTerminal(terminalId: string) {
  const websocket = useMultiTerminalWebSocket(terminalId)
  const apiState = ref({
    currentAgent: null,
    apiCalls: [],
    rateLimits: {},
    background: true // Can run in background
  })
  
  // API agent coordination
  const startAgent = async (agentType: 'claude-code' | 'gemini-cli' | 'custom') => {
    apiState.value.currentAgent = agentType
    
    // Send agent initialization to terminal
    websocket.sendInput(`${agentType} --interactive --session=${terminalId}\r`)
    
    // Setup API monitoring
    websocket.addOutputObserver((output) => {
      trackAPIActivity(output)
      processAgentOutput(output)
    })
  }
  
  // Background processing continues regardless of focus
  const processAgentOutput = (output: string) => {
    // Parse API responses and agent status
    if (output.includes('API_REQUEST:')) {
      const apiCall = parseAPICall(output)
      apiState.value.apiCalls.push(apiCall)
    }
    
    if (output.includes('RATE_LIMIT:')) {
      updateRateLimits(output)
    }
    
    if (output.includes('TASK_COMPLETE:')) {
      notifyTaskCompletion()
    }
  }
  
  // API call tracking for monitoring
  const trackAPIActivity = (output: string) => {
    const apiCall = {
      timestamp: new Date(),
      endpoint: extractEndpoint(output),
      status: extractStatus(output),
      responseTime: extractResponseTime(output)
    }
    
    // Update terminal state for UI monitoring
    updateTerminalAPIStats(terminalId, apiCall)
  }
  
  return {
    apiState: readonly(apiState),
    startAgent,
    stopAgent: () => websocket.sendInput('\x03'), // Ctrl+C
    isBackgroundActive: computed(() => !isFocused.value && apiState.value.currentAgent)
  }
}
```

### API Agent Manager

```typescript
// stores/apiAgentManager.ts
export const useAPIAgentManager = defineStore('apiAgentManager', () => {
  const agents = ref(new Map<string, APIAgentState>())
  
  const backgroundAgents = computed(() => 
    Array.from(agents.value.values()).filter(agent => 
      !agent.isFocused && agent.status === 'active'
    )
  )
  
  const totalAPICallsPerMinute = computed(() =>
    backgroundAgents.value.reduce((sum, agent) => 
      sum + agent.apiCallsPerMinute, 0
    )
  )
  
  const createAgent = async (terminalId: string, agentType: string) => {
    const agent: APIAgentState = {
      terminalId,
      agentType,
      status: 'initializing',
      isFocused: false,
      apiCallsPerMinute: 0,
      avgResponseTime: 0,
      lastActivity: new Date(),
      currentTask: null
    }
    
    agents.value.set(terminalId, agent)
    
    // Agents continue running regardless of terminal focus
    return terminalId
  }
  
  const setTerminalFocus = (terminalId: string, focused: boolean) => {
    const agent = agents.value.get(terminalId)
    if (agent) {
      agent.isFocused = focused
      // Agent continues running in background when unfocused
    }
  }
  
  return {
    agents: readonly(agents),
    backgroundAgents,
    totalAPICallsPerMinute,
    createAgent,
    setTerminalFocus
  }
})
```

</details>

<details>
<summary><strong>Network & API Monitoring UI</strong></summary>

```vue
<!-- components/terminal/APIActivityMonitor.vue -->
<template>
  <div class="api-monitor">
    <div class="monitor-header">
      <h4>API Agent Activity</h4>
      <div class="total-calls">
        {{ totalAPICallsPerMinute }} calls/min
      </div>
    </div>
    
    <div class="agent-list">
      <div 
        v-for="agent in backgroundAgents" 
        :key="agent.terminalId"
        class="agent-item"
      >
        <div class="agent-info">
          <span class="agent-name">{{ agent.agentType }}</span>
          <span class="agent-task">{{ agent.currentTask }}</span>
        </div>
        
        <div class="agent-stats">
          <div class="stat">
            <label>Calls/min:</label>
            <value>{{ agent.apiCallsPerMinute }}</value>
          </div>
          <div class="stat">
            <label>Avg Response:</label>
            <value>{{ agent.avgResponseTime }}ms</value>
          </div>
          <div class="stat">
            <label>Status:</label>
            <value :class="getStatusClass(agent.status)">
              {{ agent.status }}
            </value>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Rate limit warnings -->
    <div v-if="hasRateLimitWarnings" class="rate-limit-warning">
      ⚠️ Some agents approaching rate limits
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAPIAgentManager } from '~/stores/apiAgentManager'

const agentManager = useAPIAgentManager()

const backgroundAgents = computed(() => agentManager.backgroundAgents)
const totalAPICallsPerMinute = computed(() => agentManager.totalAPICallsPerMinute)

const hasRateLimitWarnings = computed(() =>
  backgroundAgents.value.some(agent => agent.apiCallsPerMinute > 50)
)

const getStatusClass = (status: string) => ({
  'status-active': status === 'active',
  'status-waiting': status === 'waiting',
  'status-error': status === 'error'
})
</script>
```

</details>

---

## Implementation Roadmap

### Phase 1: MVP Foundation (Solution 1 - Conservative Limits)
1. Implement terminal manager store with basic resource limits (15 terminals max)
2. Create multi-terminal WebSocket architecture (one connection per terminal)
3. Build sidebar with basic terminal list and status indicators
4. Add terminal switching and focus management
5. Implement basic terminal persistence using file system storage

### Phase 2: Smart Resource Management & Enhanced Cleanup
1. **Intelligent resource scaling** - Dynamic limits based on workload detection:
   - Monitor terminal activity (API calls vs bash commands vs intensive operations)
   - Adjust limits based on actual resource usage patterns
   - Scale from 15 terminals (safe) up to 25+ terminals (for pure API workloads)
2. **Enhanced cleanup strategies**:
   - Startup connection cleanup using persisted terminal state
   - Smart stale detection that preserves active terminals
   - Terminal session restoration after app restart
3. **Terminal persistence and session tracking**:
   - Store terminal metadata (Claude Code session IDs, working directory, agent type)
   - Track terminal activity patterns for smart cleanup decisions
   - Preserve terminal state across app restarts

### Phase 3: API Agent Integration
1. Implement API agent detection and coordination
2. Add background agent continuity system  
3. Create API call monitoring and rate limit tracking
4. Build agent state management (running/paused/error)
5. Add terminal-to-agent session mapping persistence

### Phase 4: Advanced Features
1. Add cross-terminal agent coordination
2. Implement agent task scheduling and queuing
3. Create advanced output observation for agent triggers
4. Build agent performance analytics and workload optimization
5. Dynamic resource allocation based on terminal workload profiles

---

## Updated CPU Core Management for API Agents

<details>
<summary><strong>Revised Resource Strategy for API-based Workloads</strong></summary>

### API Agent Resource Profile
Since API agents primarily handle network I/O rather than CPU-intensive processing:

```typescript
// Updated system resource detection for API agents
export function useSystemResourcesForAPIAgents() {
  const detectSystemCapability = () => {
    const totalCores = navigator.hardwareConcurrency || 4
    
    // API agents use minimal CPU - can be more generous with limits
    const reservedCores = Math.max(2, Math.ceil(totalCores * 0.15)) // Only 15% reserved
    const availableCores = totalCores - reservedCores
    
    // API agents can scale higher since they're mostly I/O bound
    const maxTerminals = Math.min(availableCores * 2, 25) // Up to 2 terminals per available core
    
    return {
      totalCores,
      reservedCores,
      availableCores,
      maxTerminals,
      recommendedMaxTerminals: Math.min(maxTerminals, 15), // Conservative default
      workloadType: 'api-agents' // Identify the optimization
    }
  }
}
```

### Resource Monitoring Updates

```vue
<!-- Updated ResourceMonitor for API agents -->
<template>
  <div class="resource-monitor api-optimized">
    <div class="resource-header">
      <h4>API Agent Resources</h4>
      <div class="resource-indicator" :class="getIndicatorClass()">
        {{ activeAgents }}/{{ maxTerminals }}
      </div>
    </div>
    
    <div class="resource-details">
      <div class="resource-row">
        <span class="resource-label">Active API Agents:</span>
        <span class="resource-value">{{ activeAgents }}</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Network Calls/min:</span>
        <span class="resource-value">{{ totalAPICallsPerMinute }}</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Avg Response Time:</span>
        <span class="resource-value">{{ avgResponseTime }}ms</span>
      </div>
      
      <div class="resource-row">
        <span class="resource-label">Terminal Capacity:</span>
        <span class="resource-value">{{ Math.round(usagePercentage) }}%</span>
      </div>
    </div>
    
    <!-- Network-focused progress bar -->
    <div class="resource-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :class="getProgressClass()"
          :style="{ width: `${usagePercentage}%` }"
        />
      </div>
      <span class="progress-text">
        {{ activeAgents }} API agents running
      </span>
    </div>
    
    <!-- API-specific warnings -->
    <div v-if="hasNetworkWarnings" class="network-warning">
      🌐 High API activity - monitor rate limits
    </div>
  </div>
</template>
```

### MVP Resource Limits (Conservative for Safety)

**Your 20-core i5-14600KF for MVP:**
- **Reserved cores**: 5 cores (25% - conservative for safety)
- **Available for terminals**: 15 cores  
- **Max terminals**: 15 (1 terminal per available core)
- **Recommended default**: 10 terminals
- **Rationale**: AI agents can execute intensive bash commands, file operations, and applications

**⚠️ Important**: While AI agents use APIs for reasoning, they can trigger intensive local operations:
- File system operations (large file processing)
- Bash commands (builds, tests, data processing)  
- Application launches (Docker, databases, dev servers)
- Git operations (large repo clones, rebasing)
- Package installations and builds

</details>

### Git Repository Validation + Saved Directories

<details>
<summary><strong>Git Repository Validation Service</strong></summary>

```typescript
// composables/useGitValidation.ts
export function useGitValidation() {
  
  interface GitRepoInfo {
    isValidRepo: boolean
    repoPath: string
    currentBranch: string
    availableBranches: string[]
    isClean: boolean
    hasRemote: boolean
    errorMessage?: string
  }
  
  const validateGitRepository = async (directoryPath: string): Promise<GitRepoInfo> => {
    // Comprehensive git validation:
    // - Directory exists
    // - Is git repository
    // - Get current branch and all branches
    // - Check if working directory is clean
    // - Check for remote repository
  }
  
  const canCreateWorktree = (repoInfo: GitRepoInfo): { canCreate: boolean; reason?: string } => {
    if (!repoInfo.isValidRepo) {
      return { canCreate: false, reason: 'Not a valid git repository' }
    }
    
    if (!repoInfo.isClean) {
      return { 
        canCreate: false, 
        reason: 'Repository has uncommitted changes. Please commit or stash changes first.' 
      }
    }
    
    return { canCreate: true }
  }
}
```

</details>

<details>
<summary><strong>Saved Directories User Settings</strong></summary>

```typescript
// composables/useSavedDirectories.ts
export function useSavedDirectories() {
  interface SavedDirectory {
    id: string
    name: string
    path: string
    description?: string
    lastUsed: Date
    isValid: boolean
    defaultBranch?: string
  }
  
  const getSavedDirectories = async (): Promise<SavedDirectory[]> => {
    // Load from settings service
  }
  
  const addSavedDirectory = async (directory: Omit<SavedDirectory, 'id' | 'lastUsed' | 'isValid'>): Promise<void> => {
    // Save to settings with auto-generated ID
  }
  
  const validateSavedDirectories = async (): Promise<void> => {
    // Check all saved directories are still valid git repos
    // Update validity status and default branches
  }
}
```

</details>

<details>
<summary><strong>Enhanced Terminal Creation UI</strong></summary>

```vue
<!-- Terminal Creation Modal with Git Validation -->
<template>
  <div class="p-6">
    <h3>Create New Terminal</h3>
    
    <!-- Quick Select from Saved Directories -->
    <USelect 
      v-model="selectedSavedDir"
      :options="savedDirectoryOptions"
      placeholder="Select from saved repositories..."
    />
    
    <!-- Manual Path Entry with Validation -->
    <div class="flex gap-2">
      <UInput 
        v-model="form.basePath" 
        placeholder="/path/to/your/repo"
        @blur="validateRepository"
      />
      <UButton icon="folder" @click="selectDirectory" />
      <UButton icon="bookmark" @click="saveCurrentDirectory" />
    </div>
    
    <!-- Git Repository Status -->
    <div v-if="repoInfo?.isValidRepo" class="status-display">
      ✅ Valid Git Repository
      Current Branch: {{ repoInfo.currentBranch }}
      Status: {{ repoInfo.isClean ? 'Clean' : 'Dirty' }}
    </div>
    
    <!-- Branch Selection -->
    <USelect 
      v-model="form.branchName"
      :options="repoInfo.availableBranches"
      searchable
      creatable
    />
    
    <!-- Worktree Preview -->
    <div class="preview">
      Worktree will be created at: 
      <code>{{ previewWorktreePath }}</code>
    </div>
  </div>
</template>
```

</details>

---

---

## 🎯 **CHOSEN SOLUTION: Solution 1 - Multiple WebSocket Connections**

Based on comprehensive analysis of requirements for API-based AI agents with git worktree integration, **Solution 1** has been selected as the optimal approach.

### Final Requirements Confirmed:
- ✅ **API-based AI agents** (Claude Code, Gemini CLI) executing commands locally
- ✅ **Background terminal execution** - agents continue while unfocused
- ✅ **Git worktree isolation** - dedicated worktree per terminal
- ✅ **Dynamic resource limits** - based on any computer's CPU cores  
- ✅ **User-driven terminal creation** - no auto-creation
- ✅ **Robust startup cleanup** - handles force-closed applications
- ✅ **Git repository validation** - pre-req for terminal creation
- ✅ **Saved directories** - user settings for quick repository selection

---

## 🏆 **Final Solution Architecture**

### **Core Implementation: Multiple WebSocket Connections**
- **One WebSocket per terminal** for complete independence
- **One git worktree per terminal** for branch isolation
- **Dynamic CPU core limits** (25% reserved, scales with machine)
- **File system persistence** for terminal state and git mappings
- **Conservative cleanup** to preserve active sessions

### **Key Components:**

#### **1. Terminal Management**
```typescript
// Dynamic resource detection
const systemInfo = {
  totalCores: navigator.hardwareConcurrency, // e.g., 20 cores
  reservedCores: Math.max(2, Math.ceil(totalCores * 0.25)), // 5 cores
  maxTerminals: totalCores - reservedCores, // 15 terminals
}

// User-driven terminal creation only
const createTerminal = async (userOptions: {
  name: string,
  basePath: string, 
  branchName: string
}) => {
  // Git validation → Worktree creation → Terminal initialization
}
```

#### **2. Git Worktree Integration**  
```typescript
// Dedicated worktree per terminal
const worktreePath = `${basePath}/../worktrees/terminal-${terminalId}-${branchName}`

// Git repository validation
const validateRepo = async (path: string) => {
  // Check: git repo, clean state, available branches
}

// Saved directories for UX
const savedDirectories = [
  { name: "Main Project", path: "/code/my-app", defaultBranch: "main" },
  { name: "Feature Work", path: "/code/features", defaultBranch: "develop" }
]
```

#### **3. Safe Cleanup Strategy**
```typescript
// Conservative stale detection (6+ hours + disconnected + no agent)
const isStale = (terminal) => {
  return terminal.status === 'disconnected' 
    && timeSinceActivity > 6 * 60 * 60 * 1000
    && !terminal.claudeSessionId 
    && !terminal.isActive
}

// Startup cleanup for orphaned worktrees/states
const startupCleanup = async () => {
  // Clean orphaned persisted states (24+ hours old)
  // Remove orphaned worktrees without active terminals
}
```

#### **4. Resource Monitoring UI**
```vue
<!-- Real-time resource display -->
<div class="resource-indicator">
  {{ activeTerminals }}/{{ maxTerminals }} <!-- e.g., "4/15" -->
</div>

<div class="resource-details">
  <div>Active Terminals: {{ activeTerminals }}</div>
  <div>Available Cores: {{ maxTerminals }}</div>
  <div>Total CPU Cores: {{ totalCores }}</div>
  <div>Core Utilization: {{ usagePercentage }}%</div>
</div>
```

### **Final Advantages:**
- ✅ **Perfect for AI coding workflows** - isolated git environments per agent
- ✅ **Handles intensive operations** - builds, file processing, Docker launches
- ✅ **Scales across developer machines** - 8-core MacBook to 20-core workstation
- ✅ **Safe and debuggable** - clear separation, easy troubleshooting
- ✅ **User-controlled** - no surprising auto-behavior, explicit actions
- ✅ **Robust recovery** - handles crashes, preserves important sessions

### **Resource Profile (Conservative MVP):**
- **Your 20-core machine**: 15 terminal limit (75% utilization)
- **8-core MacBook Pro**: 6 terminal limit (75% utilization)  
- **CPU per terminal**: 2-5% (API coordination) + variable (executed commands)
- **Memory per terminal**: 10-50MB (WebSocket + buffers) + variable (applications)
- **Focus**: Safe limits that handle both API calls AND intensive local operations

---

## Implementation Roadmap (Updated)

### **Phase 1: MVP Foundation**
1. ✅ **Dynamic resource detection** - CPU core-based terminal limits
2. ✅ **Basic terminal manager** - WebSocket per terminal architecture  
3. ✅ **Git worktree integration** - validation, creation, cleanup
4. ✅ **Saved directories** - user settings for quick selection
5. ✅ **Terminal persistence** - state preservation across restarts
6. ✅ **Safe cleanup** - conservative stale detection

### **Phase 2: Enhanced Features** 
1. **Smart resource scaling** - detect API vs intensive workloads
2. **Advanced UI monitoring** - real-time activity, API call rates
3. **Session restoration** - reconnect to existing worktrees/agents
4. **Performance analytics** - terminal usage patterns, optimization

### **Phase 3: AI Agent Optimization**
1. **Agent coordination** - cross-terminal communication
2. **Task scheduling** - queue management for agents
3. **Output triggers** - advanced automation based on terminal output
4. **Resource optimization** - dynamic limits based on actual usage patterns

The **modular foundation** enables incremental enhancement while maintaining the core principle: **safe, isolated, user-controlled terminal multiplexing for AI-assisted development workflows**.