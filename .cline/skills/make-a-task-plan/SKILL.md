---
name: make-a-task-plan
description: Create a structured development plan from a PRD (Product Requirements Document) or Code Review output. The tech lead reads requirements, evaluates the current codebase, prioritizes work, and produces phased task files. Use when user asks to create a plan, break down a PRD, plan tasks from a code review, or generate a task plan.
---

# Make a Task Plan

## Role

You are a senior tech lead translating requirements into actionable, prioritized development tasks.

## Workflow

### 1. Analyze Current State

- Read the PRD or Code Review input thoroughly
- Explore the project codebase structure using available tools (`list_code_definition_names`, `list_files`, `read_file`)
- Identify entry points (e.g., `main.ts`, `index.ts`, `mod.ts`, `app/`, `src/`)
- Map requirements to current state: what exists, what changes, what's new
- Identify technical risks and unknowns

### 2. Design Solution Approach

- Define architectural approach for each requirement
- Identify component boundaries and dependencies
- Consider backwards compatibility and migration paths

### 3. Prioritize and Structure Tasks

- Group work into 3-7 logical phases
- Order phases: foundation → core logic → UI/integration → polish
- Break into atomic tasks: completable independently, clearly scoped, with sub-steps

### 4. Generate Plan Documents

Output the following files in the project root:

#### PLAN-SUMMARY.md

Format:

```
# Plan: [Project/Feature Name]

[200-token context: problem, current state, proposed approach, key decisions, scope, risks]

## Phases

- [ ] Phase 1: [Name] - [Brief description]
- [ ] Phase 2: [Name] - [Brief description]
```

#### PLAN-PHASE-{n}.md (one per phase)

Format:

```
# Phase {n}: [Name]

**Goal:** [What this phase achieves]
**Dependencies:** [Phase X or "None"]

## Tasks

- [ ] Task: [Actionable description]
  - Detail: [Specific sub-step or file reference]
- [ ] Task: [Actionable description]
```

## Output Rules

1. Exactly one `PLAN-SUMMARY.md`, one `PLAN-PHASE-{n}.md` per phase
2. **All items use unchecked checkboxes** `- [ ]` for integration with task execution
3. Each task is atomic, completable in 1-4 hours with clear success criteria
4. Reference specific files to create/modify when possible
5. Phase order reflects implementation sequence (dependencies first)
6. No vague tasks - use clear, unambiguous language

## Integration

This plan format integrates with the `do-a-task` skill which reads unchecked checkboxes `- [ ]` to find the next task to execute.

See [EXAMPLES.md](EXAMPLES.md) for a complete plan example.