# Test Status Indicators

## Visual Status Indicator Reference:

### 🟡 Connecting (Yellow - Pulsing)
- Status: `"connecting"`
- Appears when terminal is being created
- Pulsing animation indicates activity

### 🟢 Connected (Green - Solid)  
- Status: `"connected"`
- Appears when terminal has active WebSocket connection
- Solid green indicates healthy connection

### 🔴 Disconnected (Red - Solid)
- Status: `"disconnected"` 
- Appears when terminal is not connected
- This should show for restored terminals on app restart

### 🔴 Error (Red - Pulsing)
- Status: `"error"`
- Appears when terminal encounters connection errors
- Pulsing red indicates problem needs attention

## Test Steps:

1. **Test Restored Terminals**:
   - Create terminals in UI
   - Restart app with `Ctrl+C` then `pnpm dev`
   - **Expected**: Restored terminals show 🔴 red dots (disconnected)

2. **Test Connection Flow**:
   - Create new terminal
   - **Expected**: Brief 🟡 yellow dot (connecting)
   - **Expected**: Changes to 🟢 green dot (connected)

3. **Test Error State** (if implemented):
   - Disconnect internet/server
   - **Expected**: 🔴 red pulsing dot (error)

## Quick Visual Test:
```bash
# Start app
pnpm dev

# Create terminal via UI, then restart app
# Check that restored terminals show red dots
```