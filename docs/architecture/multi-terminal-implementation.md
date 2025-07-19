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
// composables/useGitRepository.ts
import { simpleGit, SimpleGit } from 'simple-git'
import { logger } from '~/utils/logger'

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
    try {
      // Check if directory exists and is accessible
      if (!await directoryExists(directoryPath)) {
        return {
          isValidRepo: false,
          repoPath: directoryPath,
          currentBranch: '',
          availableBranches: [],
          isClean: false,
          hasRemote: false,
          errorMessage: 'Directory does not exist or is not accessible'
        }
      }

      const git: SimpleGit = simpleGit(directoryPath)
      
      // Check if it's a git repository
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        return {
          isValidRepo: false,
          repoPath: directoryPath,
          currentBranch: '',
          availableBranches: [],
          isClean: false,
          hasRemote: false,
          errorMessage: 'Directory is not a git repository'
        }
      }

      // Get current branch
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD'])
      
      // Get all branches (local and remote)
      const branchSummary = await git.branch(['-a'])
      const availableBranches = Object.keys(branchSummary.branches)
        .filter(branch => !branch.includes('HEAD'))
        .map(branch => branch.replace('remotes/origin/', ''))
        .filter((branch, index, arr) => arr.indexOf(branch) === index) // Remove duplicates
      
      // Check if working directory is clean
      const status = await git.status()
      const isClean = status.files.length === 0
      
      // Check for remote repository
      const remotes = await git.getRemotes(true)
      const hasRemote = remotes.length > 0

      logger.info('Git repository validated', {
        repoPath: directoryPath,
        currentBranch,
        branchCount: availableBranches.length,
        isClean,
        hasRemote
      })

      return {
        isValidRepo: true,
        repoPath: directoryPath,
        currentBranch,
        availableBranches,
        isClean,
        hasRemote
      }
      
    } catch (error) {
      logger.error('Failed to validate git repository', { error, directoryPath })
      
      return {
        isValidRepo: false,
        repoPath: directoryPath,
        currentBranch: '',
        availableBranches: [],
        isClean: false,
        hasRemote: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown git validation error'
      }
    }
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

  return {
    validateGitRepository,
    canCreateWorktree
  }
}

// Helper function for directory existence check
async function directoryExists(path: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch {
    return false
  }
}
```

**Test file:**
```typescript
// composables/useGitRepository.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { vol } from 'memfs'
import { useGitRepository } from './useGitRepository'

// Mock simple-git
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    checkIsRepo: vi.fn().mockResolvedValue(true),
    revparse: vi.fn().mockResolvedValue('main'),
    branch: vi.fn().mockResolvedValue({
      branches: {
        'main': {},
        'feature/test': {},
        'remotes/origin/main': {},
        'remotes/origin/develop': {}
      }
    }),
    status: vi.fn().mockResolvedValue({ files: [] }),
    getRemotes: vi.fn().mockResolvedValue([{ name: 'origin' }])
  }))
}))

describe('useGitRepository', () => {
  beforeEach(() => {
    vol.reset()
  })

  it('should validate a proper git repository', async () => {
    const { validateGitRepository } = useGitRepository()
    
    // Setup mock directory
    vol.fromJSON({
      '/test/repo/.git/config': '[core]\n\trepositoryformatversion = 0'
    })
    
    const result = await validateGitRepository('/test/repo')
    
    expect(result.isValidRepo).toBe(true)
    expect(result.currentBranch).toBe('main')
    expect(result.availableBranches).toContain('main')
    expect(result.availableBranches).toContain('develop')
    expect(result.isClean).toBe(true)
    expect(result.hasRemote).toBe(true)
  })

  it('should handle non-existent directory', async () => {
    const { validateGitRepository } = useGitRepository()
    
    const result = await validateGitRepository('/nonexistent/path')
    
    expect(result.isValidRepo).toBe(false)
    expect(result.errorMessage).toContain('Directory does not exist')
  })

  it('should check worktree creation eligibility', () => {
    const { canCreateWorktree } = useGitRepository()
    
    const validRepo = {
      isValidRepo: true,
      repoPath: '/test/repo',
      currentBranch: 'main',
      availableBranches: ['main'],
      isClean: true,
      hasRemote: true
    }
    
    const result = canCreateWorktree(validRepo)
    expect(result.canCreate).toBe(true)
  })

  it('should reject worktree creation for dirty repo', () => {
    const { canCreateWorktree } = useGitRepository()
    
    const dirtyRepo = {
      isValidRepo: true,
      repoPath: '/test/repo',
      currentBranch: 'main',
      availableBranches: ['main'],
      isClean: false,
      hasRemote: true
    }
    
    const result = canCreateWorktree(dirtyRepo)
    expect(result.canCreate).toBe(false)
    expect(result.reason).toContain('uncommitted changes')
  })
})
```

**Definition of Done:**
- ✅ Validates git repositories correctly (checks if directory is git repo)
- ✅ Returns current branch and all available branches (local + remote)
- ✅ Detects clean vs dirty working directory state
- ✅ Identifies presence of remote repositories
- ✅ Handles non-existent directories gracefully
- ✅ Provides clear error messages for invalid repositories
- ✅ Tests cover success and failure scenarios
- ✅ `canCreateWorktree` correctly validates preconditions

**Integration Checkpoint:**
Ready for Step 8 when `validateGitRepository()` returns comprehensive git repository information and `canCreateWorktree()` validates worktree creation eligibility.

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
// server/services/gitWorktree.ts
import { simpleGit, SimpleGit } from 'simple-git'
import { join, dirname } from 'path'
import { logger } from '~/utils/logger'

export interface WorktreeInfo {
  worktreePath: string
  branchName: string
  terminalId: string
  basePath: string
  createdAt: Date
}

export interface CreateWorktreeOptions {
  basePath: string
  branchName: string
  terminalId: string
  createBranch?: boolean
}

export class GitWorktreeService {
  private worktrees = new Map<string, WorktreeInfo>()

  async createWorktree(options: CreateWorktreeOptions): Promise<WorktreeInfo> {
    const { basePath, branchName, terminalId, createBranch = false } = options
    
    try {
      const git: SimpleGit = simpleGit(basePath)
      
      // Validate base repository
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        throw new Error(`Base path ${basePath} is not a git repository`)
      }

      // Generate worktree path - place in parallel directory to avoid conflicts
      const repoName = dirname(basePath).split('/').pop() || 'repo'
      const worktreeDir = join(dirname(basePath), 'worktrees')
      const worktreePath = join(worktreeDir, `${repoName}-${terminalId}-${branchName}`)

      // Ensure worktree directory exists
      await this.ensureDirectory(worktreeDir)

      // Check if worktree path already exists
      if (await this.directoryExists(worktreePath)) {
        throw new Error(`Worktree path ${worktreePath} already exists`)
      }

      // Create worktree
      if (createBranch) {
        // Create new branch and worktree
        await git.raw(['worktree', 'add', '-b', branchName, worktreePath])
        logger.info('Created new branch and worktree', { branchName, worktreePath })
      } else {
        // Use existing branch
        await git.raw(['worktree', 'add', worktreePath, branchName])
        logger.info('Created worktree for existing branch', { branchName, worktreePath })
      }

      const worktreeInfo: WorktreeInfo = {
        worktreePath,
        branchName,
        terminalId,
        basePath,
        createdAt: new Date()
      }

      this.worktrees.set(terminalId, worktreeInfo)

      logger.info('Worktree created successfully', {
        terminalId,
        worktreePath,
        branchName,
        basePath
      })

      return worktreeInfo
      
    } catch (error) {
      logger.error('Failed to create worktree', { error, options })
      throw error
    }
  }

  async removeWorktree(terminalId: string): Promise<void> {
    const worktreeInfo = this.worktrees.get(terminalId)
    if (!worktreeInfo) {
      logger.warn('No worktree found for terminal', { terminalId })
      return
    }

    try {
      const git: SimpleGit = simpleGit(worktreeInfo.basePath)
      
      // Remove worktree
      await git.raw(['worktree', 'remove', worktreeInfo.worktreePath, '--force'])
      
      this.worktrees.delete(terminalId)

      logger.info('Worktree removed successfully', {
        terminalId,
        worktreePath: worktreeInfo.worktreePath
      })
      
    } catch (error) {
      logger.error('Failed to remove worktree', { error, terminalId, worktreeInfo })
      // Don't throw - cleanup should be best effort
    }
  }

  getWorktree(terminalId: string): WorktreeInfo | undefined {
    return this.worktrees.get(terminalId)
  }

  getAllWorktrees(): WorktreeInfo[] {
    return Array.from(this.worktrees.values())
  }

  async cleanupOrphanedWorktrees(activeTerminalIds: Set<string>): Promise<void> {
    const allWorktrees = this.getAllWorktrees()
    const orphanedWorktrees = allWorktrees.filter(w => !activeTerminalIds.has(w.terminalId))

    logger.info('Cleaning up orphaned worktrees', { 
      total: allWorktrees.length,
      orphaned: orphanedWorktrees.length 
    })

    for (const worktree of orphanedWorktrees) {
      await this.removeWorktree(worktree.terminalId)
    }
  }

  private async ensureDirectory(path: string): Promise<void> {
    try {
      const fs = await import('fs/promises')
      await fs.mkdir(path, { recursive: true })
    } catch (error) {
      logger.error('Failed to create directory', { error, path })
      throw error
    }
  }

  private async directoryExists(path: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises')
      const stat = await fs.stat(path)
      return stat.isDirectory()
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const gitWorktreeService = new GitWorktreeService()
```

**Test file:**
```typescript
// server/services/gitWorktree.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { vol } from 'memfs'
import { GitWorktreeService } from './gitWorktree'

// Mock simple-git
const mockGit = {
  checkIsRepo: vi.fn().mockResolvedValue(true),
  raw: vi.fn().mockResolvedValue('')
}

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGit)
}))

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
**Goal**: Enhanced terminal creation with git repository selection

**Prerequisites:**
- ✅ Steps 7-8 completed (git validation + worktree service)
- ✅ Basic terminal creation UI from Phase 1
- ✅ Nuxt UI components available

**Files to create:**
- `components/terminal/CreateTerminalModal.vue`
- `composables/useSavedDirectories.ts`

**Files to modify:**
- `components/terminal/TerminalSidebar.vue`

**What to build:**
```typescript
// composables/useSavedDirectories.ts
export interface SavedDirectory {
  id: string
  name: string
  path: string
  description?: string
  lastUsed: Date
  isValid: boolean
  defaultBranch?: string
}

export function useSavedDirectories() {
  const settingsService = useSettingsService()
  const { validateGitRepository } = useGitRepository()

  const getSavedDirectories = async (): Promise<SavedDirectory[]> => {
    try {
      const saved = await settingsService.loadSettings('saved-directories')
      return saved?.directories || []
    } catch (error) {
      logger.error('Failed to load saved directories', { error })
      return []
    }
  }

  const addSavedDirectory = async (directory: Omit<SavedDirectory, 'id' | 'lastUsed' | 'isValid'>): Promise<void> => {
    try {
      const directories = await getSavedDirectories()
      
      const newDirectory: SavedDirectory = {
        ...directory,
        id: `dir_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        lastUsed: new Date(),
        isValid: true
      }

      directories.push(newDirectory)
      
      await settingsService.saveSettings('saved-directories', {
        directories
      })

      logger.info('Added saved directory', { directory: newDirectory })
    } catch (error) {
      logger.error('Failed to add saved directory', { error, directory })
      throw error
    }
  }

  const removeSavedDirectory = async (directoryId: string): Promise<void> => {
    try {
      const directories = await getSavedDirectories()
      const filtered = directories.filter(d => d.id !== directoryId)
      
      await settingsService.saveSettings('saved-directories', {
        directories: filtered
      })

      logger.info('Removed saved directory', { directoryId })
    } catch (error) {
      logger.error('Failed to remove saved directory', { error, directoryId })
      throw error
    }
  }

  const validateSavedDirectories = async (): Promise<void> => {
    try {
      const directories = await getSavedDirectories()
      let hasChanges = false

      for (const directory of directories) {
        const repoInfo = await validateGitRepository(directory.path)
        
        if (directory.isValid !== repoInfo.isValidRepo || directory.defaultBranch !== repoInfo.currentBranch) {
          directory.isValid = repoInfo.isValidRepo
          directory.defaultBranch = repoInfo.currentBranch
          hasChanges = true
        }
      }

      if (hasChanges) {
        await settingsService.saveSettings('saved-directories', {
          directories
        })
        logger.info('Updated saved directory validity status')
      }
    } catch (error) {
      logger.error('Failed to validate saved directories', { error })
    }
  }

  return {
    getSavedDirectories,
    addSavedDirectory,
    removeSavedDirectory,
    validateSavedDirectories
  }
}
```

```vue
<!-- components/terminal/CreateTerminalModal.vue -->
<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Create New Terminal</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Terminal Name -->
        <UFormGroup label="Terminal Name" required>
          <UInput
            v-model="form.name"
            placeholder="e.g., Feature Development"
          />
        </UFormGroup>

        <!-- Repository Selection -->
        <UFormGroup label="Repository" required>
          <div class="space-y-2">
            <!-- Quick Select from Saved -->
            <USelect
              v-model="selectedSavedDir"
              :options="savedDirectoryOptions"
              placeholder="Select from saved repositories..."
              value-attribute="id"
              option-attribute="name"
              @change="onSavedDirectorySelect"
            />

            <!-- Manual Path Entry -->
            <div class="flex gap-2">
              <UInput
                v-model="form.basePath"
                placeholder="/path/to/your/repository"
                @input="onPathChange"
              />
              <UButton
                icon="i-heroicons-folder-open"
                variant="outline"
                @click="selectDirectory"
              />
              <UButton
                icon="i-heroicons-bookmark"
                variant="outline"
                :disabled="!form.basePath"
                @click="saveCurrentDirectory"
              />
            </div>
          </div>
        </UFormGroup>

        <!-- Repository Status -->
        <div v-if="repoInfo" class="p-3 rounded-lg border">
          <div v-if="repoInfo.isValidRepo" class="text-green-600">
            ✅ Valid Git Repository
            <div class="text-sm mt-1">
              <div>Current Branch: <code>{{ repoInfo.currentBranch }}</code></div>
              <div>Status: {{ repoInfo.isClean ? '✅ Clean' : '⚠️ Uncommitted changes' }}</div>
              <div>Remote: {{ repoInfo.hasRemote ? '✅ Available' : '❌ None' }}</div>
            </div>
          </div>
          <div v-else class="text-red-600">
            ❌ {{ repoInfo.errorMessage }}
          </div>
        </div>

        <!-- Branch Selection -->
        <UFormGroup v-if="repoInfo?.isValidRepo" label="Branch" required>
          <USelect
            v-model="form.branchName"
            :options="branchOptions"
            searchable
            creatable
            placeholder="Select or create branch..."
          />
          <template #help>
            <div class="text-xs text-gray-500">
              Select existing branch or type new name to create branch
            </div>
          </template>
        </UFormGroup>

        <!-- Worktree Preview -->
        <div v-if="form.basePath && form.branchName" class="p-3 bg-gray-50 rounded-lg">
          <div class="text-sm">
            <strong>Worktree will be created at:</strong>
            <code class="block mt-1 text-xs">{{ previewWorktreePath }}</code>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="gray"
            variant="outline"
            @click="closeModal"
          >
            Cancel
          </UButton>
          <UButton
            :disabled="!canCreateTerminal"
            :loading="isCreating"
            @click="createTerminal"
          >
            Create Terminal
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'terminalCreated', terminalId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { validateGitRepository } = useGitRepository()
const { getSavedDirectories, addSavedDirectory } = useSavedDirectories()
const terminalStore = useTerminalManagerStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  name: '',
  basePath: '',
  branchName: ''
})

const selectedSavedDir = ref('')
const repoInfo = ref<GitRepoInfo | null>(null)
const isCreating = ref(false)
const savedDirectories = ref<SavedDirectory[]>([])

// Computed properties
const savedDirectoryOptions = computed(() =>
  savedDirectories.value
    .filter(dir => dir.isValid)
    .map(dir => ({
      id: dir.id,
      name: dir.name,
      path: dir.path,
      label: `${dir.name} (${dir.path})`
    }))
)

const branchOptions = computed(() => {
  if (!repoInfo.value?.isValidRepo) return []
  
  return [
    ...repoInfo.value.availableBranches.map(branch => ({
      value: branch,
      label: branch
    }))
  ]
})

const previewWorktreePath = computed(() => {
  if (!form.value.basePath || !form.value.branchName) return ''
  
  const repoName = form.value.basePath.split('/').pop() || 'repo'
  const terminalId = 'terminal-xxx' // Placeholder
  return `${form.value.basePath}/../worktrees/${repoName}-${terminalId}-${form.value.branchName}`
})

const canCreateTerminal = computed(() => {
  return form.value.name.trim() &&
         form.value.basePath.trim() &&
         form.value.branchName.trim() &&
         repoInfo.value?.isValidRepo &&
         terminalStore.canCreateTerminal
})

// Methods
const onSavedDirectorySelect = () => {
  const selected = savedDirectories.value.find(dir => dir.id === selectedSavedDir.value)
  if (selected) {
    form.value.basePath = selected.path
    form.value.branchName = selected.defaultBranch || ''
    onPathChange()
  }
}

const onPathChange = async () => {
  if (!form.value.basePath.trim()) {
    repoInfo.value = null
    return
  }

  try {
    repoInfo.value = await validateGitRepository(form.value.basePath)
    
    // Auto-select current branch if not set
    if (repoInfo.value.isValidRepo && !form.value.branchName) {
      form.value.branchName = repoInfo.value.currentBranch
    }
  } catch (error) {
    logger.error('Failed to validate repository on path change', { error })
  }
}

const selectDirectory = async () => {
  // This would integrate with file system picker in a real app
  // For now, just a placeholder
  console.log('Directory picker would open here')
}

const saveCurrentDirectory = async () => {
  if (!form.value.basePath || !repoInfo.value?.isValidRepo) return

  try {
    await addSavedDirectory({
      name: form.value.name || `Repository ${Date.now()}`,
      path: form.value.basePath,
      description: `Added from terminal creation`,
      defaultBranch: repoInfo.value.currentBranch
    })

    // Refresh saved directories
    await loadSavedDirectories()
  } catch (error) {
    logger.error('Failed to save directory', { error })
  }
}

const createTerminal = async () => {
  if (!canCreateTerminal.value) return

  isCreating.value = true
  
  try {
    // This will be enhanced in Phase 2B with actual worktree creation
    const terminalId = terminalStore.createTerminal(form.value.name)
    
    // For now, just create basic terminal
    // TODO: Integrate with gitWorktreeService in Phase 2B
    
    emit('terminalCreated', terminalId)
    closeModal()
    
  } catch (error) {
    logger.error('Failed to create terminal', { error })
  } finally {
    isCreating.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    basePath: '',
    branchName: ''
  }
  selectedSavedDir.value = ''
  repoInfo.value = null
}

const loadSavedDirectories = async () => {
  try {
    savedDirectories.value = await getSavedDirectories()
  } catch (error) {
    logger.error('Failed to load saved directories', { error })
  }
}

// Lifecycle
onMounted(() => {
  loadSavedDirectories()
})

// Watch for path changes
watch(() => form.value.basePath, onPathChange, { debounce: 500 })
</script>
```

```vue
<!-- Update components/terminal/TerminalSidebar.vue -->
<template>
  <div class="terminal-sidebar">
    <ResourceMonitor />
    
    <div class="sidebar-header">
      <h3>Terminals</h3>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        :disabled="!canCreateTerminal"
        @click="showCreateModal = true"
      >
        New
      </UButton>
    </div>
    
    <!-- Terminal list (existing content) -->
    <div class="terminal-list">
      <!-- ... existing terminal list content ... -->
    </div>

    <!-- Create Terminal Modal -->
    <CreateTerminalModal
      v-model="showCreateModal"
      @terminal-created="onTerminalCreated"
    />
  </div>
</template>

<script setup lang="ts">
// ... existing imports
import CreateTerminalModal from './CreateTerminalModal.vue'

const showCreateModal = ref(false)

// ... existing code

const onTerminalCreated = (terminalId: string) => {
  terminalStore.setActiveTerminal(terminalId)
  showCreateModal.value = false
}

// Remove the old createNewTerminal method - now handled by modal
</script>
```

**Definition of Done:**
- ✅ Enhanced create terminal UI with repository selection
- ✅ Saved directories management working correctly
- ✅ Git repository validation integrated in UI
- ✅ Branch selection supports existing and new branches
- ✅ Worktree path preview shows expected location
- ✅ Form validation prevents invalid terminal creation
- ✅ Save/load directories persistence working
- ✅ Modal integrates with existing terminal sidebar

**Integration Checkpoint:**
Ready for Phase 2B when enhanced terminal creation UI can validate git repositories and prepare for worktree integration.

---

### **Phase 2B: WebSocket Integration**

#### **Step 10: Basic WebSocket Connection per Terminal** ⏱️ *~45 minutes*
**Goal**: Individual WebSocket connections for terminal isolation

**Prerequisites:**
- ✅ Phase 2A completed (Steps 7-9)
- ✅ Existing WebSocket terminal handler from Phase 1
- ✅ Understanding of WebSocket connection management

**Files to create:**
- `composables/useMultiTerminalWebSocket.ts`
- `composables/useMultiTerminalWebSocket.test.ts`

**Files to modify:**
- `stores/terminalManager.ts` (enhance with WebSocket integration)

**What to build:**
```typescript
// composables/useMultiTerminalWebSocket.ts
import { ref, computed, onUnmounted } from 'vue'
import { logger } from '~/utils/logger'

export interface TerminalConnection {
  terminalId: string
  websocket: WebSocket | null
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastActivity: Date
  messageCount: number
  errorCount: number
}

export interface MultiTerminalWebSocketOptions {
  terminalId: string
  workingDirectory?: string
  initialCommand?: string
  onOutput?: (output: string) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: TerminalConnection['status']) => void
}

export function useMultiTerminalWebSocket(options: MultiTerminalWebSocketOptions) {
  const { terminalId, workingDirectory, initialCommand, onOutput, onError, onStatusChange } = options
  
  const connection = ref<TerminalConnection>({
    terminalId,
    websocket: null,
    status: 'disconnected',
    lastActivity: new Date(),
    messageCount: 0,
    errorCount: 0
  })

  const isConnected = computed(() => connection.value.status === 'connected')
  const canSendInput = computed(() => isConnected.value && connection.value.websocket)

  const connect = async (): Promise<void> => {
    if (connection.value.websocket) {
      logger.warn('WebSocket already exists for terminal', { terminalId })
      return
    }

    try {
      connection.value.status = 'connecting'
      onStatusChange?.(connection.value.status)

      // Create WebSocket connection with terminal-specific parameters
      const wsUrl = new URL('/api/ws/terminal', window.location.origin)
      wsUrl.protocol = wsUrl.protocol.replace('http', 'ws')
      wsUrl.searchParams.set('terminalId', terminalId)
      
      if (workingDirectory) {
        wsUrl.searchParams.set('cwd', workingDirectory)
      }

      const ws = new WebSocket(wsUrl.toString())
      connection.value.websocket = ws

      // Setup event handlers
      ws.onopen = () => {
        connection.value.status = 'connected'
        connection.value.lastActivity = new Date()
        onStatusChange?.(connection.value.status)
        
        logger.info('Terminal WebSocket connected', { terminalId })

        // Send initial command if provided
        if (initialCommand) {
          sendInput(initialCommand)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? event.data : event.data.toString()
          
          connection.value.messageCount++
          connection.value.lastActivity = new Date()
          
          // Process output through callback
          onOutput?.(data)
          
          logger.debug('Terminal output received', { 
            terminalId,
            outputLength: data.length,
            messageCount: connection.value.messageCount
          })
          
        } catch (error) {
          logger.error('Failed to process terminal output', { error, terminalId })
          connection.value.errorCount++
        }
      }

      ws.onerror = (event) => {
        const error = new Error(`WebSocket error for terminal ${terminalId}`)
        connection.value.errorCount++
        connection.value.status = 'error'
        onStatusChange?.(connection.value.status)
        
        logger.error('Terminal WebSocket error', { error, terminalId, event })
        onError?.(error)
      }

      ws.onclose = (event) => {
        connection.value.status = 'disconnected'
        connection.value.websocket = null
        onStatusChange?.(connection.value.status)
        
        logger.info('Terminal WebSocket closed', { 
          terminalId,
          code: event.code,
          reason: event.reason
        })
      }

    } catch (error) {
      connection.value.status = 'error'
      connection.value.errorCount++
      onStatusChange?.(connection.value.status)
      
      logger.error('Failed to create terminal WebSocket', { error, terminalId })
      throw error
    }
  }

  const disconnect = (): void => {
    if (connection.value.websocket) {
      try {
        connection.value.websocket.close(1000, 'Client disconnect')
        logger.info('Terminal WebSocket disconnected by client', { terminalId })
      } catch (error) {
        logger.error('Failed to close terminal WebSocket', { error, terminalId })
      } finally {
        connection.value.websocket = null
        connection.value.status = 'disconnected'
        onStatusChange?.(connection.value.status)
      }
    }
  }

  const sendInput = (input: string): boolean => {
    if (!canSendInput.value) {
      logger.warn('Cannot send input - terminal not connected', { terminalId, status: connection.value.status })
      return false
    }

    try {
      connection.value.websocket!.send(input)
      connection.value.lastActivity = new Date()
      
      logger.debug('Terminal input sent', { 
        terminalId,
        inputLength: input.length
      })
      
      return true
    } catch (error) {
      connection.value.errorCount++
      logger.error('Failed to send terminal input', { error, terminalId })
      return false
    }
  }

  const sendCommand = (command: string): boolean => {
    return sendInput(command + '\r')
  }

  const resize = (cols: number, rows: number): boolean => {
    if (!canSendInput.value) {
      return false
    }

    try {
      // Send resize command through WebSocket
      const resizeMessage = JSON.stringify({
        type: 'resize',
        cols,
        rows
      })
      
      connection.value.websocket!.send(resizeMessage)
      
      logger.debug('Terminal resized', { terminalId, cols, rows })
      return true
    } catch (error) {
      logger.error('Failed to resize terminal', { error, terminalId })
      return false
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connection: readonly(connection),
    isConnected,
    canSendInput,
    connect,
    disconnect,
    sendInput,
    sendCommand,
    resize
  }
}

// Multi-terminal management composable
export function useMultiTerminalManager() {
  const connections = ref(new Map<string, ReturnType<typeof useMultiTerminalWebSocket>>())
  const activeConnections = computed(() => 
    Array.from(connections.value.values()).filter(conn => conn.isConnected.value)
  )

  const createConnection = (options: MultiTerminalWebSocketOptions) => {
    const existingConnection = connections.value.get(options.terminalId)
    if (existingConnection) {
      logger.warn('Connection already exists for terminal', { terminalId: options.terminalId })
      return existingConnection
    }

    const connection = useMultiTerminalWebSocket(options)
    connections.value.set(options.terminalId, connection)
    
    logger.info('Created terminal connection', { terminalId: options.terminalId })
    return connection
  }

  const removeConnection = (terminalId: string): void => {
    const connection = connections.value.get(terminalId)
    if (connection) {
      connection.disconnect()
      connections.value.delete(terminalId)
      logger.info('Removed terminal connection', { terminalId })
    }
  }

  const getConnection = (terminalId: string) => {
    return connections.value.get(terminalId)
  }

  const disconnectAll = (): void => {
    for (const [terminalId, connection] of connections.value) {
      connection.disconnect()
    }
    connections.value.clear()
    logger.info('Disconnected all terminal connections')
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnectAll()
  })

  return {
    connections: readonly(connections),
    activeConnections,
    createConnection,
    removeConnection,
    getConnection,
    disconnectAll
  }
}
```

**Test file:**
```typescript
// composables/useMultiTerminalWebSocket.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMultiTerminalWebSocket, useMultiTerminalManager } from './useMultiTerminalWebSocket'

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  readyState: WebSocket.CONNECTING
}))

describe('useMultiTerminalWebSocket', () => {
  let mockWebSocket: any
  let options: any

  beforeEach(() => {
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      readyState: WebSocket.CONNECTING
    }
    
    vi.mocked(WebSocket).mockImplementation(() => mockWebSocket)

    options = {
      terminalId: 'test-terminal',
      workingDirectory: '/test/path',
      onOutput: vi.fn(),
      onError: vi.fn(),
      onStatusChange: vi.fn()
    }
  })

  it('should create WebSocket connection with correct URL', async () => {
    const { connect } = useMultiTerminalWebSocket(options)
    
    await connect()
    
    expect(WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/api/ws/terminal')
    )
    expect(WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('terminalId=test-terminal')
    )
    expect(WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('cwd=/test/path')
    )
  })

  it('should handle WebSocket open event', async () => {
    const { connect, connection } = useMultiTerminalWebSocket(options)
    
    await connect()
    
    // Simulate WebSocket open
    mockWebSocket.onopen()
    
    expect(connection.value.status).toBe('connected')
    expect(options.onStatusChange).toHaveBeenCalledWith('connected')
  })

  it('should handle WebSocket message event', async () => {
    const { connect } = useMultiTerminalWebSocket(options)
    
    await connect()
    
    // Simulate WebSocket message
    const testOutput = 'Hello from terminal'
    mockWebSocket.onmessage({ data: testOutput })
    
    expect(options.onOutput).toHaveBeenCalledWith(testOutput)
  })

  it('should send input correctly', async () => {
    const { connect, sendInput, connection } = useMultiTerminalWebSocket(options)
    
    await connect()
    mockWebSocket.onopen() // Simulate connection
    
    const result = sendInput('test command')
    
    expect(result).toBe(true)
    expect(mockWebSocket.send).toHaveBeenCalledWith('test command')
  })

  it('should send commands with carriage return', async () => {
    const { connect, sendCommand } = useMultiTerminalWebSocket(options)
    
    await connect()
    mockWebSocket.onopen()
    
    sendCommand('ls -la')
    
    expect(mockWebSocket.send).toHaveBeenCalledWith('ls -la\r')
  })

  it('should handle WebSocket errors', async () => {
    const { connect, connection } = useMultiTerminalWebSocket(options)
    
    await connect()
    
    // Simulate WebSocket error
    mockWebSocket.onerror(new Event('error'))
    
    expect(connection.value.status).toBe('error')
    expect(options.onStatusChange).toHaveBeenCalledWith('error')
  })

  it('should disconnect gracefully', async () => {
    const { connect, disconnect, connection } = useMultiTerminalWebSocket(options)
    
    await connect()
    mockWebSocket.onopen()
    
    disconnect()
    
    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Client disconnect')
    expect(connection.value.status).toBe('disconnected')
  })
})

describe('useMultiTerminalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create and manage multiple connections', () => {
    const manager = useMultiTerminalManager()
    
    const conn1 = manager.createConnection({
      terminalId: 'terminal-1',
      onOutput: vi.fn()
    })
    
    const conn2 = manager.createConnection({
      terminalId: 'terminal-2',
      onOutput: vi.fn()
    })
    
    expect(manager.connections.value.size).toBe(2)
    expect(manager.getConnection('terminal-1')).toBe(conn1)
    expect(manager.getConnection('terminal-2')).toBe(conn2)
  })

  it('should remove connections correctly', () => {
    const manager = useMultiTerminalManager()
    
    manager.createConnection({
      terminalId: 'terminal-to-remove',
      onOutput: vi.fn()
    })
    
    expect(manager.connections.value.size).toBe(1)
    
    manager.removeConnection('terminal-to-remove')
    
    expect(manager.connections.value.size).toBe(0)
    expect(manager.getConnection('terminal-to-remove')).toBeUndefined()
  })

  it('should disconnect all connections', () => {
    const manager = useMultiTerminalManager()
    
    manager.createConnection({ terminalId: 'term1', onOutput: vi.fn() })
    manager.createConnection({ terminalId: 'term2', onOutput: vi.fn() })
    
    expect(manager.connections.value.size).toBe(2)
    
    manager.disconnectAll()
    
    expect(manager.connections.value.size).toBe(0)
  })
})
```

**Enhanced terminal store:**
```typescript
// Update stores/terminalManager.ts to integrate WebSocket connections
import { useMultiTerminalManager } from '~/composables/useMultiTerminalWebSocket'
import { gitWorktreeService } from '~/server/services/gitWorktree'

export const useTerminalManagerStore = defineStore('terminalManager', () => {
  // ... existing code from Phase 1

  // Add WebSocket management
  const webSocketManager = useMultiTerminalManager()
  const terminalOutputs = ref(new Map<string, string[]>())

  // Enhanced terminal interface with git integration
  interface EnhancedTerminal extends BasicTerminal {
    worktreePath?: string
    branchName?: string
    basePath?: string
    outputHistory: string[]
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  }

  // Enhanced createTerminal with WebSocket and git integration
  const createTerminalWithGit = async (options: {
    name: string
    basePath?: string
    branchName?: string
    createBranch?: boolean
  }): Promise<string> => {
    if (!canCreateTerminal.value) {
      throw new Error('Terminal limit reached')
    }

    const terminalId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    let worktreePath: string | undefined

    try {
      // Create git worktree if git parameters provided
      if (options.basePath && options.branchName) {
        const worktreeInfo = await gitWorktreeService.createWorktree({
          basePath: options.basePath,
          branchName: options.branchName,
          terminalId,
          createBranch: options.createBranch || false
        })
        worktreePath = worktreeInfo.worktreePath
      }

      // Create enhanced terminal
      const terminal: EnhancedTerminal = {
        id: terminalId,
        name: options.name,
        status: 'connecting',
        isActive: false,
        createdAt: new Date(),
        worktreePath,
        branchName: options.branchName,
        basePath: options.basePath,
        outputHistory: [],
        connectionStatus: 'connecting'
      }

      terminals.value.set(terminalId, terminal)

      // Create WebSocket connection
      const connection = webSocketManager.createConnection({
        terminalId,
        workingDirectory: worktreePath || options.basePath,
        onOutput: (output) => handleTerminalOutput(terminalId, output),
        onError: (error) => handleTerminalError(terminalId, error),
        onStatusChange: (status) => handleConnectionStatusChange(terminalId, status)
      })

      // Connect immediately
      await connection.connect()

      logger.info('Terminal created with git integration', {
        terminalId,
        name: options.name,
        worktreePath,
        branchName: options.branchName
      })

      return terminalId

    } catch (error) {
      // Cleanup on failure
      terminals.value.delete(terminalId)
      if (worktreePath) {
        await gitWorktreeService.removeWorktree(terminalId)
      }
      
      logger.error('Failed to create terminal with git integration', { error, options })
      throw error
    }
  }

  // Enhanced removeTerminal with cleanup
  const removeTerminalWithCleanup = async (terminalId: string): Promise<void> => {
    const terminal = terminals.value.get(terminalId) as EnhancedTerminal
    if (!terminal) return

    try {
      // Disconnect WebSocket
      webSocketManager.removeConnection(terminalId)

      // Cleanup git worktree
      if (terminal.worktreePath) {
        await gitWorktreeService.removeWorktree(terminalId)
      }

      // Remove from store
      terminals.value.delete(terminalId)
      terminalOutputs.value.delete(terminalId)

      // Update active terminal
      if (activeTerminalId.value === terminalId) {
        const remaining = Array.from(terminals.value.keys())
        setActiveTerminal(remaining[0] || null)
      }

      logger.info('Terminal removed with cleanup', { terminalId })

    } catch (error) {
      logger.error('Failed to remove terminal with cleanup', { error, terminalId })
      throw error
    }
  }

  // Output handling
  const handleTerminalOutput = (terminalId: string, output: string): void => {
    const terminal = terminals.value.get(terminalId) as EnhancedTerminal
    if (!terminal) return

    // Add to output history
    terminal.outputHistory.push(output)
    
    // Keep history limited
    if (terminal.outputHistory.length > 1000) {
      terminal.outputHistory = terminal.outputHistory.slice(-500)
    }

    // Store in outputs map for UI access
    if (!terminalOutputs.value.has(terminalId)) {
      terminalOutputs.value.set(terminalId, [])
    }
    terminalOutputs.value.get(terminalId)!.push(output)
  }

  const handleTerminalError = (terminalId: string, error: Error): void => {
    const terminal = terminals.value.get(terminalId) as EnhancedTerminal
    if (terminal) {
      terminal.status = 'disconnected'
      terminal.connectionStatus = 'error'
    }

    logger.error('Terminal connection error', { error, terminalId })
  }

  const handleConnectionStatusChange = (terminalId: string, status: string): void => {
    const terminal = terminals.value.get(terminalId) as EnhancedTerminal
    if (terminal) {
      terminal.connectionStatus = status as any
      
      if (status === 'connected') {
        terminal.status = 'connected'
      }
    }
  }

  // Terminal interaction methods
  const sendInput = (terminalId: string, input: string): boolean => {
    const connection = webSocketManager.getConnection(terminalId)
    return connection?.sendInput(input) || false
  }

  const sendCommand = (terminalId: string, command: string): boolean => {
    const connection = webSocketManager.getConnection(terminalId)
    return connection?.sendCommand(command) || false
  }

  const getTerminalOutput = (terminalId: string): string[] => {
    return terminalOutputs.value.get(terminalId) || []
  }

  return {
    // ... existing Phase 1 exports
    terminals: readonly(terminals),
    activeTerminalId: readonly(activeTerminalId),
    canCreateTerminal,
    setActiveTerminal,
    
    // Enhanced methods
    createTerminalWithGit,
    removeTerminalWithCleanup,
    sendInput,
    sendCommand,
    getTerminalOutput,
    
    // WebSocket manager access
    webSocketManager,
    terminalOutputs: readonly(terminalOutputs)
  }
})
```

**Definition of Done:**
- ✅ Individual WebSocket connections per terminal working
- ✅ Connection state management and error handling
- ✅ Terminal input/output handling through WebSocket
- ✅ Integration with git worktree working directory
- ✅ Multi-terminal manager handles connection lifecycle
- ✅ Enhanced terminal store with WebSocket integration
- ✅ Tests cover connection, messaging, and error scenarios
- ✅ Proper cleanup on terminal removal

**Integration Checkpoint:**
Ready for Step 11 when terminals have working WebSocket connections and can send/receive data.

---

#### **Step 11: Replace Placeholder with Real Terminal** ⏱️ *~45 minutes*
**Goal**: Integrate xterm.js with WebSocket streams for real terminal UI

**Prerequisites:**
- ✅ Step 10 completed (WebSocket connections working)
- ✅ `@xterm/xterm` and addons installed
- ✅ Understanding of xterm.js integration patterns

**Files to create:**
- `components/terminal/XTerminalInstance.vue`
- `components/terminal/XTerminalInstance.test.ts`

**Files to modify:**
- `components/terminal/TerminalDisplay.vue`

**What to build:**
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
        <UButton
          icon="i-heroicons-arrow-path"
          size="xs"
          variant="outline"
          @click="reconnect"
          :disabled="isConnecting"
        />
        <UButton
          icon="i-heroicons-trash"
          size="xs"
          variant="outline"
          color="red"
          @click="$emit('remove')"
        />
      </div>
    </div>

    <div 
      ref="terminalContainer"
      class="terminal-container"
      @contextmenu.prevent
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
  terminal: EnhancedTerminal
}

interface Emits {
  (e: 'remove'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const terminalStore = useTerminalManagerStore()
const terminalContainer = ref<HTMLElement>()

// xterm.js instances
let xterm: Terminal | null = null
let fitAddon: FitAddon | null = null
let webLinksAddon: WebLinksAddon | null = null

const isConnecting = computed(() => props.terminal.connectionStatus === 'connecting')

const initializeTerminal = async (): Promise<void> => {
  if (!terminalContainer.value || xterm) return

  try {
    // Create xterm instance
    xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Menlo", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        selection: '#33467c',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5'
      }
    })

    // Add addons
    fitAddon = new FitAddon()
    webLinksAddon = new WebLinksAddon()
    
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)

    // Open terminal in container
    xterm.open(terminalContainer.value)

    // Fit terminal to container
    await nextTick()
    fitAddon.fit()

    // Setup input handling
    xterm.onData((data) => {
      terminalStore.sendInput(props.terminal.id, data)
    })

    // Setup resize handling
    xterm.onResize(({ cols, rows }) => {
      const connection = terminalStore.webSocketManager.getConnection(props.terminal.id)
      connection?.resize(cols, rows)
    })

    // Load existing output history
    const outputHistory = terminalStore.getTerminalOutput(props.terminal.id)
    outputHistory.forEach(output => {
      xterm!.write(output)
    })

    logger.info('XTerm terminal initialized', { 
      terminalId: props.terminal.id,
      cols: xterm.cols,
      rows: xterm.rows
    })

  } catch (error) {
    logger.error('Failed to initialize XTerm terminal', { 
      error, 
      terminalId: props.terminal.id 
    })
  }
}

const destroyTerminal = (): void => {
  if (xterm) {
    xterm.dispose()
    xterm = null
    fitAddon = null
    webLinksAddon = null
    
    logger.info('XTerm terminal destroyed', { terminalId: props.terminal.id })
  }
}

const reconnect = async (): Promise<void> => {
  const connection = terminalStore.webSocketManager.getConnection(props.terminal.id)
  if (connection) {
    connection.disconnect()
    await connection.connect()
  }
}

const handleResize = (): void => {
  if (fitAddon && xterm) {
    try {
      fitAddon.fit()
    } catch (error) {
      logger.error('Failed to resize terminal', { error, terminalId: props.terminal.id })
    }
  }
}

// Watch for new output and write to xterm
watch(
  () => terminalStore.getTerminalOutput(props.terminal.id),
  (newOutput, oldOutput) => {
    if (!xterm || !newOutput) return

    // Get only the new output since last update
    const newLines = newOutput.slice(oldOutput?.length || 0)
    newLines.forEach(line => {
      xterm!.write(line)
    })
  },
  { deep: true }
)

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeTerminal()
  
  // Setup resize observer
  const resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  
  if (terminalContainer.value) {
    resizeObserver.observe(terminalContainer.value)
  }
  
  // Cleanup observer on unmount
  onUnmounted(() => {
    resizeObserver.disconnect()
    destroyTerminal()
  })
})

// Handle prop changes
watch(() => props.terminal, (newTerminal, oldTerminal) => {
  if (newTerminal.id !== oldTerminal?.id) {
    destroyTerminal()
    nextTick(() => initializeTerminal())
  }
})
</script>

<style scoped>
.xterminal-instance {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-surface-elevated);
  border-bottom: 1px solid var(--color-border);
}

.terminal-info h4 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.terminal-meta {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.terminal-id {
  font-family: var(--font-mono);
  background-color: var(--color-muted);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.connection-status {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

.status-connected {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-connecting {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.status-disconnected,
.status-error {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.branch-info {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.terminal-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.terminal-container {
  flex: 1;
  padding: var(--spacing-sm);
  background-color: #1a1b26;
  overflow: hidden;
}

/* Ensure xterm fills container */
.terminal-container :deep(.xterm) {
  height: 100% !important;
}

.terminal-container :deep(.xterm-viewport) {
  background-color: transparent !important;
}
</style>
```

**Updated TerminalDisplay component:**
```vue
<!-- Update components/terminal/TerminalDisplay.vue -->
<template>
  <div class="terminal-display">
    <div v-if="!activeTerminal" class="no-terminal">
      <div class="no-terminal-content">
        <h3>No Terminal Selected</h3>
        <p>Create a new terminal or select one from the sidebar</p>
        <UButton
          icon="i-heroicons-plus"
          @click="$emit('create-terminal')"
        >
          Create Terminal
        </UButton>
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

interface Emits {
  (e: 'create-terminal'): void
}

const emit = defineEmits<Emits>()
const terminalStore = useTerminalManagerStore()

const activeTerminal = computed(() => {
  const activeId = terminalStore.activeTerminalId
  return activeId ? terminalStore.terminals.get(activeId) : null
})

const handleRemoveTerminal = async (): Promise<void> => {
  if (!activeTerminal.value) return

  try {
    await terminalStore.removeTerminalWithCleanup(activeTerminal.value.id)
  } catch (error) {
    logger.error('Failed to remove terminal', { error })
  }
}
</script>

<style scoped>
.terminal-display {
  display: flex;
  flex: 1;
  height: 100%;
  min-height: 400px;
}

.no-terminal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.no-terminal-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.no-terminal-content h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.no-terminal-content p {
  margin-bottom: var(--spacing-md);
}
</style>
```

**Test file:**
```typescript
// components/terminal/XTerminalInstance.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import XTerminalInstance from './XTerminalInstance.vue'

// Mock xterm.js
const mockTerminal = {
  open: vi.fn(),
  dispose: vi.fn(),
  write: vi.fn(),
  onData: vi.fn(),
  onResize: vi.fn(),
  loadAddon: vi.fn(),
  cols: 80,
  rows: 24
}

const mockFitAddon = {
  fit: vi.fn()
}

vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => mockTerminal)
}))

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(() => mockFitAddon)
}))

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(() => ({}))
}))

// Mock terminal store
const mockTerminalStore = {
  sendInput: vi.fn(),
  getTerminalOutput: vi.fn(() => ['$ echo "hello"', 'hello']),
  webSocketManager: {
    getConnection: vi.fn(() => ({
      resize: vi.fn()
    }))
  },
  removeTerminalWithCleanup: vi.fn()
}

vi.mock('~/stores/terminalManager', () => ({
  useTerminalManagerStore: () => mockTerminalStore
}))

describe('XTerminalInstance', () => {
  let wrapper: any
  let terminal: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    terminal = {
      id: 'test-terminal-123',
      name: 'Test Terminal',
      status: 'connected',
      connectionStatus: 'connected',
      branchName: 'main',
      isActive: true,
      createdAt: new Date(),
      outputHistory: [],
      worktreePath: '/test/worktree'
    }

    wrapper = mount(XTerminalInstance, {
      props: { terminal }
    })
  })

  it('should render terminal header with correct information', () => {
    expect(wrapper.find('h4').text()).toBe('Test Terminal')
    expect(wrapper.find('.terminal-id').text()).toBe('test-ter')
    expect(wrapper.find('.connection-status').text()).toBe('connected')
    expect(wrapper.find('.branch-info').text()).toContain('main')
  })

  it('should initialize xterm on mount', async () => {
    await wrapper.vm.$nextTick()
    
    expect(mockTerminal.open).toHaveBeenCalled()
    expect(mockTerminal.loadAddon).toHaveBeenCalledTimes(2) // fit + weblinks
    expect(mockFitAddon.fit).toHaveBeenCalled()
  })

  it('should handle input data from xterm', async () => {
    await wrapper.vm.$nextTick()
    
    // Get the onData callback
    const onDataCallback = mockTerminal.onData.mock.calls[0][0]
    
    // Simulate user input
    onDataCallback('test input')
    
    expect(mockTerminalStore.sendInput).toHaveBeenCalledWith(
      'test-terminal-123',
      'test input'
    )
  })

  it('should write output history to xterm on initialization', async () => {
    await wrapper.vm.$nextTick()
    
    expect(mockTerminal.write).toHaveBeenCalledWith('$ echo "hello"')
    expect(mockTerminal.write).toHaveBeenCalledWith('hello')
  })

  it('should handle reconnect action', async () => {
    const reconnectButton = wrapper.find('[icon="i-heroicons-arrow-path"]')
    
    await reconnectButton.trigger('click')
    
    const connection = mockTerminalStore.webSocketManager.getConnection()
    // Verify disconnect/connect would be called (mocked)
    expect(mockTerminalStore.webSocketManager.getConnection).toHaveBeenCalled()
  })

  it('should emit remove event when remove button clicked', async () => {
    const removeButton = wrapper.find('[icon="i-heroicons-trash"]')
    
    await removeButton.trigger('click')
    
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('should dispose terminal on unmount', () => {
    wrapper.unmount()
    
    expect(mockTerminal.dispose).toHaveBeenCalled()
  })

  it('should show correct status classes', async () => {
    const statusElement = wrapper.find('.connection-status')
    expect(statusElement.classes()).toContain('status-connected')
    
    // Test different statuses
    await wrapper.setProps({
      terminal: { ...terminal, connectionStatus: 'error' }
    })
    
    expect(wrapper.find('.connection-status').classes()).toContain('status-error')
  })
})
```

**Definition of Done:**
- ✅ Real xterm.js terminal replaces placeholder
- ✅ Terminal connects to WebSocket streams for I/O
- ✅ Input handling from terminal to WebSocket working
- ✅ Output from WebSocket displays in terminal correctly
- ✅ Terminal sizing and fitting works properly
- ✅ Connection status and controls functional
- ✅ Git branch information displayed in header
- ✅ Terminal cleanup and disposal on removal
- ✅ Tests cover terminal initialization, I/O, and lifecycle

**Integration Checkpoint:**
Ready for Phase 2C when real terminals display WebSocket streams and handle user interaction correctly.

---

### **Phase 2C: Persistence & Cleanup**

#### **Step 12: File System State Persistence** ⏱️ *~45 minutes*
**Goal**: Persist terminal state and session information to survive app restarts

**Prerequisites:**
- ✅ Phase 2B completed (Steps 10-11)
- ✅ Settings service available from Phase 1
- ✅ Understanding of terminal lifecycle and state management

**Files to create:**
- `composables/useTerminalPersistence.ts`
- `composables/useTerminalPersistence.test.ts`

**Files to modify:**
- `stores/terminalManager.ts` (integrate persistence)

**What to build:**
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
  activityPattern: {
    commandsExecuted: number
    lastCommand?: string
    avgSessionLength: number
    totalSessions: number
  }
  connectionInfo: {
    totalConnections: number
    lastConnectionTime: Date
    connectionErrors: number
  }
}

export function useTerminalPersistence() {
  const settingsService = useSettingsService()
  
  const saveTerminalState = async (terminalId: string, state: Partial<PersistedTerminalState>): Promise<void> => {
    try {
      const existingStates = await getAllTerminalStates()
      
      const terminalState: PersistedTerminalState = {
        terminalId,
        name: state.name || `Terminal ${terminalId.slice(0, 8)}`,
        lastActivity: state.lastActivity || new Date(),
        status: state.status || 'connecting',
        worktreePath: state.worktreePath,
        branchName: state.branchName,
        basePath: state.basePath,
        createdAt: state.createdAt || new Date(),
        activityPattern: state.activityPattern || {
          commandsExecuted: 0,
          avgSessionLength: 0,
          totalSessions: 1
        },
        connectionInfo: state.connectionInfo || {
          totalConnections: 1,
          lastConnectionTime: new Date(),
          connectionErrors: 0
        }
      }
      
      existingStates.set(terminalId, terminalState)
      
      await settingsService.saveSettings('terminal-states', {
        terminals: Object.fromEntries(existingStates),
        lastUpdate: new Date()
      })
      
      logger.debug('Terminal state saved', { terminalId, state: terminalState })
      
    } catch (error) {
      logger.error('Failed to save terminal state', { error, terminalId })
      throw error
    }
  }
  
  const getAllTerminalStates = async (): Promise<Map<string, PersistedTerminalState>> => {
    try {
      const saved = await settingsService.loadSettings('terminal-states')
      const states = new Map<string, PersistedTerminalState>()
      
      if (saved?.terminals) {
        for (const [terminalId, state] of Object.entries(saved.terminals)) {
          const parsedState = state as any
          states.set(terminalId, {
            ...parsedState,
            lastActivity: new Date(parsedState.lastActivity),
            createdAt: new Date(parsedState.createdAt),
            connectionInfo: {
              ...parsedState.connectionInfo,
              lastConnectionTime: new Date(parsedState.connectionInfo.lastConnectionTime)
            }
          })
        }
      }
      
      logger.debug('Loaded terminal states', { count: states.size })
      return states
    } catch (error) {
      logger.error('Failed to load terminal states', { error })
      return new Map()
    }
  }
  
  const removeTerminalState = async (terminalId: string): Promise<void> => {
    try {
      const existingStates = await getAllTerminalStates()
      existingStates.delete(terminalId)
      
      await settingsService.saveSettings('terminal-states', {
        terminals: Object.fromEntries(existingStates),
        lastUpdate: new Date()
      })
      
      logger.debug('Terminal state removed', { terminalId })
    } catch (error) {
      logger.error('Failed to remove terminal state', { error, terminalId })
      throw error
    }
  }
  
  const getTerminalState = async (terminalId: string): Promise<PersistedTerminalState | null> => {
    const states = await getAllTerminalStates()
    return states.get(terminalId) || null
  }
  
  const updateTerminalActivity = async (terminalId: string, activity: {
    type: 'command' | 'connection' | 'output' | 'error'
    command?: string
    timestamp?: Date
  }): Promise<void> => {
    try {
      const state = await getTerminalState(terminalId)
      if (!state) {
        logger.warn('Cannot update activity for non-existent terminal state', { terminalId })
        return
      }

      state.lastActivity = activity.timestamp || new Date()
      
      switch (activity.type) {
        case 'command':
          state.activityPattern.commandsExecuted++
          if (activity.command) {
            state.activityPattern.lastCommand = activity.command
          }
          break
          
        case 'connection':
          state.connectionInfo.totalConnections++
          state.connectionInfo.lastConnectionTime = new Date()
          break
          
        case 'error':
          state.connectionInfo.connectionErrors++
          break
      }

      await saveTerminalState(terminalId, state)
      
    } catch (error) {
      logger.error('Failed to update terminal activity', { error, terminalId, activity })
    }
  }
  
  const getTerminalStatistics = async (): Promise<{
    totalTerminals: number
    activeTerminals: number
    totalCommands: number
    averageSessionLength: number
    lastActivity: Date | null
  }> => {
    try {
      const states = await getAllTerminalStates()
      const stateArray = Array.from(states.values())
      
      if (stateArray.length === 0) {
        return {
          totalTerminals: 0,
          activeTerminals: 0,
          totalCommands: 0,
          averageSessionLength: 0,
          lastActivity: null
        }
      }

      const activeTerminals = stateArray.filter(s => 
        s.status === 'connected' || s.status === 'connecting'
      ).length
      
      const totalCommands = stateArray.reduce((sum, s) => 
        sum + s.activityPattern.commandsExecuted, 0
      )
      
      const avgSessionLength = stateArray.reduce((sum, s) => 
        sum + s.activityPattern.avgSessionLength, 0
      ) / stateArray.length
      
      const lastActivity = stateArray.reduce((latest, s) => 
        !latest || s.lastActivity > latest ? s.lastActivity : latest,
        null as Date | null
      )

      return {
        totalTerminals: stateArray.length,
        activeTerminals,
        totalCommands,
        averageSessionLength: avgSessionLength,
        lastActivity
      }
      
    } catch (error) {
      logger.error('Failed to calculate terminal statistics', { error })
      return {
        totalTerminals: 0,
        activeTerminals: 0,
        totalCommands: 0,
        averageSessionLength: 0,
        lastActivity: null
      }
    }
  }

  return {
    saveTerminalState,
    getAllTerminalStates,
    removeTerminalState,
    getTerminalState,
    updateTerminalActivity,
    getTerminalStatistics
  }
}
```

**Test file:**
```typescript
// composables/useTerminalPersistence.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTerminalPersistence } from './useTerminalPersistence'

// Mock settings service
const mockSettingsService = {
  saveSettings: vi.fn(),
  loadSettings: vi.fn()
}

vi.mock('~/composables/useSettingsService', () => ({
  useSettingsService: () => mockSettingsService
}))

describe('useTerminalPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettingsService.loadSettings.mockResolvedValue({
      terminals: {},
      lastUpdate: new Date()
    })
  })

  it('should save terminal state correctly', async () => {
    const { saveTerminalState } = useTerminalPersistence()
    
    const terminalState = {
      terminalId: 'test-terminal',
      name: 'Test Terminal',
      status: 'connected' as const,
      lastActivity: new Date(),
      createdAt: new Date()
    }

    await saveTerminalState('test-terminal', terminalState)

    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
      'terminal-states',
      expect.objectContaining({
        terminals: expect.objectContaining({
          'test-terminal': expect.objectContaining({
            terminalId: 'test-terminal',
            name: 'Test Terminal',
            status: 'connected'
          })
        })
      })
    )
  })

  it('should load terminal states correctly', async () => {
    const { getAllTerminalStates } = useTerminalPersistence()
    
    const mockStates = {
      terminals: {
        'terminal-1': {
          terminalId: 'terminal-1',
          name: 'Terminal 1',
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          connectionInfo: {
            lastConnectionTime: new Date().toISOString(),
            totalConnections: 1,
            connectionErrors: 0
          },
          activityPattern: {
            commandsExecuted: 5,
            avgSessionLength: 300,
            totalSessions: 1
          }
        }
      }
    }

    mockSettingsService.loadSettings.mockResolvedValue(mockStates)

    const result = await getAllTerminalStates()

    expect(result.size).toBe(1)
    expect(result.get('terminal-1')).toMatchObject({
      terminalId: 'terminal-1',
      name: 'Terminal 1'
    })
  })

  it('should remove terminal state correctly', async () => {
    const { removeTerminalState, getAllTerminalStates } = useTerminalPersistence()
    
    // Setup initial state
    mockSettingsService.loadSettings.mockResolvedValue({
      terminals: {
        'terminal-1': { terminalId: 'terminal-1', name: 'Terminal 1' },
        'terminal-2': { terminalId: 'terminal-2', name: 'Terminal 2' }
      }
    })

    await removeTerminalState('terminal-1')

    // Verify save was called with terminal-1 removed
    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
      'terminal-states',
      expect.objectContaining({
        terminals: expect.not.objectContaining({
          'terminal-1': expect.anything()
        })
      })
    )
  })

  it('should update terminal activity correctly', async () => {
    const { updateTerminalActivity, getTerminalState } = useTerminalPersistence()
    
    // Setup existing state
    const existingState = {
      terminalId: 'test-terminal',
      name: 'Test Terminal',
      lastActivity: new Date('2023-01-01'),
      createdAt: new Date(),
      activityPattern: {
        commandsExecuted: 5,
        avgSessionLength: 300,
        totalSessions: 1
      },
      connectionInfo: {
        totalConnections: 1,
        lastConnectionTime: new Date('2023-01-01'),
        connectionErrors: 0
      }
    }

    mockSettingsService.loadSettings.mockResolvedValue({
      terminals: {
        'test-terminal': existingState
      }
    })

    await updateTerminalActivity('test-terminal', {
      type: 'command',
      command: 'ls -la',
      timestamp: new Date('2023-01-02')
    })

    // Verify saveTerminalState was called with updated activity
    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
      'terminal-states',
      expect.objectContaining({
        terminals: expect.objectContaining({
          'test-terminal': expect.objectContaining({
            activityPattern: expect.objectContaining({
              commandsExecuted: 6,
              lastCommand: 'ls -la'
            })
          })
        })
      })
    )
  })

  it('should calculate terminal statistics correctly', async () => {
    const { getTerminalStatistics } = useTerminalPersistence()
    
    const now = new Date()
    const mockStates = {
      terminals: {
        'terminal-1': {
          terminalId: 'terminal-1',
          status: 'connected',
          lastActivity: now.toISOString(),
          activityPattern: { commandsExecuted: 10, avgSessionLength: 500 },
          connectionInfo: { totalConnections: 2 }
        },
        'terminal-2': {
          terminalId: 'terminal-2',
          status: 'disconnected',
          lastActivity: new Date(now.getTime() - 3600000).toISOString(),
          activityPattern: { commandsExecuted: 5, avgSessionLength: 300 },
          connectionInfo: { totalConnections: 1 }
        }
      }
    }

    mockSettingsService.loadSettings.mockResolvedValue(mockStates)

    const stats = await getTerminalStatistics()

    expect(stats).toMatchObject({
      totalTerminals: 2,
      activeTerminals: 1, // Only one connected
      totalCommands: 15, // 10 + 5
      averageSessionLength: 400 // (500 + 300) / 2
    })
    expect(stats.lastActivity).toBeInstanceOf(Date)
  })

  it('should handle empty state gracefully', async () => {
    const { getTerminalStatistics } = useTerminalPersistence()
    
    mockSettingsService.loadSettings.mockResolvedValue({
      terminals: {}
    })

    const stats = await getTerminalStatistics()

    expect(stats).toEqual({
      totalTerminals: 0,
      activeTerminals: 0,
      totalCommands: 0,
      averageSessionLength: 0,
      lastActivity: null
    })
  })
})
```

**Enhanced terminal store with persistence:**
```typescript
// Update stores/terminalManager.ts to integrate persistence
import { useTerminalPersistence } from '~/composables/useTerminalPersistence'

export const useTerminalManagerStore = defineStore('terminalManager', () => {
  // ... existing code from Phase 2B

  // Add persistence integration
  const persistence = useTerminalPersistence()

  // Enhanced createTerminal with persistence
  const createTerminalWithPersistence = async (options: {
    name: string
    basePath?: string
    branchName?: string
    createBranch?: boolean
  }): Promise<string> => {
    const terminalId = await createTerminalWithGit(options)
    
    try {
      // Save initial terminal state
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

      // Track connection activity
      await persistence.updateTerminalActivity(terminalId, {
        type: 'connection',
        timestamp: new Date()
      })

      logger.info('Terminal state persisted', { terminalId })
      
    } catch (error) {
      logger.error('Failed to persist terminal state', { error, terminalId })
      // Don't fail terminal creation for persistence errors
    }

    return terminalId
  }

  // Enhanced removeTerminal with persistence cleanup
  const removeTerminalWithPersistence = async (terminalId: string): Promise<void> => {
    await removeTerminalWithCleanup(terminalId)
    
    try {
      await persistence.removeTerminalState(terminalId)
      logger.info('Terminal state persistence cleaned up', { terminalId })
    } catch (error) {
      logger.error('Failed to cleanup terminal state persistence', { error, terminalId })
      // Don't fail terminal removal for persistence errors
    }
  }

  // Enhanced output handling with activity tracking
  const handleTerminalOutputWithPersistence = async (terminalId: string, output: string): Promise<void> => {
    handleTerminalOutput(terminalId, output)
    
    try {
      // Track output activity
      await persistence.updateTerminalActivity(terminalId, {
        type: 'output',
        timestamp: new Date()
      })

      // Track commands if output looks like a command
      if (output.startsWith('$ ') || output.startsWith('# ')) {
        const command = output.slice(2).trim()
        if (command) {
          await persistence.updateTerminalActivity(terminalId, {
            type: 'command',
            command,
            timestamp: new Date()
          })
        }
      }
      
    } catch (error) {
      logger.error('Failed to track terminal activity', { error, terminalId })
      // Don't fail output handling for persistence errors
    }
  }

  // Session restoration on startup
  const restorePersistedSessions = async (): Promise<void> => {
    try {
      const persistedStates = await persistence.getAllTerminalStates()
      const now = new Date()
      
      logger.info('Attempting to restore persisted terminal sessions', { 
        count: persistedStates.size 
      })

      for (const [terminalId, state] of persistedStates) {
        // Only restore recent sessions (within last 24 hours)
        const hoursSinceActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceActivity > 24) {
          logger.debug('Skipping restoration of old terminal session', { 
            terminalId, 
            hoursSinceActivity 
          })
          continue
        }

        // Only restore if git worktree still exists
        if (state.worktreePath && !await directoryExists(state.worktreePath)) {
          logger.debug('Skipping restoration - worktree path no longer exists', { 
            terminalId, 
            worktreePath: state.worktreePath 
          })
          continue
        }

        logger.info('Restoring terminal session', { 
          terminalId: terminalId.slice(0, 8),
          name: state.name,
          lastActivity: state.lastActivity 
        })

        // Note: This is a simplified restoration - doesn't restore full WebSocket state
        // In a full implementation, you might restore terminals as "disconnected" 
        // and allow manual reconnection
      }
      
    } catch (error) {
      logger.error('Failed to restore persisted sessions', { error })
    }
  }

  // Startup cleanup helper
  const performStartupCleanup = async (): Promise<void> => {
    try {
      // Clean up orphaned worktrees
      const activeTerminalIds = new Set(Array.from(terminals.value.keys()))
      await gitWorktreeService.cleanupOrphanedWorktrees(activeTerminalIds)

      // Clean up old persisted states (>7 days)
      const persistedStates = await persistence.getAllTerminalStates()
      const now = new Date()
      
      for (const [terminalId, state] of persistedStates) {
        const daysSinceActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceActivity > 7) {
          logger.info('Cleaning up old persisted terminal state', { 
            terminalId: terminalId.slice(0, 8),
            daysSinceActivity: Math.round(daysSinceActivity)
          })
          await persistence.removeTerminalState(terminalId)
        }
      }

      logger.info('Startup cleanup completed')
      
    } catch (error) {
      logger.error('Failed to perform startup cleanup', { error })
    }
  }

  return {
    // ... existing exports from Phase 2B
    
    // Enhanced methods with persistence
    createTerminal: createTerminalWithPersistence,
    removeTerminal: removeTerminalWithPersistence,
    
    // Session management
    restorePersistedSessions,
    performStartupCleanup,
    
    // Persistence utilities
    getTerminalStatistics: persistence.getTerminalStatistics,
    persistence
  }
})

// Helper function for directory existence check
async function directoryExists(path: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch {
    return false
  }
}
```

**Definition of Done:**
- ✅ Terminal state persisted to file system across app restarts
- ✅ Activity tracking for commands, connections, and errors
- ✅ Session restoration for recent terminals (24 hours)
- ✅ Automatic cleanup of old persisted states (7+ days)
- ✅ Statistics calculation for terminal usage patterns
- ✅ Integration with existing terminal store without breaking changes
- ✅ Tests cover persistence, restoration, and cleanup scenarios
- ✅ Error handling prevents persistence failures from breaking terminal functionality

**Integration Checkpoint:**
Ready for Step 13 when terminal states persist across restarts and activity is tracked properly.

---

#### **Step 13: Startup Cleanup Logic** ⏱️ *~30 minutes*
**Goal**: Safe cleanup of stale connections and orphaned resources on application startup

**Prerequisites:**
- ✅ Step 12 completed (persistence working)
- ✅ Understanding of cleanup safety requirements
- ✅ Git worktree service from Step 8

**Files to create:**
- `plugins/startup-cleanup.client.ts`
- `composables/useStartupCleanup.ts`

**Files to modify:**
- `app.vue` (integrate startup logic)

**What to build:**
```typescript
// composables/useStartupCleanup.ts
export function useStartupCleanup() {
  const terminalStore = useTerminalManagerStore()
  const systemResources = useSystemResources()
  const { gitWorktreeService } = useGitWorktree()
  
  interface CleanupReport {
    orphanedWorktrees: number
    stalePersistentStates: number
    cleanedTerminals: number
    errors: string[]
    duration: number
  }

  const performSafeStartupCleanup = async (): Promise<CleanupReport> => {
    const startTime = Date.now()
    const report: CleanupReport = {
      orphanedWorktrees: 0,
      stalePersistentStates: 0,
      cleanedTerminals: 0,
      errors: [],
      duration: 0
    }

    logger.info('Starting safe startup cleanup...')

    try {
      // Step 1: Detect system resources first
      systemResources.detectSystemCapability()
      
      // Step 2: Clean up orphaned worktrees (very conservative)
      await cleanupOrphanedWorktrees(report)
      
      // Step 3: Clean up stale persistent states
      await cleanupStalePersistentStates(report)
      
      // Step 4: Validate existing terminal connections
      await validateExistingConnections(report)

      report.duration = Date.now() - startTime
      
      logger.info('Startup cleanup completed', {
        report,
        duration: `${report.duration}ms`
      })

    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : 'Unknown cleanup error')
      logger.error('Startup cleanup failed', { error, report })
    }

    return report
  }

  const cleanupOrphanedWorktrees = async (report: CleanupReport): Promise<void> => {
    try {
      // Get all persisted terminal states
      const persistedStates = await terminalStore.persistence.getAllTerminalStates()
      const knownWorktrees = new Set<string>()
      
      // Collect all known worktree paths from persisted states
      for (const state of persistedStates.values()) {
        if (state.worktreePath) {
          knownWorktrees.add(state.worktreePath)
        }
      }

      // Get all actual worktrees from git service
      const allWorktrees = gitWorktreeService.getAllWorktrees()
      
      // Find orphaned worktrees (exist in git but not in any persisted state)
      for (const worktree of allWorktrees) {
        if (!knownWorktrees.has(worktree.worktreePath)) {
          // Check if worktree is truly orphaned (older than 24 hours)
          const hoursSinceCreation = (Date.now() - worktree.createdAt.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceCreation > 24) {
            logger.info('Cleaning up orphaned worktree', {
              terminalId: worktree.terminalId.slice(0, 8),
              worktreePath: worktree.worktreePath,
              hoursSinceCreation: Math.round(hoursSinceCreation)
            })
            
            await gitWorktreeService.removeWorktree(worktree.terminalId)
            report.orphanedWorktrees++
          }
        }
      }
      
    } catch (error) {
      const errorMsg = `Failed to cleanup orphaned worktrees: ${error instanceof Error ? error.message : 'Unknown error'}`
      report.errors.push(errorMsg)
      logger.error(errorMsg, { error })
    }
  }

  const cleanupStalePersistentStates = async (report: CleanupReport): Promise<void> => {
    try {
      const persistedStates = await terminalStore.persistence.getAllTerminalStates()
      const now = new Date()
      const staleTerminalIds: string[] = []

      for (const [terminalId, state] of persistedStates) {
        // Conservative stale detection - only remove very old states
        const daysSinceActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        
        // Only remove states that are:
        // 1. Older than 7 days
        // 2. Have no associated worktree directory
        // 3. Were last disconnected (not connecting/connected)
        if (daysSinceActivity > 7 && 
            state.status === 'disconnected' &&
            (!state.worktreePath || !await directoryExists(state.worktreePath))) {
          
          staleTerminalIds.push(terminalId)
        }
      }

      // Remove stale states
      for (const terminalId of staleTerminalIds) {
        logger.info('Removing stale persistent state', {
          terminalId: terminalId.slice(0, 8),
          daysSinceActivity: Math.round(
            (now.getTime() - persistedStates.get(terminalId)!.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          )
        })
        
        await terminalStore.persistence.removeTerminalState(terminalId)
        report.stalePersistentStates++
      }
      
    } catch (error) {
      const errorMsg = `Failed to cleanup stale persistent states: ${error instanceof Error ? error.message : 'Unknown error'}`
      report.errors.push(errorMsg)
      logger.error(errorMsg, { error })
    }
  }

  const validateExistingConnections = async (report: CleanupReport): Promise<void> => {
    try {
      // Check if there are any active terminals from previous session
      const activeConnections = terminalStore.webSocketManager.activeConnections.value
      
      if (activeConnections.length > 0) {
        logger.info('Found existing terminal connections from previous session', {
          count: activeConnections.length
        })

        // Validate each connection
        for (const connection of activeConnections) {
          const terminalId = connection.connection.value.terminalId
          
          // Check if connection is actually responsive
          if (connection.isConnected.value) {
            // Update activity to mark as recently validated
            await terminalStore.persistence.updateTerminalActivity(terminalId, {
              type: 'connection',
              timestamp: new Date()
            })
          } else {
            // Clean up non-responsive connections
            terminalStore.webSocketManager.removeConnection(terminalId)
            report.cleanedTerminals++
          }
        }
      }
      
    } catch (error) {
      const errorMsg = `Failed to validate existing connections: ${error instanceof Error ? error.message : 'Unknown error'}`
      report.errors.push(errorMsg)
      logger.error(errorMsg, { error })
    }
  }

  // Optional: Attempt session restoration (disabled by default for safety)
  const attemptSessionRestoration = async (maxSessions: number = 3): Promise<number> => {
    try {
      const persistedStates = await terminalStore.persistence.getAllTerminalStates()
      const now = new Date()
      let restoredCount = 0

      // Sort by most recent activity
      const recentStates = Array.from(persistedStates.values())
        .filter(state => {
          const hoursSinceActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60 * 60)
          return hoursSinceActivity <= 6 && // Within last 6 hours
                 state.status === 'connected' && // Was previously connected
                 state.worktreePath && // Has worktree
                 directoryExists(state.worktreePath) // Worktree still exists
        })
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        .slice(0, maxSessions) // Limit restoration count

      for (const state of recentStates) {
        if (restoredCount >= maxSessions) break

        logger.info('Attempting session restoration', {
          terminalId: state.terminalId.slice(0, 8),
          name: state.name,
          lastActivity: state.lastActivity
        })

        // Create new terminal with same configuration
        // Note: This creates a new terminal rather than restoring the exact session
        const newTerminalId = await terminalStore.createTerminal({
          name: `${state.name} (Restored)`,
          basePath: state.basePath,
          branchName: state.branchName
        })

        if (newTerminalId) {
          restoredCount++
        }
      }

      logger.info('Session restoration completed', { restoredCount })
      return restoredCount
      
    } catch (error) {
      logger.error('Failed to restore sessions', { error })
      return 0
    }
  }

  return {
    performSafeStartupCleanup,
    attemptSessionRestoration
  }
}

// Helper function for directory existence check
async function directoryExists(path: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch {
    return false
  }
}
```

**Startup plugin:**
```typescript
// plugins/startup-cleanup.client.ts
export default defineNuxtPlugin(async () => {
  const { performSafeStartupCleanup } = useStartupCleanup()
  
  // Perform cleanup on app startup (client-side only)
  if (process.client) {
    try {
      const report = await performSafeStartupCleanup()
      
      // Log cleanup summary
      if (report.orphanedWorktrees > 0 || report.stalePersistentStates > 0 || report.cleanedTerminals > 0) {
        console.log('🧹 Startup cleanup completed:', {
          orphanedWorktrees: report.orphanedWorktrees,
          stalePersistentStates: report.stalePersistentStates,
          cleanedTerminals: report.cleanedTerminals,
          duration: `${report.duration}ms`
        })
      }

      if (report.errors.length > 0) {
        console.warn('⚠️ Startup cleanup had errors:', report.errors)
      }
      
    } catch (error) {
      console.error('❌ Startup cleanup failed:', error)
      // Don't block app startup for cleanup failures
    }
  }
})
```

**App integration:**
```vue
<!-- Update app.vue to show cleanup status -->
<template>
  <div id="app">
    <div v-if="isStartingUp" class="startup-overlay">
      <div class="startup-content">
        <h3>Initializing AI Controller...</h3>
        <p>Cleaning up previous sessions and preparing terminals</p>
        <div class="loading-spinner" />
      </div>
    </div>
    
    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
const isStartingUp = ref(true)

onMounted(async () => {
  // Allow startup cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 1000))
  isStartingUp.value = false
})
</script>

<style scoped>
.startup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.startup-content {
  text-align: center;
  color: var(--color-text-primary);
}

.startup-content h3 {
  margin-bottom: var(--spacing-sm);
}

.startup-content p {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-muted);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

**Definition of Done:**
- ✅ Safe startup cleanup removes only truly stale resources
- ✅ Orphaned worktrees cleaned up (24+ hours old, no persistent state)
- ✅ Stale persistent states removed (7+ days, disconnected, no worktree)
- ✅ Existing connections validated and non-responsive ones cleaned
- ✅ Cleanup report shows what was cleaned and any errors
- ✅ Optional session restoration for recent sessions (disabled by default)
- ✅ Startup UI shows cleanup progress to user
- ✅ Cleanup failures don't block application startup

**Integration Checkpoint:**
Ready for Phase 3 when startup cleanup safely removes stale resources without affecting active sessions.

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