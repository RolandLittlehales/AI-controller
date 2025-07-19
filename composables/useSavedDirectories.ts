import { logger } from "~/utils/logger";

/**
 * Saved Directory Management Composable
 *
 * Manages user's saved git repository directories for quick terminal creation.
 * Uses settings service for persistence and git validation for verification.
 */

export interface SavedDirectory {
  id: string;
  name: string;
  path: string;
  description?: string;
  lastUsed: Date;
  isValid: boolean;
  defaultBranch?: string;
}

export function useSavedDirectories() {
  // Note: This will be enhanced with real settings service in Phase 2B
  // For now, using localStorage as a placeholder

  const getSavedDirectories = async (): Promise<SavedDirectory[]> => {
    try {
      // Placeholder implementation using localStorage
      if (import.meta.client) {
        const saved = localStorage.getItem("saved-directories");
        if (saved) {
          const directories = JSON.parse(saved);
          // Convert date strings back to Date objects
          return directories.map((dir: SavedDirectory) => ({
            ...dir,
            lastUsed: new Date(dir.lastUsed),
          }));
        }
      }
      return [];
    } catch (error) {
      logger.error("Failed to load saved directories", { error });
      return [];
    }
  };

  const addSavedDirectory = async (directory: Omit<SavedDirectory, "id" | "lastUsed" | "isValid">): Promise<void> => {
    try {
      const directories = await getSavedDirectories();

      const newDirectory: SavedDirectory = {
        ...directory,
        id: `dir_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        lastUsed: new Date(),
        isValid: true, // Assume valid when adding, will validate later
      };

      directories.push(newDirectory);

      // Placeholder implementation using localStorage
      if (import.meta.client) {
        localStorage.setItem("saved-directories", JSON.stringify(directories));
      }

      logger.info("Added saved directory", { directory: newDirectory });
    } catch (error) {
      logger.error("Failed to add saved directory", { error, directory });
      throw error;
    }
  };

  const removeSavedDirectory = async (directoryId: string): Promise<void> => {
    try {
      const directories = await getSavedDirectories();
      const filtered = directories.filter(d => d.id !== directoryId);

      // Placeholder implementation using localStorage
      if (import.meta.client) {
        localStorage.setItem("saved-directories", JSON.stringify(filtered));
      }

      logger.info("Removed saved directory", { directoryId });
    } catch (error) {
      logger.error("Failed to remove saved directory", { error, directoryId });
      throw error;
    }
  };

  const updateSavedDirectory = async (directoryId: string, updates: Partial<SavedDirectory>): Promise<void> => {
    try {
      const directories = await getSavedDirectories();
      const directoryIndex = directories.findIndex(d => d.id === directoryId);

      if (directoryIndex === -1) {
        throw new Error(`Directory with id ${directoryId} not found`);
      }

      const currentDirectory = directories[directoryIndex];
      if (!currentDirectory) {
        throw new Error(`Directory with id ${directoryId} not found`);
      }

      directories[directoryIndex] = {
        ...currentDirectory,
        ...updates,
        id: directoryId, // Ensure ID cannot be changed
        name: updates.name ?? currentDirectory.name,
        path: updates.path ?? currentDirectory.path,
        isValid: updates.isValid ?? currentDirectory.isValid,
        lastUsed: updates.lastUsed ?? currentDirectory.lastUsed,
      };

      // Placeholder implementation using localStorage
      if (import.meta.client) {
        localStorage.setItem("saved-directories", JSON.stringify(directories));
      }

      logger.info("Updated saved directory", { directoryId, updates });
    } catch (error) {
      logger.error("Failed to update saved directory", { error, directoryId, updates });
      throw error;
    }
  };

  const validateSavedDirectories = async (): Promise<void> => {
    try {
      const directories = await getSavedDirectories();
      let hasChanges = false;

      for (const directory of directories) {
        // For now, we'll mark all as valid since git validation is server-side
        // In Phase 2B, this will call the git validation API
        const wasValid = directory.isValid;

        // Placeholder: Assume directories are valid unless path doesn't exist
        // Real implementation will call validateGitRepository API
        if (directory.isValid !== wasValid) {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Placeholder implementation using localStorage
        if (import.meta.client) {
          localStorage.setItem("saved-directories", JSON.stringify(directories));
        }
        logger.info("Updated saved directory validity status");
      }
    } catch (error) {
      logger.error("Failed to validate saved directories", { error });
    }
  };

  const getSavedDirectory = async (directoryId: string): Promise<SavedDirectory | undefined> => {
    try {
      const directories = await getSavedDirectories();
      return directories.find(d => d.id === directoryId);
    } catch (error) {
      logger.error("Failed to get saved directory", { error, directoryId });
      return undefined;
    }
  };

  const updateLastUsed = async (directoryId: string): Promise<void> => {
    try {
      await updateSavedDirectory(directoryId, { lastUsed: new Date() });
    } catch (error) {
      logger.error("Failed to update last used timestamp", { error, directoryId });
    }
  };

  return {
    getSavedDirectories,
    addSavedDirectory,
    removeSavedDirectory,
    updateSavedDirectory,
    validateSavedDirectories,
    getSavedDirectory,
    updateLastUsed,
  };
}