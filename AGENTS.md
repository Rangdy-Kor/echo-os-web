# Echo OS — Agent Instructions

## Project Overview

This project is an interactive web-based concept operating system created as a personal creative work.

The goal is not to build a real operating system. The goal is to create a convincing and coherent desktop environment that users can interact with through a web browser.

The project should feel like a small, independent operating system rather than a conventional website or dashboard.

The final result should prioritize:

- Coherent UX
- Visual consistency
- Interactive behavior
- Clear system architecture
- High-quality polish
- A distinctive identity

Do not add features merely because they are technically interesting. Every feature should contribute to the experience of the concept operating system.

## Technology

Use:

- React
- TypeScript
- Vite
- CSS

Prefer native React and CSS implementations over large UI frameworks.

Use additional dependencies only when they provide clear value.

Use TypeScript strictly and avoid `any` unless there is a strong technical reason.

## Architecture

Organize the application around these concepts:

- Desktop
- Window System
- Application Registry
- Applications
- Virtual File System
- System State
- Theme

The architecture should separate operating-system-level behavior from individual applications.

### Desktop

The Desktop manages the overall environment, including:

- Wallpaper
- System bar
- Application launcher
- Running applications
- Notifications
- Desktop-level interactions

### Window System

All applications run inside a shared Window system.

Windows should be designed to support:

- Open
- Close
- Focus
- Move
- Minimize
- Maximize
- Restore

Window behavior should be implemented centrally rather than independently inside each application.

### Application Registry

Applications should be registered through a centralized registry.

An application should have a stable identifier and metadata such as:

- ID
- Name
- Icon
- Component
- Capabilities, when necessary

Applications should not directly manipulate unrelated applications or global UI state.

### Virtual File System

The project must not depend on the user's real file system.

Use an in-memory or browser-persisted virtual file system.

The virtual file system should represent:

- Files
- Directories
- Paths
- File metadata

Keep the file system implementation independent from the File Manager UI.

## State Management

Keep state as close as possible to the component or system that owns it.

Use global state only for genuinely global concerns such as:

- Window management
- System settings
- Virtual file system
- Application registry

Do not introduce global state simply for convenience.

If state management becomes complex, prefer a small dedicated store rather than passing large amounts of state through unrelated components.

## UI and Design

The interface should feel like a complete operating system.

Avoid copying Windows, macOS, or Linux interfaces directly.

Existing operating systems may be used as UX references, but the final interface should have its own visual identity.

Maintain consistent:

- Spacing
- Typography
- Colors
- Border radius
- Shadows
- Icons
- Animation
- Interaction patterns

Use CSS variables/design tokens for values shared across the interface.

Avoid hardcoding the same visual values throughout many components.

## Component Design

Components should have one clear responsibility.

Prefer composition over large monolithic components.

Avoid components that contain unrelated business logic, state management, and presentation all at once.

When a component becomes difficult to understand, consider extracting a smaller component.

Do not create abstractions prematurely.

## Development Rules

Before modifying existing code:

1. Inspect the relevant files.
2. Understand the existing architecture.
3. Reuse existing components and utilities when appropriate.
4. Make the smallest reasonable change.
5. Check for regressions.

Do not rewrite working parts of the application unnecessarily.

Do not introduce a new library when the existing stack can reasonably solve the problem.

Do not generate large amounts of unused or speculative code.

## AI Agent Behavior

The AI agent is a development assistant, not the sole designer of the project.

The human developer makes the final decisions about:

- Product concept
- UX
- Visual direction
- Feature scope
- Architecture
- Behavior
- Final implementation

When requirements are ambiguous, prefer the simplest implementation consistent with the existing project rather than inventing major new functionality.

Do not silently introduce major architectural changes.

If a requested feature conflicts with the existing architecture, explain the conflict before making a major change.

## Implementation Strategy

Build the system incrementally.

Preferred order:

1. Project foundation
2. Desktop
3. Window system
4. Application registry
5. Virtual file system
6. File Manager
7. Settings
8. Terminal
9. Additional applications
10. Visual polish
11. Animation and interaction refinement

Do not implement all features at once.

Each major feature should be functional before moving to the next one.

## Quality

Before considering a task complete:

- Run the project.
- Check for TypeScript errors.
- Check for build errors.
- Test the changed behavior.
- Fix obvious runtime errors.
- Ensure existing functionality still works.

Do not claim that a feature works without verifying it.

## Scope

This is a creative prototype.

Do not attempt to implement:

- A real kernel
- Real hardware access
- Real operating system APIs
- Real user accounts
- Real security boundaries
- Real process isolation
- Real device drivers

Simulate these concepts only when they contribute to the experience.

The goal is a convincing interactive prototype, not a production operating system.
