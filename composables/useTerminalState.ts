import { ref, computed, readonly } from "vue";

/**
 * Terminal connection states
 */
export type TerminalConnectionState = "disconnected" | "connecting" | "connected";

/**
 * Terminal state management composable
 *
 * Provides centralized state management for terminal connection status,
 * terminal ID, and status messages with reactive updates.
 */
export function useTerminalState() {
  // Private state - only this composable can modify
  const _isConnected = ref(false);
  const _isConnecting = ref(false);
  const _terminalId = ref<string | undefined>();
  const _statusMessage = ref("Terminal not connected");

  // Computed properties for derived state
  const connectionState = computed<TerminalConnectionState>(() => {
    if (_isConnected.value) return "connected";
    if (_isConnecting.value) return "connecting";
    return "disconnected";
  });

  const hasTerminalId = computed(() => Boolean(_terminalId.value));

  const displayTerminalId = computed(() => {
    return _terminalId.value ? _terminalId.value.slice(0, 8) : "";
  });

  // State mutation methods
  const setConnectionState = (state: TerminalConnectionState) => {
    switch (state) {
      case "connected":
        _isConnected.value = true;
        _isConnecting.value = false;
        _statusMessage.value = "Terminal connected";
        break;
      case "connecting":
        _isConnected.value = false;
        _isConnecting.value = true;
        _statusMessage.value = "Connecting...";
        break;
      case "disconnected":
        _isConnected.value = false;
        _isConnecting.value = false;
        _statusMessage.value = "Terminal not connected";
        break;
    }
  };

  const setTerminalId = (id: string | undefined) => {
    _terminalId.value = id;
  };

  const setStatusMessage = (message: string) => {
    _statusMessage.value = message;
  };

  const setCustomError = (error: string) => {
    _statusMessage.value = error;
    _isConnected.value = false;
    _isConnecting.value = false;
  };

  // Reset all state to initial values
  const resetState = () => {
    _isConnected.value = false;
    _isConnecting.value = false;
    _terminalId.value = undefined;
    _statusMessage.value = "Terminal not connected";
  };

  // Public API - readonly refs to prevent external mutation
  return {
    // State (readonly)
    isConnected: readonly(_isConnected),
    isConnecting: readonly(_isConnecting),
    terminalId: readonly(_terminalId),
    statusMessage: readonly(_statusMessage),

    // Computed state
    connectionState: readonly(connectionState),
    hasTerminalId: readonly(hasTerminalId),
    displayTerminalId: readonly(displayTerminalId),

    // Actions
    setConnectionState,
    setTerminalId,
    setStatusMessage,
    setCustomError,
    resetState,
  };
}

export type TerminalState = ReturnType<typeof useTerminalState>;