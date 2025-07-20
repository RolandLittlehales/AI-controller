import { ref, readonly } from "vue";
import { logger } from "~/utils/logger";

/**
 * Git Repository Management Composable
 *
 * Provides basic git repository validation and information.
 * KISS approach: Only essential git operations for terminal creation.
 *
 * PHASE 2A: Client-side validation only (returns fallback for server operations)
 * PHASE 2B: Will implement server-side git operations (Step 7-8 of implementation plan)
 *
 * Coverage Exemption: Server-side code paths intentionally not covered in Phase 2A
 * TODO: Remove coverage exemption and enable server-side tests in Phase 2B Step 7
 */

interface GitRepositoryInfo {
  isGitRepository: boolean;
  currentBranch: string | null;
  rootPath: string | null;
  hasUncommittedChanges: boolean;
  error: string | null;
}

export function useGitRepository() {
  const repositoryInfo = ref<GitRepositoryInfo>({
    isGitRepository: false,
    currentBranch: null,
    rootPath: null,
    hasUncommittedChanges: false,
    error: null,
  });

  /**
   * Validate if current directory is a git repository and get basic info
   * @param cwd - Directory to check (defaults to current working directory)
   * @returns Promise<GitRepositoryInfo>
   */
  const validateRepository = async (cwd?: string): Promise<GitRepositoryInfo> => {
    try {
      logger.info("Validating git repository", { cwd });

      // Return default non-git info on client side
      if (!import.meta.server) {
        const info: GitRepositoryInfo = {
          isGitRepository: false,
          currentBranch: null,
          rootPath: null,
          hasUncommittedChanges: false,
          error: "Git validation only available on server",
        };
        repositoryInfo.value = info;
        return info;
      }

      // Dynamic import of simple-git on server side
      const { simpleGit } = await import("simple-git");
      const git = simpleGit({
        baseDir: cwd || process.cwd(),
        binary: "git",
        maxConcurrentProcesses: 1,
      });

      // Check if we're in a git repository
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        const info: GitRepositoryInfo = {
          isGitRepository: false,
          currentBranch: null,
          rootPath: null,
          hasUncommittedChanges: false,
          error: "Not a git repository",
        };
        repositoryInfo.value = info;
        logger.warn("Directory is not a git repository", { cwd });
        return info;
      }

      // Get current branch
      const branchSummary = await git.branch();
      const currentBranch = branchSummary.current;

      // Get repository root path
      const rootPath = await git.revparse(["--show-toplevel"]);

      // Check for uncommitted changes
      const status = await git.status();
      const hasUncommittedChanges =
        status.files.length > 0 ||
        status.staged.length > 0 ||
        status.modified.length > 0;

      const info: GitRepositoryInfo = {
        isGitRepository: true,
        currentBranch,
        rootPath: rootPath.trim(),
        hasUncommittedChanges,
        error: null,
      };

      repositoryInfo.value = info;
      logger.info("Git repository validated successfully", {
        currentBranch,
        rootPath: rootPath.trim(),
        hasUncommittedChanges,
      });

      return info;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown git error";
      logger.error("Git repository validation failed", { error });

      const info: GitRepositoryInfo = {
        isGitRepository: false,
        currentBranch: null,
        rootPath: null,
        hasUncommittedChanges: false,
        error: errorMessage,
      };

      repositoryInfo.value = info;
      return info;
    }
  };

  /**
   * Get list of available branches
   * @returns Promise<string[]> List of branch names
   */
  const getAvailableBranches = async (): Promise<string[]> => {
    try {
      if (!repositoryInfo.value.isGitRepository) {
        logger.warn("Cannot get branches: not in a git repository");
        return [];
      }

      if (!import.meta.server) {
        logger.warn("Cannot get branches: git only available on server");
        return [];
      }

      // Dynamic import of simple-git on server side
      const { simpleGit } = await import("simple-git");
      const git = simpleGit({
        baseDir: repositoryInfo.value.rootPath || process.cwd(),
        binary: "git",
        maxConcurrentProcesses: 1,
      });

      const branchSummary = await git.branch(["-a"]);
      const branches = Object.keys(branchSummary.branches)
        .filter(branch => !branch.startsWith("remotes/"))
        .filter(branch => branch !== "HEAD")
        .map(branch => branch.replace("origin/", ""));

      logger.info("Retrieved available branches", { branches });
      return branches;
    } catch (error) {
      logger.error("Failed to get available branches", { error });
      return [];
    }
  };

  /**
   * Check if a specific branch exists
   * @param branchName - Name of branch to check
   * @returns Promise<boolean>
   */
  const branchExists = async (branchName: string): Promise<boolean> => {
    try {
      if (!repositoryInfo.value.isGitRepository) {
        return false;
      }

      const branches = await getAvailableBranches();
      return branches.includes(branchName);
    } catch (error) {
      logger.error("Failed to check if branch exists", { error, branchName });
      return false;
    }
  };

  return {
    repositoryInfo: readonly(repositoryInfo),
    validateRepository,
    getAvailableBranches,
    branchExists,
  };
}