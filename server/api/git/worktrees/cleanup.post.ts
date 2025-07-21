import { defineEventHandler, readBody } from "h3";
import { GitWorktreeService } from "~/server/services/gitWorktree";
import type { ApiResponse, NitroEvent } from "~/types";
import { logger } from "~/utils/logger";
import { useTerminalPersistence } from "~/composables/useTerminalPersistence";
import { existsSync } from "fs";
import { resolve } from "path";

interface CleanupRequest {
  dryRun?: boolean;
}

interface CleanupResult {
  cleanedCount: number;
  orphanedWorktrees: string[];
  errors: string[];
}

export default defineEventHandler(async (event: NitroEvent): Promise<ApiResponse<CleanupResult>> => {
  try {
    const body = await readBody<CleanupRequest>(event);
    const dryRun = body?.dryRun ?? false;

    logger.info("Starting worktree cleanup", { dryRun });

    const result: CleanupResult = {
      cleanedCount: 0,
      orphanedWorktrees: [],
      errors: [],
    };

    // Find a git repository in common locations
    const possibleGitRoots = [
      process.cwd(),
      resolve(process.cwd(), ".."),
      resolve(process.cwd(), "../.."),
    ];

    let gitRoot: string | null = null;
    for (const root of possibleGitRoots) {
      if (existsSync(resolve(root, ".git"))) {
        gitRoot = root;
        break;
      }
    }

    if (!gitRoot) {
      logger.warn("No git repository found, skipping worktree cleanup");
      return {
        success: true,
        data: result,
      };
    }

    const worktreeService = new GitWorktreeService(gitRoot);

    // Get all existing worktrees
    const worktrees = await worktreeService.listWorktrees();

    // Get all active terminal IDs from persisted state
    const persistence = useTerminalPersistence();
    const terminalStates = await persistence.getAllTerminalStates();
    const activeTerminalIds = new Set(Array.from(terminalStates.keys()));

    // Find orphaned worktrees
    for (const worktree of worktrees) {
      if (!activeTerminalIds.has(worktree.terminalId)) {
        result.orphanedWorktrees.push(worktree.terminalId);

        if (!dryRun) {
          try {
            const removed = await worktreeService.removeWorktree(
              worktree.terminalId,
              worktree.isTemporary, // Clean up branch if temporary
            );

            if (removed) {
              result.cleanedCount++;
              logger.info("Removed orphaned worktree", {
                terminalId: worktree.terminalId,
                branchName: worktree.branchName,
                isTemporary: worktree.isTemporary,
              });
            }
          } catch (error) {
            const errorMessage = `Failed to remove worktree ${worktree.terminalId}: ${error}`;
            result.errors.push(errorMessage);
            logger.error(errorMessage);
          }
        }
      }
    }

    logger.info("Worktree cleanup completed", {
      dryRun,
      orphaned: result.orphanedWorktrees.length,
      cleaned: result.cleanedCount,
      errors: result.errors.length,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("Worktree cleanup failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Worktree cleanup failed",
    };
  }
});