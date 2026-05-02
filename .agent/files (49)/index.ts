/**
 * user-story — Pi extension
 *
 * Commands:
 *   /story-list              List all stories in the workspace
 *   /story-open [ref]        Switch the current story
 *   /task-list [story-ref]   List tasks in current (or given) story
 *   /task-run [story] [task] Run a task
 *   /story-new               Create a new story interactively
 *   /task-new                Create a new task in the current story
 *
 * Configuration:
 *   AGENT_FS_WORKSPACE=/path/to/workspace pi
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import * as nodePath from "node:path";
import * as nodeFs   from "node:fs";

import {
  listStories, findStory, listTasks, findTask,
  buildPayload, buildSystemPromptAddition,
  toArr, readFileContent, parseMd, pad, slugify,
  type StoryMeta, type TaskMeta,
  FILES, DIRS,
} from "./fs.js";

import { pickStory, pickTask } from "./ui.js";

// ─── Module-level state ───────────────────────────────────────────────────────

let BASE_DIR = "";
let currentStory: StoryMeta | null = null;
let pendingSystemPrompt: string | null = null;

// ─── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {

  // ── session_start ──────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    const ws =
      process.env["AGENT_FS_WORKSPACE"] ??
      (pi as any).getFlag?.("workspace") ??
      ctx.cwd;

    BASE_DIR = nodePath.resolve(ws);

    if (!nodeFs.existsSync(BASE_DIR)) {
      ctx.ui.notify(`[user-story] Workspace not found: ${BASE_DIR}`, "error");
      ctx.ui.notify(`Set AGENT_FS_WORKSPACE env var or use --workspace flag`, "warning");
      return;
    }

    // Restore current story from session custom entries
    currentStory = null;
    for (const entry of ctx.sessionManager.getEntries()) {
      if (
        entry.type === "custom" &&
        (entry as any).customType === "user-story:current-story"
      ) {
        const folderName = (entry as any).data?.folderName as string | undefined;
        if (folderName) {
          const found = findStory(BASE_DIR, folderName);
          if (found) currentStory = found;
        }
      }
    }

    setFooter(ctx);
    ctx.ui.notify(
      `[user-story] workspace: ${BASE_DIR}` +
      (currentStory
        ? `  ·  story: ${String(currentStory.frontmatter.name ?? currentStory.slug)}`
        : `  ·  use /story-open to select a story`),
      "info"
    );
  });

  // ── before_agent_start – inject system prompt ──────────────────────────────

  pi.on("before_agent_start", async (_event, ctx) => {
    if (!pendingSystemPrompt) return undefined;
    const addition = pendingSystemPrompt;
    pendingSystemPrompt = null;
    return { systemPrompt: ctx.getSystemPrompt() + "\n\n" + addition };
  });

  // ── /story-list ────────────────────────────────────────────────────────────

  pi.registerCommand("story-list", {
    description: "List all stories in the workspace",
    handler: async (_args, ctx) => {
      if (!checkWorkspace(ctx)) return;
      const stories = listStories(BASE_DIR);
      if (!stories.length) {
        ctx.ui.notify("No stories found. Use /story-new to create one.", "info");
        return;
      }
      const lines = stories.map(s => {
        const tasks = listTasks(s.dirPath);
        const done  = tasks.length > 0 && tasks.every(t => t.done);
        const count = `${tasks.filter(t => t.done).length}/${tasks.length}`;
        const cur   = currentStory?.folderName === s.folderName ? "  ◆" : "";
        return `${done ? "✓" : "○"} [${String(s.number).padStart(3, "0")}]  ${String(s.frontmatter.name ?? s.slug)}${cur}  (${count} tasks)`;
      });
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  // ── /story-open ────────────────────────────────────────────────────────────

  pi.registerCommand("story-open", {
    description: "Open a story as current context. Arg: number or slug. No arg = picker.",
    handler: async (args, ctx) => {
      if (!checkWorkspace(ctx)) return;

      let story: StoryMeta | null = null;
      if (args?.trim()) {
        story = findStory(BASE_DIR, args.trim());
        if (!story) { ctx.ui.notify(`Story not found: "${args.trim()}"`, "error"); return; }
      } else {
        story = await pickStory(ctx, listStories(BASE_DIR));
      }
      if (!story) return;

      currentStory = story;
      pi.appendEntry("user-story:current-story", { folderName: story.folderName });
      setFooter(ctx);
      ctx.ui.notify(`Current story → ${String(story.frontmatter.name ?? story.folderName)}`, "info");
    },
  });

  // ── /task-list ─────────────────────────────────────────────────────────────

  pi.registerCommand("task-list", {
    description: "List tasks in current story. Optional arg: story ref.",
    handler: async (args, ctx) => {
      if (!checkWorkspace(ctx)) return;
      const story = getStory(args?.trim() ?? null, ctx);
      if (!story) return;

      const tasks = listTasks(story.dirPath);
      if (!tasks.length) {
        ctx.ui.notify(`No tasks in "${String(story.frontmatter.name ?? story.slug)}".`, "info");
        return;
      }
      const lines = tasks.map(t => {
        const agents = toArr(t.frontmatter.agents).join(", ");
        return (
          `${t.done ? "✓" : "○"} TASK-${String(t.number).padStart(3, "0")}  ` +
          `${String(t.frontmatter.name ?? t.slug)}` +
          (agents ? `  [${agents}]` : "")
        );
      });
      ctx.ui.notify(
        `Tasks — ${String(story.frontmatter.name ?? story.slug)}:\n${lines.join("\n")}`,
        "info"
      );
    },
  });

  // ── /task-run ──────────────────────────────────────────────────────────────

  pi.registerCommand("task-run", {
    description: [
      "Run a task. Usage:",
      "  /task-run                     → interactive picker",
      "  /task-run TASK-001            → task in current story",
      "  /task-run 1                   → task #1 in current story",
      "  /task-run STORY-001 TASK-002  → explicit story + task",
      "  /task-run 1 2                 → story #1, task #2",
    ].join("\n"),
    handler: async (args, ctx) => {
      if (!checkWorkspace(ctx)) return;

      const parts = (args?.trim() ?? "").split(/\s+/).filter(Boolean);
      let story: StoryMeta | null = null;
      let taskRef: string | null = null;

      if (parts.length === 0) {
        story = await pickStory(ctx, listStories(BASE_DIR));
        if (!story) return;
        const picked = await pickTask(ctx, listTasks(story.dirPath), String(story.frontmatter.name ?? story.slug));
        if (!picked) return;
        taskRef = picked.fileName;

      } else if (parts.length === 1) {
        const p = parts[0]!;
        if (isTaskRef(p)) {
          story = getStory(null, ctx);
          if (!story) return;
          taskRef = p;
        } else {
          story = findStory(BASE_DIR, p);
          if (!story) { ctx.ui.notify(`Story not found: "${p}"`, "error"); return; }
          const picked = await pickTask(ctx, listTasks(story.dirPath), String(story.frontmatter.name ?? story.slug));
          if (!picked) return;
          taskRef = picked.fileName;
        }

      } else {
        // Two args: story + task
        story = findStory(BASE_DIR, parts[0]!);
        if (!story) {
          // Maybe first arg is a task ref and current story applies
          story = getStory(null, ctx);
          if (!story) return;
          taskRef = parts[0]!;
        } else {
          taskRef = parts[1]!;
        }
      }

      if (!story || !taskRef) return;

      const task = findTask(story.dirPath, taskRef);
      if (!task) {
        ctx.ui.notify(
          `Task "${taskRef}" not found in "${story.folderName}". Use /task-list to check.`,
          "error"
        );
        return;
      }

      await runTask(ctx, story, task);
    },
  });

  // ── /story-new ─────────────────────────────────────────────────────────────

  pi.registerCommand("story-new", {
    description: "Create a new story interactively",
    handler: async (_args, ctx) => {
      if (!checkWorkspace(ctx)) return;

      const name = await ctx.ui.input("Story name:", "e.g. user-auth-feature");
      if (!name?.trim()) return;
      const desc = await ctx.ui.input("Description (optional):", "");

      const storiesRoot = nodePath.join(BASE_DIR, DIRS.STORIES);
      nodeFs.mkdirSync(storiesRoot, { recursive: true });

      const all    = listStories(BASE_DIR);
      const number = all.reduce((m, s) => Math.max(m, s.number), 0) + 1;
      const slug   = slugify(name.trim());
      const folder = `${pad(number)}-${slug}`;
      const dir    = nodePath.join(storiesRoot, folder);
      nodeFs.mkdirSync(dir, { recursive: true });

      nodeFs.writeFileSync(
        nodePath.join(dir, FILES.STORY),
        [
          "---",
          `name: ${name.trim()}`,
          `description: ${(desc ?? "").trim()}`,
          "agents: []",
          "skills: []",
          "---",
          "",
        ].join("\n")
      );

      const story = findStory(BASE_DIR, folder);
      if (story) {
        currentStory = story;
        pi.appendEntry("user-story:current-story", { folderName: story.folderName });
        setFooter(ctx);
      }
      ctx.ui.notify(`Created story: ${folder}  (now current)`, "info");
    },
  });

  // ── /task-new ──────────────────────────────────────────────────────────────

  pi.registerCommand("task-new", {
    description: "Create a new task in the current story",
    handler: async (_args, ctx) => {
      if (!checkWorkspace(ctx)) return;
      const story = getStory(null, ctx);
      if (!story) return;

      const name = await ctx.ui.input("Task name:", "e.g. setup-database");
      if (!name?.trim()) return;
      const desc    = await ctx.ui.input("Description (optional):", "");
      const prompts = await ctx.ui.editor("Agent prompt:", "Describe what the agent should do…");
      if (!prompts?.trim()) { ctx.ui.notify("Prompt is required.", "error"); return; }

      const tasks  = listTasks(story.dirPath);
      const number = tasks.reduce((m, t) => Math.max(m, t.number), 0) + 1;
      const fname  = `TASK-${pad(number)}-${slugify(name.trim())}.md`;

      nodeFs.writeFileSync(
        nodePath.join(story.dirPath, fname),
        [
          "---",
          `name: ${name.trim()}`,
          `description: ${(desc ?? "").trim()}`,
          "agents: []",
          "skills: []",
          `prompts: ${prompts.trim()}`,
          "---",
          "",
          "## Checklist",
          "",
          "- [ ] TODO",
          "",
        ].join("\n")
      );
      ctx.ui.notify(`Created task: ${fname}`, "info");
    },
  });

  // ─── Internal helpers ────────────────────────────────────────────────────────

  function checkWorkspace(ctx: ExtensionContext): boolean {
    if (!BASE_DIR) {
      ctx.ui.notify("No workspace. Set AGENT_FS_WORKSPACE or use --workspace.", "error");
      return false;
    }
    return true;
  }

  function getStory(ref: string | null, ctx: ExtensionContext): StoryMeta | null {
    if (ref) {
      const found = findStory(BASE_DIR, ref);
      if (!found) { ctx.ui.notify(`Story not found: "${ref}"`, "error"); return null; }
      return found;
    }
    if (!currentStory) {
      ctx.ui.notify("No current story. Use /story-open to select one.", "warning");
      return null;
    }
    return findStory(BASE_DIR, currentStory.folderName) ?? currentStory;
  }

  function setFooter(ctx: ExtensionContext): void {
    ctx.ui.setStatus(
      "user-story",
      currentStory
        ? `◆ ${String(currentStory.frontmatter.name ?? currentStory.slug)}`
        : "○ no story"
    );
  }

  function isTaskRef(s: string): boolean {
    return /^(task-?\d+|\d+)$/i.test(s);
  }

  async function runTask(
    ctx: ExtensionContext,
    story: StoryMeta,
    task: TaskMeta
  ): Promise<void> {
    const payload = buildPayload(BASE_DIR, story, task);

    // Notify user what's about to run
    ctx.ui.notify(
      [
        `▶  TASK-${String(task.number).padStart(3, "0")}: ${String(task.frontmatter.name ?? task.slug)}`,
        `   story:  ${String(story.frontmatter.name ?? story.slug)}`,
        `   agents: ${payload.agents.length ? payload.agents.map(p => nodePath.basename(nodePath.dirname(p))).join(", ") : "none"}`,
        `   skills: ${payload.skills.length ? payload.skills.map(p => nodePath.basename(nodePath.dirname(p))).join(", ") : "none"}`,
      ].join("\n"),
      "info"
    );

    // ── System prompt ──────────────────────────────────────────────────────

    const systemParts: string[] = [
      buildSystemPromptAddition(story, payload.agents),
    ];

    // Inline each skill's body
    for (const skillPath of payload.skills) {
      try {
        const raw  = readFileContent(skillPath);
        const { frontmatter, body } = parseMd(raw);
        const name = String((frontmatter.name as string | undefined) ?? nodePath.basename(nodePath.dirname(skillPath)));
        systemParts.push(`\n---\n## Skill: ${name}\n\n${body.trim()}`);
      } catch { /* skip unreadable */ }
    }

    pendingSystemPrompt = systemParts.join("\n\n");

    // ── User prompt: frontmatter prompt + @TASK.md reference ──────────────

    const userPrompt = `${payload.prompt}\n\n@${payload.task}`.trim();

    // Name the session so it's easy to find
    try {
      ctx.sessionManager.setName(
        `${String(story.frontmatter.name ?? story.slug)} › TASK-${String(task.number).padStart(3, "0")}`
      );
    } catch { /* optional */ }

    // Send the turn — before_agent_start fires first and injects system prompt
    await ctx.sendUserMessage(userPrompt);
  }
}
