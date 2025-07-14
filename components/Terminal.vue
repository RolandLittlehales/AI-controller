<template>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="terminal-title">
        <Icon name="i-heroicons-terminal" class="terminal-icon" />
        Terminal {{ terminalId ? `(${terminalId.slice(0, 8)})` : '' }}
      </div>
      <div class="terminal-controls">
        <UButton 
          v-if="!isConnected"
          size="xs"
          color="primary"
          :loading="isConnecting"
          @click="connect"
        >
          Connect
        </UButton>
        <UButton 
          v-else
          size="xs"
          color="red"
          @click="disconnect"
        >
          Disconnect
        </UButton>
      </div>
    </div>
    
    <div v-if="!isConnected" class="terminal-status">
      <div class="status-message">
        <Icon name="i-heroicons-exclamation-triangle" />
        {{ statusMessage }}
      </div>
    </div>

    <div 
      ref="terminalRef" 
      class="terminal-content"
      :class="{ 'terminal-disconnected': !isConnected }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import type { WebSocketMessage, TerminalMessage } from '~/types'
import { logger } from '~/utils/logger'

// Terminal library interfaces
interface XTerminalConstructor {
  new (config: Record<string, unknown>): XTerminalInstance
}

interface XTerminalInstance {
  open(element: HTMLElement): void
  write(data: string): void
  dispose(): void
  onData(callback: (data: string) => void): void
  onResize(callback: (size: { cols: number; rows: number }) => void): void
  focus(): void
  loadAddon(addon: unknown): void
}

interface XAddonConstructor {
  new (): XAddonInstance
  [key: string]: unknown
}

interface XAddonInstance {
  fit?(): void
  [key: string]: unknown
}

// Dynamic imports for browser-only modules
let Terminal: XTerminalConstructor
let FitAddon: XAddonConstructor
let WebLinksAddon: XAddonConstructor

interface Props {
  cwd?: string
  rows?: number
  cols?: number
  autoConnect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cwd: '',
  rows: 24,
  cols: 80,
  autoConnect: true
})

const emit = defineEmits<{
  connected: [terminalId: string]
  disconnected: []
  error: [message: string]
}>()

// Terminal state
const terminalRef = ref<HTMLDivElement>()
const terminal = ref<XTerminalInstance>()
const fitAddon = ref<XAddonInstance>()
const webLinksAddon = ref<XAddonInstance>()

// Connection state
const ws = ref<WebSocket>()
const isConnected = ref(false)
const isConnecting = ref(false)
const terminalId = ref<string>()
const statusMessage = ref('Terminal not connected')

// Terminal configuration
const terminalConfig = {
  fontFamily: 'Fira Code, JetBrains Mono, Monaco, Consolas, monospace',
  fontSize: 14,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: 'block' as const,
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    selection: '#264f78',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff'
  }
}

onMounted(async () => {
  await initializeTerminal()
  if (props.autoConnect) {
    await connect()
  }
})

onUnmounted(() => {
  cleanup()
})

async function initializeTerminal() {
  if (!terminalRef.value) return

  try {
    // Dynamic imports for browser-only modules
    if (!Terminal) {
      const xterm = await import('@xterm/xterm')
      const fitAddon = await import('@xterm/addon-fit')
      const webLinksAddon = await import('@xterm/addon-web-links')
      
      Terminal = xterm.Terminal
      FitAddon = fitAddon.FitAddon as unknown as XAddonConstructor
      WebLinksAddon = webLinksAddon.WebLinksAddon as unknown as XAddonConstructor
    }

    // Create terminal instance
    terminal.value = new Terminal(terminalConfig)
    
    // Create addons
    fitAddon.value = new FitAddon() as XAddonInstance
    webLinksAddon.value = new WebLinksAddon() as XAddonInstance
    
    // Load addons
    terminal.value.loadAddon(fitAddon.value)
    terminal.value.loadAddon(webLinksAddon.value)
    
    // Open terminal in DOM
    terminal.value.open(terminalRef.value)
    
    // Handle terminal input
    terminal.value.onData((data: string) => {
      if (isConnected.value && ws.value && terminalId.value) {
        const message: TerminalMessage = {
          type: 'terminal-data',
          terminalId: terminalId.value,
          data: { input: data },
          timestamp: new Date()
        }
        ws.value.send(JSON.stringify(message))
      }
    })
    
    // Handle resize
    terminal.value.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      if (isConnected.value && ws.value && terminalId.value) {
        const message: WebSocketMessage = {
          type: 'terminal-resize',
          terminalId: terminalId.value,
          data: { cols, rows },
          timestamp: new Date()
        }
        ws.value.send(JSON.stringify(message))
      }
    })
    
    // Fit terminal to container
    await nextTick()
    fitAddon.value?.fit?.()
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize)
    
  } catch (error) {
    logger.error('Terminal initialization failed', error, { component: 'Terminal', action: 'initialize' })
    statusMessage.value = 'Failed to initialize terminal'
    emit('error', 'Failed to initialize terminal')
  }
}

async function connect() {
  if (isConnecting.value || isConnected.value) return
  
  isConnecting.value = true
  statusMessage.value = 'Connecting...'
  
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws/terminal`
    
    ws.value = new WebSocket(wsUrl)
    
    ws.value.onopen = () => {
      
      // Request terminal creation
      const message: WebSocketMessage = {
        type: 'terminal-create',
        data: {
          cols: props.cols,
          rows: props.rows,
          cwd: props.cwd || (typeof process !== 'undefined' && process.cwd?.() || '/')
        },
        timestamp: new Date()
      }
      
      ws.value!.send(JSON.stringify(message))
    }
    
    ws.value.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (error) {
        logger.error('Invalid WebSocket message received', error, { component: 'Terminal', action: 'message' })
      }
    }
    
    ws.value.onclose = () => {
      isConnected.value = false
      isConnecting.value = false
      statusMessage.value = 'Terminal disconnected'
      emit('disconnected')
    }
    
    ws.value.onerror = (error) => {
      logger.error('WebSocket connection error', error, { component: 'Terminal', action: 'websocket' })
      isConnected.value = false
      isConnecting.value = false
      statusMessage.value = 'Connection error'
      emit('error', 'WebSocket connection error')
    }
    
  } catch (error) {
    logger.error('Terminal connection failed', error, { component: 'Terminal', action: 'connect' })
    isConnecting.value = false
    statusMessage.value = 'Failed to connect'
    emit('error', 'Failed to connect to terminal')
  }
}

function disconnect() {
  if (!isConnected.value) return
  
  if (ws.value && terminalId.value) {
    // Send destroy message
    const message: WebSocketMessage = {
      type: 'terminal-destroy',
      terminalId: terminalId.value,
      data: {},
      timestamp: new Date()
    }
    ws.value.send(JSON.stringify(message))
  }
  
  cleanup()
}

function handleWebSocketMessage(message: WebSocketMessage) {
  switch (message.type) {
    case 'terminal-created':
      isConnected.value = true
      isConnecting.value = false
      terminalId.value = message.terminalId
      statusMessage.value = 'Terminal connected'
      terminal.value?.focus()
      emit('connected', message.terminalId!)
      break
      
    case 'terminal-data':
      if (terminal.value && message.data && typeof message.data === 'object' && 'output' in message.data) {
        terminal.value.write(message.data.output as string)
      }
      break
      
    case 'terminal-exit':
      terminal.value?.write('\r\n\x1b[31mTerminal process exited\x1b[0m\r\n')
      setTimeout(() => {
        disconnect()
      }, 1000)
      break
      
    case 'terminal-destroyed':
      disconnect()
      break
      
    case 'error': {
      logger.error('Terminal error received', message.data, { component: 'Terminal', action: 'handleMessage' })
      const errorMessage = (message.data && typeof message.data === 'object' && 'message' in message.data) 
        ? message.data.message as string 
        : 'Terminal error'
      statusMessage.value = errorMessage
      emit('error', errorMessage)
      break
    }
  }
}

function handleWindowResize() {
  if (fitAddon.value && terminal.value) {
    fitAddon.value?.fit?.()
  }
}

function cleanup() {
  if (ws.value) {
    ws.value.close()
    ws.value = undefined
  }
  
  if (terminal.value) {
    terminal.value.dispose()
    terminal.value = undefined
  }
  
  window.removeEventListener('resize', handleWindowResize)
  
  isConnected.value = false
  isConnecting.value = false
  terminalId.value = undefined
  statusMessage.value = 'Terminal not connected'
}

// Public methods
defineExpose({
  connect,
  disconnect,
  isConnected: readonly(isConnected),
  terminalId: readonly(terminalId)
})
</script>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #333;
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d4d4d4;
  font-size: 14px;
  font-weight: 500;
}

.terminal-icon {
  width: 16px;
  height: 16px;
}

.terminal-controls {
  display: flex;
  gap: 8px;
}

.terminal-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #333;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f59e0b;
  font-size: 14px;
}

.terminal-content {
  flex: 1;
  min-height: 0;
  background-color: #1e1e1e;
}

.terminal-disconnected {
  opacity: 0.5;
  pointer-events: none;
}

/* Hide scrollbars in terminal */
.terminal-content :deep(.xterm-viewport) {
  scrollbar-width: thin;
  scrollbar-color: #666 #1e1e1e;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: #1e1e1e;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: #666;
  border-radius: 4px;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: #888;
}
</style>