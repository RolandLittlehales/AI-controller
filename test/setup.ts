import { vi } from 'vitest'

// Global mocks for browser-only libraries
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    focus: vi.fn(),
    loadAddon: vi.fn()
  }))
}))

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(() => ({
    fit: vi.fn()
  }))
}))

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(() => ({}))
}))

// Mock browser globals
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'http:',
    host: 'localhost:3000'
  },
  writable: true
})

// Mock process.cwd for browser context
if (typeof process === 'undefined') {
  (globalThis as { process?: { cwd: () => string } }).process = {
    cwd: () => '/home/user'
  }
}