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

## 🔄 **Next Phase Preview**

**Phase 2A**: Git Integration (KISS approach)
- Step 7: Basic git repository validation
- Step 8: Simple worktree creation
- Step 9: Update terminal creation UI

**Phase 2B**: WebSocket Integration
- Step 10: Basic WebSocket connection per terminal
- Step 11: Replace placeholder with real terminal

**Phase 2C**: Persistence & Cleanup
- Step 12: File system state persistence
- Step 13: Startup cleanup logic

---

## 🎯 **KISS/YAGNI Principles Applied**

### **What we're NOT building yet:**
- ❌ Complex terminal previews
- ❌ Advanced UI animations  
- ❌ API call monitoring
- ❌ Terminal output parsing
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