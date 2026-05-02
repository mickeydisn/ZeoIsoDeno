/**
 * StoryManager – CRUD + validation + done-check for Story entities.
 */

import * as path from "path";
import { CONFIG } from "./config";
import type {
  StoryEntity,
  StoryFrontmatter,
  AgentEntity,
  SkillEntity,
  ValidationResult,
  StoryDoneResult,
  CreateStoryOptions,
  UpdateStoryOptions,
} from "./types";
import {
  storyFolderName,
  storyDir,
  storyFile,
  parseMd,
  serializeMd,
  writeFile,
  readFile,
  fileExists,
  listDirs,
  nextStoryNumber,
  slugify,
} from "./utils";
import { AgentManager } from "./agent";
import { SkillManager } from "./skill";
import { TaskManager } from "./task";

export class StoryManager {
  private agentMgr: AgentManager;
  private skillMgr: SkillManager;
  private taskMgr: TaskManager;

  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {
    this.agentMgr = new AgentManager(baseDir);
    this.skillMgr = new SkillManager(baseDir);
    this.taskMgr = new TaskManager(baseDir);
  }

  // ── Paths ──────────────────────────────────────────────────────────────────

  storyPath(folderName: string): string {
    return storyFile(this.baseDir, folderName);
  }

  storyDirPath(folderName: string): string {
    return storyDir(this.baseDir, folderName);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  read(folderName: string): StoryEntity {
    const p = this.storyPath(folderName);
    if (!fileExists(p)) throw new Error(`Story not found: ${folderName}`);
    const raw = readFile(p);
    const { frontmatter, body } = parseMd(raw);
    const fm = frontmatter as StoryFrontmatter;

    // Normalise arrays
    fm.agents = normaliseArr(fm.agents);
    fm.skills = normaliseArr(fm.skills);

    const agents = fm.agents.map((a) => this.agentMgr.tryRead(a)).filter((x): x is AgentEntity => x !== null);
    const skills = fm.skills.map((s) => this.skillMgr.tryRead(s)).filter((x): x is SkillEntity => x !== null);
    const dir = this.storyDirPath(folderName);
    const tasks = this.taskMgr.list(dir);

    return { path: p, dir, frontmatter: fm, body, agents, skills, tasks };
  }

  tryRead(folderName: string): StoryEntity | null {
    try {
      return this.read(folderName);
    } catch {
      return null;
    }
  }

  list(): StoryEntity[] {
    const storiesRoot = path.join(this.baseDir, CONFIG.DIRS.STORIES);
    const dirs = listDirs(storiesRoot);
    return dirs
      .map((d) => this.tryRead(d))
      .filter((s): s is StoryEntity => s !== null);
  }

  exists(folderName: string): boolean {
    return fileExists(this.storyPath(folderName));
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(options: CreateStoryOptions): StoryEntity {
    const number = nextStoryNumber(this.baseDir);
    const folder = storyFolderName(number, options.name);
    const fm: StoryFrontmatter = {
      name: options.name,
      description: options.description,
      agents: options.agents ?? [],
      skills: options.skills ?? [],
    };
    const p = this.storyPath(folder);
    writeFile(p, serializeMd(fm, options.body ?? ""));
    return this.read(folder);
  }

  update(folderName: string, options: UpdateStoryOptions): StoryEntity {
    const entity = this.read(folderName);
    const fm = { ...entity.frontmatter };
    if (options.name !== undefined) fm.name = options.name;
    if (options.description !== undefined) fm.description = options.description;
    if (options.agents !== undefined) fm.agents = options.agents;
    if (options.skills !== undefined) fm.skills = options.skills;
    const body = options.body ?? entity.body;
    writeFile(entity.path, serializeMd(fm, body));
    return this.read(folderName);
  }

  delete(folderName: string): void {
    const dir = this.storyDirPath(folderName);
    const fs = require("fs") as typeof import("fs");
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }

  autoValidate(folderName: string): StoryEntity {
    const entity = this.read(folderName);
    // Re-derive expected folder name from number prefix + current name slug
    const numberMatch = folderName.match(/^(\d{3})-/);
    if (!numberMatch) return entity;
    const number = parseInt(numberMatch[1], 10);
    const expectedFolder = storyFolderName(number, entity.frontmatter.name);
    if (expectedFolder !== folderName) {
      const oldDir = this.storyDirPath(folderName);
      const newDir = this.storyDirPath(expectedFolder);
      const fs = require("fs") as typeof import("fs");
      fs.renameSync(oldDir, newDir);
      return this.read(expectedFolder);
    }
    return entity;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  validate(folderName: string): ValidationResult {
    const issues = [];
    const p = this.storyPath(folderName);
    if (!fileExists(p)) {
      return { valid: false, issues: [{ severity: "error", message: `STORY.md not found at ${p}` }] };
    }
    const entity = this.read(folderName);
    if (!entity.frontmatter.name) {
      issues.push({ severity: "error" as const, field: "name", message: "name is required" });
    }
    for (const a of entity.frontmatter.agents) {
      if (!this.agentMgr.exists(a)) {
        issues.push({ severity: "error" as const, field: "agents", message: `Agent "${a}" not found` });
      }
    }
    for (const s of entity.frontmatter.skills) {
      if (!this.skillMgr.exists(s)) {
        issues.push({ severity: "warning" as const, field: "skills", message: `Skill "${s}" not found` });
      }
    }
    return { valid: issues.filter((i) => i.severity === "error").length === 0, issues };
  }

  // ── Done check ─────────────────────────────────────────────────────────────

  isDone(folderName: string): StoryDoneResult {
    const entity = this.read(folderName);
    const taskResults = entity.tasks.map((t) => {
      const { done } = this.taskMgr.isDone(t.path);
      return { path: t.path, done };
    });
    const allDone = taskResults.length > 0 && taskResults.every((r) => r.done);
    return { done: allDone, taskResults };
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function normaliseArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v) return [v];
  return [];
}
