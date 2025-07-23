# CLAUDE.md - AI Controller Development Guide

**Activity Router:** Start here for all development work → Find what you need based on what you're doing

## 🔄 **IMPORTANT: When Asked to "Update Your Learnings"**

**This means update the documentation to capture new insights, patterns, or standards.**

### What to Update:
1. **This file (CLAUDE.md)** - For workflow changes, new commands, or core principles
2. **Relevant module in `docs/`** - Update the specific area that changed:
   - `docs/implementation/` - New technical patterns or approaches
   - `docs/workflows/` - Process improvements or new development steps  
   - `docs/troubleshooting/` - New problem/solution patterns discovered
   - `docs/standards/` - Updated coding standards or requirements
   - `docs/reference/` - New architecture decisions or code patterns

### Update Process:
- **Identify the domain** of the learning (testing, CSS, API patterns, etc.)
- **Update the appropriate module** in the docs structure
- **Cross-reference** from this CLAUDE.md if it affects daily workflow
- **Keep examples practical** and immediately usable

---

## 🚀 Project Overview

AI-controller is a Nuxt 3 web application for managing multiple terminal-based AI instances. 

**🎯 Critical Use Case:** This is a **local development tool** that individual developers run on their own computers - NOT a multi-user service or production application. This context is essential for all design decisions.

**Key Implications:**
- **Single-user environment** - No authentication/authorization needed
- **Local-only access** - No rate limiting or DOS protection required  
- **Developer-controlled** - User has full control over their environment
- **HTTP is acceptable** - No strict HTTPS requirement for local dev
- **Race conditions unlikely** - No concurrent users competing for resources

**Current Phase:** Phase 2A - Git Integration (client-side validation)  
**Implementation Plan:** `docs/architecture/multi-terminal-implementation.md`  
**Architecture:** Component-based frontend + Nitro backend + WebSocket terminals

## 🎯 What Are You Trying To Do?

### 🔨 **Implementation Work**
- **Building Vue components?** → `docs/implementation/frontend.md`
- **Server/API development?** → `docs/implementation/backend.md` 
- **Writing tests?** → `docs/implementation/testing.md`
- **CSS/styling work?** → `docs/implementation/styling.md`

### 🔄 **Development Workflows**
- **Starting new feature?** → `docs/workflows/feature-development.md`
- **Conducting code review?** → `docs/workflows/code-review.md`
- **Debugging issues?** → `docs/workflows/debugging.md`
- **UI/UX development?** → `docs/workflows/ui-development.md`

### 🆘 **Problem Solving**
- **Tests failing?** → `docs/troubleshooting/test-issues.md`
- **Build/lint errors?** → `docs/troubleshooting/build-issues.md`
- **Need debugging help?** → `docs/workflows/debugging.md`
- **Code review issues?** → `docs/workflows/code-review.md`

### 📚 **Quick Reference**
- **Implementation plan/phases?** → `docs/architecture/multi-terminal-implementation.md`
- **Standards checklist?** → `docs/reference/standards-quick.md`
- **Common code patterns?** → `docs/reference/code-patterns.md`
- **API documentation?** → `docs/reference/api-guide.md`
- **Architecture overview?** → `docs/reference/architecture.md`

### 📖 **Comprehensive Standards**
- **All standards index** → `docs/standards/README.md`
- **Detailed technical specs** → Individual files in `docs/standards/`

## ⚡ Essential Commands

### Quality Gates (ALL must pass before commit)
```bash
pnpm test        # → 100% test success
pnpm lint        # → 0 errors, 0 warnings  
pnpm typecheck   # → 0 TypeScript errors
pnpm build       # → Successful production build
```

### Development
```bash
pnpm dev              # Start development server
pnpm test             # Run tests with watch
pnpm test:ui          # Run Vitest with UI
```

### Critical Setup (Required after install)
```bash
# Rebuild node-pty native bindings (MUST do this)
cd node_modules/.pnpm/node-pty@1.0.0/node_modules/node-pty && npm rebuild
```

## 🏗️ Technology Stack

- **Frontend:** Nuxt 3 + Vue 3 + TypeScript + Nuxt UI
- **Backend:** Nitro with WebSocket support
- **Terminal:** xterm.js + node-pty + Socket.IO  
- **Styling:** Vanilla Extract + CSS custom properties
- **Testing:** Vitest with minimal mocking philosophy
- **State:** Pinia stores

## 🎯 Core Development Principles

- **Standards First:** Always check `docs/standards/` before implementing
- **Quality Gates:** 100% pass rate required before any commit
- **KISS Principle:** Keep implementations simple and maintainable
- **Type Safety:** Zero `any` tolerance, explicit interfaces everywhere
- **Testing:** Integration-focused, minimal external mocking
- **Design System:** Internal components (`App*`) before external libraries

## 📋 Development Workflow (Essential Steps)

### 1. Branch Management
- **Always** create new branch from `main`
- Use descriptive branch names reflecting the work

### 2. Requirements Analysis  
- Think deeply about requirements before coding
- **Ask for clarification** if anything unclear
- Consider impact on existing codebase

### 3. Standards Check
- **Reference `docs/standards/`** for applicable patterns
- Follow established architecture and coding standards
- Ensure design system compliance

### 4. Implementation
- Keep solutions **KISS** and maintainable
- **Always include tests** (Vitest framework)
- Prefer **integration tests** over unit tests
- Mock only external dependencies

### 5. Quality Assurance
- Run quality gates continuously during development
- Perform self-code review before submission
- Ensure 100% test pass rate and coverage requirements

### 6. Quality Gates (MANDATORY)
**🚨 CRITICAL: ALL must return exit code 0 before any commit:**
```bash
pnpm test        # 100% test success rate
pnpm lint        # 0 linting errors, 0 warnings
pnpm typecheck   # 0 TypeScript errors
pnpm build       # Successful production build
```

## 🚨 Emergency Quick Reference

### Common Issues
- **Tests failing?** Check mocks in `test/setup.ts`
- **TypeScript errors?** Look for `any` types, add proper interfaces
- **Build failing?** Verify all imports and file paths
- **Lint errors?** Run `pnpm lint:fix` for auto-fixes

### Key Files
- **Global test setup:** `test/setup.ts`
- **Type definitions:** `types/index.ts`
- **Standards index:** `docs/standards/README.md`
- **Main terminal component:** `components/Terminal.vue`

### Project Terminology
- **Quality Gates:** Mandatory CI checks (test/lint/typecheck/build)
- **WET Tests:** Write Everything Twice - tests should be clear over DRY
- **Minimal Mocking:** Only mock external dependencies we don't control
- **Design System First:** Check `components/ui/` before external libraries
- **Phase-based Development:** Current approach (Phase 2A → 2B → 3)

## 🔧 Current State & Context

### Phase 2A Implementation (Current)
- **Git Repository Validation:** Client-side only (server-side in Phase 2B)
- **Saved Directories:** localStorage placeholder (proper service in Phase 2B)
- **Terminal Creation UI:** Simplified for current phase
- **Next Phase:** Phase 2B - Server-side Git operations and worktree management
- **Full roadmap:** See `docs/architecture/multi-terminal-implementation.md`

### Key Architecture Decisions
- **Component co-location:** Tests next to source files
- **Vanilla Extract:** Primary CSS system
- **Integration testing:** Focus on user journeys over unit tests
- **TypeScript strict mode:** Zero tolerance for `any` types

### Development Standards Location
All detailed technical standards and patterns are organized in `docs/standards/`:

- **TypeScript:** `docs/standards/typescript.md`
- **Components:** `docs/standards/components.md`  
- **Testing:** `docs/standards/testing.md`
- **CSS/Styling:** `docs/standards/css-styling.md`
- **API/Server:** `docs/standards/api-server.md`
- **Design System:** `docs/standards/design-system.md`
- **Code Quality:** `docs/standards/code-quality.md`
- **Documentation:** `docs/standards/documentation.md`

**📋 Complete Standards Index:** `docs/standards/README.md`

## 💡 Need Help?

### Custom Commands Available
Check `/commands` directory for custom AI workflows and automation

### Documentation Organization
- **Daily workflow:** This file (CLAUDE.md)
- **Implementation guides:** `docs/implementation/`
- **Workflow processes:** `docs/workflows/`  
- **Problem solving:** `docs/troubleshooting/`
- **Quick reference:** `docs/reference/`
- **Detailed standards:** `docs/standards/`

### Update Process
When asked to "update your learnings" → See the detailed process at the top of this file

---
**🎯 Pro Tip:** Bookmark `docs/standards/README.md` for comprehensive technical standards reference