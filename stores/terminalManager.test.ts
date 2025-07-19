import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTerminalManagerStore } from "./terminalManager";

// Mock the useSystemResources composable
vi.mock("~/composables/useSystemResources", () => ({
  useSystemResources: () => ({
    systemInfo: {
      value: {
        totalCores: 8,
        maxTerminals: 6,
      },
    },
    detectSystemCapability: vi.fn(),
  }),
}));

describe("useTerminalManagerStore", () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    const store = useTerminalManagerStore();

    expect(store.terminals.size).toBe(0);
    expect(store.activeTerminalId).toBeNull();
    expect(store.terminalCount).toBe(0);
    expect(store.canCreateTerminal).toBe(true);
    expect(store.getAllTerminals).toEqual([]);
    expect(store.getActiveTerminal).toBeUndefined();
  });

  it("should create terminals correctly", () => {
    const store = useTerminalManagerStore();

    const terminalId = store.createTerminal("Test Terminal");

    expect(terminalId).toMatch(/^term_\d+_[a-z0-9]{6}$/);
    expect(store.terminals.size).toBe(1);
    expect(store.terminalCount).toBe(1);

    const terminal = store.getTerminal(terminalId);
    expect(terminal).toBeDefined();
    expect(terminal?.id).toBe(terminalId);
    expect(terminal?.name).toBe("Test Terminal");
    expect(terminal?.status).toBe("connecting");
    expect(terminal?.isActive).toBe(false);
    expect(terminal?.createdAt).toBeInstanceOf(Date);
  });

  it("should enforce terminal limits", () => {
    const store = useTerminalManagerStore();

    // Create terminals up to the limit (6)
    for (let i = 1; i <= 6; i++) {
      store.createTerminal(`Terminal ${i}`);
    }

    expect(store.terminals.size).toBe(6);
    expect(store.canCreateTerminal).toBe(false);

    // Attempt to create one more should throw
    expect(() => {
      store.createTerminal("Terminal 7");
    }).toThrow("Terminal limit reached");

    expect(store.terminals.size).toBe(6);
  });

  it("should handle active terminal switching correctly", () => {
    const store = useTerminalManagerStore();

    const terminal1Id = store.createTerminal("Terminal 1");
    const terminal2Id = store.createTerminal("Terminal 2");

    // Initially no active terminal
    expect(store.activeTerminalId).toBeNull();
    expect(store.getActiveTerminal).toBeUndefined();

    // Set first terminal as active
    store.setActiveTerminal(terminal1Id);
    expect(store.activeTerminalId).toBe(terminal1Id);
    expect(store.getActiveTerminal?.id).toBe(terminal1Id);
    expect(store.getTerminal(terminal1Id)?.isActive).toBe(true);
    expect(store.getTerminal(terminal2Id)?.isActive).toBe(false);

    // Switch to second terminal
    store.setActiveTerminal(terminal2Id);
    expect(store.activeTerminalId).toBe(terminal2Id);
    expect(store.getActiveTerminal?.id).toBe(terminal2Id);
    expect(store.getTerminal(terminal1Id)?.isActive).toBe(false);
    expect(store.getTerminal(terminal2Id)?.isActive).toBe(true);

    // Deactivate all
    store.setActiveTerminal(null);
    expect(store.activeTerminalId).toBeNull();
    expect(store.getActiveTerminal).toBeUndefined();
    expect(store.getTerminal(terminal1Id)?.isActive).toBe(false);
    expect(store.getTerminal(terminal2Id)?.isActive).toBe(false);
  });

  it("should handle non-existent terminal activation gracefully", () => {
    const store = useTerminalManagerStore();

    // Try to activate non-existent terminal
    store.setActiveTerminal("non-existent-id");
    expect(store.activeTerminalId).toBe("non-existent-id");
    expect(store.getActiveTerminal).toBeUndefined();
  });

  it("should remove terminals correctly", () => {
    const store = useTerminalManagerStore();

    const terminal1Id = store.createTerminal("Terminal 1");
    const terminal2Id = store.createTerminal("Terminal 2");
    const terminal3Id = store.createTerminal("Terminal 3");

    expect(store.terminals.size).toBe(3);

    // Remove middle terminal
    store.removeTerminal(terminal2Id);
    expect(store.terminals.size).toBe(2);
    expect(store.getTerminal(terminal2Id)).toBeUndefined();
    expect(store.getTerminal(terminal1Id)).toBeDefined();
    expect(store.getTerminal(terminal3Id)).toBeDefined();
  });

  it("should handle active terminal removal with automatic switching", () => {
    const store = useTerminalManagerStore();

    const terminal1Id = store.createTerminal("Terminal 1");
    const terminal2Id = store.createTerminal("Terminal 2");
    store.createTerminal("Terminal 3");

    // Set second terminal as active
    store.setActiveTerminal(terminal2Id);
    expect(store.activeTerminalId).toBe(terminal2Id);

    // Remove active terminal
    store.removeTerminal(terminal2Id);

    // Should automatically switch to first remaining terminal
    expect(store.terminals.size).toBe(2);
    expect(store.activeTerminalId).toBe(terminal1Id);
    expect(store.getTerminal(terminal1Id)?.isActive).toBe(true);
  });

  it("should handle removing last terminal", () => {
    const store = useTerminalManagerStore();

    const terminalId = store.createTerminal("Only Terminal");
    store.setActiveTerminal(terminalId);

    // Remove the only terminal
    store.removeTerminal(terminalId);

    expect(store.terminals.size).toBe(0);
    expect(store.activeTerminalId).toBeNull();
    expect(store.getActiveTerminal).toBeUndefined();
  });

  it("should handle removing non-existent terminal gracefully", () => {
    const store = useTerminalManagerStore();

    const terminalId = store.createTerminal("Test Terminal");
    expect(store.terminals.size).toBe(1);

    // Try to remove non-existent terminal
    store.removeTerminal("non-existent-id");
    expect(store.terminals.size).toBe(1);
    expect(store.getTerminal(terminalId)).toBeDefined();
  });

  it("should update terminal status correctly", () => {
    const store = useTerminalManagerStore();

    const terminalId = store.createTerminal("Test Terminal");
    expect(store.getTerminal(terminalId)?.status).toBe("connecting");

    // Update to connected
    store.updateTerminalStatus(terminalId, "connected");
    expect(store.getTerminal(terminalId)?.status).toBe("connected");

    // Update to disconnected
    store.updateTerminalStatus(terminalId, "disconnected");
    expect(store.getTerminal(terminalId)?.status).toBe("disconnected");
  });

  it("should handle status update for non-existent terminal gracefully", () => {
    const store = useTerminalManagerStore();

    // Should not throw error
    expect(() => {
      store.updateTerminalStatus("non-existent-id", "connected");
    }).not.toThrow();
  });

  it("should return all terminals as array", () => {
    const store = useTerminalManagerStore();

    const terminal1Id = store.createTerminal("Terminal 1");
    const terminal2Id = store.createTerminal("Terminal 2");

    const allTerminals = store.getAllTerminals;
    expect(allTerminals).toHaveLength(2);
    expect(allTerminals.map(t => t.id)).toContain(terminal1Id);
    expect(allTerminals.map(t => t.id)).toContain(terminal2Id);
    expect(allTerminals.map(t => t.name)).toContain("Terminal 1");
    expect(allTerminals.map(t => t.name)).toContain("Terminal 2");
  });

  it("should maintain unique terminal IDs", () => {
    const store = useTerminalManagerStore();

    const ids = new Set<string>();

    // Create terminals up to the limit (6)
    for (let i = 0; i < 6; i++) {
      const id = store.createTerminal(`Terminal ${i}`);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }

    expect(ids.size).toBe(6);
    expect(store.terminals.size).toBe(6); // Limited by maxTerminals
  });

  it("should track terminal creation time", () => {
    const store = useTerminalManagerStore();
    const beforeCreation = new Date();

    const terminalId = store.createTerminal("Timed Terminal");
    const terminal = store.getTerminal(terminalId);

    const afterCreation = new Date();

    expect(terminal?.createdAt).toBeInstanceOf(Date);
    expect(terminal?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(terminal?.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it("should provide readonly access to internal state", () => {
    const store = useTerminalManagerStore();

    // Create a terminal to test with
    const terminalId = store.createTerminal("Test Terminal");
    const originalSize = store.terminals.size;

    // Attempt to modify readonly terminals map should not work
    try {
      // @ts-expect-error - Testing readonly behavior
      store.terminals.clear();
    } catch {
      // Silently handle - readonly may warn but not throw
    }

    // Size should remain unchanged
    expect(store.terminals.size).toBe(originalSize);

    // Attempt to modify readonly activeTerminalId should not work
    store.setActiveTerminal(terminalId);
    const originalActiveId = store.activeTerminalId;

    try {
      // @ts-expect-error - Testing readonly behavior
      store.activeTerminalId.value = "test";
    } catch {
      // Silently handle - readonly may warn but not throw
    }

    // Active ID should remain unchanged
    expect(store.activeTerminalId).toBe(originalActiveId);
  });
});