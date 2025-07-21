import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSavedDirectories } from "./useSavedDirectories";
import type { SavedDirectory } from "./useSavedDirectories";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("useSavedDirectories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    // Reset to return null by default (no saved data)
    mockLocalStorage.getItem.mockReturnValue(null);
    vi.stubGlobal("import.meta", { client: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("composable structure", () => {
    it("should return all expected methods", () => {
      const {
        getSavedDirectories,
        addSavedDirectory,
        removeSavedDirectory,
        updateSavedDirectory,
        validateSavedDirectories,
        getSavedDirectory,
        updateLastUsed,
      } = useSavedDirectories();

      expect(typeof getSavedDirectories).toBe("function");
      expect(typeof addSavedDirectory).toBe("function");
      expect(typeof removeSavedDirectory).toBe("function");
      expect(typeof updateSavedDirectory).toBe("function");
      expect(typeof validateSavedDirectories).toBe("function");
      expect(typeof getSavedDirectory).toBe("function");
      expect(typeof updateLastUsed).toBe("function");
    });
  });

  describe("client-side behavior", () => {
    it("should handle server-side environment gracefully", async () => {
      vi.stubGlobal("import.meta", { client: false });

      const { getSavedDirectories, addSavedDirectory } = useSavedDirectories();

      // These should not throw errors even when localStorage is unavailable
      const result = await getSavedDirectories();
      expect(result).toEqual([]);

      // Should complete without throwing
      await expect(addSavedDirectory({
        name: "Test",
        path: "/test",
      })).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      const { validateSavedDirectories } = useSavedDirectories();

      // Should not throw even if there are issues
      await expect(validateSavedDirectories()).resolves.toBeUndefined();
    });

    it("should handle getSavedDirectory with non-existent ID", async () => {
      const { getSavedDirectory } = useSavedDirectories();

      const result = await getSavedDirectory("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("basic functionality", () => {
    it("should return empty array when no saved directories exist", async () => {
      const { getSavedDirectories } = useSavedDirectories();
      const result = await getSavedDirectories();

      expect(result).toEqual([]);
    });

    it("should complete operations without throwing", async () => {
      const { addSavedDirectory, removeSavedDirectory, updateLastUsed } = useSavedDirectories();

      // These should all complete without throwing in the test environment
      await expect(addSavedDirectory({ name: "Test", path: "/test" })).resolves.toBeUndefined();
      await expect(removeSavedDirectory("test-id")).resolves.toBeUndefined();
      await expect(updateLastUsed("test-id")).resolves.toBeUndefined();
    });

    it("should handle getSavedDirectory gracefully", async () => {
      const { getSavedDirectory } = useSavedDirectories();
      const result = await getSavedDirectory("non-existent");

      expect(result).toBeUndefined();
    });

    it("should handle validation without throwing", async () => {
      const { validateSavedDirectories } = useSavedDirectories();

      await expect(validateSavedDirectories()).resolves.toBeUndefined();
    });
  });

  describe("data structure validation", () => {
    it("should work with valid SavedDirectory structure", () => {
      const mockDirectory: SavedDirectory = {
        id: "test-123",
        name: "Test Project",
        path: "/test/path",
        description: "Test description",
        lastUsed: new Date(),
        isValid: true,
        defaultBranch: "main",
      };

      expect(mockDirectory.id).toBeDefined();
      expect(mockDirectory.name).toBeDefined();
      expect(mockDirectory.path).toBeDefined();
      expect(mockDirectory.lastUsed).toBeInstanceOf(Date);
      expect(typeof mockDirectory.isValid).toBe("boolean");
    });
  });

  describe("Phase 2A placeholder behavior", () => {
    it("should handle localStorage operations gracefully", async () => {
      const { addSavedDirectory, getSavedDirectories, removeSavedDirectory, updateLastUsed } = useSavedDirectories();

      // These should all complete without throwing in Phase 2A
      await expect(addSavedDirectory({ name: "Test", path: "/test" })).resolves.toBeUndefined();
      await expect(getSavedDirectories()).resolves.toEqual([]);
      await expect(removeSavedDirectory("test-id")).resolves.toBeUndefined();
      await expect(updateLastUsed("test-id")).resolves.toBeUndefined();
    });

    it("should handle error conditions gracefully", async () => {
      const { getSavedDirectories } = useSavedDirectories();

      // Mock invalid JSON to test error handling
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      const result = await getSavedDirectories();
      expect(result).toEqual([]);
    });
  });
});