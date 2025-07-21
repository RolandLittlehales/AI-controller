#!/usr/bin/env node

/**
 * Manual test script to check cleanup functionality
 */

// Create test data with old terminal
const fs = require('fs');
const path = require('path');

const settingsDir = path.join(process.cwd(), 'settings');
const terminalStatesFile = path.join(settingsDir, 'terminal-states.json');

// Ensure settings directory exists
if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
}

// Create test data with an old terminal (8 days ago)
const eightDaysAgo = new Date();
eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

const testData = {
    terminals: {
        "old-terminal-123": {
            id: "old-terminal-123",
            terminalId: "old-terminal-123",
            name: "Old Terminal (should be cleaned)",
            status: "disconnected",
            isActive: false,
            createdAt: eightDaysAgo.toISOString(),
            lastActivity: eightDaysAgo.toISOString()
        },
        "recent-terminal-456": {
            id: "recent-terminal-456", 
            terminalId: "recent-terminal-456",
            name: "Recent Terminal (should remain)",
            status: "disconnected",
            isActive: false,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        }
    },
    lastUpdate: new Date().toISOString(),
    version: "1.0.0"
};

fs.writeFileSync(terminalStatesFile, JSON.stringify(testData, null, 2));

console.log('✅ Created test terminal states:');
console.log('📁 File:', terminalStatesFile);
console.log('🕐 Old terminal lastActivity:', eightDaysAgo.toISOString());
console.log('🆕 Recent terminal lastActivity:', new Date().toISOString());
console.log('\n📋 Test steps:');
console.log('1. Start app: pnpm dev');
console.log('2. Check browser console for cleanup logs');
console.log('3. Wait 2-3 seconds for cleanup to run'); 
console.log('4. Check if old terminal was removed from settings file');
console.log('5. Recent terminal should remain and show red dot');