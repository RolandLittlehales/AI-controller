/**
 * Application-wide constants
 */

// Terminal persistence and cleanup
export const STALE_TERMINAL_THRESHOLD_DAYS = 7;
export const STALE_TERMINAL_THRESHOLD_MS = STALE_TERMINAL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

// Startup cleanup timing
export const STARTUP_CLEANUP_DELAY_MS = 1000;
export const CLEANUP_STATUS_POLL_INTERVAL_MS = 100;
export const CLEANUP_TIMEOUT_MS = 10000;

// UI timing
export const CLEANUP_INDICATOR_HIDE_DELAY_MS = 1000;