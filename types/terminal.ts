/**
 * Terminal-specific type definitions
 *
 * Contains all xterm.js related interfaces and types used across
 * terminal components and composables.
 */

// xterm.js Terminal Instance
export interface XTerminalInstance {
  [key: string]: unknown;
  open(element: HTMLElement): void;
  write(data: string): void;
  dispose(): void;
  onData(callback: (data: string) => void): void;
  onResize(callback: (size: { cols: number; rows: number }) => void): void;
  focus(): void;
  loadAddon(addon: unknown): void;
}

// xterm.js Terminal Constructor
export interface XTerminalConstructor {
  new (config: XTermOptions): XTerminalInstance;
}

// xterm.js Fit Addon
export interface XTermFitAddon {
  [key: string]: unknown;
  fit(): void;
}

export interface XTermFitAddonConstructor {
  new (): XTermFitAddon;
}

// xterm.js Web Links Addon
export interface XTermWebLinksAddon {
  [key: string]: unknown;
}

export interface XTermWebLinksAddonConstructor {
  new (): XTermWebLinksAddon;
}

// xterm.js Configuration Options
export interface XTermOptions {
  [key: string]: unknown;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  cursorBlink?: boolean;
  cursorStyle?: string;
  theme?: Record<string, unknown>;
}

// Terminal Configuration with default values
export interface TerminalConfig extends XTermOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorBlink: boolean;
  cursorStyle: string;
  theme: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

// Terminal Props interface
export interface TerminalProps {
  cwd?: string;
  rows?: number;
  cols?: number;
  autoConnect?: boolean;
}

// Terminal Emits interface
export interface TerminalEmits {
  connected: [terminalId: string];
  disconnected: [];
  error: [message: string];
}

// Terminal size interface
export interface TerminalSize {
  cols: number;
  rows: number;
}

// Default terminal configuration
export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  fontFamily: "Fira Code, JetBrains Mono, Monaco, Consolas, monospace",
  fontSize: 14,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: "block",
  theme: {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    cursor: "#ffffff",
    selection: "#264f78",
    black: "#000000",
    red: "#cd3131",
    green: "#0dbc79",
    yellow: "#e5e510",
    blue: "#2472c8",
    magenta: "#bc3fbc",
    cyan: "#11a8cd",
    white: "#e5e5e5",
    brightBlack: "#666666",
    brightRed: "#f14c4c",
    brightGreen: "#23d18b",
    brightYellow: "#f5f543",
    brightBlue: "#3b8eea",
    brightMagenta: "#d670d6",
    brightCyan: "#29b8db",
    brightWhite: "#ffffff",
  },
};