import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useTerminalPersistence } from "./useTerminalPersistence";
import type { PersistedTerminalState, TerminalStatesData } from "./useTerminalPersistence";
import type { ApiResponse } from "~/types";

// Mock the global $fetch
const mockFetch = vi.fn() as typeof globalThis.$fetch;
globalThis.$fetch = mockFetch;

// Mock logger with hoisted functions for proper access in tests
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("~/utils/logger", () => ({
  logger: mockLogger,
}));

describe("useTerminalPersistence", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAllTerminalStates", () => {
    it("should return empty Map when API returns empty data", async () => {
      const mockResponse: ApiResponse<TerminalStatesData> = {
        success: true,
        data: {
          terminals: {},
          lastUpdate: "2025-07-21T10:00:00Z",
          version: "1.0.0",
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { getAllTerminalStates } = useTerminalPersistence();
      const result = await getAllTerminalStates();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states");
      expect(mockLogger.debug).toHaveBeenCalledWith("Loaded terminal states", { count: 0 });
    });

    it("should parse and return terminal states with converted dates", async () => {
      const mockTerminalData = {
        "term1": {
          id: "term1",
          name: "Test Terminal",
          status: "disconnected" as const,
          isActive: false,
          createdAt: "2025-07-21T09:00:00Z",
          lastActivity: "2025-07-21T10:00:00Z",
          terminalId: "term1",
        },
        "term2": {
          id: "term2",
          name: "Another Terminal",
          status: "connected" as const,
          isActive: true,
          createdAt: "2025-07-21T08:00:00Z",
          lastActivity: "2025-07-21T10:30:00Z",
          terminalId: "term2",
          branchName: "feature/test",
          worktreePath: "/path/to/worktree",
        },
      };

      const mockResponse: ApiResponse<TerminalStatesData> = {
        success: true,
        data: {
          terminals: mockTerminalData,
          lastUpdate: "2025-07-21T10:00:00Z",
          version: "1.0.0",
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { getAllTerminalStates } = useTerminalPersistence();
      const result = await getAllTerminalStates();

      expect(result.size).toBe(2);

      const term1 = result.get("term1");
      expect(term1).toBeDefined();
      expect(term1?.name).toBe("Test Terminal");
      expect(term1?.createdAt).toBeInstanceOf(Date);
      expect(term1?.lastActivity).toBeInstanceOf(Date);

      const term2 = result.get("term2");
      expect(term2).toBeDefined();
      expect(term2?.branchName).toBe("feature/test");
      expect(term2?.worktreePath).toBe("/path/to/worktree");

      expect(mockLogger.debug).toHaveBeenCalledWith("Loaded terminal states", { count: 2 });
    });

    it("should return empty Map when file not found (404)", async () => {
      const notFoundError = new Error("Not found");
      Object.assign(notFoundError, { statusCode: 404 });
      mockFetch.mockRejectedValue(notFoundError);

      const { getAllTerminalStates } = useTerminalPersistence();
      const result = await getAllTerminalStates();

      expect(result.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith("No terminal states file found, starting fresh");
    });

    it("should handle API errors gracefully", async () => {
      const apiError = new Error("API Error");
      mockFetch.mockRejectedValue(apiError);

      const { getAllTerminalStates, error } = useTerminalPersistence();
      const result = await getAllTerminalStates();

      expect(result.size).toBe(0);
      expect(error.value).toBe("API Error");
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to load terminal states", { error: apiError });
    });
  });

  describe("saveTerminalState", () => {
    it("should save terminal state successfully", async () => {
      // Mock successful get (empty states)
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
      });

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
      });

      const { saveTerminalState } = useTerminalPersistence();
      const terminalState: Partial<PersistedTerminalState> = {
        id: "term1",
        name: "Test Terminal",
        status: "connected",
        isActive: true,
        createdAt: new Date("2025-07-21T09:00:00Z"),
      };

      await expect(saveTerminalState("term1", terminalState)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", {
        method: "PUT",
        body: expect.objectContaining({
          terminals: expect.objectContaining({
            "term1": expect.objectContaining({
              ...terminalState,
              terminalId: "term1",
              lastActivity: expect.any(Date),
            }),
          }),
          lastUpdate: expect.any(String),
          version: "1.0.0",
        }),
      });

      expect(mockLogger.info).toHaveBeenCalledWith("Terminal state saved", { terminalId: "term1" });
    });

    it("should update existing terminal state", async () => {
      const existingTerminals = {
        "term1": {
          id: "term1",
          name: "Old Name",
          status: "disconnected" as const,
          isActive: false,
          createdAt: "2025-07-21T08:00:00Z",
          lastActivity: "2025-07-21T09:00:00Z",
          terminalId: "term1",
        },
      };

      // Mock get existing states
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: existingTerminals, lastUpdate: "", version: "1.0.0" },
      });

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: existingTerminals, lastUpdate: "", version: "1.0.0" },
      });

      const { saveTerminalState } = useTerminalPersistence();
      const updatedState: Partial<PersistedTerminalState> = {
        name: "Updated Name",
        status: "connected",
      };

      await saveTerminalState("term1", updatedState);

      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", {
        method: "PUT",
        body: expect.objectContaining({
          terminals: expect.objectContaining({
            "term1": expect.objectContaining({
              name: "Updated Name",
              status: "connected",
              terminalId: "term1",
              lastActivity: expect.any(Date),
            }),
          }),
        }),
      });
    });

    it("should handle save errors", async () => {
      // Mock successful get
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
      });

      // Mock failed save
      mockFetch.mockResolvedValueOnce({
        success: false,
        error: "Save failed",
      });

      const { saveTerminalState, error } = useTerminalPersistence();

      await expect(saveTerminalState("term1", { name: "Test" }))
        .rejects.toThrow("Save failed");

      expect(error.value).toBe("Save failed");
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to save terminal state",
        expect.objectContaining({ terminalId: "term1" }));
    });
  });

  describe("removeTerminalState", () => {
    it("should remove terminal state successfully", async () => {
      const existingTerminals = {
        "term1": {
          id: "term1",
          name: "Terminal 1",
          status: "disconnected" as const,
          isActive: false,
          createdAt: "2025-07-21T08:00:00Z",
          lastActivity: "2025-07-21T09:00:00Z",
          terminalId: "term1",
        },
        "term2": {
          id: "term2",
          name: "Terminal 2",
          status: "connected" as const,
          isActive: true,
          createdAt: "2025-07-21T08:30:00Z",
          lastActivity: "2025-07-21T10:00:00Z",
          terminalId: "term2",
        },
      };

      // Mock get existing states
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: existingTerminals, lastUpdate: "", version: "1.0.0" },
      });

      // Mock successful save (with term1 removed)
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: { "term2": existingTerminals.term2 }, lastUpdate: "", version: "1.0.0" },
      });

      const { removeTerminalState } = useTerminalPersistence();
      await removeTerminalState("term1");

      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", {
        method: "PUT",
        body: expect.objectContaining({
          terminals: expect.not.objectContaining({
            "term1": expect.anything(),
          }),
        }),
      });

      expect(mockLogger.info).toHaveBeenCalledWith("Terminal state removed", { terminalId: "term1" });
    });

    it("should handle remove errors", async () => {
      // Mock get error
      mockFetch.mockRejectedValue(new Error("Get failed"));

      const { removeTerminalState, error } = useTerminalPersistence();

      await expect(removeTerminalState("term1")).rejects.toThrow("Get failed");
      expect(error.value).toBe("Get failed");
    });
  });

  describe("updateLastActivity", () => {
    it("should update last activity timestamp", async () => {
      const existingTerminal = {
        id: "term1",
        name: "Test Terminal",
        status: "connected" as const,
        isActive: true,
        createdAt: "2025-07-21T08:00:00Z",
        lastActivity: "2025-07-21T09:00:00Z",
        terminalId: "term1",
      };

      // Mock get existing state
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: { "term1": existingTerminal }, lastUpdate: "", version: "1.0.0" },
      });

      // Mock successful save
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: { "term1": existingTerminal }, lastUpdate: "", version: "1.0.0" },
      });

      const { updateLastActivity } = useTerminalPersistence();
      await updateLastActivity("term1");

      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", {
        method: "PUT",
        body: expect.objectContaining({
          terminals: expect.objectContaining({
            "term1": expect.objectContaining({
              lastActivity: expect.any(Date),
            }),
          }),
        }),
      });
    });

    it("should handle missing terminal gracefully", async () => {
      // Mock get empty states
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
      });

      const { updateLastActivity } = useTerminalPersistence();

      // Should not throw
      await expect(updateLastActivity("nonexistent")).resolves.not.toThrow();
    });

    it("should handle update activity errors without throwing", async () => {
      const existingTerminal = {
        id: "term1",
        name: "Test Terminal", 
        status: "connected" as const,
        isActive: true,
        createdAt: "2025-07-21T08:00:00Z",
        lastActivity: "2025-07-21T09:00:00Z",
        terminalId: "term1",
      };

      // Mock successful get (returns existing terminal)
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: { "term1": existingTerminal }, lastUpdate: "", version: "1.0.0" },
      });

      // Mock failed save operation 
      mockFetch.mockRejectedValueOnce(new Error("Update failed"));

      const { updateLastActivity } = useTerminalPersistence();

      // Should not throw even on error
      await expect(updateLastActivity("term1")).resolves.not.toThrow();
      expect(mockLogger.warn).toHaveBeenCalledWith("Failed to update terminal activity",
        expect.objectContaining({ terminalId: "term1" }));
    });
  });

  describe("clearAllTerminalStates", () => {
    it("should clear all terminal states", async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
      });

      const { clearAllTerminalStates } = useTerminalPersistence();
      await clearAllTerminalStates();

      expect(mockFetch).toHaveBeenCalledWith("/api/settings/terminal-states", {
        method: "PUT",
        body: expect.objectContaining({
          terminals: {},
          lastUpdate: expect.any(String),
          version: "1.0.0",
        }),
      });

      expect(mockLogger.info).toHaveBeenCalledWith("All terminal states cleared");
    });
  });

  describe("loading state", () => {
    it("should manage loading state during operations", async () => {
      mockFetch.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          data: { terminals: {}, lastUpdate: "", version: "1.0.0" },
        }), 100);
      }));

      const { getAllTerminalStates, isLoading } = useTerminalPersistence();

      expect(isLoading.value).toBe(false);

      const promise = getAllTerminalStates();
      expect(isLoading.value).toBe(true);

      await promise;
      expect(isLoading.value).toBe(false);
    });
  });
});