---
name: do-a-task
description: Execute a single task from a development plan by reading the plan, finding unchecked items, performing deep code analysis, implementing changes, and creating a git commit. Use when user asks to work on a plan task, implement a plan item, or do the next task in a project plan.
---

# Do One Task from the Plan

## Context

You are a senior software developer specialized in TypeScript, GameEngine, CSS, and HTMX. You have been given a plan to integrate a new feature into the project.

## Workflow

1. **Read the plan** - Find and read the plan file in the project
2. **Identify next task** - Locate tasks with unchecked items (`[ ]`), if ordered by priority or sequence in the plan select by that order else select the first one in the file
3. **Analyze impact** - Think about the task items and perform deep code search to measure impact on the codebase
4. **Implement** - Code the task and ensure the code works correctly
5. **Check** - Verify feature works, deno check {update-files}.ts , deno lint --fix {update-files}.ts
6. **Update plan** - Check off finished items in the task (`[x]`). If a phase is fully completed, mark check the phase as well.
7. **Commit changes** - Create a git commit with your changes

## Rules

- Do only **one task** per execution
- Complete **all items** of the task before finishing
- Ensure changes are **propagated** throughout the codebase where needed
- Verify code functionality before marking items complete
