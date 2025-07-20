import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGitRepository } from "./useGitRepository";

// Mock simple-git
const mockGit = {
  checkIsRepo: vi.fn(),
  branch: vi.fn(),
  revparse: vi.fn(),
  status: vi.fn(),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => mockGit),
}));

// Mock logger
vi.mock("~/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useGitRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe("validateRepository", () => {
    it("should return client-side fallback when not on server", async () => {
      vi.stubGlobal("import.meta", { server: false });

      const { validateRepository, repositoryInfo } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.currentBranch).toBeNull();
      expect(result.rootPath).toBeNull();
      expect(result.hasUncommittedChanges).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
      expect(repositoryInfo.value).toEqual(result);
    });

    it("should return client-side fallback for non-git directory", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { validateRepository, repositoryInfo } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.currentBranch).toBeNull();
      expect(result.rootPath).toBeNull();
      expect(result.hasUncommittedChanges).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
      expect(repositoryInfo.value).toEqual(result);
    });

    it("should return client-side fallback for uncommitted changes check", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { validateRepository } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
    });

    it("should return client-side fallback for git errors", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { validateRepository } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
    });
  });

  describe("getAvailableBranches", () => {
    it("should return empty array when not on server", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { getAvailableBranches } = useGitRepository();

      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
    });

    it("should return empty array when not in git repository", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { getAvailableBranches } = useGitRepository();

      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
    });

    it("should handle branch listing errors", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { validateRepository, getAvailableBranches } = useGitRepository();

      // Setup valid repository first
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branch.mockResolvedValue({ current: "main" });
      mockGit.revparse.mockResolvedValue("/home/user/project");
      mockGit.status.mockResolvedValue({ files: [], staged: [], modified: [] });

      await validateRepository();

      // Mock branch listing failure
      mockGit.branch.mockRejectedValue(new Error("Branch listing failed"));

      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
    });
  });

  describe("branchExists", () => {
    it("should return false when not on server", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { branchExists } = useGitRepository();

      const exists = await branchExists("main");
      expect(exists).toBe(false);
    });

    it("should return false for non-existing branch", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { validateRepository, branchExists } = useGitRepository();

      // Setup valid repository
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branch.mockResolvedValue({ current: "main" });
      mockGit.revparse.mockResolvedValue("/home/user/project");
      mockGit.status.mockResolvedValue({ files: [], staged: [], modified: [] });

      await validateRepository();

      // Mock branch listing
      mockGit.branch.mockResolvedValue({
        branches: {
          main: {},
        },
      });

      const exists = await branchExists("non-existent");
      expect(exists).toBe(false);
    });

    it("should return false when not in git repository", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { branchExists } = useGitRepository();

      const exists = await branchExists("any-branch");
      expect(exists).toBe(false);
    });
  });

  describe.skip("server-side git operations", () => {
    // Skip server-side tests in Phase 2A - git operations are client-side only for now
    // TODO: Enable these tests in Phase 2B Step 7 when server-side git operations are implemented
    // Also remove coverage exemption from vitest.config.ts at that time

    it("should handle git validation errors with Error objects", async () => {
      vi.stubGlobal("import.meta", { server: true });
      const { logger } = await import("~/utils/logger");

      // Mock simple-git to throw an Error
      mockGit.checkIsRepo.mockRejectedValue(new Error("Git command failed"));

      const { validateRepository } = useGitRepository();
      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git command failed");
      expect(logger.error).toHaveBeenCalledWith("Git repository validation failed", expect.any(Object));
    });

    it("should handle git validation errors with non-Error objects", async () => {
      vi.stubGlobal("import.meta", { server: true });
      const { logger } = await import("~/utils/logger");

      // Mock simple-git to throw a non-Error object
      mockGit.checkIsRepo.mockRejectedValue("String error");

      const { validateRepository } = useGitRepository();
      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Unknown git error");
      expect(logger.error).toHaveBeenCalledWith("Git repository validation failed", expect.any(Object));
    });

    it("should get available branches successfully on server", async () => {
      vi.stubGlobal("import.meta", { server: true });
      const { logger } = await import("~/utils/logger");

      // Setup valid repository
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branch.mockResolvedValue({ current: "main" });
      mockGit.revparse.mockResolvedValue("/home/user/project");
      mockGit.status.mockResolvedValue({ files: [], staged: [], modified: [] });

      const { validateRepository, getAvailableBranches } = useGitRepository();
      await validateRepository();

      // Mock successful branch listing
      mockGit.branch.mockResolvedValue({
        branches: {
          "main": {},
          "develop": {},
          "remotes/origin/feature": {},
          "HEAD": {},
        },
      });

      const branches = await getAvailableBranches();

      expect(branches).toEqual(["main", "develop"]);
      expect(logger.info).toHaveBeenCalledWith("Retrieved available branches", { branches: ["main", "develop"] });
    });

    it("should handle getAvailableBranches when not in git repository", async () => {
      vi.stubGlobal("import.meta", { server: true });
      const { logger } = await import("~/utils/logger");

      // Don't set up repository as valid
      const { getAvailableBranches } = useGitRepository();
      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith("Cannot get branches: not in a git repository");
    });

    it("should handle getAvailableBranches when not on server", async () => {
      vi.stubGlobal("import.meta", { server: false });
      const { logger } = await import("~/utils/logger");

      const { getAvailableBranches } = useGitRepository();
      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith("Cannot get branches: git only available on server");
    });

    it("should check branch existence successfully", async () => {
      vi.stubGlobal("import.meta", { server: true });

      // Setup valid repository
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branch.mockResolvedValue({ current: "main" });
      mockGit.revparse.mockResolvedValue("/home/user/project");
      mockGit.status.mockResolvedValue({ files: [], staged: [], modified: [] });

      const { validateRepository, branchExists } = useGitRepository();
      await validateRepository();

      // Mock successful branch listing
      mockGit.branch.mockResolvedValue({
        branches: {
          "main": {},
          "develop": {},
        },
      });

      const existsMain = await branchExists("main");
      const existsDevelop = await branchExists("develop");
      const existsNonExistent = await branchExists("non-existent");

      expect(existsMain).toBe(true);
      expect(existsDevelop).toBe(true);
      expect(existsNonExistent).toBe(false);
    });

    it("should handle branchExists errors", async () => {
      vi.stubGlobal("import.meta", { server: true });
      const { logger } = await import("~/utils/logger");

      // Setup valid repository
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branch.mockResolvedValue({ current: "main" });
      mockGit.revparse.mockResolvedValue("/home/user/project");
      mockGit.status.mockResolvedValue({ files: [], staged: [], modified: [] });

      const { validateRepository, branchExists } = useGitRepository();
      await validateRepository();

      // Mock branch listing failure
      mockGit.branch.mockRejectedValue(new Error("Branch listing failed"));

      const exists = await branchExists("test-branch");

      expect(exists).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Failed to check if branch exists", expect.objectContaining({
        error: expect.any(Error),
        branchName: "test-branch",
      }));
    });
  });
});