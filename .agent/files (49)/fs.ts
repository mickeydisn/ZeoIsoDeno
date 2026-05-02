/**
 * Minimal self-contained file-system layer for the user-story extension.
 * Mirrors the agent-fs package but with zero external dependencies so the
 * extension is a single directory that pi can hot-load.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Constants ────────────────────────────────────────────────────────────────

export const DIRS = { SKILLS: "skills", AGENTS: "agents", STORIES: "story" } as const;
export const FILES = { SKILL: "SKILL.md", AGENT: "AGENT.md", STORY: "STORY.md" } as const;
export const TASK_PATTERN = /^TASK-(\d{3})-(.+)\.md$/;
export const LOG_PATTERN = /^LOG-(\d{3})-(\d{3})-(.+)\.md$/;
export const INCOMPLETE_TOKENS = ["[ ]", "TODO"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Frontmatter {
  name?: string;
  description?: string;
  agents?: string[];
  skills?: string[];
  prompts?: string;
  [key: string]: unknown;
}

export interface StoryMeta {
  folderName: string;       // e.g. "001-my-story"
  number: number;
  slug: string;
  dirPath: string;          // absolute path to story dir
  storyFilePath: string;    // absolute path to STORY.md
  frontmatter: Frontmatter;
  body: string;
}

export interface TaskMeta {
  filePath: string;
  fileName: string;
  number: number;
  slug: string;
  frontmatter: Frontmatter;
  body: string;
  done: boolean;
}

export interface SkillMeta {
  filePath: string;
  name: string;
  frontmatter: Frontmatter;
}

export interface AgentMeta {
  filePath: string;
  name: string;
  frontmatter: Frontmatter;
  body: string;
}

export interface TaskExecutionPayload {
  story: string;          // path to STORY.md
  agents: string[];       // paths to AGENT.md (union: task + story)
  skills: string[];       // paths to SKILL.md (union: task + agents + story)
  prompt: string;         // frontmatter.prompts of the task
  task: string;           // path to TASK*.md
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

export function parseMd(raw: string): { frontmatter: Frontmatter; body: string } {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") return { frontmatter: {}, body: raw };
  const closeIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (closeIdx === -1) return { frontmatter: {}, body: raw };

  const fmLines = lines.slice(1, closeIdx);
  const body = lines.slice(closeIdx + 1).join("\n").trimStart();
  return { frontmatter: parseFmLines(fmLines), body };
}

function parseFmLines(lines: string[]): Frontmatter {
  const result: Frontmatter = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) { i++; continue; }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) { i++; continue; }
    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    if (rest === "") {
      // multi-line list
      const items: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trimStart().startsWith("-")) {
        items.push(lines[i]!.trimStart().slice(1).trim());
        i++;
      }
      (result as Record<string, unknown>)[key] = items.length ? items : undefined;
      continue;
    }

    if (rest.includes(",")) {
      (result as Record<string, unknown>)[key] = rest.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      (result as Record<string, unknown>)[key] = unquote(rest);
    }
    i++;
  }
  return result;
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1);
  return s;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function pad(n: number): string {
  return String(n).padStart(3, "0");
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export function listStories(baseDir: string): StoryMeta[] {
  const storiesRoot = path.join(baseDir, DIRS.STORIES);
  if (!fs.existsSync(storiesRoot)) return [];

  return fs.readdirSync(storiesRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const m = d.name.match(/^(\d{3})-(.+)$/);
      if (!m) return null;
      const number = parseInt(m[1]!, 10);
      const slug = m[2]!;
      const dirPath = path.join(storiesRoot, d.name);
      const storyFilePath = path.join(dirPath, FILES.STORY);
      if (!fs.existsSync(storyFilePath)) return null;
      const raw = fs.readFileSync(storyFilePath, "utf-8");
      const { frontmatter, body } = parseMd(raw);
      return { folderName: d.name, number, slug, dirPath, storyFilePath, frontmatter, body } as StoryMeta;
    })
    .filter((s): s is StoryMeta => s !== null)
    .sort((a, b) => a.number - b.number);
}

export function findStory(baseDir: string, ref: string): StoryMeta | null {
  const stories = listStories(baseDir);
  // Match by number (e.g. "1", "001", "STORY-001") or slug
  const numMatch = ref.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]!, 10);
    const found = stories.find(s => s.number === n);
    if (found) return found;
  }
  return stories.find(s => s.folderName === ref || s.slug === slugify(ref)) ?? null;
}

export function listTasks(storyDirPath: string): TaskMeta[] {
  if (!fs.existsSync(storyDirPath)) return [];
  return fs.readdirSync(storyDirPath)
    .filter(f => TASK_PATTERN.test(f))
    .sort()
    .map(fileName => {
      const m = fileName.match(TASK_PATTERN)!;
      const number = parseInt(m[1]!, 10);
      const slug = m[2]!;
      const filePath = path.join(storyDirPath, fileName);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, body } = parseMd(raw);
      const done = !INCOMPLETE_TOKENS.some(t => raw.includes(t));
      return { filePath, fileName, number, slug, frontmatter, body, done };
    });
}

export function findTask(storyDirPath: string, ref: string): TaskMeta | null {
  const tasks = listTasks(storyDirPath);
  const numMatch = ref.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]!, 10);
    const found = tasks.find(t => t.number === n);
    if (found) return found;
  }
  return tasks.find(t => t.fileName === ref) ?? null;
}

// ─── Skill resolution ─────────────────────────────────────────────────────────

export function resolveSkillPaths(baseDir: string, skillNames: string[], agentName?: string): string[] {
  const paths: string[] = [];
  for (const name of skillNames) {
    // Agent-local first
    if (agentName) {
      const local = path.join(baseDir, DIRS.AGENTS, agentName, DIRS.SKILLS, name, FILES.SKILL);
      if (fs.existsSync(local)) { paths.push(local); continue; }
    }
    // Base-dir
    const global = path.join(baseDir, DIRS.SKILLS, name, FILES.SKILL);
    if (fs.existsSync(global)) paths.push(global);
  }
  return paths;
}

export function resolveAgentPaths(baseDir: string, agentNames: string[]): string[] {
  return agentNames
    .map(name => path.join(baseDir, DIRS.AGENTS, name, FILES.AGENT))
    .filter(p => fs.existsSync(p));
}

// ─── Execution payload builder ────────────────────────────────────────────────

export function buildPayload(
  baseDir: string,
  story: StoryMeta,
  task: TaskMeta
): TaskExecutionPayload {
  const storyAgents = toArr(story.frontmatter.agents);
  const taskAgents  = toArr(task.frontmatter.agents);
  const storySkills = toArr(story.frontmatter.skills);
  const taskSkills  = toArr(task.frontmatter.skills);

  // Union of agent paths
  const allAgentNames = unique([...taskAgents, ...storyAgents]);
  const agentPaths = resolveAgentPaths(baseDir, allAgentNames);

  // Skills from agents
  const agentSkillPaths: string[] = [];
  for (const agentName of allAgentNames) {
    const agentFile = path.join(baseDir, DIRS.AGENTS, agentName, FILES.AGENT);
    if (fs.existsSync(agentFile)) {
      const raw = fs.readFileSync(agentFile, "utf-8");
      const { frontmatter } = parseMd(raw);
      for (const sp of resolveSkillPaths(baseDir, toArr(frontmatter.skills), agentName)) {
        agentSkillPaths.push(sp);
      }
    }
  }

  // Direct skill paths
  const directSkillPaths = [
    ...resolveSkillPaths(baseDir, taskSkills),
    ...resolveSkillPaths(baseDir, storySkills),
  ];

  const skillPaths = unique([...directSkillPaths, ...agentSkillPaths]);

  return {
    story: story.storyFilePath,
    agents: agentPaths,
    skills: skillPaths,
    prompt: (task.frontmatter.prompts as string | undefined) ?? "",
    task: task.filePath,
  };
}

// ─── System prompt builder ────────────────────────────────────────────────────

/**
 * Builds the injected system prompt content from story + agents.
 * Skills are registered via Pi's skill paths, not inlined here.
 */
export function buildSystemPromptAddition(
  story: StoryMeta,
  agentPaths: string[]
): string {
  const parts: string[] = [];

  parts.push(`## Current Story\n\n**${story.frontmatter.name ?? story.folderName}**`);
  if (story.frontmatter.description) {
    parts.push(story.frontmatter.description as string);
  }
  parts.push(`\nStory file: \`${story.storyFilePath}\``);

  for (const ap of agentPaths) {
    try {
      const raw = fs.readFileSync(ap, "utf-8");
      const { frontmatter, body } = parseMd(raw);
      parts.push(`\n---\n## Agent: ${frontmatter.name ?? path.basename(path.dirname(ap))}\n`);
      if (frontmatter.description) parts.push(frontmatter.description as string);
      if (body.trim()) parts.push(`\n${body.trim()}`);
    } catch { /* skip unreadable agents */ }
  }

  return parts.join("\n\n");
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

export function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v) return [v];
  return [];
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}
