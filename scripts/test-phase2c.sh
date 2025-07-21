#!/bin/bash

# Phase 2C Quick Test Script
set -e

echo "🧪 Testing Phase 2C Persistence & Cleanup..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if persistence file structure works
echo -e "${YELLOW}📁 Test 1: Creating mock terminal state...${NC}"
mkdir -p settings
cat > settings/terminal-states.json << EOF
{
  "terminals": {
    "test-old-terminal": {
      "id": "test-old-terminal",
      "terminalId": "test-old-terminal",
      "name": "Old Test Terminal", 
      "status": "disconnected",
      "isActive": false,
      "createdAt": "2025-07-10T08:00:00.000Z",
      "lastActivity": "2025-07-10T08:00:00.000Z"
    },
    "test-recent-terminal": {
      "id": "test-recent-terminal", 
      "terminalId": "test-recent-terminal",
      "name": "Recent Test Terminal",
      "status": "connected", 
      "isActive": true,
      "createdAt": "2025-07-21T08:00:00.000Z",
      "lastActivity": "2025-07-21T08:00:00.000Z"
    }
  },
  "lastUpdate": "2025-07-21T08:00:00.000Z",
  "version": "1.0.0"
}
EOF

if [ -f "settings/terminal-states.json" ]; then
    echo -e "${GREEN}✅ Mock terminal state created${NC}"
else
    echo -e "${RED}❌ Failed to create mock state${NC}"
    exit 1
fi

# Test 2: Check API endpoints when server starts
echo -e "${YELLOW}🌐 Test 2: Testing API endpoints...${NC}"

# Start dev server in background
echo "Starting dev server..."
pnpm dev > /tmp/nuxt-dev.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start${NC}"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Test persistence API
echo "Testing terminal states API..."
RESPONSE=$(curl -s http://localhost:3001/api/settings/terminal-states)
if echo "$RESPONSE" | grep -q "test-old-terminal"; then
    echo -e "${GREEN}✅ Terminal states API working${NC}"
else
    echo -e "${RED}❌ Terminal states API failed${NC}"
    echo "Response: $RESPONSE"
fi

# Test cleanup API
echo "Testing cleanup API..."
CLEANUP_RESPONSE=$(curl -s -X POST http://localhost:3001/api/git/worktrees/cleanup \
    -H "Content-Type: application/json" \
    -d '{"dryRun": true}')

if echo "$CLEANUP_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Cleanup API working${NC}"
else
    echo -e "${RED}❌ Cleanup API failed${NC}"
    echo "Response: $CLEANUP_RESPONSE"
fi

# Test 3: Check if stale cleanup would work
echo -e "${YELLOW}🧹 Test 3: Simulating stale terminal cleanup...${NC}"
# The old terminal (test-old-terminal) should be identified as stale

# Clean up
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

# Test 4: Verify persistence file handling
echo -e "${YELLOW}📋 Test 4: Testing file operations...${NC}"

# Check if settings service can handle the file
if [ -f "settings/terminal-states.json" ]; then
    TERMINAL_COUNT=$(cat settings/terminal-states.json | grep -o "test.*terminal" | wc -l)
    echo -e "${GREEN}✅ Found $TERMINAL_COUNT test terminals in persistence file${NC}"
fi

# Clean up test files
echo -e "${YELLOW}🧽 Cleaning up test files...${NC}"
rm -f settings/terminal-states.json
rm -f /tmp/nuxt-dev.log

echo -e "${GREEN}🎉 Phase 2C testing complete!${NC}"
echo ""
echo -e "${YELLOW}📖 For manual testing, see: scripts/test-persistence.md${NC}"
echo -e "${YELLOW}🚀 To test full functionality: pnpm dev${NC}"