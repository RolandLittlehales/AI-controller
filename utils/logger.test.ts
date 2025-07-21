/* eslint-disable no-console */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

// Unmock logger for this test file - we need to test the actual implementation
vi.unmock("~/utils/logger");

describe("Logger", () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  const mockConsole = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Replace console methods with mocks
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      process.env.NODE_ENV = "development";

      logger.debug("Debug message");

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] DEBUG: Debug message$/),
      );
    });

    it("should log debug messages with context in development", () => {
      process.env.NODE_ENV = "development";

      logger.debug("Debug message", { component: "Terminal", action: "test" });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] DEBUG: Debug message {"component":"Terminal","action":"test"}$/),
      );
    });

    it("should not log debug messages in production", () => {
      process.env.NODE_ENV = "production";

      logger.debug("Debug message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should log info messages in development", () => {
      process.env.NODE_ENV = "development";

      logger.info("Info message");

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] INFO: Info message$/),
      );
    });

    it("should log info messages with context in development", () => {
      process.env.NODE_ENV = "development";

      logger.info("Info message", { userId: "123" });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] INFO: Info message {"userId":"123"}$/),
      );
    });

    it("should not log info messages in production", () => {
      process.env.NODE_ENV = "production";

      logger.info("Info message");

      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe("warn", () => {
    it("should always log warning messages", () => {
      process.env.NODE_ENV = "production";

      logger.warn("Warning message");

      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] WARN: Warning message$/),
      );
    });

    it("should log warning messages with context", () => {
      logger.warn("Warning message", { severity: "high" });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] WARN: Warning message {"severity":"high"}$/),
      );
    });
  });

  describe("error", () => {
    it("should always log error messages", () => {
      process.env.NODE_ENV = "production";

      logger.error("Error message");

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR: Error message {}$/),
      );
    });

    it("should log error messages with Error object", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\\n    at test";

      logger.error("Operation failed", error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR: Operation failed.*"error":{"name":"Error","message":"Test error","stack":"Error: Test error.*/),
      );
    });

    it("should log error messages with unknown error type", () => {
      const error = "String error";

      logger.error("Operation failed", error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR: Operation failed.*"error":"String error".*/),
      );
    });

    it("should log error messages with context and error", () => {
      const error = new Error("Test error");

      logger.error("Database operation failed", error, { operation: "insert", table: "users" });

      const logCall = mockConsole.error.mock.calls[0]?.[0];
      expect(logCall).toMatch(/ERROR: Database operation failed/);
      expect(logCall).toMatch(/"operation":"insert"/);
      expect(logCall).toMatch(/"table":"users"/);
      expect(logCall).toMatch(/"error":{"name":"Error","message":"Test error"/);
    });

    it("should handle undefined error gracefully", () => {
      logger.error("Error without details", undefined, { component: "Test" });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] ERROR: Error without details {"component":"Test"}$/),
      );
    });
  });

  describe("message formatting", () => {
    it("should include ISO timestamp", () => {
      logger.warn("Test message");

      const logCall = mockConsole.warn.mock.calls[0]?.[0];
      expect(logCall).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it("should format message with level", () => {
      logger.error("Test error");

      const logCall = mockConsole.error.mock.calls[0]?.[0];
      expect(logCall).toMatch(/ERROR: Test error/);
    });

    it("should handle empty context object", () => {
      logger.warn("Test message", {});

      const logCall = mockConsole.warn.mock.calls[0]?.[0];
      expect(logCall).toMatch(/WARN: Test message {}$/);
    });

    it("should handle complex context objects", () => {
      process.env.NODE_ENV = "development";

      const context = {
        user: { id: 1, name: "John" },
        nested: { deep: { value: "test" } },
        array: [1, 2, 3],
      };

      logger.info("Complex context", context);

      const logCall = mockConsole.info.mock.calls[0]?.[0];
      expect(logCall).toBeDefined();
      expect(logCall).toContain('"user":{"id":1,"name":"John"}');
      expect(logCall).toContain('"nested":{"deep":{"value":"test"}}');
      expect(logCall).toContain('"array":[1,2,3]');
    });
  });

  describe("environment behavior", () => {
    it("should determine development environment correctly", () => {
      process.env.NODE_ENV = "development";

      logger.debug("Debug in dev");
      logger.info("Info in dev");

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });

    it("should determine production environment correctly", () => {
      process.env.NODE_ENV = "production";

      logger.debug("Debug in prod");
      logger.info("Info in prod");
      logger.warn("Warn in prod");
      logger.error("Error in prod");

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined NODE_ENV as development", () => {
      delete process.env.NODE_ENV;

      logger.debug("Debug with undefined env");

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
    });
  });
});