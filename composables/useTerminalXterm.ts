import { ref, nextTick } from "vue";
import type {
  XTerminalInstance,
  XTerminalConstructor,
  XTermFitAddon,
  XTermFitAddonConstructor,
  XTermWebLinksAddon,
  XTermWebLinksAddonConstructor,
  XTermOptions,
  TerminalSize,
} from "~/types/terminal";
import { DEFAULT_TERMINAL_CONFIG } from "~/types/terminal";
import { logger } from "~/utils/logger";

// Global references for dynamically imported xterm.js modules
let Terminal: XTerminalConstructor;
let FitAddon: XTermFitAddonConstructor;
let WebLinksAddon: XTermWebLinksAddonConstructor;

/**
 * xterm.js integration composable
 *
 * Handles xterm.js initialization, DOM integration, addon management,
 * and terminal operations while maintaining clean separation from
 * WebSocket and state management concerns.
 */
export function useTerminalXterm() {
  // Terminal instances and addons
  const terminal = ref<XTerminalInstance>();
  const fitAddon = ref<XTermFitAddon>();
  const webLinksAddon = ref<XTermWebLinksAddon>();
  const resizeObserver = ref<ResizeObserver>();

  // Event callbacks
  const onDataCallback = ref<(data: string) => void>();
  const onResizeCallback = ref<(size: TerminalSize) => void>();

  /**
   * Load xterm.js modules dynamically (browser-only)
   */
  const loadXTermModules = async () => {
    if (Terminal) return; // Already loaded

    try {
      // Dynamic imports for browser-only modules
      const [xtermModule, fitAddonModule, webLinksAddonModule] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);

      Terminal = xtermModule.Terminal as unknown as XTerminalConstructor;
      FitAddon = fitAddonModule.FitAddon as unknown as XTermFitAddonConstructor;
      WebLinksAddon = webLinksAddonModule.WebLinksAddon as unknown as XTermWebLinksAddonConstructor;

      logger.info("xterm.js modules loaded successfully");
    } catch (error) {
      logger.error("Failed to load xterm.js modules", error);
      throw new Error("Failed to load xterm.js modules");
    }
  };

  /**
   * Setup terminal event handlers
   */
  const setupEventHandlers = () => {
    if (!terminal.value) return;

    // Handle terminal input
    terminal.value.onData((data: string) => {
      onDataCallback.value?.(data);
    });

    // Handle terminal resize
    terminal.value.onResize((size: TerminalSize) => {
      onResizeCallback.value?.(size);
    });
  };

  /**
   * Setup resize observer for container changes
   */
  const setupResizeObserver = (container: HTMLElement) => {
    resizeObserver.value = new ResizeObserver(() => {
      if (fitAddon.value && terminal.value) {
        try {
          fitAddon.value.fit();
        } catch (error) {
          logger.error("Failed to fit terminal", error);
        }
      }
    });

    resizeObserver.value.observe(container);
  };

  /**
   * Handle window resize events
   */
  const handleWindowResize = () => {
    if (fitAddon.value && terminal.value) {
      try {
        fitAddon.value.fit();
      } catch (error) {
        logger.error("Failed to fit terminal on window resize", error);
      }
    }
  };

  /**
   * Initialize terminal with configuration
   */
  const initializeTerminal = async (
    container: HTMLElement,
    config: XTermOptions = DEFAULT_TERMINAL_CONFIG,
  ) => {
    if (!container) {
      throw new Error("Container element is required");
    }

    try {
      // Load xterm.js modules
      await loadXTermModules();

      // Create terminal instance
      terminal.value = new Terminal(config);

      // Create and load addons
      fitAddon.value = new FitAddon();
      webLinksAddon.value = new WebLinksAddon();

      terminal.value.loadAddon(fitAddon.value);
      terminal.value.loadAddon(webLinksAddon.value);

      // Open terminal in DOM
      terminal.value.open(container);

      // Set up event handlers
      setupEventHandlers();

      // Fit terminal to container
      await nextTick();
      fitAddon.value.fit();

      // Setup resize observer
      setupResizeObserver(container);

      // Setup window resize handler
      window.addEventListener("resize", handleWindowResize);

      // Focus terminal
      terminal.value.focus();

      logger.info("Terminal initialized successfully");
    } catch (error) {
      logger.error("Terminal initialization failed", error);
      throw error;
    }
  };

  /**
   * Write data to terminal
   */
  const writeData = (data: string) => {
    if (!terminal.value) {
      logger.warn("Attempted to write to uninitialized terminal");
      return;
    }

    try {
      terminal.value.write(data);
    } catch (error) {
      logger.error("Failed to write to terminal", error);
    }
  };

  /**
   * Focus terminal
   */
  const focusTerminal = () => {
    if (!terminal.value) {
      logger.warn("Attempted to focus uninitialized terminal");
      return;
    }

    try {
      terminal.value.focus();
    } catch (error) {
      logger.error("Failed to focus terminal", error);
    }
  };

  /**
   * Fit terminal to container
   */
  const fitTerminal = () => {
    if (!fitAddon.value) {
      logger.warn("Attempted to fit terminal without fit addon");
      return;
    }

    try {
      fitAddon.value.fit();
    } catch (error) {
      logger.error("Failed to fit terminal", error);
    }
  };

  /**
   * Set data callback handler
   */
  const setOnDataCallback = (callback: (data: string) => void) => {
    onDataCallback.value = callback;
  };

  /**
   * Set resize callback handler
   */
  const setOnResizeCallback = (callback: (size: TerminalSize) => void) => {
    onResizeCallback.value = callback;
  };

  /**
   * Cleanup terminal and resources
   */
  const cleanup = () => {
    try {
      // Remove event listeners
      window.removeEventListener("resize", handleWindowResize);

      // Disconnect resize observer
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
        resizeObserver.value = undefined;
      }

      // Dispose terminal
      if (terminal.value) {
        terminal.value.dispose();
        terminal.value = undefined;
      }

      // Clear addons
      fitAddon.value = undefined;
      webLinksAddon.value = undefined;

      // Clear callbacks
      onDataCallback.value = undefined;
      onResizeCallback.value = undefined;

      logger.info("Terminal cleanup completed");
    } catch (error) {
      logger.error("Error during terminal cleanup", error);
    }
  };

  return {
    // State
    terminal,
    fitAddon,
    webLinksAddon,

    // Methods
    initializeTerminal,
    writeData,
    focusTerminal,
    fitTerminal,
    setOnDataCallback,
    setOnResizeCallback,
    cleanup,
  };
}

export type TerminalXterm = ReturnType<typeof useTerminalXterm>;