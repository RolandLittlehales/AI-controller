# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-controller is a web application designed to manage multiple terminal-based AI instances. The project is currently in its initial stages with no implementation yet.

## Current State

As of the initial commit, this is an empty project with:
- A basic README.md describing the project purpose
- Git repository initialized
- No source code, build configuration, or dependencies defined yet

## Development Guidelines

When implementing this project, consider:

1. **Technology Stack**: No technology stack has been chosen. Based on the project description (web app for managing terminal AI instances), consider technologies that support:
   - Web frontend for management interface
   - Backend capable of process management/terminal interaction
   - Real-time communication for terminal output streaming

2. **Architecture Considerations**: The application will need to:
   - Spawn and manage multiple terminal processes
   - Capture and stream terminal output
   - Provide a web interface for monitoring and control
   - Handle concurrent connections to multiple AI instances

## Future Updates

This file should be updated as the project develops to include:
- Build, test, and lint commands once a technology stack is chosen
- Architecture decisions and patterns
- API design and endpoints
- Component structure and organization