# user-story

A [Pi](https://pi.dev) extension that brings structured **user-story / task** project management directly into your terminal session.

Built on the [agent-fs](../agent-fs) file-system pattern: every story, task, agent, and skill is a plain Markdown file with YAML front-matter — version-control friendly, editor-agnostic, and fully inspectable.

---

## What it does

| Command | Description |
|---|---|
| `/story-list` | List all stories in your workspace |
| `/story-open [ref]` | Switch the active story (number or slug; no arg = interactive picker) |
| `/task-list [story-ref]` | List tasks in the current (or named) story |
| `/task-run [story] [task]` | Run a task — builds the execution payload and fires an agent turn |
| `/story-new` | Create a new story interactively |
| `/task-new` | Create a new task in the current story |

The **current story** is always visible in Pi's footer status bar.

When a task runs, the extension:
1. Reads the task + story front-matter to build the `TaskExecutionPayload`
2. Injects **story context** + **agent definitions** + **skill bodies** into the system prompt
3. Sends the prompt as: `<task.prompts>\n\n@/path/to/TASK.md`

---

## Requirements

- [Pi](https://pi.dev) installed (`npm i -g @mariozechner/pi-coding-agent` or the binary from [pi.dev](https://pi.dev))
- Node.js ≥ 18

---

## Installation

### Option A — Direct (recommended for development)

Clone or copy this directory anywhere on your machine, then start Pi pointing at it:

```bash
git clone https://github.com/your-org/user-story
cd user-story

# Point Pi at the extension and your workspace
AGENT_FS_WORKSPACE=/path/to/your/workspace \
  pi --extension ./extensions/index.ts
```

### Option B — As a Pi Package

Add a `pi.json` (or the `"pi"` key in `package.json`) to publish:

```json
{
  "pi": {
    "extensions": ["./extensions"]
  }
}
```

Then install into Pi globally:

```bash
pi install ./user-story          # local path
# or after publishing to npm:
pi install npm:@your-org/user-story
```

### Option C — Add to Pi settings

Add the extension path to your `~/.pi/settings.json`:

```json
{
  "extensions": [
    "/absolute/path/to/user-story/extensions/index.ts"
  ]
}
```

---

## Configuration

| Method | Example |
|---|---|
| Environment variable | `AGENT_FS_WORKSPACE=/my/workspace pi` |
| Pi flag | `pi --workspace /my/workspace` |
| Default | Falls back to the current working directory |

---

## Workspace layout

```
workspace/
  skills/
    <skill-name>/
      SKILL.md          ← name, description, body (injected into system prompt)
  agents/
    <agent-name>/
      AGENT.md          ← name, description, skills list
      skills/           ← optional agent-local skills (override base-dir)
        <skill-name>/
          SKILL.md
  story/
    001-my-feature/
      STORY.md          ← name, description, agents, skills
      TASK-001-do-thing.md
      TASK-002-next-thing.md
      log/
        LOG-001-001-first-run.md
```

### STORY.md

```yaml
---
name: User Auth Feature
description: Implement login, registration and JWT refresh
agents:
  - backend-dev
skills:
  - code-review
---
Any additional context the agent should know about this story.
```

### TASK-001-setup-database.md

```yaml
---
name: Setup database schema
description: Create users table and migration
agents:
  - backend-dev
skills:
  - sql-expert
prompts: Design and implement the users table migration. Include indexes for email and created_at.
---

## Checklist

- [ ] Create migration file
- [ ] Add indexes
- [ ] Write rollback
```

A task is **done** when it contains no `[ ]` or `TODO` tokens.
A story is **done** when all its tasks are done.

### AGENT.md

```yaml
---
name: backend-dev
description: Expert in Node.js, TypeScript, PostgreSQL, and REST API design
skills:
  - code-review
  - sql-expert
---
You prefer explicit over implicit. Always add types. Prefer composition over inheritance.
```

### SKILL.md

```yaml
---
name: sql-expert
description: Deep knowledge of PostgreSQL query planning, indexing, and schema design
---
When writing SQL migrations, always:
- Use timestamptz not timestamp
- Add NOT NULL constraints unless NULL is semantically meaningful
- Name indexes explicitly: idx_<table>_<column>
```

---

## How /task-run works

```
/task-run STORY-001 TASK-002
         │              │
         │              └─ find TASK-002 in story dir
         └─ find story 001

 ┌─ TaskExecutionPayload ─────────────────────────────────────────┐
 │  story:   story/001-my-feature/STORY.md                        │
 │  agents:  [agents/backend-dev/AGENT.md, ...]   ← union         │
 │  skills:  [skills/sql-expert/SKILL.md, ...]    ← union         │
 │  prompt:  "Design and implement the users table migration..."   │
 │  task:    story/001-my-feature/TASK-002-setup-database.md      │
 └────────────────────────────────────────────────────────────────┘

 System prompt injection (before_agent_start):
   ## Current Story
   [STORY.md content]

   ## Agent: backend-dev
   [AGENT.md content]

   ## Skill: sql-expert
   [SKILL.md body]

 User message:
   Design and implement the users table migration...

   @/path/to/TASK-002-setup-database.md
```

The `@file` reference lets Pi read the full task file so the agent sees the checklist, description, and any in-progress notes.

---

## Shortcuts

| Reference | Resolves to |
|---|---|
| `/task-run` | Picker for story → picker for task |
| `/task-run 1` | Task #1 in current story |
| `/task-run TASK-001` | Same |
| `/task-run 2 1` | Story #2, Task #1 |
| `/task-run STORY-002 TASK-001` | Same, explicit |
| `/story-open 3` | Switch to story #3 |

---

## Footer

The current story is always shown in Pi's status bar:

```
◆ User Auth Feature
```

This updates immediately when you switch stories with `/story-open`.

---

## Extension files

```
extensions/
  index.ts    ← main extension: commands, events, state
  fs.ts       ← file-system layer (no external deps)
  ui.ts       ← TUI components: story/task pickers, footer
```

The extension has **zero runtime dependencies** beyond Pi's own packages — everything is plain Node.js `fs` + Pi's built-in TUI components.

---

## Roadmap

- [ ] `/task-done` — mark a task complete
- [ ] `/story-status` — kanban-style overview widget
- [ ] Log auto-creation after each task run
- [ ] Agent scaffolding via `/agent-new`
- [ ] Skill scaffolding via `/skill-new`
