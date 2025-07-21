import { ref, readonly } from "vue";
import { useTerminalPersistence } from "~/composables/useTerminalPersistence";
import { logger } from "~/utils/logger";
import { STALE_TERMINAL_THRESHOLD_MS } from "~/utils/constants";
import type { ApiResponse, WorktreeCleanupResult } from "~/types";

export interface CleanupReport {
  cleanedStates: number;
  cleanedWorktrees: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * Startup Cleanup Composable
 *
 * Handles cleanup of stale terminal states and orphaned git worktrees on app startup.
 * Runs non-blocking cleanup operations to maintain system hygiene.
 */
export function useStartupCleanup() {
  const isRunning = ref(false);
  const cleanupReport = ref<CleanupReport | null>(null);

  /**
   * Clean up stale terminal states older than the configured threshold
   */
  const cleanupStaleTerminalStates = async (report: CleanupReport): Promise<void> => {
    try {
      const persistence = useTerminalPersistence();
      const persistedStates = await persistence.getAllTerminalStates();
      const now = new Date();

      for (const [terminalId, state] of persistedStates) {
        try {
          const lastActivity = new Date(state.lastActivity);
          const timeSinceActivity = now.getTime() - lastActivity.getTime();

          // Remove if:
          // 1. More than threshold days since last activity (regardless of status)
          // 2. OR invalid date/corrupted state
          const shouldRemove = (timeSinceActivity > STALE_TERMINAL_THRESHOLD_MS) ||
                              isNaN(lastActivity.getTime());

          if (shouldRemove) {
            await persistence.removeTerminalState(terminalId);
            report.cleanedStates++;

            logger.debug("Removed stale terminal state", {
              terminalId,
              lastActivity: state.lastActivity,
              daysSinceActivity: Math.floor(timeSinceActivity / (1000 * 60 * 60 * 24)),
            });
          }
        } catch (error) {
          const errorMessage = `Failed to clean terminal state ${terminalId}: ${error}`;
          report.errors.push(errorMessage);
          logger.warn(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Failed to clean stale terminal states: ${error}`;
      report.errors.push(errorMessage);
      logger.error(errorMessage);
    }
  };

  /**
   * Clean up orphaned git worktrees
   */
  const cleanupOrphanedWorktrees = async (report: CleanupReport): Promise<void> => {
    try {
      // Get list of orphaned worktrees from the server
      const response = await $fetch<ApiResponse<WorktreeCleanupResult>>("/api/git/worktrees/cleanup", {
        method: "POST",
        body: {
          dryRun: false,
        },
      });

      if (response && response.success && response.data) {
        report.cleanedWorktrees = response.data.cleanedCount || 0;

        if (report.cleanedWorktrees > 0) {
          logger.info("Cleaned orphaned worktrees", {
            count: report.cleanedWorktrees,
          });
        }
      }
    } catch (error) {
      const errorMessage = `Failed to clean orphaned worktrees: ${error}`;
      report.errors.push(errorMessage);
      logger.error(errorMessage);
    }
  };

  /**
   * Perform safe startup cleanup operations
   *
   * 1. Remove stale terminal states (older than configured threshold)
   * 2. Clean up orphaned git worktrees
   * 3. Report cleanup results
   */
  const performSafeStartupCleanup = async (): Promise<CleanupReport> => {
    isRunning.value = true;
    const report: CleanupReport = {
      cleanedStates: 0,
      cleanedWorktrees: 0,
      errors: [],
      startTime: new Date(),
    };

    try {
      logger.info("Starting startup cleanup");

      // Step 1: Clean up stale terminal states
      await cleanupStaleTerminalStates(report);

      // Step 2: Clean up orphaned worktrees
      await cleanupOrphanedWorktrees(report);

      report.endTime = new Date();
      report.duration = report.endTime.getTime() - report.startTime.getTime();

      logger.info("Startup cleanup completed", {
        cleanedStates: report.cleanedStates,
        cleanedWorktrees: report.cleanedWorktrees,
        duration: `${report.duration}ms`,
        errors: report.errors.length,
      });

      cleanupReport.value = report;
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown cleanup error";
      report.errors.push(errorMessage);
      logger.error("Startup cleanup failed", { error });

      report.endTime = new Date();
      report.duration = report.endTime.getTime() - report.startTime.getTime();

      cleanupReport.value = report;
      return report;
    } finally {
      isRunning.value = false;
    }
  };

  /**
   * Check if cleanup is needed (for UI purposes)
   */
  const isCleanupNeeded = async (): Promise<boolean> => {
    try {
      const persistence = useTerminalPersistence();
      const states = await persistence.getAllTerminalStates();
      const now = new Date();

      for (const [_, state] of states) {
        const lastActivity = new Date(state.lastActivity);
        const timeSinceActivity = now.getTime() - lastActivity.getTime();

        if ((timeSinceActivity > STALE_TERMINAL_THRESHOLD_MS) ||
            isNaN(lastActivity.getTime())) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn("Failed to check if cleanup needed", { error });
      return false;
    }
  };

  return {
    performSafeStartupCleanup,
    isCleanupNeeded,
    isRunning: readonly(isRunning),
    cleanupReport: readonly(cleanupReport),
  };
}