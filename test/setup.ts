import { vi } from "vitest";
import { ref } from "vue";

// Global mocks for browser-only libraries
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    focus: vi.fn(),
    loadAddon: vi.fn(),
  })),
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: vi.fn(() => ({
    fit: vi.fn(),
  })),
}));

vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: vi.fn(() => ({})),
}));

// Mock Nuxt composables
vi.mock("nuxt/app", () => ({
  useCookie: vi.fn(() => ref(undefined)),
  useState: vi.fn((key: string, initialValue: () => any) => ref(initialValue())),
  useNuxtApp: vi.fn(() => ({
    $config: {},
  })),
}));

// Mock ClientOnly component
vi.mock("#components", () => ({
  ClientOnly: {
    name: "ClientOnly",
    render: (props: any, { slots }: any) => slots.default?.(),
  },
}));

// Mock browser globals
Object.defineProperty(window, "location", {
  value: {
    protocol: "http:",
    host: "localhost:3000",
  },
  writable: true,
});

// Mock matchMedia for theme detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock process.cwd for browser context
if (typeof process === "undefined") {
  (globalThis as { process?: { cwd: () => string } }).process = {
    cwd: () => "/home/user",
  };
}