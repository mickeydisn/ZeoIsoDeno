# agent-fs

A TypeScript package for managing a **Skills / Agents / Stories / Tasks / Logs** file-system.

---

## Directory layout

```
<BASE_DIR>/
  skills/
    <skill-name>/
      SKILL.md
  agents/
    <agent-name>/
      AGENT.md
      skills/            # agent-local skills (optional)
        <skill-name>/
          SKILL.md
  story/
    <000>-<story-name>/
      STORY.md
      TASK-<000>-<name>.md
      log/
        LOG-<000>-<001>-<name>.md
```

---

## Installation

```bash
npm install agent-fs
# or
pnpm add agent-fs
```

Set `AGENT_FS_BASE_DIR` env var, or pass `baseDir` to constructors / `createClient()`.

---

## Quick start

```ts
import { createClient } from "agent-fs";

const fs = createClient("/path/to/workspace");

// Create a skill
const skill = fs.skills.create({ name: "web-search", description: "Search the web" });

// Create an agent that uses it
const agent = fs.agents.create({
  name: "researcher",
  description: "Research agent",
  skills: ["web-search"],
});

// Create a story
const story = fs.stories.create({
  name: "market-analysis",
  description: "Analyse the market",
  agents: ["researcher"],
});

// Add a task to the story
const task = fs.tasks.create({
  storyDir: story.dir,
  name: "collect-data",
  description: "Collect raw market data",
  prompts: "Search for the top 10 competitors and summarise their pricing.",
  agents: ["researcher"],
});

// Build execution payload
const payload = fs.executor.buildPayload("001-market-analysis", task.path);
// payload = { story, agents, skills, prompt, task }

// Check if task / story is done
console.log(fs.tasks.isDone(task.path));   // { done: false, remaining: ["[ ]", ...] }
console.log(fs.stories.isDone("001-market-analysis")); // { done: false, taskResults: [...] }
```

---

## API

### `createClient(baseDir?: string): AgentFsClient`

Returns an object with fully wired managers:

| Property    | Type              |
|-------------|-------------------|
| `skills`    | `SkillManager`    |
| `agents`    | `AgentManager`    |
| `stories`   | `StoryManager`    |
| `tasks`     | `TaskManager`     |
| `logs`      | `LogManager`      |
| `executor`  | `TaskExecutor`    |

---

### `SkillManager`

| Method | Description |
|--------|-------------|
| `create(opts)` | Create a new `SKILL.md` |
| `read(name)` | Read & parse a skill |
| `tryRead(name)` | Like `read` but returns `null` on miss |
| `update(name, opts)` | Update fields; auto-renames folder if name changes |
| `delete(name)` | Delete the skill file |
| `list()` | All skills in base-dir |
| `exists(name)` | Check presence |
| `validate(name)` | Return `ValidationResult` |
| `autoValidate(name)` | Rename folder to match frontmatter `name` |

---

### `AgentManager`

Same surface as `SkillManager` plus:

| Method | Description |
|--------|-------------|
| `resolveSkills(agentName, skillNames)` | Resolve skill names → `SkillEntity[]` (agent-local first, then base-dir) |

---

### `StoryManager`

| Method | Description |
|--------|-------------|
| `create(opts)` | Creates `story/<000>-<name>/STORY.md` with auto-increment number |
| `read(folderName)` | Read story + resolved agents, skills, tasks |
| `update(folderName, opts)` | Update frontmatter |
| `delete(folderName)` | Remove entire story directory |
| `list()` | All stories |
| `validate(folderName)` | Validation |
| `autoValidate(folderName)` | Rename folder to match frontmatter |
| `isDone(folderName)` | `StoryDoneResult` – done only if all tasks are done |

---

### `TaskManager`

| Method | Description |
|--------|-------------|
| `create(opts)` | Creates `TASK-<000>-<name>.md` with auto-increment |
| `read(filePath)` | Parse task + agents, skills, logs |
| `update(filePath, opts)` | Update; auto-renames file if name changes |
| `delete(filePath)` | Delete file |
| `list(storyDirPath)` | All tasks in a story dir |
| `validate(filePath)` | Validation |
| `autoValidate(filePath)` | Rename to match frontmatter |
| `isDone(filePath)` | `TaskDoneResult` – scans for `[ ]` / `TODO` |

---

### `LogManager`

| Method | Description |
|--------|-------------|
| `create(opts)` | Creates `log/LOG-<000>-<001>-<name>.md` |
| `read(filePath)` | Parse log with `prompts`, `taskContent`, `result` sections |
| `update(filePath, opts)` | Update frontmatter and/or body sections |
| `delete(filePath)` | Delete file |
| `list(storyDirPath)` | All logs in a story |
| `listForTask(storyDirPath, taskNumber)` | Logs scoped to one task |
| `validate(filePath)` | Validation |

---

### `TaskExecutor`

| Method | Description |
|--------|-------------|
| `buildPayload(storyFolder, taskFilePath)` | Returns `TaskExecutionPayload` with deduplicated agents and skills |
| `buildAllPayloads(storyFolder)` | One payload per task |
| `buildNextPayload(storyFolder)` | Payload for the first undone task, or `null` |

`TaskExecutionPayload`:
```ts
{
  story: string;    // path to STORY.md
  agents: string[]; // paths to AGENT.md (task ∪ story)
  skills: string[]; // paths to SKILL.md (task ∪ agents ∪ story ∪ story-agents)
  prompt: string;   // frontmatter.prompts of the task
  task: string;     // path to TASK*.md
}
```

---

## Configuration

`config.ts` exports a `CONFIG` constant. Override `BASE_DIR` via the env var `AGENT_FS_BASE_DIR`.

---

## File format

All files use YAML front-matter delimited by `---`.

### SKILL.md
```yaml
---
name: web-search
description: Search the web for information
---
Body content here.
```

### AGENT.md
```yaml
---
name: researcher
description: Autonomous research agent
skills:
  - web-search
  - summariser
---
```

### STORY.md
```yaml
---
name: market-analysis
description: Full market analysis pipeline
agents:
  - researcher
skills:
  - report-writer
---
```

### TASK-001-collect-data.md
```yaml
---
name: collect-data
description: Gather raw market data
agents:
  - researcher
skills: []
prompts: Search for the top 10 competitors and summarise their pricing.
---
- [ ] Find competitor list
- [ ] Extract pricing pages
```

### LOG-001-001-initial-run.md
```yaml
---
name: initial-run
description: First execution of collect-data
task: story/001-market-analysis/TASK-001-collect-data.md
---

### prompts:
Search for the top 10 competitors...

### task-content:
- [ ] Find competitor list

### result:
Found 10 competitors: ...
```
