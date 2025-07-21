// @ts-ignore - Nuxt auto-imports
import { defineNuxtPlugin } from "#app";
import { useStartupCleanup } from "~/composables/useStartupCleanup";
import { logger } from "~/utils/logger";

/**
 * Startup Cleanup Plugin
 *
 * Runs cleanup operations on client-side app initialization.
 * Non-blocking to avoid delaying app startup.
 */
export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) {
    return;
  }

  try {
    const { performSafeStartupCleanup, isCleanupNeeded } = useStartupCleanup();

    // Check if cleanup is needed first
    const needsCleanup = await isCleanupNeeded();

    if (needsCleanup) {
      logger.info("Startup cleanup needed, running in background");

      // Run cleanup asynchronously to avoid blocking startup
      setTimeout(async () => {
        try {
          const report = await performSafeStartupCleanup();

          if (report.cleanedStates > 0 || report.cleanedWorktrees > 0) {
            logger.info("Startup cleanup completed", {
              states: report.cleanedStates,
              worktrees: report.cleanedWorktrees,
              duration: report.duration,
            });
          }

          if (report.errors.length > 0) {
            logger.warn("Startup cleanup completed with errors", {
              errors: report.errors,
            });
          }
        } catch (error) {
          logger.error("Background startup cleanup failed", { error });
        }
      }, 1000); // Delay by 1 second to let app initialize
    } else {
      logger.debug("No startup cleanup needed");
    }
  } catch (error) {
    // Don't let cleanup errors prevent app startup
    logger.error("Startup cleanup check failed", { error });
  }
});