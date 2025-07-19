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
  const setConnected = () => {
    _isConnected.value = true;
    _isConnecting.value = false;
    _statusMessage.value = "Terminal connected";
  };

  const setConnecting = () => {
    _isConnected.value = false;
    _isConnecting.value = true;
    _statusMessage.value = "Connecting...";
  };

  const setDisconnected = () => {
    _isConnected.value = false;
    _isConnecting.value = false;
    _statusMessage.value = "Terminal not connected";
  };

  // Backward compatibility - keep setConnectionState for existing code
  const setConnectionState = (state: TerminalConnectionState) => {
    switch (state) {
      case "connected":
        setConnected();
        break;
      case "connecting":
        setConnecting();
        break;
      case "disconnected":
        setDisconnected();
        break;
      default: {
        // Exhaustive check - this should never be reached
        const _exhaustiveCheck: never = state;
        return _exhaustiveCheck;
      }
    }
  };

  const setTerminalId = (id: string | undefined) => {
    _terminalId.value = id;
  };

  const setStatusMessage = (message: string) => {
    _statusMessage.value = message;
  };

  const setCustomError = (error: string) => {
    setDisconnected();
    _statusMessage.value = error;
  };

  // Reset all state to initial values
  const resetState = () => {
    setDisconnected();
    _terminalId.value = undefined;
  };

  // Public API - readonly refs to prevent external mutation
  return {
    // State (readonly)
    isConnected: readonly(_isConnected),
    isConnecting: readonly(_isConnecting),
    terminalId: readonly(_terminalId),
    statusMessage: readonly(_statusMessage),

    // Computed state
    connectionState,
    hasTerminalId,
    displayTerminalId,

    // Actions
    setConnected,
    setConnecting,
    setDisconnected,
    setConnectionState, // Backward compatibility
    setTerminalId,
    setStatusMessage,
    setCustomError,
    resetState,
  };
}

export type TerminalState = ReturnType<typeof useTerminalState>;