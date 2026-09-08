# Echo OS — Agent Instructions

## Project Overview

Echo OS is an interactive web-based concept operating system created as a
personal creative project.

It is not an attempt to implement a real operating system kernel or reproduce
an existing desktop environment in a browser.

Echo OS is a design experiment built around the following question:

> What if we step away from the assumption that a desktop operating system
> must be application-centric, and instead design the environment around the
> user's work?

The project explores how an operating environment can reduce the amount of
attention users spend operating the OS and its applications, allowing them to
focus more directly on what they actually want to work on.

A useful guiding principle is:

> Focus on what the user wants to do with the operating system, rather than
> on using the operating system itself.

This is an exploratory prototype. Do not assume that the current interaction
model is final. New abstractions should be justified by observed needs in the
prototype rather than designed speculatively.


## Core Design Direction

Traditional desktop environments often expose applications as the primary
entry point:

Intent
→ Application
→ Window
→ File or Content
→ Work

Echo OS is currently exploring a different flow:

Intent
→ Surface
→ Item
→ Application / Capability
→ Work

This does NOT mean that applications should be removed.

Applications remain useful implementation units and capability providers.
The experiment is whether they need to remain the primary user-facing
organizational unit.

When making UX or architecture decisions, preserve this distinction between:

- internal system structure
- user-facing interaction structure

They do not need to be identical.


## Current Conceptual Model

The project currently uses or explores the following concepts.

### Surface

Surface is a transient invocation and discovery interface.

It can expose:

- Items
- Applications
- Actions
- Recent Items

Surface is NOT an Application Launcher.

Do not turn it into an application grid, Start menu, or conventional command
palette by default.

When the query is empty, Surface currently prioritizes recent Items.

When the user searches, Item, Application, and Action results may be shown
through the same interface.

Avoid duplicate intents. For example, if an Application result already opens
About, do not also expose an "Open About" Action merely as an alias.


### Item

An Item represents something the user can work with or act on.

The current prototype primarily maps Items to VFS files and directories, but
the concept should not be unnecessarily restricted to traditional files.

An Item is not conceptually owned by an Application.

Applications may operate on Items.

Current execution policy is intentionally small:

- directory → Files
- `.txt` file → Text Viewer
- unsupported file → no execution

Do not introduce MIME systems, handler registries, Open With systems, or
generalized capability frameworks until the prototype actually requires them.


### Application

Applications are capability and implementation units.

They do not necessarily need to be directly launchable by the user.

For example, Text Viewer exists as an Application internally but is currently
hidden from Surface because it is invoked through a text Item.

Do not assume:

Application = launcher entry = Window owner

These may coincide in some cases, but Echo OS deliberately does not treat them
as universally equivalent.


### Window

A Window is part of the workspace/spatial environment.

A Window does not have to belong permanently to an Application.

The current Window model therefore allows `appId` to be absent and supports
Generic Windows that can later have an Application attached.

Preserve this property unless there is a deliberate design decision to change
it.

Do not regress toward an architecture where every Window must be created and
owned by an Application.


### Workspace and Tab

Workspace and Tab are conceptual directions, not completed systems.

The rough spatial model under exploration is:

Workspace
→ Window
→ Tab

Do not implement a Workspace or Tab architecture merely because these concepts
are documented.

They should only be introduced when a concrete interaction requires them.


## Current Interaction Model

The current prototype supports this important interaction path:

Surface
→ Item
→ shared Item execution policy
→ appropriate Application / capability
→ Window

Item execution is centralized at the Desktop/system level.

Both Surface and Files use the same Item execution policy for files.

Files must not know that `.txt` means Text Viewer.

Likewise, Surface must not independently duplicate Item execution rules.

Context-specific navigation is allowed.

For example:

- Surface → directory opens that directory in Files.
- Files → directory double-click navigates within the existing Files Window.

Do not force these interactions to behave identically merely for architectural
uniformity.


## Recent

Recent is currently Item-centric.

The intended prototype rule is:

> Recent = Items that were successfully executed through the shared Item
> execution path.

Recent is NOT currently:

- recent Applications
- recent Windows
- Files navigation history
- general activity history

Keep Recent small and simple unless later testing shows that this definition
needs to change.


## Technology

Use:

- React
- TypeScript
- Vite
- CSS

Prefer native React and CSS implementations over large UI frameworks.

Use additional dependencies only when they provide clear value.

Use TypeScript strictly.

Avoid `any` unless there is a strong technical reason.


## Architecture

Keep system-level behavior separate from individual Applications.

Current major implementation areas include:

- Desktop
- Universal Surface
- Window System
- Application Registry
- Applications
- Virtual File System
- Item execution
- Taskbar
- System-level state

The architecture should support the concept rather than dictate it.

Do not expose an internal implementation concept in the UI merely because it
exists in the architecture.


### Application Registry

Applications are registered through a centralized registry.

An Application may have metadata such as:

- ID
- Name
- Icon
- Component
- Surface visibility

Registry membership does not imply that an Application must appear as a
directly launchable Surface result.


### Virtual File System

The project must not depend on the user's real file system.

The VFS currently represents files, directories, paths, and content for the
prototype.

Keep VFS logic independent from the Files UI.

The current VFS state model is intentionally simple and is not yet a fully
shared persistent filesystem.

Do not redesign VFS state management unless a feature creates a concrete need
for shared state.


## State Management

Keep state as close as possible to the component or system that owns it.

Promote state only when multiple parts of the system genuinely need shared
ownership.

Do not introduce global state simply for convenience.

Do not add a state-management library unless the existing React model has
become a concrete limitation.


## UI and Design

Echo OS should feel coherent as an operating environment, but visual fidelity
to existing desktop operating systems is not the primary goal.

Windows, macOS, Linux, browsers, launchers, and other interfaces may be used
as references.

Do not copy their interaction models automatically.

For every familiar desktop convention, ask whether it supports the current
Echo OS concept before reproducing it.

Maintain consistent:

- spacing
- typography
- colors
- border radius
- shadows
- icons
- animation
- interaction patterns

Use shared CSS variables or design tokens where appropriate.

Avoid unnecessary visual complexity.

The interface should emphasize the user's content and work rather than system
chrome.


## Component Design

Components should have clear responsibilities.

Prefer composition over large monolithic components.

Extract shared logic when real duplication or shared responsibility appears.

Do not create abstractions merely because they may become useful later.

A small amount of duplication or explicit policy is preferable to a premature
framework.


## Development Rules

Before modifying existing code:

1. Inspect the relevant files.
2. Understand the current behavior.
3. Identify the smallest layer that owns the requested behavior.
4. Reuse existing paths when they already express the same behavior.
5. Make the smallest reasonable change.
6. Verify regressions.

Do not rewrite working systems unnecessarily.

Do not introduce speculative architecture.

Do not implement future roadmap features as part of the current task.

If a limitation is discovered outside the requested scope, report it instead
of automatically fixing it.


## Prototype-First Development

Echo OS is developed experimentally.

Prefer:

idea
→ smallest working prototype
→ actual use
→ observation
→ refinement

over:

idea
→ complete abstract architecture
→ generalized framework
→ implementation

Do not attempt to fully formalize concepts such as Item, Application,
Capability, Workspace, Action, or Tab before the prototype requires it.

When two real code paths begin duplicating the same responsibility, a small
shared abstraction may be introduced.

Avoid designing systems solely for hypothetical future features.


## AI Agent Behavior

The AI agent is a development assistant, not the product designer.

The human developer makes final decisions about:

- product concept
- UX
- visual direction
- feature scope
- architecture
- behavior
- implementation

Do not silently reinterpret the project's concept.

Do not turn conceptual possibilities mentioned in documentation into
implementation requirements.

When requirements are ambiguous, prefer the smallest implementation consistent
with current behavior and design direction.

If a request would require a major architectural change, explain why before
performing it.

When you notice a potentially useful future improvement, report it separately
rather than implementing it without request.


## Current Development Priorities

Development priorities are determined by the current interaction experiment,
not by a checklist of conventional OS features.

The current focus is approximately:

1. Universal Surface
2. Item discovery and execution
3. Item/Application separation
4. Recent Items
5. Evaluate the resulting interaction loop
6. Refine the model based on actual use

Do not assume that conventional features such as Settings, Terminal, additional
Applications, Workspace, or Tabs are automatically the next priority.

After completing a phase, stop unless explicitly asked to continue.


## Quality and Verification

Before considering a task complete:

- Run TypeScript checks.
- Run the production build.
- Use `git diff --check`.
- Test the changed behavior in the actual application when possible.
- Check the browser console.
- Test relevant existing behavior for regressions.

Do not claim that a feature works without verifying it.

When reporting completion, distinguish between:

- directly verified behavior
- behavior inferred from code
- known existing issues


## Scope

Echo OS is a concept OS and interactive UX prototype.

Do not attempt to implement:

- a real kernel
- real hardware access
- real device drivers
- real process isolation
- real security boundaries
- real operating-system user accounts

Simulate operating-system concepts only when they contribute to the interaction
experiment.

Technical realism is useful when it supports the concept, but it is not the
primary goal.


## Guiding Rule

When uncertain between a conventional desktop solution and a smaller
experimental solution, do not automatically choose the conventional one.

Ask:

> Does this help the user reach and work with what they actually care about,
> or does it merely make Echo OS behave more like an existing operating system?

Preserve familiar conventions where they are useful.

Challenge them only where doing so serves the central experiment.