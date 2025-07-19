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

// Mock import.meta.server in the module
vi.stubGlobal("import.meta", { server: true });

describe("useGitRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure server environment for each test
    vi.stubGlobal("import.meta", { server: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateRepository", () => {
    it("should return client-side fallback when not on server", async () => {
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
      const { validateRepository } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
    });

    it("should return client-side fallback for git errors", async () => {
      const { validateRepository } = useGitRepository();

      const result = await validateRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git validation only available on server");
    });
  });

  describe("getAvailableBranches", () => {
    it("should return empty array when not on server", async () => {
      const { getAvailableBranches } = useGitRepository();

      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
    });

    it("should return empty array when not in git repository", async () => {
      const { getAvailableBranches } = useGitRepository();

      const branches = await getAvailableBranches();

      expect(branches).toEqual([]);
    });

    it("should handle branch listing errors", async () => {
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
      const { branchExists } = useGitRepository();

      const exists = await branchExists("main");
      expect(exists).toBe(false);
    });

    it("should return false for non-existing branch", async () => {
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
      const { branchExists } = useGitRepository();

      const exists = await branchExists("any-branch");
      expect(exists).toBe(false);
    });
  });
});