import { ref, readonly } from "vue";

/**
 * Dynamic System Resource Detection for Terminal Limits
 *
 * Detects CPU cores and calculates safe terminal limits based on:
 * - Total CPU cores available
 * - 25% core reservation for system operations
 * - Conservative limits for MVP safety
 */

interface SystemInfo {
  totalCores: number
  maxTerminals: number
}

export function useSystemResources() {
  const systemInfo = ref<SystemInfo>({
    totalCores: 0,
    maxTerminals: 0,
  });

  /**
   * Detect system capability and calculate terminal limits
   * Uses navigator.hardwareConcurrency to detect CPU cores
   * Falls back to 4 cores if API not available (older browsers or SSR)
   */
  const detectSystemCapability = (): SystemInfo => {
    // Get total CPU cores from browser API (safe for SSR)
    const totalCores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;

    // Reserve 25% of cores (minimum 2) for system operations
    const reservedCores = Math.max(2, Math.ceil(totalCores * 0.25));

    // Calculate maximum terminals (available cores after reservation)
    const maxTerminals = totalCores - reservedCores;

    // Update reactive state
    systemInfo.value = {
      totalCores,
      maxTerminals,
    };

    return systemInfo.value;
  };

  return {
    systemInfo: readonly(systemInfo),
    detectSystemCapability,
  };
}