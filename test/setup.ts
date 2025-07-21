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
  useState: vi.fn((key: string, initialValue: () => unknown) => ref(initialValue())),
  useNuxtApp: vi.fn(() => ({
    $config: {},
  })),
}));

// Mock Nuxt components and icons
vi.mock("#components", () => ({
  ClientOnly: {
    name: "ClientOnly",
    template: '<template v-if="mounted"><slot /></template><template v-else><slot name="fallback" /></template>',
    data() {
      return { mounted: true }; // Always mounted in tests
    },
  },
  Icon: {
    name: "Icon",
    template: '<span class="mock-icon" :data-icon="name"><slot /></span>',
    props: ["name", "size"],
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

// Mock fs for server-side tests using memfs
vi.mock("fs", async () => {
  const memfs = await vi.importActual("memfs") as { fs: Record<string, unknown> };
  return {
    default: memfs.fs,
    ...memfs.fs,
  };
});

vi.mock("node:fs", async () => {
  const memfs = await vi.importActual("memfs") as { fs: Record<string, unknown> };
  return {
    default: memfs.fs,
    ...memfs.fs,
  };
});

// Global logger mock for clean test output and log assertions
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("~/utils/logger", () => ({
  logger: mockLogger,
}));

// Export the mock for use in test assertions
export { mockLogger };