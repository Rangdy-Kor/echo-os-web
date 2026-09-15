# Echo OS — Agent Instructions

## Project Documentation

Before making changes, use the project documentation according to its role:

- `docs/concept.md` defines the project's conceptual direction and goals.
- `docs/design.md` defines interaction and design principles.
- `docs/architecture.md` describes the current system architecture.

Treat these documents according to their roles rather than as interchangeable
sources of truth.

Implementation examples in documentation are not necessarily permanent
requirements.

When documentation and the current code disagree, inspect both and consider
the type of documentation involved. Do not silently resolve the discrepancy
by assuming either the documentation or the code is automatically correct.

If the discrepancy affects the requested change, preserve the project's
conceptual and design direction, make the smallest reasonable implementation
decision, and report the discrepancy when relevant.

## Project Overview

Echo OS is an interactive web-based concept operating system created as a
personal creative project.

It is not an attempt to implement a real operating system kernel or reproduce
an existing desktop environment in a browser.

The project explores operating-system interaction from a work-centered rather
than strictly application-centered perspective.

For the project's goals, conceptual model, design philosophy, and current
architecture, refer to the project documentation above.

Echo OS is an exploratory prototype. Do not assume that the current
interaction model or implementation is final.

New abstractions should be justified by observed needs in the prototype rather
than designed speculatively.

## Core Agent Principles

### Work over Implementation Structure

Preserve the distinction between:

- internal system structure
- user-facing interaction structure

They do not need to be identical.

Do not expose an internal implementation concept in the UI merely because it
exists in the architecture.

Applications, registries, components, state containers, and other
implementation units should not automatically become user-facing
organizational units.

When modifying existing UI, preserve the project's work-centered direction
described in `docs/concept.md` and `docs/design.md`.

### Surface Boundaries

Treat a Surface as a meaningful work-context boundary.

Within the same Surface, existing context may be reused when that preserves
continuity and matches the intended interaction.

Across different Surfaces, do not automatically redirect, focus, move, or
deduplicate work merely because the same Item or equivalent target already
exists elsewhere.

The same Item may exist in more than one Surface.

Crossing a Surface boundary should generally result from explicit user
interaction rather than invisible global behavior.

Do not optimize away Surface boundaries merely to enforce uniqueness.

### Work-Target Identity

When UI represents a work target, prefer the identity of that target over the
identity of the implementation used to render it.

Do not add redundant Application names, headings, or chrome merely because the
rendering component belongs to an Application internally.

Tabs, titles, search results, and other work-facing UI should represent what
the user is working with when that is the more meaningful identity.

This does not prohibit Application identity when the Application itself is the
user's intended target.

### Context over Uniformity

Shared system behavior does not require every interaction context to behave
identically.

The same Item or action may have different navigation behavior depending on
where the user invoked it.

Prefer behavior that preserves the user's current context and work continuity
over artificial architectural uniformity.

Do not duplicate system-level policy merely to achieve context-specific
navigation. Share the policy that is genuinely common and keep navigation
behavior in the context that owns it.

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

## Architecture Rules

The current architecture is documented in `docs/architecture.md`.

Do not duplicate its implementation description in this file.

When modifying architecture, inspect the current code in addition to the
architecture document.

The architecture should support the product concept rather than dictate it.

Do not preserve an architectural structure solely because it already exists if
the requested behavior reveals a concrete reason to change it.

At the same time, do not redesign architecture when the existing structure can
support the requested behavior with a smaller change.

### Responsibility and State Ownership

Keep behavior in the smallest layer that genuinely owns the responsibility.

Keep state as close as possible to the component or system that owns it.

Promote state only when multiple parts of the system genuinely require shared
ownership.

When shared ownership is required, prefer one coherent source of truth over
manually synchronized duplicate state.

Do not introduce global state simply for convenience.

Do not add a state-management library unless the existing React model has
become a concrete limitation.

Do not move behavior to a higher-level system merely because doing so is
convenient for one call site.

### Item Execution

Item execution policy should be shared when multiple contexts execute the same
kind of Item.

Do not independently duplicate knowledge of Item handling across Surface,
Files, or other interfaces.

Individual Applications should not need to know unrelated system-level
execution policy.

Keep separate:

- what an Item represents
- how the system executes it
- how a particular context navigates to or represents it

Do not introduce generalized handler, MIME, capability, or Open With systems
until a concrete requirement justifies them.

### Virtual File System

Keep VFS logic independent from the Files UI and other individual consumers.

Files, editors, discovery interfaces, and other UI should consume filesystem
state rather than own independent copies of it when shared state is required.

Changes to shared filesystem state should remain coherent for relevant
consumers.

Do not couple VFS operations to a specific UI merely to make synchronization
work.

Do not introduce persistence layers, real filesystem access, synchronization
frameworks, filesystem databases, or generalized storage abstractions until a
concrete feature requires them.

## UI Implementation Rules

Follow the interaction and visual principles in `docs/design.md`.

Do not reproduce familiar desktop behavior automatically.

Do not change familiar behavior merely for novelty.

Prefer the user's content and work over unnecessary system chrome.

### Overflow and Resizing

UI should remain usable across Window and Surface resizing.

Do not hide overflow merely to remove a scrollbar.

When unexpected overflow appears, identify whether it comes from actual content
or from layout behavior such as:

- padding
- borders
- intrinsic sizing
- flex or grid constraints
- baseline behavior
- nested scroll owners

Place scrolling responsibility on the element that conceptually owns the
overflow.

Avoid multiple nested scroll containers for the same content unless the
interaction genuinely requires them.

Temporary editing UI may use different overflow behavior from normal content
display when that produces the more appropriate editing interaction.

Inputs and editing controls should remain usable within the current viewport
while adapting to their content where appropriate.

### Keyboard and Interaction Behavior

Keyboard behavior must be scoped to the context that actually owns it.

Do not treat an active Window or active Tab as equivalent to keyboard focus
inside an editable element.

Before handling a keyboard action, consider:

- active Window or Surface
- active Tab or target
- focused element
- whether the focused element is editable
- whether the requested action is currently available

Do not intercept normal text-editing behavior for navigation or system
shortcuts.

When a shortcut has no valid action in the current context, prefer leaving the
event unconsumed unless there is a deliberate reason otherwise.

When keyboard, context-menu, toolbar, or other interactions express the same
user intent, reuse the same underlying action where practical.

Do not create separate implementations of the same operation merely because
they have different invocation methods.

## Component Design

Components should have clear responsibilities.

Prefer composition over large monolithic components.

Extract shared logic when real duplication or shared responsibility appears.

Do not create abstractions merely because they may become useful later.

A small amount of duplication or explicit policy is preferable to a premature
framework.

When an abstraction is introduced, it should solve a responsibility that has
already appeared in real code or interaction behavior.

Do not generalize a local solution solely because a future feature might
possibly need similar behavior.

## Development Rules

Before modifying existing code:

1. Inspect the relevant files.
2. Understand the current behavior.
3. Identify the smallest layer that owns the requested behavior.
4. Reuse existing paths when they already express the same behavior.
5. Make the smallest reasonable change.
6. Preserve relevant existing behavior unless the request intentionally changes
   it.

Do not rewrite working systems unnecessarily.

Do not introduce speculative architecture.

Do not implement future roadmap features as part of the current task.

Do not silently broaden the task into cleanup, refactoring, modernization, or
architecture work.

If a limitation is discovered outside the requested scope, report it instead
of automatically fixing it.

A local problem should receive a local solution unless the existing
architecture makes that impossible.

Prefer extending an existing behavior path over creating a parallel path for
the same responsibility.

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

Do not fully formalize a concept merely because it appears likely to become
important later.

Do not design systems solely for hypothetical future features.

When real code paths begin duplicating the same responsibility, a small shared
abstraction may be introduced.

When actual use reveals that an earlier implementation or abstraction is no
longer appropriate, it may be changed.

Do not preserve an implementation merely because it was previously documented.

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
with:

1. the explicit request
2. the project's conceptual and design direction
3. current behavior
4. current architecture

Do not invent additional requirements merely to make a feature more complete.

If a request would require a major architectural change, explain why before
performing it.

When you notice a potentially useful future improvement, report it separately
rather than implementing it without request.

Do not continue into another feature, roadmap phase, refactor, or cleanup task
unless explicitly requested.

## Roadmap and Development Priorities

AGENTS.md does not define the current roadmap.

Development priorities change as the prototype is used and evaluated.

Follow the human developer's current request and current project planning
rather than treating any feature list in this file as a permanent priority
order.

Do not infer that a conventional operating-system feature should be implemented
merely because it is absent.

Do not assume that the next logical engineering task is the next desired
product task.

A future feature mentioned in documentation is not an implementation request.

After completing the requested task, stop unless explicitly asked to continue.

## Validation and Reporting

Do not automatically run expensive or broad validation commands unless the
human developer requests validation or the current task explicitly requires it.

In particular, do not assume that every task requires:

- TypeScript `--noEmit` checks
- production builds
- `git diff --check`
- browser or manual verification
- broad regression testing

The human developer may perform validation separately.

When validation is requested, use the smallest validation appropriate to the
change before expanding to broader checks.

Never claim that behavior was verified when it was only inferred from code.

When reporting completion, distinguish when relevant between:

- implemented changes
- directly verified behavior
- behavior inferred from code
- validation not performed
- known existing issues

Do not spend substantial task time or token budget on validation that was not
requested.

## Scope

Echo OS is a concept OS and interactive UX prototype.

Do not expand a normal feature request into implementation of real
operating-system infrastructure.

Unless the project deliberately changes scope, do not attempt to implement:

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
