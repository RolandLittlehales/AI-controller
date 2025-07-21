import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitWorktreeService } from "./gitWorktree";
import type { WorktreeCreateResult } from "./gitWorktree";

// Mock simple-git
const mockGit = {
  branch: vi.fn(),
  raw: vi.fn(),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => mockGit),
}));

describe("GitWorktreeService", () => {
  let service: GitWorktreeService;
  const testGitRoot = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GitWorktreeService(testGitRoot);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createWorktree", () => {
    it("should create worktree with new branch successfully", async () => {
      const terminalId = "term_123";
      const baseBranch = "main";

      // Mock branch listing
      mockGit.branch.mockResolvedValue({
        branches: {
          main: {},
          "origin/main": {},
        },
      });

      // Mock successful worktree creation
      mockGit.raw.mockResolvedValue("");

      const result: WorktreeCreateResult = await service.createWorktree({
        terminalId,
        baseBranch,
      });

      expect(result.success).toBe(true);
      expect(result.worktreeInfo).toBeDefined();
      expect(result.worktreeInfo?.terminalId).toBe(terminalId);
      expect(result.worktreeInfo?.branchName).toBe(`terminal-${terminalId}`);
      expect(result.worktreeInfo?.isTemporary).toBe(true);
      expect(result.worktreeInfo?.worktreePath).toBe(`${testGitRoot}/.worktrees/${terminalId}`);

      // Verify git commands
      expect(mockGit.raw).toHaveBeenCalledWith([
        "worktree",
        "add",
        "-b",
        `terminal-${terminalId}`,
        `${testGitRoot}/.worktrees/${terminalId}`,
        baseBranch,
      ]);
    });

    it("should create worktree with custom branch name", async () => {
      const terminalId = "term_456";
      const branchName = "feature/custom";
      const baseBranch = "develop";

      mockGit.branch.mockResolvedValue({
        branches: {
          develop: {},
          "origin/develop": {},
        },
      });

      mockGit.raw.mockResolvedValue("");

      const result = await service.createWorktree({
        terminalId,
        branchName,
        baseBranch,
      });

      expect(result.success).toBe(true);
      expect(result.worktreeInfo?.branchName).toBe(branchName);
      expect(result.worktreeInfo?.isTemporary).toBe(false);
    });

    it("should handle branch already exists by using existing branch", async () => {
      const terminalId = "term_789";
      const branchName = "existing-branch";

      mockGit.branch.mockResolvedValue({
        branches: {
          main: {},
          "origin/main": {},
        },
      });

      // First call fails (branch exists), second succeeds
      mockGit.raw
        .mockRejectedValueOnce(new Error("branch already exists"))
        .mockResolvedValueOnce("");

      const result = await service.createWorktree({
        terminalId,
        branchName,
      });

      expect(result.success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledTimes(2);
      expect(mockGit.raw).toHaveBeenLastCalledWith([
        "worktree",
        "add",
        `${testGitRoot}/.worktrees/${terminalId}`,
        branchName,
      ]);
    });

    it("should fail when base branch does not exist", async () => {
      const terminalId = "term_invalid";
      const baseBranch = "nonexistent";

      mockGit.branch.mockResolvedValue({
        branches: {
          main: {},
        },
      });

      const result = await service.createWorktree({
        terminalId,
        baseBranch,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Base branch 'nonexistent' does not exist");
      expect(mockGit.raw).not.toHaveBeenCalled();
    });

    it("should handle git command failures", async () => {
      const terminalId = "term_fail";

      mockGit.branch.mockResolvedValue({
        branches: { main: {} },
      });

      mockGit.raw.mockRejectedValue(new Error("Git command failed"));

      const result = await service.createWorktree({
        terminalId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Git command failed");
    });

    it("should handle errors during branch existence check", async () => {
      const terminalId = "term_error";

      mockGit.branch.mockRejectedValue(new Error("Git error"));

      const result = await service.createWorktree({
        terminalId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Git error");
    });
  });

  describe("removeWorktree", () => {
    it("should remove worktree successfully", async () => {
      const terminalId = "term_remove";

      mockGit.raw.mockResolvedValue("");

      const success = await service.removeWorktree(terminalId);

      expect(success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        "worktree",
        "remove",
        `${testGitRoot}/.worktrees/${terminalId}`,
        "--force",
      ]);
    });

    it("should remove worktree and cleanup branch", async () => {
      const terminalId = "term_cleanup";

      mockGit.raw.mockResolvedValue("");

      const success = await service.removeWorktree(terminalId, true);

      expect(success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        "worktree",
        "remove",
        `${testGitRoot}/.worktrees/${terminalId}`,
        "--force",
      ]);
      // Should also attempt branch cleanup
      expect(mockGit.branch).toHaveBeenCalledWith(["-D", `terminal-${terminalId}`]);
    });

    it("should handle worktree removal failure", async () => {
      const terminalId = "term_fail_remove";

      mockGit.raw.mockRejectedValue(new Error("Remove failed"));

      const success = await service.removeWorktree(terminalId);

      expect(success).toBe(false);
    });

    it("should continue even if branch cleanup fails", async () => {
      const terminalId = "term_branch_fail";

      mockGit.raw.mockResolvedValue(""); // Worktree removal succeeds
      mockGit.branch.mockRejectedValue(new Error("Branch removal failed")); // Branch cleanup fails

      const success = await service.removeWorktree(terminalId, true);

      expect(success).toBe(true); // Should still succeed overall
    });
  });

  describe("listWorktrees", () => {
    it("should parse worktree list correctly", async () => {
      const mockOutput = `worktree ${testGitRoot}
branch refs/heads/main

worktree ${testGitRoot}/.worktrees/term_123
branch refs/heads/terminal-term_123

worktree ${testGitRoot}/.worktrees/term_456
branch refs/heads/feature/custom`;

      mockGit.raw.mockResolvedValue(mockOutput);

      const worktrees = await service.listWorktrees();

      expect(worktrees).toHaveLength(2);
      expect(worktrees[0]).toMatchObject({
        terminalId: "term_123",
        branchName: "terminal-term_123",
        isTemporary: true,
      });
      expect(worktrees[1]).toMatchObject({
        terminalId: "term_456",
        branchName: "feature/custom",
        isTemporary: false,
      });
    });

    it("should handle empty worktree list", async () => {
      mockGit.raw.mockResolvedValue(`worktree ${testGitRoot}
branch refs/heads/main`);

      const worktrees = await service.listWorktrees();

      expect(worktrees).toHaveLength(0);
    });

    it("should handle git list command failure", async () => {
      mockGit.raw.mockRejectedValue(new Error("List failed"));

      const worktrees = await service.listWorktrees();

      expect(worktrees).toHaveLength(0);
    });
  });

  describe("worktreeExists", () => {
    it("should return true when worktree exists", async () => {
      const mockOutput = `worktree ${testGitRoot}/.worktrees/term_123
branch refs/heads/terminal-term_123`;

      mockGit.raw.mockResolvedValue(mockOutput);

      const exists = await service.worktreeExists("term_123");

      expect(exists).toBe(true);
    });

    it("should return false when worktree does not exist", async () => {
      mockGit.raw.mockResolvedValue(`worktree ${testGitRoot}
branch refs/heads/main`);

      const exists = await service.worktreeExists("term_nonexistent");

      expect(exists).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      mockGit.raw.mockRejectedValue(new Error("Command failed"));

      const exists = await service.worktreeExists("term_error");

      expect(exists).toBe(false);
    });
  });

  describe("getWorktreePath", () => {
    it("should return correct worktree path", () => {
      const terminalId = "term_path_test";
      const path = service.getWorktreePath(terminalId);

      expect(path).toBe(`${testGitRoot}/.worktrees/${terminalId}`);
    });
  });
});