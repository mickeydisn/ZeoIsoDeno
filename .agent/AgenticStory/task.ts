/**
 * TaskManager – CRUD + validation + done-check for Task entities.
 * LogManager  – CRUD for Log entities within a story.
 */

import * as path from "path";
import { CONFIG } from "./config";
import type {
  TaskEntity,
  TaskFrontmatter,
  LogEntity,
  LogFrontmatter,
  ValidationResult,
  TaskDoneResult,
  CreateTaskOptions,
  UpdateTaskOptions,
  CreateLogOptions,
  UpdateLogOptions,
} from "./types";
import {
  taskFileName,
  logFileName,
  logDir,
  parseMd,
  serializeMd,
  writeFile,
  readFile,
  fileExists,
  listDir,
  deleteFile,
  nextIncrement,
  extractSection,
  buildLogBody,
  slugify,
  ensureDir,
} from "./utils";
import { AgentManager } from "./agent";
import { SkillManager } from "./skill";

// ─── TaskManager ─────────────────────────────────────────────────────────────

export class TaskManager {
  private agentMgr: AgentManager;
  private skillMgr: SkillManager;

  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {
    this.agentMgr = new AgentManager(baseDir);
    this.skillMgr = new SkillManager(baseDir);
  }

  // ── Paths ──────────────────────────────────────────────────────────────────

  taskPath(storyDirPath: string, number: number, name: string): string {
    return path.join(storyDirPath, taskFileName(number, name));
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  read(taskFilePath: string): TaskEntity {
    if (!fileExists(taskFilePath)) throw new Error(`Task not found: ${taskFilePath}`);
    const raw = readFile(taskFilePath);
    const { frontmatter, body } = parseMd(raw);
    const fm = frontmatter as TaskFrontmatter;

    // Normalise arrays
    fm.agents = normaliseStringArray(fm.agents);
    fm.skills = normaliseStringArray(fm.skills);

    const agents = fm.agents.map((a) => this.agentMgr.tryRead(a)).filter((x): x is NonNullable<typeof x> => x !== null);
    const skills = fm.skills.map((s) => this.skillMgr.tryRead(s)).filter((x): x is NonNullable<typeof x> => x !== null);

    const parsed = parseTaskFileName(path.basename(taskFilePath));
    const logMgr = new LogManager(this.baseDir);
    const logs = logMgr.listForTask(path.dirname(taskFilePath), parsed.number);

    return {
      path: taskFilePath,
      number: parsed.number,
      slug: parsed.slug,
      frontmatter: fm,
      body,
      agents,
      skills,
      logs,
    };
  }

  list(storyDirPath: string): TaskEntity[] {
    const files = listDir(storyDirPath)
      .filter((f) => CONFIG.PATTERNS.TASK.test(f))
      .sort();
    return files.map((f) => this.read(path.join(storyDirPath, f)));
  }

  exists(taskFilePath: string): boolean {
    return fileExists(taskFilePath);
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(options: CreateTaskOptions): TaskEntity {
    const storyDirPath = options.storyDir;
    const number = nextIncrement(storyDirPath, CONFIG.PATTERNS.TASK);
    const fm: TaskFrontmatter = {
      name: options.name,
      description: options.description,
      agents: options.agents ?? [],
      skills: options.skills ?? [],
      prompts: options.prompts,
    };
    const filePath = this.taskPath(storyDirPath, number, options.name);
    writeFile(filePath, serializeMd(fm, options.body ?? ""));
    return this.read(filePath);
  }

  update(taskFilePath: string, options: UpdateTaskOptions): TaskEntity {
    const entity = this.read(taskFilePath);
    const fm = { ...entity.frontmatter };
    if (options.name !== undefined) fm.name = options.name;
    if (options.description !== undefined) fm.description = options.description;
    if (options.agents !== undefined) fm.agents = options.agents;
    if (options.skills !== undefined) fm.skills = options.skills;
    if (options.prompts !== undefined) fm.prompts = options.prompts;
    const body = options.body ?? entity.body;
    writeFile(taskFilePath, serializeMd(fm, body));

    // Auto-rename if name changed
    if (options.name !== undefined && options.name !== entity.frontmatter.name) {
      const newPath = path.join(
        path.dirname(taskFilePath),
        taskFileName(entity.number, options.name)
      );
      const fs = require("fs") as typeof import("fs");
      fs.renameSync(taskFilePath, newPath);
      return this.read(newPath);
    }
    return this.read(taskFilePath);
  }

  delete(taskFilePath: string): void {
    deleteFile(taskFilePath);
  }

  autoValidate(taskFilePath: string): TaskEntity {
    const entity = this.read(taskFilePath);
    const expectedSlug = slugify(entity.frontmatter.name);
    const expectedFileName = taskFileName(entity.number, entity.frontmatter.name);
    const currentFileName = path.basename(taskFilePath);
    if (expectedFileName !== currentFileName) {
      const newPath = path.join(path.dirname(taskFilePath), expectedFileName);
      const fs = require("fs") as typeof import("fs");
      fs.renameSync(taskFilePath, newPath);
      return this.read(newPath);
    }
    return entity;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  validate(taskFilePath: string): ValidationResult {
    const issues = [];
    if (!fileExists(taskFilePath)) {
      return { valid: false, issues: [{ severity: "error", message: `Task file not found: ${taskFilePath}` }] };
    }
    const entity = this.read(taskFilePath);
    if (!entity.frontmatter.name) {
      issues.push({ severity: "error" as const, field: "name", message: "name is required" });
    }
    if (!entity.frontmatter.prompts) {
      issues.push({ severity: "error" as const, field: "prompts", message: "prompts is required" });
    }
    // Check agents exist
    for (const a of entity.frontmatter.agents) {
      if (!this.agentMgr.exists(a)) {
        issues.push({ severity: "error" as const, field: "agents", message: `Agent "${a}" not found` });
      }
    }
    // Check skills exist
    for (const s of entity.frontmatter.skills) {
      if (!this.skillMgr.exists(s)) {
        issues.push({ severity: "warning" as const, field: "skills", message: `Skill "${s}" not found` });
      }
    }
    return { valid: issues.filter((i) => i.severity === "error").length === 0, issues };
  }

  // ── Done check ─────────────────────────────────────────────────────────────

  isDone(taskFilePath: string): TaskDoneResult {
    const raw = readFile(taskFilePath);
    const remaining = CONFIG.INCOMPLETE_TOKENS.filter((token) => raw.includes(token));
    return { done: remaining.length === 0, remaining };
  }
}

// ─── LogManager ──────────────────────────────────────────────────────────────

export class LogManager {
  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {}

  // ── Read ───────────────────────────────────────────────────────────────────

  read(logFilePath: string): LogEntity {
    if (!fileExists(logFilePath)) throw new Error(`Log not found: ${logFilePath}`);
    const raw = readFile(logFilePath);
    const { frontmatter, body } = parseMd(raw);
    const fm = frontmatter as LogFrontmatter;
    const parsed = parseLogFileName(path.basename(logFilePath));
    return {
      path: logFilePath,
      taskNumber: parsed.taskNumber,
      logNumber: parsed.logNumber,
      slug: parsed.slug,
      frontmatter: fm,
      prompts: extractSection(body, "prompts"),
      taskContent: extractSection(body, "task-content"),
      result: extractSection(body, "result"),
    };
  }

  listForTask(storyDirPath: string, taskNumber: number): LogEntity[] {
    const lDir = logDir(storyDirPath);
    if (!fileExists(lDir)) return [];
    const pattern = new RegExp(`^LOG-${String(taskNumber).padStart(3, "0")}-\\d{3}-.+\\.md$`);
    return listDir(lDir)
      .filter((f) => pattern.test(f))
      .sort()
      .map((f) => this.read(path.join(lDir, f)));
  }

  list(storyDirPath: string): LogEntity[] {
    const lDir = logDir(storyDirPath);
    if (!fileExists(lDir)) return [];
    return listDir(lDir)
      .filter((f) => CONFIG.PATTERNS.LOG.test(f))
      .sort()
      .map((f) => this.read(path.join(lDir, f)));
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(options: CreateLogOptions): LogEntity {
    const lDir = logDir(options.storyDir);
    ensureDir(lDir);
    const logNumber = nextIncrement(lDir, CONFIG.PATTERNS.LOG);
    const fm: LogFrontmatter = {
      name: options.name,
      description: options.description,
      task: options.task,
    };
    const body = buildLogBody(
      options.prompts ?? "",
      options.taskContent ?? "",
      options.result ?? ""
    );
    const filePath = path.join(lDir, logFileName(options.taskNumber, logNumber, options.name));
    writeFile(filePath, serializeMd(fm, body));
    return this.read(filePath);
  }

  update(logFilePath: string, options: UpdateLogOptions): LogEntity {
    const entity = this.read(logFilePath);
    const fm = { ...entity.frontmatter };
    if (options.name !== undefined) fm.name = options.name;
    if (options.description !== undefined) fm.description = options.description;
    if (options.task !== undefined) fm.task = options.task;

    const newPrompts = options.prompts ?? entity.prompts;
    const newTaskContent = options.taskContent ?? entity.taskContent;
    const newResult = options.result ?? entity.result;
    const body = buildLogBody(newPrompts, newTaskContent, newResult);
    writeFile(logFilePath, serializeMd(fm, body));
    return this.read(logFilePath);
  }

  delete(logFilePath: string): void {
    deleteFile(logFilePath);
  }

  validate(logFilePath: string): ValidationResult {
    const issues = [];
    if (!fileExists(logFilePath)) {
      return { valid: false, issues: [{ severity: "error", message: `Log file not found: ${logFilePath}` }] };
    }
    const entity = this.read(logFilePath);
    if (!entity.frontmatter.name) {
      issues.push({ severity: "error" as const, field: "name", message: "name is required" });
    }
    if (!entity.frontmatter.task) {
      issues.push({ severity: "warning" as const, field: "task", message: "task reference is empty" });
    }
    return { valid: issues.filter((i) => i.severity === "error").length === 0, issues };
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseTaskFileName(filename: string): { number: number; slug: string } {
  const m = filename.match(CONFIG.PATTERNS.TASK);
  if (!m) throw new Error(`Invalid task filename: ${filename}`);
  return { number: parseInt(m[1], 10), slug: m[2] };
}

function parseLogFileName(filename: string): { taskNumber: number; logNumber: number; slug: string } {
  const m = filename.match(CONFIG.PATTERNS.LOG);
  if (!m) throw new Error(`Invalid log filename: ${filename}`);
  return { taskNumber: parseInt(m[1], 10), logNumber: parseInt(m[2], 10), slug: m[3] };
}

function normaliseStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v) return [v];
  return [];
}
