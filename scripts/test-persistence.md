# Phase 2C Testing Guide

## 1. Terminal State Persistence Test

### Test Steps:
1. **Start the app**: `pnpm dev`
2. **Create terminals**: Use the UI to create 2-3 terminals with different names
3. **Verify persistence file**: Check if `settings/terminal-states.json` is created
4. **Restart app**: Stop (`Ctrl+C`) and restart (`pnpm dev`)
5. **Verify restoration**: Check if terminals appear in the sidebar (status: "disconnected")

### Expected Results:
- Terminals persist across restarts
- Terminal metadata (name, creation time) is preserved  
- Status correctly shows as "disconnected" on restart

### Check Persistence File:
```bash
cat settings/terminal-states.json
```

## 2. Startup Cleanup Test

### Test Stale Terminal States:
1. **Manually modify dates**: Edit `settings/terminal-states.json` 
2. **Set old lastActivity**: Change to 8+ days ago: `"2025-07-13T10:00:00.000Z"`
3. **Set status to disconnected**: `"status": "disconnected"`
4. **Restart app**: Should clean up old terminals

### Test Orphaned Worktrees:
1. **Create fake worktree folder**: `mkdir -p .worktrees/fake-terminal-123`
2. **Check cleanup endpoint**: 
```bash
curl -X POST http://localhost:3001/api/git/worktrees/cleanup \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

## 3. API Testing

### Test Terminal States API:
```bash
# Get current states
curl http://localhost:3001/api/settings/terminal-states

# Save new state
curl -X PUT http://localhost:3001/api/settings/terminal-states \
  -H "Content-Type: application/json" \
  -d '{
    "terminals": {
      "test-123": {
        "id": "test-123",
        "terminalId": "test-123", 
        "name": "Test Terminal",
        "status": "disconnected",
        "isActive": false,
        "createdAt": "2025-07-21T08:00:00.000Z",
        "lastActivity": "2025-07-21T08:00:00.000Z"
      }
    },
    "lastUpdate": "2025-07-21T08:00:00.000Z",
    "version": "1.0.0"
  }'
```

## 4. UI Indicators Test

### Startup Cleanup Indicator:
1. **Create stale data** (as above)
2. **Restart app**
3. **Watch bottom-right corner**: Should see "Cleaning up..." spinner briefly
4. **Check console**: Should log cleanup results

## 5. Browser DevTools Testing

### Check Console Logs:
1. **Open DevTools** (F12)
2. **Watch Console tab** during app startup
3. **Look for cleanup logs**:
   - "Startup cleanup needed, running in background"
   - "Startup cleanup completed"
   - "Restored terminals from persistence"

### Check Network Tab:
1. **Monitor API calls** to `/api/settings/terminal-states`
2. **Monitor cleanup calls** to `/api/git/worktrees/cleanup`

## 6. Error Handling Tests

### Test Missing Files:
1. **Delete settings file**: `rm settings/terminal-states.json`
2. **Restart app**: Should handle gracefully without errors

### Test Corrupted Data:
1. **Add invalid JSON**: `echo "invalid json" > settings/terminal-states.json`  
2. **Restart app**: Should fall back to empty state

### Test Permission Errors:
1. **Remove write permissions**: `chmod 444 settings/terminal-states.json`
2. **Create terminal**: Should handle save errors gracefully

## Expected Behaviors

### ✅ Success Indicators:
- No console errors during startup
- Terminals persist across restarts  
- Stale terminals (7+ days) get cleaned up
- UI shows subtle cleanup progress
- API endpoints return proper responses

### ❌ Failure Indicators:
- App crashes or fails to start
- Terminals don't persist
- Cleanup doesn't run or fails silently
- API returns 500 errors
- UI blocks on startup

## Automated Testing Commands

```bash
# Quick test sequence
pnpm dev &           # Start in background
sleep 5              # Wait for startup
curl -s http://localhost:3001/api/settings/terminal-states
curl -X POST http://localhost:3001/api/git/worktrees/cleanup -d '{"dryRun":true}'
kill %1              # Stop background dev server
```