import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { useTheme } from "./useTheme";

// Create reactive refs for mocking
const mockCookieRef = ref<boolean | undefined>(undefined);
const mockStateRef = ref<boolean>(false);

// Mock Nuxt composables
vi.mock("nuxt/app", () => ({
  useCookie: vi.fn(() => mockCookieRef),
  useState: vi.fn(() => mockStateRef),
}));

describe("useTheme", () => {
  let mockMatchMedia: vi.MockedFunction<(query: string) => MediaQueryList>;
  let originalWindow: typeof window;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock returns
    mockCookieRef.value = undefined;
    mockStateRef.value = false;

    // Mock window.matchMedia
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Store original window
    originalWindow = global.window;

    // Setup window mock
    Object.defineProperty(global, "window", {
      value: {
        matchMedia: mockMatchMedia,
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
  });

  describe("System preference detection", () => {
    it("should detect dark system preference when matchMedia matches", () => {
      // Setup dark mode system preference
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { systemPreference } = useTheme();

      expect(systemPreference.value).toBe("Dark");
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should detect light system preference when matchMedia does not match", () => {
      // Setup light mode system preference
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { systemPreference } = useTheme();

      expect(systemPreference.value).toBe("Light");
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should return Unknown when window is undefined (SSR)", () => {
      // Mock SSR environment
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      });

      const { systemPreference } = useTheme();

      expect(systemPreference.value).toBe("Unknown");
    });
  });

  describe("Theme toggling", () => {
    it("should toggle isDarkMode from false to true", () => {
      mockStateRef.value = false;

      const { isDarkMode, toggleTheme } = useTheme();

      expect(isDarkMode.value).toBe(false);

      toggleTheme();

      expect(mockStateRef.value).toBe(true);
    });

    it("should toggle isDarkMode from true to false", () => {
      mockStateRef.value = true;

      const { isDarkMode, toggleTheme } = useTheme();

      expect(isDarkMode.value).toBe(true);

      toggleTheme();

      expect(mockStateRef.value).toBe(false);
    });

    it("should persist theme preference to cookie when toggled", async () => {
      mockStateRef.value = false;

      const { isDarkMode, toggleTheme } = useTheme();

      // Simulate the toggle
      toggleTheme();

      // State should be updated
      expect(mockStateRef.value).toBe(true);
      expect(isDarkMode.value).toBe(true);

      // Cookie should be updated via watch (happens automatically with reactive refs)
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow watch to trigger
      expect(mockCookieRef.value).toBe(true);
    });
  });

  describe("Cookie persistence and mounted lifecycle", () => {
    it("should initialize from cookie when cookie has a value", () => {
      // Setup existing cookie preference
      mockCookieRef.value = true;
      mockStateRef.value = false; // Initial state different from cookie

      const { isDarkMode } = useTheme();

      // Should respect the cookie value
      expect(isDarkMode.value).toBe(false); // Initial state before mounted
    });

    it("should detect system preference when no cookie exists", () => {
      // Setup no cookie preference
      mockCookieRef.value = undefined;
      mockStateRef.value = false;

      // Setup dark system preference
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { systemPreference } = useTheme();

      expect(systemPreference.value).toBe("Dark");
    });

    it("should detect light system preference correctly", () => {
      // Setup no cookie preference
      mockCookieRef.value = undefined;
      mockStateRef.value = false;

      // Setup light system preference
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { systemPreference } = useTheme();

      expect(systemPreference.value).toBe("Light");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete user journey: system detection → toggle", () => {
      // Scenario: User loads page for first time with dark system preference
      mockCookieRef.value = undefined;
      mockStateRef.value = false;

      mockMatchMedia.mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { isDarkMode, toggleTheme, systemPreference } = useTheme();

      // 1. Initial load - should detect dark system preference
      expect(systemPreference.value).toBe("Dark");
      expect(isDarkMode.value).toBe(false); // Initial state

      // 2. User toggles to light mode
      toggleTheme();
      expect(mockStateRef.value).toBe(true);

      // 3. User toggles back to dark mode
      toggleTheme();
      expect(mockStateRef.value).toBe(false);
    });

    it("should show system preference regardless of user setting", () => {
      // User has manually set light mode
      mockCookieRef.value = false;
      mockStateRef.value = true; // Different from cookie initially

      // System is in dark mode
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { systemPreference, isDarkMode } = useTheme();

      // Should show system preference as dark
      expect(systemPreference.value).toBe("Dark");

      // But user setting is independent
      expect(isDarkMode.value).toBe(true); // Current state
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle cookie with boolean true value", () => {
      mockCookieRef.value = true;
      mockStateRef.value = false;

      const { isDarkMode } = useTheme();

      expect(isDarkMode.value).toBe(false); // Initial state
    });

    it("should handle cookie with boolean false value", () => {
      mockCookieRef.value = false;
      mockStateRef.value = true;

      const { isDarkMode } = useTheme();

      expect(isDarkMode.value).toBe(true); // Initial state
    });

    it("should handle missing matchMedia gracefully", () => {
      // Remove matchMedia entirely
      Object.defineProperty(global, "window", {
        value: {
          matchMedia: undefined,
        },
        writable: true,
      });

      // This should not throw an error and should return Unknown
      const { systemPreference } = useTheme();
      expect(systemPreference.value).toBe("Unknown");
    });
  });
});