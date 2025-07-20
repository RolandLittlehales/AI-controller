# Multi-Terminal Implementation Plan
## KISS/YAGNI Approach - Laser-Focused Steps

> **Philosophy**: Keep It Simple, Stupid & You Aren't Gonna Need It
> 
> Each step is **small, focused, and immediately testable**. No over-engineering, no premature optimization.

---

## 🎯 **Goals**

### **Phase 1 Goal (Foundation UI)**
Build a **basic terminal multiplexer UI** that can:
- Create multiple placeholder terminals
- Switch between terminals (visual switching only)
- Dynamically detect system resources and show limits
- Display terminal list with basic management

### **Full MVP Goal (Complete System)**
Build a **working terminal multiplexer** that can:
- Create multiple terminals with git worktrees
- Switch between terminals (only one receives input)
- Execute real commands via WebSocket connections
- Clean up properly on startup/shutdown

---

## 🎫 **Ticketing Structure**

Each **step = one individual ticket** (15-45 minutes of focused work):
- **Phase = Epic** containing multiple tickets
- **Step = Ticket** with clear deliverable and test criteria
- **Estimated Total**: ~3 hours for Phase 1 foundation (6 tickets)

### **Epic Structure:**
```
Epic: Phase 1A - Core Terminal Manager
├── Ticket: Step 1 - Dynamic Resource Detection (~30min)
├── Ticket: Step 2 - Terminal State Management (~45min)  
└── Ticket: Step 3 - Resource Monitor UI (~30min)

Epic: Phase 1B - Basic Terminal UI  
├── Ticket: Step 4 - Terminal Sidebar (~45min)
├── Ticket: Step 5 - Terminal Display (~30min)
└── Ticket: Step 6 - Layout Integration (~15min)
```

**Benefits of per-step tickets:**
- ✅ Immediate feedback on small deliverables
- ✅ Easy to debug issues in isolation
- ✅ Clear progress tracking
- ✅ Can pause/resume work between any step

---

## 📋 **Implementation Steps**

### **Phase 1A: Foundation (Core Terminal Manager)**

#### **Step 1: Dynamic System Resource Detection** ⏱️ *~30 minutes*
**Goal**: Detect CPU cores and calculate safe terminal limits

**Prerequisites:**
- ✅ Nuxt 3 project running
- ✅ Composables directory exists
- ✅ Basic understanding of Vue 3 Composition API

**Files to create:**
- `composables/useSystemResources.ts`

**What to build:**
```typescript
// KISS: Just the essentials
export function useSystemResources() {
  const systemInfo = ref({
    totalCores: 0,
    maxTerminals: 0
  })
  
  const detectSystemCapability = () => {
    const totalCores = navigator.hardwareConcurrency || 4
    const reservedCores = Math.max(2, Math.ceil(totalCores * 0.25))
    const maxTerminals = totalCores - reservedCores
    
    systemInfo.value = { totalCores, maxTerminals }
    return systemInfo.value
  }
  
  return { systemInfo: readonly(systemInfo), detectSystemCapability }
}
```

**Definition of Done:**
- ✅ Returns correct core count on your machine (should be 15 max terminals)
- ✅ Handles edge case of `navigator.hardwareConcurrency` undefined
- ✅ Calculates 25% reservation correctly
- ✅ Composable can be imported and used in other components
- ✅ Console.log shows correct values during testing

**Integration Checkpoint:**
Ready for Step 2 when `useSystemResources()` returns valid `systemInfo` object.

---

#### **Step 2: Basic Terminal State Management** ⏱️ *~45 minutes*
**Goal**: Simple in-memory terminal tracking (no persistence yet)

**Prerequisites:**
- ✅ Step 1 completed (`useSystemResources` working)
- ✅ Pinia installed and configured in Nuxt
- ✅ Stores directory exists

**Files to create:**
- `stores/terminalManager.ts`

**What to build:**
```typescript
// KISS: Minimal state, no persistence yet
export const useTerminalManagerStore = defineStore('terminalManager', () => {
  const terminals = ref(new Map<string, BasicTerminal>())
  const activeTerminalId = ref<string | null>(null)
  const systemResources = useSystemResources()
  
  interface BasicTerminal {
    id: string
    name: string
    status: 'connecting' | 'connected' | 'disconnected'
    isActive: boolean
    createdAt: Date
  }
  
  const canCreateTerminal = computed(() => 
    terminals.value.size < systemResources.systemInfo.value.maxTerminals
  )
  
  const createTerminal = (name: string): string => {
    if (!canCreateTerminal.value) throw new Error('Terminal limit reached')
    
    const terminalId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const terminal: BasicTerminal = {
      id: terminalId,
      name,
      status: 'connecting',
      isActive: false,
      createdAt: new Date()
    }
    
    terminals.value.set(terminalId, terminal)
    return terminalId
  }
  
  const setActiveTerminal = (terminalId: string | null) => {
    // Deactivate previous
    if (activeTerminalId.value) {
      const prev = terminals.value.get(activeTerminalId.value)
      if (prev) prev.isActive = false
    }
    
    // Activate new
    activeTerminalId.value = terminalId
    if (terminalId) {
      const terminal = terminals.value.get(terminalId)
      if (terminal) terminal.isActive = true
    }
  }
  
  const removeTerminal = (terminalId: string) => {
    terminals.value.delete(terminalId)
    if (activeTerminalId.value === terminalId) {
      const remaining = Array.from(terminals.value.keys())
      setActiveTerminal(remaining[0] || null)
    }
  }
  
  return {
    terminals: readonly(terminals),
    activeTerminalId: readonly(activeTerminalId),
    canCreateTerminal,
    createTerminal,
    setActiveTerminal,
    removeTerminal
  }
})
```

**Definition of Done:**
- ✅ Can create terminals up to system limit
- ✅ Throws error when limit exceeded
- ✅ Active terminal switching works correctly
- ✅ Removing active terminal switches to next available
- ✅ Store can be imported and used in components
- ✅ All terminal operations logged to console for verification

**Integration Checkpoint:**
Ready for Step 3 when store creates/manages terminals and tracks active state.

---

#### **Step 3: Resource Monitor UI Component** ⏱️ *~30 minutes*
**Goal**: Show current terminal usage

**Prerequisites:**
- ✅ Steps 1-2 completed (system resources + terminal store)
- ✅ Components directory structure exists
- ✅ Nuxt UI or basic styling available

**Files to create:**
- `components/terminal/ResourceMonitor.vue`

**What to build:**
```vue
<!-- KISS: Just the essential display -->
<template>
  <div class="resource-monitor">
    <div class="resource-header">
      <h4>System Resources</h4>
      <div class="resource-indicator" :class="getIndicatorClass()">
        {{ activeTerminals }}/{{ maxTerminals }}
      </div>
    </div>
    
    <div class="resource-details">
      <div>Active Terminals: {{ activeTerminals }}</div>
      <div>Available Slots: {{ maxTerminals }}</div>
      <div>Total CPU Cores: {{ totalCores }}</div>
    </div>
    
    <div class="progress-bar">
      <div 
        class="progress-fill"
        :style="{ width: `${usagePercentage}%` }"
        :class="getProgressClass()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const terminalStore = useTerminalManagerStore()
const systemResources = useSystemResources()

const activeTerminals = computed(() => terminalStore.terminals.size)
const maxTerminals = computed(() => systemResources.systemInfo.value.maxTerminals)
const totalCores = computed(() => systemResources.systemInfo.value.totalCores)
const usagePercentage = computed(() => 
  Math.round((activeTerminals.value / maxTerminals.value) * 100)
)

const getIndicatorClass = () => {
  const usage = usagePercentage.value
  return usage < 50 ? 'indicator-safe' : usage < 80 ? 'indicator-warning' : 'indicator-danger'
}

const getProgressClass = () => {
  const usage = usagePercentage.value
  return usage < 50 ? 'progress-safe' : usage < 80 ? 'progress-warning' : 'progress-danger'
}

// Initialize on mount
onMounted(() => {
  systemResources.detectSystemCapability()
})
</script>
```

**Definition of Done:**
- ✅ Shows correct current/max terminal count
- ✅ Progress bar updates when terminals added/removed
- ✅ Color changes based on usage percentage
- ✅ Displays actual CPU core count
- ✅ Component renders without errors
- ✅ Real-time updates when store state changes

**Integration Checkpoint:**
Ready for Step 4 when ResourceMonitor displays live terminal counts and responds to store changes.

---

### **Phase 1B: Basic Terminal UI**

#### **Step 4: Simple Terminal List Sidebar** ⏱️ *~45 minutes*
**Goal**: List terminals with basic switching

**Prerequisites:**
- ✅ Steps 1-3 completed (foundation + resource monitor)
- ✅ ResourceMonitor component working
- ✅ Terminal store operations functional

**Files to create:**
- `components/terminal/TerminalSidebar.vue`

**What to build:**
```vue
<!-- KISS: Minimal terminal list -->
<template>
  <div class="terminal-sidebar">
    <ResourceMonitor />
    
    <div class="sidebar-header">
      <h3>Terminals</h3>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        :disabled="!canCreateTerminal"
        @click="createNewTerminal"
      >
        New
      </UButton>
    </div>
    
    <div class="terminal-list">
      <div
        v-for="terminal in terminalList"
        :key="terminal.id"
        :class="[
          'terminal-item',
          { 'terminal-item--active': terminal.isActive }
        ]"
        @click="setActiveTerminal(terminal.id)"
      >
        <div class="terminal-header">
          <span class="terminal-name">{{ terminal.name }}</span>
          <div class="terminal-controls">
            <span :class="`status-${terminal.status}`" class="status-dot" />
            <UButton
              icon="i-heroicons-x-mark"
              size="xs"
              variant="ghost"
              @click.stop="removeTerminal(terminal.id)"
            />
          </div>
        </div>
        
        <div class="terminal-meta">
          <span class="terminal-id">{{ terminal.id.slice(0, 8) }}</span>
          <span class="created-time">{{ formatTime(terminal.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const terminalStore = useTerminalManagerStore()

const terminalList = computed(() => Array.from(terminalStore.terminals.values()))
const canCreateTerminal = computed(() => terminalStore.canCreateTerminal)

let terminalCounter = 1

const createNewTerminal = () => {
  try {
    const terminalId = terminalStore.createTerminal(`Terminal ${terminalCounter++}`)
    terminalStore.setActiveTerminal(terminalId)
  } catch (error) {
    // Handle error - maybe show toast
    console.error('Failed to create terminal:', error.message)
  }
}

const setActiveTerminal = (terminalId: string) => {
  terminalStore.setActiveTerminal(terminalId)
}

const removeTerminal = (terminalId: string) => {
  terminalStore.removeTerminal(terminalId)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
```

**Test criteria:**
- ✅ Shows list of created terminals
- ✅ "New" button disabled when at limit
- ✅ Clicking terminal makes it active (visual indicator)
- ✅ Remove button works correctly
- ✅ Resource monitor shows updated counts

---

#### **Step 5: Placeholder Terminal Display** ⏱️ *~30 minutes*
**Goal**: Main area that shows active terminal (placeholder for now)

**Files to create:**
- `components/terminal/TerminalDisplay.vue`

**What to build:**
```vue
<!-- KISS: Just placeholder content -->
<template>
  <div class="terminal-display">
    <div v-if="!activeTerminal" class="no-terminal">
      <h3>No Terminal Selected</h3>
      <p>Create a new terminal or select one from the sidebar</p>
    </div>
    
    <div v-else class="active-terminal">
      <div class="terminal-header">
        <h3>{{ activeTerminal.name }}</h3>
        <div class="terminal-info">
          <span>ID: {{ activeTerminal.id.slice(0, 8) }}</span>
          <span>Status: {{ activeTerminal.status }}</span>
          <span>Created: {{ formatTime(activeTerminal.createdAt) }}</span>
        </div>
      </div>
      
      <div class="terminal-placeholder">
        <div class="placeholder-content">
          <h4>Terminal Content Placeholder</h4>
          <p>Terminal ID: {{ activeTerminal.id }}</p>
          <p>This is where xterm.js will be integrated</p>
          <p>Status: {{ activeTerminal.status }}</p>
          
          <!-- Simulate some terminal-like content -->
          <div class="mock-terminal">
            <div class="mock-line">$ echo "Hello from {{ activeTerminal.name }}"</div>
            <div class="mock-line">Hello from {{ activeTerminal.name }}</div>
            <div class="mock-line">$ _</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const terminalStore = useTerminalManagerStore()

const activeTerminal = computed(() => {
  const activeId = terminalStore.activeTerminalId
  return activeId ? terminalStore.terminals.get(activeId) : null
})

const formatTime = (date: Date) => {
  return date.toLocaleString()
}
</script>
```

**Test criteria:**
- ✅ Shows "No Terminal Selected" when none active
- ✅ Shows active terminal info when one is selected
- ✅ Updates when switching between terminals
- ✅ Display updates when terminal is removed

---

#### **Step 6: Main Layout Integration** ⏱️ *~15 minutes*
**Goal**: Put sidebar and display together

**Files to modify:**
- `pages/index.vue` (update terminal section)

**What to build:**
```vue
<!-- Update the terminal section in pages/index.vue -->
<template>
  <div class="container">
    <!-- ... existing header sections ... -->
    
    <main class="main">
      <!-- ... existing welcome section ... -->
      
      <div class="terminal-section">
        <ClientOnly>
          <div class="terminal-layout">
            <TerminalSidebar />
            <TerminalDisplay />
          </div>
          <template #fallback>
            <div class="terminal-loading">Loading terminals...</div>
          </template>
        </ClientOnly>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Import components
import TerminalSidebar from "~/components/terminal/TerminalSidebar.vue"
import TerminalDisplay from "~/components/terminal/TerminalDisplay.vue"
</script>

<style scoped>
.terminal-layout {
  display: flex;
  height: 100%;
  gap: 1rem;
}

.terminal-section {
  flex: 1;
  min-height: 600px;
  height: calc(100vh - 200px);
}
</style>
```

**Test criteria:**
- ✅ Sidebar and main display show side by side
- ✅ Creating terminals via sidebar updates main display
- ✅ Switching terminals updates main display immediately
- ✅ Layout is responsive and usable

---

## 🏁 **Phase 1 Complete Checkpoint**

After completing Steps 1-6, you should have:
- ✅ **Dynamic resource detection** working on any machine
- ✅ **Basic terminal management** (create, switch, delete)
- ✅ **Resource monitoring UI** showing current usage
- ✅ **Working sidebar** with terminal list
- ✅ **Main display area** that responds to selections
- ✅ **User-driven terminal creation** (no auto-creation)

**Time estimate**: ~3 hours of focused work

**Test the complete flow:**
1. Open app → Shows 0/15 terminals (or your machine's limit)
2. Click "New" → Creates Terminal 1, becomes active
3. Click "New" again → Creates Terminal 2, becomes active  
4. Click Terminal 1 in sidebar → Switches display to Terminal 1
5. Try to create 16 terminals → "New" button becomes disabled
6. Remove terminals → Count decreases, "New" becomes enabled

---

## 🔄 **Phase 2: Smart Resource Management & Enhanced Cleanup**

> **Philosophy**: Building on Phase 1 foundation with git integration, real terminal connections, and robust persistence
> 
> Each step maintains **KISS principles** while adding production-ready functionality for AI-assisted development workflows.

---

### **Phase 2A: Git Integration**

#### **Step 7: Basic Git Repository Validation** ⏱️ *~45 minutes*
**Goal**: Validate git repositories and detect branch information

**Prerequisites:**
- ✅ Phase 1 completed (Steps 1-6)
- ✅ `simple-git` package installed (`pnpm install simple-git`)
- ✅ Understanding of git worktree concepts

**Files to create:**
- `composables/useGitRepository.ts`
- `composables/useGitRepository.test.ts`

**What to build:**
```typescript
// KISS: Just the git validation essentials
export interface GitRepoInfo {
  isValidRepo: boolean
  repoPath: string
  currentBranch: string
  availableBranches: string[]
  isClean: boolean
  hasRemote: boolean
  errorMessage?: string
}

export function useGitRepository() {
  const validateGitRepository = async (directoryPath: string): Promise<GitRepoInfo> => {
    const git = simpleGit(directoryPath)
    
    // Check if valid git repo
    const isRepo = await git.checkIsRepo()
    if (!isRepo) return { isValidRepo: false, errorMessage: 'Not a git repository' }
    
    // Get essential info
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD'])
    const branches = await git.branch(['-a'])
    const status = await git.status()
    
    return {
      isValidRepo: true,
      repoPath: directoryPath,
      currentBranch,
      availableBranches: Object.keys(branches.branches),
      isClean: status.files.length === 0,
      hasRemote: (await git.getRemotes()).length > 0
    }
  }
  
  return { validateGitRepository }
}
```

**Definition of Done:**
- ✅ Validates git repositories correctly
- ✅ Returns current branch and available branches
- ✅ Detects clean vs dirty working directory state
- ✅ Handles errors gracefully
- ✅ Tests use memfs for file system mocking

**Integration Checkpoint:**
Ready for Step 8 when `validateGitRepository()` returns comprehensive git repository information.

---

#### **Step 8: Simple Worktree Creation** ⏱️ *~45 minutes*
**Goal**: Create isolated git worktrees for terminal sessions

**Prerequisites:**
- ✅ Step 7 completed (git repository validation working)
- ✅ Understanding of git worktree concepts
- ✅ File system permissions for worktree creation

**Files to create:**
- `server/services/gitWorktree.ts`
- `server/services/gitWorktree.test.ts`

**What to build:**
```typescript
// KISS: Just the worktree management essentials
export interface WorktreeInfo {
  worktreePath: string
  branchName: string
  terminalId: string
  basePath: string
  createdAt: Date
}

export class GitWorktreeService {
  private worktrees = new Map<string, WorktreeInfo>()

  async createWorktree(options: CreateWorktreeOptions): Promise<WorktreeInfo> {
    const git = simpleGit(options.basePath)
    
    // Generate worktree path
    const worktreePath = join(dirname(options.basePath), 'worktrees', 
      `${options.terminalId}-${options.branchName}`)
    
    // Create worktree with optional new branch
    if (options.createBranch) {
      await git.raw(['worktree', 'add', '-b', options.branchName, worktreePath])
    } else {
      await git.raw(['worktree', 'add', worktreePath, options.branchName])
    }
    
    const info = { worktreePath, ...options, createdAt: new Date() }
    this.worktrees.set(options.terminalId, info)
    return info
  }

  async removeWorktree(terminalId: string): Promise<void> {
    const info = this.worktrees.get(terminalId)
    if (!info) return
    
    const git = simpleGit(info.basePath)
    await git.raw(['worktree', 'remove', info.worktreePath, '--force'])
    this.worktrees.delete(terminalId)
  }
}

describe('GitWorktreeService', () => {
  let service: GitWorktreeService

  beforeEach(() => {
    service = new GitWorktreeService()
    vol.reset()
    vi.clearAllMocks()
  })

  it('should create worktree for existing branch', async () => {
    vol.fromJSON({
      '/project/.git/config': '[core]\n\trepositoryformatversion = 0',
      '/project/worktrees': null // Directory
    })

    const options = {
      basePath: '/project',
      branchName: 'feature/test',
      terminalId: 'term123',
      createBranch: false
    }

    const result = await service.createWorktree(options)

    expect(result.terminalId).toBe('term123')
    expect(result.branchName).toBe('feature/test')
    expect(result.worktreePath).toContain('worktrees')
    expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'add', expect.any(String), 'feature/test'])
  })

  it('should create worktree with new branch', async () => {
    vol.fromJSON({
      '/project/.git/config': '[core]\n\trepositoryformatversion = 0'
    })

    const options = {
      basePath: '/project',
      branchName: 'new-feature',
      terminalId: 'term456',
      createBranch: true
    }

    const result = await service.createWorktree(options)

    expect(result.branchName).toBe('new-feature')
    expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'add', '-b', 'new-feature', expect.any(String)])
  })

  it('should remove worktree correctly', async () => {
    // Create worktree first
    vol.fromJSON({
      '/project/.git/config': '[core]\n\trepositoryformatversion = 0'
    })

    const worktree = await service.createWorktree({
      basePath: '/project',
      branchName: 'test',
      terminalId: 'term789'
    })

    // Remove worktree
    await service.removeWorktree('term789')

    expect(mockGit.raw).toHaveBeenCalledWith(['worktree', 'remove', worktree.worktreePath, '--force'])
    expect(service.getWorktree('term789')).toBeUndefined()
  })

  it('should cleanup orphaned worktrees', async () => {
    vol.fromJSON({
      '/project/.git/config': '[core]\n\trepositoryformatversion = 0'
    })

    // Create multiple worktrees
    await service.createWorktree({
      basePath: '/project',
      branchName: 'active',
      terminalId: 'active-terminal'
    })

    await service.createWorktree({
      basePath: '/project',
      branchName: 'orphaned',
      terminalId: 'orphaned-terminal'
    })

    // Cleanup with only one active terminal
    await service.cleanupOrphanedWorktrees(new Set(['active-terminal']))

    expect(service.getWorktree('active-terminal')).toBeDefined()
    expect(service.getWorktree('orphaned-terminal')).toBeUndefined()
  })
})
```

**Definition of Done:**
- ✅ Creates git worktrees in dedicated worktrees directory
- ✅ Supports both existing and new branch creation
- ✅ Tracks worktree-to-terminal mappings correctly
- ✅ Removes worktrees safely with force flag
- ✅ Handles directory creation and validation
- ✅ Provides orphaned worktree cleanup functionality
- ✅ Tests cover creation, removal, and cleanup scenarios
- ✅ Error handling for invalid repositories and path conflicts

**Integration Checkpoint:**
Ready for Step 9 when `GitWorktreeService` can create/remove worktrees and track terminal mappings.

---

#### **Step 9: Update Terminal Creation UI** ⏱️ *~45 minutes*
**Goal**: Enhanced terminal creation modal with git repository integration

**Files to create:**
- `components/terminal/CreateTerminalModal.vue` - Enhanced modal with git integration
- `composables/useSavedDirectories.ts` - Directory persistence management

**Files to modify:**
- `components/terminal/TerminalSidebar.vue` - Integrate modal

**Core Implementation:**

```typescript
// composables/useSavedDirectories.ts
export interface SavedDirectory {
  id: string
  name: string
  path: string
  isValid: boolean
  defaultBranch?: string
}

export function useSavedDirectories() {
  const getSavedDirectories = async (): Promise<SavedDirectory[]>
  const addSavedDirectory = async (directory: Omit<SavedDirectory, 'id'>): Promise<void>
  const removeSavedDirectory = async (directoryId: string): Promise<void>
  
  return { getSavedDirectories, addSavedDirectory, removeSavedDirectory }
}
```

```vue
<!-- components/terminal/CreateTerminalModal.vue -->
<template>
  <AppModal v-model="isOpen">
    <form @submit.prevent="createTerminal">
      <!-- Terminal Name Input -->
      <AppInput v-model="form.name" label="Terminal Name" required />
      
      <!-- Repository Selection -->
      <AppSelect 
        v-model="selectedRepo" 
        :options="savedDirectories"
        label="Repository" 
      />
      
      <!-- Manual Path Entry -->
      <AppInput v-model="form.basePath" label="Repository Path" />
      
      <!-- Branch Selection (when repo is valid) -->
      <AppSelect 
        v-if="repoInfo?.isValidRepo"
        v-model="form.branchName" 
        :options="availableBranches"
        label="Branch" 
      />
      
      <!-- Actions -->
      <AppButton type="submit" :disabled="!canCreate">Create Terminal</AppButton>
      <AppButton variant="secondary" @click="closeModal">Cancel</AppButton>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
const { validateGitRepository } = useGitRepository()
const { getSavedDirectories, addSavedDirectory } = useSavedDirectories()

// Form state and validation
const form = ref({ name: '', basePath: '', branchName: '' })
const repoInfo = ref<GitRepoInfo | null>(null)

// Terminal creation with git integration
const createTerminal = async () => {
  const terminalId = terminalStore.createTerminal({
    name: form.value.name,
    basePath: form.value.basePath,
    branchName: form.value.branchName,
    useGit: true
  })
  
  emit('terminalCreated', terminalId)
  closeModal()
}
</script>
```

**Definition of Done:**
- ✅ Modal integrates git repository validation from Step 7
- ✅ Saved directories persistence for quick repository selection  
- ✅ Form validation prevents invalid terminal creation
- ✅ Branch selection for git repositories
- ✅ Worktree path preview integration
- ✅ Backwards compatible with Phase 2A simple terminal creation

**Integration Checkpoint:**
Ready for Phase 2B when enhanced UI can prepare worktree creation parameters.

---

### **Phase 2B: WebSocket Integration**

#### **Step 10: Basic WebSocket Connection per Terminal** ⏱️ *~45 minutes*
**Goal**: Individual WebSocket connections for isolated terminal communication

**Files to create:**
- `composables/useMultiTerminalWebSocket.ts` - WebSocket management per terminal
- `composables/useMultiTerminalWebSocket.test.ts` - Connection testing

**Files to modify:**
- `stores/terminalManager.ts` - Integrate WebSocket connections

**Core Implementation:**

```typescript
// composables/useMultiTerminalWebSocket.ts
export interface TerminalConnection {
  terminalId: string
  websocket: WebSocket | null
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastActivity: Date
}

export interface MultiTerminalWebSocketOptions {
  terminalId: string
  workingDirectory?: string
  onOutput?: (output: string) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: TerminalConnection['status']) => void
}

export function useMultiTerminalWebSocket(options: MultiTerminalWebSocketOptions) {
  const connection = ref<TerminalConnection>({
    terminalId: options.terminalId,
    websocket: null,
    status: 'disconnected',
    lastActivity: new Date()
  })

  const connect = async (): Promise<void> => {
    const wsUrl = new URL('/api/ws/terminal', window.location.origin)
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws')
    wsUrl.searchParams.set('terminalId', options.terminalId)
    
    if (options.workingDirectory) {
      wsUrl.searchParams.set('cwd', options.workingDirectory)
    }

    const ws = new WebSocket(wsUrl.toString())
    connection.value.websocket = ws
    
    // Setup event handlers for connection lifecycle
    ws.onopen = () => handleConnectionOpen()
    ws.onmessage = (event) => handleMessage(event.data)
    ws.onerror = (event) => handleError(event)
    ws.onclose = (event) => handleClose(event)
  }

  const sendInput = (input: string): boolean => {
    return connection.value.websocket?.send(input) || false
  }

  const disconnect = (): void => {
    connection.value.websocket?.close(1000, 'Client disconnect')
  }

  return { connection, connect, sendInput, disconnect }
}

export function useMultiTerminalManager() {
  const connections = ref(new Map<string, any>())
  
  const createConnection = (options: MultiTerminalWebSocketOptions) => {
    const connection = useMultiTerminalWebSocket(options)
    connections.value.set(options.terminalId, connection)
    return connection
  }

  const removeConnection = (terminalId: string): void => {
    connections.value.get(terminalId)?.disconnect()
    connections.value.delete(terminalId)
  }

  return { connections, createConnection, removeConnection }
}
```

```typescript
// Enhanced stores/terminalManager.ts integration
export const useTerminalManagerStore = defineStore('terminalManager', () => {
  // ... existing Phase 1 code

  const webSocketManager = useMultiTerminalManager()
  const terminalOutputs = ref(new Map<string, string[]>())

  const createTerminalWithGit = async (options: {
    name: string
    basePath?: string
    branchName?: string
  }): Promise<string> => {
    const terminalId = generateTerminalId()
    
    // Create git worktree if git parameters provided
    let worktreePath: string | undefined
    if (options.basePath && options.branchName) {
      worktreePath = await gitWorktreeService.createWorktree({
        basePath: options.basePath,
        branchName: options.branchName,
        terminalId
      })
    }

    // Create terminal with WebSocket connection
    const terminal = {
      id: terminalId,
      name: options.name,
      status: 'connecting',
      worktreePath,
      branchName: options.branchName
    }

    terminals.value.set(terminalId, terminal)

    // Create and connect WebSocket
    const connection = webSocketManager.createConnection({
      terminalId,
      workingDirectory: worktreePath || options.basePath,
      onOutput: (output) => handleTerminalOutput(terminalId, output),
      onStatusChange: (status) => updateTerminalStatus(terminalId, status)
    })

    await connection.connect()
    
    return terminalId
  }

  const sendInput = (terminalId: string, input: string): boolean => {
    return webSocketManager.connections.value.get(terminalId)?.sendInput(input) || false
  }

  return {
    // ... existing exports
    createTerminalWithGit,
    sendInput,
    webSocketManager
  }
})
```

**Definition of Done:**
- ✅ Individual WebSocket connections per terminal with unique URLs
- ✅ Connection lifecycle management (connect, disconnect, error handling)
- ✅ Terminal input/output streaming through WebSocket
- ✅ Integration with git worktree working directories from Step 8
- ✅ Multi-terminal manager coordinates multiple connections
- ✅ Enhanced terminal store manages WebSocket integration
- ✅ Tests cover connection scenarios and multi-terminal coordination

**Integration Checkpoint:**
Ready for Step 11 when terminals have working WebSocket data streams.

---

#### **Step 11: Replace Placeholder with Real Terminal** ⏱️ *~45 minutes*
**Goal**: Replace mock terminal with real xterm.js integration

**Files to create:**
- `components/terminal/XTerminalInstance.vue` - Real xterm.js terminal component
- `components/terminal/XTerminalInstance.test.ts` - Terminal component testing

**Files to modify:**
- `components/terminal/TerminalDisplay.vue` - Use real terminal component

**Core Implementation:**

```vue
<!-- components/terminal/XTerminalInstance.vue -->
<template>
  <div class="xterminal-instance">
    <div class="terminal-header">
      <div class="terminal-info">
        <h4>{{ terminal.name }}</h4>
        <div class="terminal-meta">
          <span class="terminal-id">{{ terminal.id.slice(0, 8) }}</span>
          <span class="connection-status" :class="`status-${terminal.connectionStatus}`">
            {{ terminal.connectionStatus }}
          </span>
          <span v-if="terminal.branchName" class="branch-info">
            📋 {{ terminal.branchName }}
          </span>
        </div>
      </div>
      
      <div class="terminal-controls">
        <AppButton icon="reconnect" @click="reconnect" :disabled="isConnecting" />
        <AppButton icon="trash" variant="danger" @click="$emit('remove')" />
      </div>
    </div>

    <div ref="terminalContainer" class="terminal-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  terminal: EnhancedTerminal
}

const props = defineProps<Props>()
const terminalStore = useTerminalManagerStore()
const terminalContainer = ref<HTMLElement>()

let xterm: Terminal | null = null
let fitAddon: FitAddon | null = null

const initializeTerminal = async (): Promise<void> => {
  if (!terminalContainer.value || xterm) return

  // Create xterm instance with theme
  xterm = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
    theme: { background: '#1a1b26', foreground: '#c0caf5' }
  })

  // Add fit addon for responsive sizing
  fitAddon = new FitAddon()
  xterm.loadAddon(fitAddon)

  // Open terminal and fit to container
  xterm.open(terminalContainer.value)
  await nextTick()
  fitAddon.fit()

  // Setup input/output handling
  xterm.onData((data) => terminalStore.sendInput(props.terminal.id, data))
  xterm.onResize(({ cols, rows }) => {
    const connection = terminalStore.webSocketManager.getConnection(props.terminal.id)
    connection?.resize(cols, rows)
  })

  // Load existing output history
  const outputHistory = terminalStore.getTerminalOutput(props.terminal.id)
  outputHistory.forEach(output => xterm!.write(output))
}

const reconnect = async (): Promise<void> => {
  const connection = terminalStore.webSocketManager.getConnection(props.terminal.id)
  if (connection) {
    connection.disconnect()
    await connection.connect()
  }
}

// Watch for new output and write to xterm
watch(
  () => terminalStore.getTerminalOutput(props.terminal.id),
  (newOutput, oldOutput) => {
    if (!xterm || !newOutput) return
    const newLines = newOutput.slice(oldOutput?.length || 0)
    newLines.forEach(line => xterm!.write(line))
  },
  { deep: true }
)

// Lifecycle management
onMounted(() => initializeTerminal())
onUnmounted(() => {
  if (xterm) {
    xterm.dispose()
    xterm = null
  }
})
</script>
```

```vue
<!-- Updated components/terminal/TerminalDisplay.vue -->
<template>
  <div class="terminal-display">
    <div v-if="!activeTerminal" class="no-terminal">
      <div class="no-terminal-content">
        <h3>No Terminal Selected</h3>
        <p>Create a new terminal or select one from the sidebar</p>
        <AppButton icon="plus" @click="$emit('create-terminal')">
          Create Terminal
        </AppButton>
      </div>
    </div>
    
    <XTerminalInstance
      v-else
      :terminal="activeTerminal"
      @remove="handleRemoveTerminal"
    />
  </div>
</template>

<script setup lang="ts">
import XTerminalInstance from './XTerminalInstance.vue'

const terminalStore = useTerminalManagerStore()

const activeTerminal = computed(() => {
  const activeId = terminalStore.activeTerminalId
  return activeId ? terminalStore.terminals.get(activeId) : null
})

const handleRemoveTerminal = async (): Promise<void> => {
  if (!activeTerminal.value) return
  await terminalStore.removeTerminalWithCleanup(activeTerminal.value.id)
}
</script>
```

**Definition of Done:**
- ✅ Real xterm.js terminal replaces mock placeholder UI
- ✅ Terminal connects to WebSocket streams from Step 10 for I/O
- ✅ Input handling streams user keystrokes to WebSocket
- ✅ Output from WebSocket displays correctly in terminal
- ✅ Terminal responsive sizing and container fitting
- ✅ Connection status indicators and control buttons functional
- ✅ Git branch information displayed in terminal header
- ✅ Proper terminal cleanup and disposal on component removal
- ✅ Tests cover terminal initialization, I/O streaming, and lifecycle

**Integration Checkpoint:**
Ready for Phase 2C when real terminals handle WebSocket I/O correctly.

---

### **Phase 2C: Persistence & Cleanup**

#### **Steps 12-13: Terminal Persistence & Startup Cleanup** ⏱️ *~60 minutes*
**Goal**: Persist terminal state across app restarts and clean up stale resources

**Files to create:**
- `composables/useTerminalPersistence.ts` - Terminal state persistence
- `composables/useStartupCleanup.ts` - Startup cleanup logic
- `plugins/startup-cleanup.client.ts` - Cleanup plugin

**Files to modify:**
- `stores/terminalManager.ts` - Integrate persistence
- `app.vue` - Show startup status

**Core Implementation:**

```typescript
// composables/useTerminalPersistence.ts
export interface PersistedTerminalState {
  terminalId: string
  name: string
  lastActivity: Date
  status: 'connected' | 'disconnected' | 'error' | 'connecting'
  worktreePath?: string
  branchName?: string
  basePath?: string
  createdAt: Date
}

export function useTerminalPersistence() {
  const settingsService = useSettingsService()
  
  const saveTerminalState = async (terminalId: string, state: Partial<PersistedTerminalState>): Promise<void> => {
    const existingStates = await getAllTerminalStates()
    existingStates.set(terminalId, { ...state, terminalId } as PersistedTerminalState)
    
    await settingsService.saveSettings('terminal-states', {
      terminals: Object.fromEntries(existingStates),
      lastUpdate: new Date()
    })
  }
  
  const getAllTerminalStates = async (): Promise<Map<string, PersistedTerminalState>> => {
    const saved = await settingsService.loadSettings('terminal-states')
    const states = new Map<string, PersistedTerminalState>()
    
    if (saved?.terminals) {
      for (const [terminalId, state] of Object.entries(saved.terminals)) {
        states.set(terminalId, state as PersistedTerminalState)
      }
    }
    
    return states
  }

  const removeTerminalState = async (terminalId: string): Promise<void> => {
    const states = await getAllTerminalStates()
    states.delete(terminalId)
    
    await settingsService.saveSettings('terminal-states', {
      terminals: Object.fromEntries(states),
      lastUpdate: new Date()
    })
  }

  return { saveTerminalState, getAllTerminalStates, removeTerminalState }
}
```

```typescript
// composables/useStartupCleanup.ts
export function useStartupCleanup() {
  const terminalStore = useTerminalManagerStore()
  
  const performSafeStartupCleanup = async (): Promise<{
    cleanedStates: number
    cleanedWorktrees: number
    errors: string[]
  }> => {
    const report = { cleanedStates: 0, cleanedWorktrees: 0, errors: [] }

    try {
      // Clean up stale persistent states (7+ days old)
      const persistedStates = await terminalStore.persistence.getAllTerminalStates()
      const now = new Date()
      
      for (const [terminalId, state] of persistedStates) {
        const daysSinceActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceActivity > 7 && state.status === 'disconnected') {
          await terminalStore.persistence.removeTerminalState(terminalId)
          report.cleanedStates++
        }
      }

      // Clean up orphaned worktrees
      const activeTerminalIds = new Set(Array.from(terminalStore.terminals.value.keys()))
      await gitWorktreeService.cleanupOrphanedWorktrees(activeTerminalIds)
      
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return report
  }

  return { performSafeStartupCleanup }
}
```

```typescript
// Enhanced stores/terminalManager.ts with persistence
export const useTerminalManagerStore = defineStore('terminalManager', () => {
  // ... existing code from Steps 7-11

  const persistence = useTerminalPersistence()

  const createTerminalWithPersistence = async (options: {
    name: string
    basePath?: string
    branchName?: string
  }): Promise<string> => {
    const terminalId = await createTerminalWithGit(options)
    
    // Save terminal state for persistence
    await persistence.saveTerminalState(terminalId, {
      terminalId,
      name: options.name,
      status: 'connecting',
      worktreePath: terminals.value.get(terminalId)?.worktreePath,
      branchName: options.branchName,
      basePath: options.basePath,
      createdAt: new Date(),
      lastActivity: new Date()
    })

    return terminalId
  }

  const removeTerminalWithPersistence = async (terminalId: string): Promise<void> => {
    await removeTerminalWithCleanup(terminalId)
    await persistence.removeTerminalState(terminalId)
  }

  return {
    // ... existing exports
    createTerminal: createTerminalWithPersistence,
    removeTerminal: removeTerminalWithPersistence,
    persistence
  }
})
```

```typescript
// plugins/startup-cleanup.client.ts
export default defineNuxtPlugin(async () => {
  const { performSafeStartupCleanup } = useStartupCleanup()
  
  if (process.client) {
    try {
      const report = await performSafeStartupCleanup()
      
      if (report.cleanedStates > 0 || report.cleanedWorktrees > 0) {
        console.log('🧹 Startup cleanup:', report)
      }
    } catch (error) {
      console.error('❌ Startup cleanup failed:', error)
    }
  }
})
```

**Definition of Done:**
- ✅ Terminal state persisted across app restarts using settings service
- ✅ Startup cleanup removes stale states (7+ days old, disconnected)
- ✅ Orphaned git worktrees cleaned up automatically
- ✅ Persistence integrated with terminal store without breaking changes
- ✅ Cleanup failures don't block app startup
- ✅ Simple startup UI shows initialization progress

**Integration Checkpoint:**
Ready for Phase 3 when terminals persist across restarts and startup cleanup works.

---

## 🏁 **Phase 2 Complete Checkpoint**

After completing Steps 7-13, you should have:
- ✅ **Git repository validation and worktree creation** (Steps 7-8)
- ✅ **Enhanced terminal creation with repository selection** (Step 9)
- ✅ **Individual WebSocket connections per terminal** (Step 10)
- ✅ **Real xterm.js terminals with WebSocket integration** (Step 11)
- ✅ **Terminal state persistence across app restarts** (Step 12)
- ✅ **Safe startup cleanup of stale resources** (Step 13)

**Time estimate**: ~5.5 hours of focused work (7 steps)

**Test the complete flow:**
1. Open app → Startup cleanup runs, removes old sessions
2. Create terminal with git repo → Validates repo, creates worktree
3. Use terminal → Real xterm.js with WebSocket, commands work
4. Close/restart app → Terminal state persisted, can be restored
5. Multiple terminals → Each has own WebSocket, git worktree
6. Remove terminal → WebSocket closed, worktree cleaned up, state removed

---

## 🎯 **KISS/YAGNI Principles Applied**

### **What we're NOT building yet:**
- ❌ Settings management UI
- ❌ Advanced cleanup strategies
- ❌ Performance optimizations

### **What we ARE building:**
- ✅ **Minimum viable functionality**
- ✅ **Immediately testable components**
- ✅ **Clear separation of concerns**
- ✅ **Simple, debuggable code**
- ✅ **Foundation for incremental enhancement**

Each step is **small enough to complete in 15-45 minutes** and **immediately testable** so you can verify it works before moving to the next step.

**Ready to start with Step 1?**