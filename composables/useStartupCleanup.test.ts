import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useStartupCleanup } from "./useStartupCleanup";
import type { PersistedTerminalState, TerminalStatesData } from "./useTerminalPersistence";
import type { ApiResponse } from "~/types";

// Mock only external API calls - minimal mocking approach
const mockFetch = vi.fn() as typeof globalThis.$fetch;
globalThis.$fetch = mockFetch;

// Mock logger for testing output
vi.mock("~/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useStartupCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("performSafeStartupCleanup", () => {
    it("should clean up stale terminal states older than 7 days", async () => {
      // Set up test data - 8 days ago (stale) and 1 day ago (recent)
      const now = new Date("2025-07-21T10:00:00Z");
      const eightDaysAgo = new Date("2025-07-13T10:00:00Z"); // 8 days old
      const oneDayAgo = new Date("2025-07-20T10:00:00Z"); // 1 day old

      vi.setSystemTime(now);

      // Mock terminal states API response
      const terminalStatesResponse: ApiResponse<TerminalStatesData> = {
        success: true,
        data: {
          terminals: {
            "stale-terminal": {
              id: "stale-terminal",
              terminalId: "stale-terminal",
              name: "Stale Terminal",
              status: "disconnected",
              isActive: false,
              createdAt: eightDaysAgo,
              lastActivity: eightDaysAgo,
            } as PersistedTerminalState,
            "recent-terminal": {
              id: "recent-terminal",
              terminalId: "recent-terminal",
              name: "Recent Terminal",
              status: "connected",
              isActive: true,
              createdAt: oneDayAgo,
              lastActivity: oneDayAgo,
            } as PersistedTerminalState,
          },
          lastUpdate: now.toISOString(),
          version: "1.0.0",
        },
      };

      // Mock worktree cleanup API response
      const worktreeCleanupResponse = {
        success: true,
        data: {
          cleanedCount: 2,
          orphanedWorktrees: ["old-worktree-1", "old-worktree-2"],
          errors: [],
        },
      };

      // Mock the API calls in sequence
      // removeTerminalState() calls getAllTerminalStates() internally, so we need extra GET calls
      mockFetch
        .mockResolvedValueOnce(terminalStatesResponse) // GET terminal states (initial load)
        .mockResolvedValueOnce(terminalStatesResponse) // GET terminal states (inside removeTerminalState)
        .mockResolvedValueOnce({ success: true, data: { terminals: { "recent-terminal": terminalStatesResponse.data.terminals["recent-terminal"] }, lastUpdate: "", version: "1.0.0" } }) // PUT updated states (after removal)
        .mockResolvedValueOnce(worktreeCleanupResponse); // POST worktree cleanup

      const { performSafeStartupCleanup } = useStartupCleanup();
      const report = await performSafeStartupCleanup();

      // Verify the cleanup results
      expect(report.cleanedStates).toBe(1); // Should remove stale terminal
      expect(report.cleanedWorktrees).toBe(2); // From worktree cleanup
      expect(report.errors).toHaveLength(0);
      expect(report.startTime).toBeInstanceOf(Date);
      expect(report.endTime).toBeInstanceOf(Date);
      expect(report.duration).toBeGreaterThanOrEqual(0);

      // Verify API calls were made correctly
      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states"); // GET
      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", { // PUT (remove stale)
        method: "PUT",
        body: expect.objectContaining({
          terminals: expect.not.objectContaining({
            "stale-terminal": expect.anything(),
          }),
        }),
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/git/worktrees/cleanup", {
        method: "POST",
        body: { dryRun: false },
      });

      vi.useRealTimers();
    });

    it("should handle terminals with corrupted dates", async () => {
      const terminalStatesResponse: ApiResponse<TerminalStatesData> = {
        success: true,
        data: {
          terminals: {
            "corrupted-terminal": {
              id: "corrupted-terminal",
              terminalId: "corrupted-terminal",
              name: "Corrupted Terminal",
              status: "disconnected",
              isActive: false,
              createdAt: new Date("invalid-date"),
              lastActivity: new Date("invalid-date"),
            } as PersistedTerminalState,
          },
          lastUpdate: new Date().toISOString(),
          version: "1.0.0",
        },
      };

      mockFetch
        .mockResolvedValueOnce(terminalStatesResponse)
        .mockResolvedValueOnce({ success: true, data: { terminals: {}, lastUpdate: "", version: "1.0.0" } })
        .mockResolvedValueOnce({ success: true, data: { cleanedCount: 0, orphanedWorktrees: [], errors: [] } });

      const { performSafeStartupCleanup } = useStartupCleanup();
      const report = await performSafeStartupCleanup();

      expect(report.cleanedStates).toBe(1); // Should remove corrupted terminal
      expect(report.errors).toHaveLength(0);
    });

    it("should handle API errors gracefully", async () => {
      const apiError = new Error("API Error");
      mockFetch.mockRejectedValue(apiError);

      const { performSafeStartupCleanup } = useStartupCleanup();
      const report = await performSafeStartupCleanup();

      expect(report.cleanedStates).toBe(0);
      expect(report.cleanedWorktrees).toBe(0);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.duration).toBeGreaterThanOrEqual(0);
    });

    it("should handle worktree cleanup failures", async () => {
      // Mock successful terminal states, but failed worktree cleanup
      mockFetch
        .mockResolvedValueOnce({ success: true, data: { terminals: {}, lastUpdate: "", version: "1.0.0" } })
        .mockRejectedValueOnce(new Error("Worktree cleanup failed"));

      const { performSafeStartupCleanup } = useStartupCleanup();
      const report = await performSafeStartupCleanup();

      expect(report.cleanedStates).toBe(0);
      expect(report.cleanedWorktrees).toBe(0);
      expect(report.errors).toContain("Failed to clean orphaned worktrees: Error: Worktree cleanup failed");
    });
  });

  describe("isCleanupNeeded", () => {
    it("should return true when stale terminals exist", async () => {
      const now = new Date("2025-07-21T10:00:00Z");
      const eightDaysAgo = new Date("2025-07-13T10:00:00Z");
      vi.setSystemTime(now);

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: {
          terminals: {
            "stale-terminal": {
              id: "stale-terminal",
              terminalId: "stale-terminal",
              lastActivity: eightDaysAgo,
            } as PersistedTerminalState,
          },
          lastUpdate: "",
          version: "1.0.0",
        },
      });

      const { isCleanupNeeded } = useStartupCleanup();
      const result = await isCleanupNeeded();

      expect(result).toBe(true);
      vi.useRealTimers();
    });

    it("should return false when no stale terminals exist", async () => {
      const now = new Date("2025-07-21T10:00:00Z");
      const oneDayAgo = new Date("2025-07-20T10:00:00Z");
      vi.setSystemTime(now);

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: {
          terminals: {
            "recent-terminal": {
              id: "recent-terminal",
              terminalId: "recent-terminal",
              lastActivity: oneDayAgo,
            } as PersistedTerminalState,
          },
          lastUpdate: "",
          version: "1.0.0",
        },
      });

      const { isCleanupNeeded } = useStartupCleanup();
      const result = await isCleanupNeeded();

      expect(result).toBe(false);
      vi.useRealTimers();
    });

    it("should return false when API fails", async () => {
      mockFetch.mockRejectedValue(new Error("API failed"));

      const { isCleanupNeeded } = useStartupCleanup();
      const result = await isCleanupNeeded();

      expect(result).toBe(false);
    });
  });

  describe("reactive state", () => {
    it("should track cleanup running state", async () => {
      // Use a delayed promise to test running state
      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(delayedPromise);

      const { performSafeStartupCleanup, isRunning } = useStartupCleanup();

      expect(isRunning.value).toBe(false);

      const cleanupPromise = performSafeStartupCleanup();

      // Should be running now
      expect(isRunning.value).toBe(true);

      // Resolve the API call
      resolvePromise({ success: true, data: { terminals: {}, lastUpdate: "", version: "1.0.0" } });
      await cleanupPromise;

      expect(isRunning.value).toBe(false);
    });

    it("should store cleanup report after completion", async () => {
      mockFetch
        .mockResolvedValueOnce({ success: true, data: { terminals: {}, lastUpdate: "", version: "1.0.0" } })
        .mockResolvedValueOnce({ success: true, data: { cleanedCount: 0, orphanedWorktrees: [], errors: [] } });

      const { performSafeStartupCleanup, cleanupReport } = useStartupCleanup();

      expect(cleanupReport.value).toBeNull();

      await performSafeStartupCleanup();

      expect(cleanupReport.value).toBeDefined();
      expect(cleanupReport.value?.cleanedStates).toBe(0);
      expect(cleanupReport.value?.cleanedWorktrees).toBe(0);
      expect(cleanupReport.value?.errors).toEqual([]);
    });
  });
});