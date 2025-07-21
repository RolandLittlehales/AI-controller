#!/bin/bash

# Claude Code Notification Hook
# Plays different Windows system sounds based on notification type
# Asterisk = Claude finished/idle
# Exclamation = Permission needed

# Get notification type from hook context
# The hook system provides different environment variables depending on the trigger
NOTIFICATION_TYPE=""

# Check if this is a user-prompt-submit hook (indicating Claude needs permission)
if [[ -n "$CLAUDE_HOOK_TYPE" ]] && [[ "$CLAUDE_HOOK_TYPE" == "user-prompt-submit" ]]; then
    NOTIFICATION_TYPE="permission"
elif [[ -n "$CLAUDE_HOOK_TYPE" ]] && [[ "$CLAUDE_HOOK_TYPE" == "notification" ]]; then
    NOTIFICATION_TYPE="idle"
else
    # Default to idle notification if we can't determine the type
    NOTIFICATION_TYPE="idle"
fi

# Play appropriate sound based on notification type
case "$NOTIFICATION_TYPE" in
    "permission")
        # Permission needed - use Exclamation sound
        powershell.exe -c "[System.Media.SystemSounds]::Exclamation.Play()" 2>/dev/null
        ;;
    "idle"|"finished")
        # Claude finished/idle - use Asterisk sound
        powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()" 2>/dev/null
        ;;
    *)
        # Default fallback - use Asterisk sound
        powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()" 2>/dev/null
        ;;
esac

# Exit successfully
exit 0



  // "hooks": {
  //   "Notification": [
  //     {
  //       "matcher": "",
  //       "hooks": [
  //         {
  //           "type": "command",
  //           "command": "/home/rolan/code/ai-controller/.claude/hooks/notification-bell.sh"
  //         }
  //       ]
  //     }
  //   ],
  //   "Stop": [
  //     {
  //       "matcher": "",
  //       "hooks": [
  //         {
  //           "type": "command",
  //           "command": "/home/rolan/code/ai-controller/.claude/hooks/notification-bell.sh"
  //         }
  //       ]
  //     }
  //   ]
  // }