import { simpleGit } from "simple-git";
import type { SimpleGit } from "simple-git";
import { join } from "path";
import { logger } from "~/utils/logger";

/**
 * Git Worktree Management Service
 *
 * Handles creation and cleanup of git worktrees for terminal isolation.
 * KISS approach: Basic worktree operations for terminal creation.
 */

export interface WorktreeInfo {
  terminalId: string;
  branchName: string;
  worktreePath: string;
  isTemporary: boolean;
  createdAt: Date;
}

export interface CreateWorktreeOptions {
  terminalId: string;
  branchName?: string;
  baseBranch?: string;
  gitRoot?: string;
}

export interface WorktreeCreateResult {
  success: boolean;
  worktreeInfo?: WorktreeInfo;
  error?: string;
}

/**
 * Git Worktree Service Class
 * Manages worktree lifecycle for terminal isolation
 */
export class GitWorktreeService {
  private readonly gitRoot: string;
  private readonly git: SimpleGit;

  constructor(gitRoot: string) {
    this.gitRoot = gitRoot;
    this.git = simpleGit({
      baseDir: gitRoot,
      binary: "git",
      maxConcurrentProcesses: 1,
    });
  }

  /**
   * Create a new git worktree for a terminal
   * @param options - Worktree creation options
   * @returns Promise<WorktreeCreateResult>
   */
  async createWorktree(options: CreateWorktreeOptions): Promise<WorktreeCreateResult> {
    const { terminalId, branchName, baseBranch = "main" } = options;

    try {
      logger.info("Creating git worktree", { terminalId, branchName, baseBranch });

      // Generate branch name if not provided
      const targetBranch = branchName || `terminal-${terminalId}`;
      const isTemporary = !branchName; // If no branch name provided, it's temporary

      // Create worktree directory path
      const worktreePath = join(this.gitRoot, ".worktrees", terminalId);

      // Check if base branch exists
      const branches = await this.git.branch(["-a"]);
      const availableBranches = Object.keys(branches.branches);
      const baseBranchExists = availableBranches.some(branch =>
        branch === baseBranch || branch === `origin/${baseBranch}`,
      );

      if (!baseBranchExists) {
        const error = `Base branch '${baseBranch}' does not exist`;
        logger.error("Worktree creation failed: base branch not found", { baseBranch, availableBranches });
        return { success: false, error };
      }

      // Create worktree with new branch
      try {
        await this.git.raw([
          "worktree",
          "add",
          "-b",
          targetBranch,
          worktreePath,
          baseBranch,
        ]);
      } catch (worktreeError) {
        // If branch already exists, try to create worktree with existing branch
        logger.warn("Branch already exists, attempting to use existing branch", { targetBranch, error: worktreeError });
        try {
          await this.git.raw([
            "worktree",
            "add",
            worktreePath,
            targetBranch,
          ]);
        } catch (existingBranchError) {
          const error = `Failed to create worktree: ${existingBranchError}`;
          logger.error("Worktree creation failed with existing branch", { error: existingBranchError });
          return { success: false, error };
        }
      }

      const worktreeInfo: WorktreeInfo = {
        terminalId,
        branchName: targetBranch,
        worktreePath,
        isTemporary,
        createdAt: new Date(),
      };

      logger.info("Git worktree created successfully", { worktreeInfo });
      return { success: true, worktreeInfo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown worktree error";
      logger.error("Git worktree creation failed", { error, terminalId, branchName });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Remove a git worktree and optionally clean up the branch
   * @param terminalId - Terminal ID associated with the worktree
   * @param cleanupBranch - Whether to delete the branch if it's temporary
   * @returns Promise<boolean> Success status
   */
  async removeWorktree(terminalId: string, cleanupBranch = false): Promise<boolean> {
    try {
      logger.info("Removing git worktree", { terminalId, cleanupBranch });

      const worktreePath = join(this.gitRoot, ".worktrees", terminalId);

      // Remove worktree
      await this.git.raw(["worktree", "remove", worktreePath, "--force"]);

      // Optionally clean up branch if it was temporary
      if (cleanupBranch) {
        const branchName = `terminal-${terminalId}`;
        try {
          await this.git.branch(["-D", branchName]);
          logger.info("Cleaned up temporary branch", { branchName });
        } catch (branchError) {
          logger.warn("Failed to cleanup branch (may not exist)", { branchName, error: branchError });
        }
      }

      logger.info("Git worktree removed successfully", { terminalId });
      return true;
    } catch (error) {
      logger.error("Failed to remove git worktree", { error, terminalId });
      return false;
    }
  }

  /**
   * List all existing worktrees
   * @returns Promise<WorktreeInfo[]> List of worktree information
   */
  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const output = await this.git.raw(["worktree", "list", "--porcelain"]);
      const worktrees: WorktreeInfo[] = [];

      // Parse worktree list output
      const lines = output.split("\n").filter(line => line.trim() !== "");
      let currentWorktree: Partial<WorktreeInfo> = {};

      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          // Save previous worktree if exists
          const prevPath = currentWorktree.worktreePath;
          if (prevPath) {
            const terminalMatch = prevPath.match(/\.worktrees\/(.+)$/);
            if (terminalMatch && terminalMatch[1]) {
              worktrees.push({
                terminalId: terminalMatch[1],
                branchName: currentWorktree.branchName || "unknown",
                worktreePath: prevPath,
                isTemporary: currentWorktree.branchName?.startsWith("terminal-") || false,
                createdAt: new Date(), // We don't have creation time from git
              });
            }
          }
          // Start new worktree
          currentWorktree = { worktreePath: line.replace("worktree ", "") };
        } else if (line.startsWith("branch ")) {
          currentWorktree.branchName = line.replace("branch refs/heads/", "");
        }
      }

      // Add last worktree
      const lastPath = currentWorktree.worktreePath;
      if (lastPath) {
        const terminalMatch = lastPath.match(/\.worktrees\/(.+)$/);
        if (terminalMatch && terminalMatch[1]) {
          worktrees.push({
            terminalId: terminalMatch[1],
            branchName: currentWorktree.branchName || "unknown",
            worktreePath: lastPath,
            isTemporary: currentWorktree.branchName?.startsWith("terminal-") || false,
            createdAt: new Date(),
          });
        }
      }

      logger.info("Listed git worktrees", { count: worktrees.length });
      return worktrees;
    } catch (error) {
      logger.error("Failed to list git worktrees", { error });
      return [];
    }
  }

  /**
   * Check if a worktree exists for a terminal
   * @param terminalId - Terminal ID to check
   * @returns Promise<boolean>
   */
  async worktreeExists(terminalId: string): Promise<boolean> {
    try {
      const worktrees = await this.listWorktrees();
      return worktrees.some(wt => wt.terminalId === terminalId);
    } catch (error) {
      logger.error("Failed to check worktree existence", { error, terminalId });
      return false;
    }
  }

  /**
   * Get worktree path for a terminal
   * @param terminalId - Terminal ID
   * @returns string Worktree path
   */
  getWorktreePath(terminalId: string): string {
    return join(this.gitRoot, ".worktrees", terminalId);
  }
}