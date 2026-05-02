# 🧠 user-story: structured project management for Pi

Hey everyone 👋

I've been building a Pi extension called **user-story** that brings structured **skills / agents / stories / tasks** project management directly into your terminal session — and it maps almost perfectly to the way Pi is designed to work. Let me walk you through the pattern and how to use it.

---

## The pattern in one sentence

> *Files are the interface. The agent reads what it needs, acts, and writes what happened.*

Everything lives in a predictable directory tree:

```
workspace/
  skills/          ← reusable capability packages     (SKILL.md)
  agents/          ← named actors with skill bundles  (AGENT.md)
  story/
    001-my-story/  ← a scoped project or epic         (STORY.md)
      TASK-001-do-something.md
      TASK-002-next-thing.md
      log/
        LOG-001-001-first-run.md
```

All files are plain Markdown with YAML front-matter — version-control friendly, editor-agnostic, grep-able.

---

## The Pi extension: `user-story`

### Installation

```bash
# Set your workspace path
AGENT_FS_WORKSPACE=/path/to/workspace pi --extension ./extensions/index.ts

# Or add to ~/.pi/settings.json:
{ "extensions": ["/path/to/user-story/extensions/index.ts"] }
```

### Commands

| Command | Description |
|---|---|
| `/story-list` | List all stories (shows completion count) |
| `/story-open [ref]` | Switch the active story — interactive picker if no arg |
| `/task-list [story]` | List tasks with done/pending status |
| `/task-run [story] [task]` | Run a task — builds context payload and fires an agent turn |
| `/story-new` | Create a new story interactively |
| `/task-new` | Create a new task in the current story |

The **current story** is always shown in Pi's footer:

```
◆ User Auth Feature
```

---

## How `/task-run` works

```
/task-run STORY-001 TASK-002
```

The extension builds a `TaskExecutionPayload`:

```
story:   story/001-my-feature/STORY.md
agents:  [agents/backend-dev/AGENT.md]   ← union of task + story agents
skills:  [skills/sql-expert/SKILL.md]    ← union of all agent skills + direct skills
prompt:  "Design the users table migration..."
task:    story/001-my-feature/TASK-002-setup-database.md
```

Then, via `before_agent_start`, it injects a **system prompt** built from the story + agents + skills, and fires this user message:

```
<task prompt>

@/path/to/TASK-002-setup-database.md
```

The `@file` reference lets Pi read the full task — checklist, description, any in-progress notes — so the agent has the complete picture.

You can also use numbers, no need to type the full ref:

```
/task-run 1 2      → story #1, task #2
/task-run 2        → task #2 in current story
/task-run          → interactive picker for story then task
```

---

## Why this maps perfectly to Pi's philosophy

### 1. Skills are Pi Skills — literally

Pi defines a **Skill** as a self-contained capability package described by a `SKILL.md` with name + description front-matter. That is exactly what `user-story` calls a Skill too.

Pi's progressive-disclosure model loads only skill *descriptions* into the context at startup, pulling full instructions on-demand. `user-story` respects this by inlining skill bodies only at task-run time, keeping startup context lean.

Any skill you write for `user-story` can be dropped into Pi's skill discovery paths (`~/.agents/skills/`, `.agents/skills/`) and Pi will pick it up with zero changes.

### 2. Agents ↔ Pi Packages

In Pi, a **Package** bundles extensions + skills + prompt templates together, scoped to a project or global install. A `user-story` **Agent** is the same idea at the workflow level: it declares which skills it brings to the table and carries its own `skills/` directory for agent-specific overrides.

The extension resolves skills in the same layered order Pi uses:
- Agent-local skills first (project scope)
- Base-dir skills as fallback (global scope)

### 3. Stories & Tasks are structured sessions

Pi has a rich Session model: branching trees, labels, compaction, fork/clone. `user-story` maps the same concepts to plain markdown files:

| Pi concept | user-story concept |
|---|---|
| Session | Story (`STORY.md`) |
| Turn / message | Task (`TASK-000-name.md`) |
| Session entry / log | Log (`LOG-000-001-name.md`) |
| Compaction summary | Log `### result:` section |

Tasks have a simple done check: no `[ ]` or `TODO` in the file = done. Story is done when all tasks are done.

### 4. `before_agent_start` is the integration point

Pi's `before_agent_start` event lets extensions modify the system prompt before each turn. `user-story` hooks this to inject the full task context: story description, agent definitions, skill bodies — all assembled from the workspace files at run time.

```typescript
pi.on("before_agent_start", async (_event, ctx) => {
  if (!pendingSystemPrompt) return undefined;
  const addition = pendingSystemPrompt;
  pendingSystemPrompt = null;
  return { systemPrompt: ctx.getSystemPrompt() + "\n\n" + addition };
});
```

This keeps Pi's core clean — it knows nothing about stories or tasks. The extension is the bridge.

### 5. Pi's TUI for the UI layer

The extension uses Pi's built-in TUI components for all interactive UI:

- `SelectList` with `DynamicBorder` for story and task pickers
- `ctx.ui.setStatus()` for the footer story indicator
- `ctx.ui.input()` / `ctx.ui.editor()` for story/task creation dialogs
- `ctx.ui.notify()` for feedback

No custom rendering from scratch — just composing Pi's primitives.

---

## File format quick reference

### STORY.md
```yaml
---
name: User Auth Feature
description: Login, registration, JWT refresh
agents:
  - backend-dev
skills:
  - code-review
---
Additional context for the agent.
```

### TASK-001-setup-db.md
```yaml
---
name: Setup database schema
description: Create users table and migration
agents:
  - backend-dev
prompts: Design and implement the users table migration with proper indexes.
---

## Checklist

- [ ] Create migration file
- [ ] Add indexes
- [ ] Write rollback
```

### AGENT.md
```yaml
---
name: backend-dev
description: Expert in Node.js, TypeScript, PostgreSQL
skills:
  - sql-expert
---
You prefer explicit over implicit. Always add types.
```

### SKILL.md
```yaml
---
name: sql-expert
description: Deep knowledge of PostgreSQL schema design and indexing
---
When writing SQL migrations:
- Use timestamptz not timestamp
- Name indexes explicitly: idx_<table>_<column>
```

---

## Links

- **Source**: [github.com/your-org/user-story](https://github.com/your-org/user-story)
- **agent-fs package** (the underlying TS module): [github.com/your-org/agent-fs](https://github.com/your-org/agent-fs)
- **Pi docs**: https://pi.dev/docs/latest
- **Pi Extensions API**: https://pi.dev/docs/latest/extensions
- **Pi TUI Components**: https://pi.dev/docs/latest/tui

Happy to answer questions or pair on wiring this into your own workspace 🙂
