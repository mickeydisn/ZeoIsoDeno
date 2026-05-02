/**
 * AgentManager – CRUD + validation for Agent entities.
 * An agent can pull skills from:
 *   1. Base-dir skills/
 *   2. Its own agents/<agent-name>/skills/
 */

import * as path from "path";
import { CONFIG } from "./config";
import type {
  AgentEntity,
  AgentFrontmatter,
  SkillEntity,
  ValidationResult,
  CreateAgentOptions,
  UpdateAgentOptions,
} from "./types";
import {
  agentFile,
  agentDir,
  agentLocalSkillFile,
  skillFile,
  parseMd,
  serializeMd,
  writeFile,
  readFile,
  fileExists,
  listDirs,
  deleteFile,
  moveFile,
  slugify,
} from "./utils";
import { SkillManager } from "./skill";

export class AgentManager {
  private skillMgr: SkillManager;

  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {
    this.skillMgr = new SkillManager(baseDir);
  }

  // ── Paths ──────────────────────────────────────────────────────────────────

  agentPath(agentName: string): string {
    return agentFile(this.baseDir, agentName);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  read(agentName: string): AgentEntity {
    const p = this.agentPath(agentName);
    if (!fileExists(p)) throw new Error(`Agent not found: ${agentName}`);
    const raw = readFile(p);
    const { frontmatter, body } = parseMd(raw);
    const fm = frontmatter as AgentFrontmatter;
    // Normalise skills field
    const skillNames: string[] = Array.isArray(fm.skills)
      ? fm.skills
      : typeof fm.skills === "string" && fm.skills
      ? [fm.skills]
      : [];
    fm.skills = skillNames;

    const skills = this.resolveSkills(agentName, skillNames);
    return { path: p, frontmatter: fm, body, skills };
  }

  tryRead(agentName: string): AgentEntity | null {
    try {
      return this.read(agentName);
    } catch {
      return null;
    }
  }

  list(): AgentEntity[] {
    const agentsRoot = path.join(this.baseDir, CONFIG.DIRS.AGENTS);
    const dirs = listDirs(agentsRoot);
    return dirs
      .map((d) => this.tryRead(d))
      .filter((a): a is AgentEntity => a !== null);
  }

  exists(agentName: string): boolean {
    return fileExists(this.agentPath(agentName));
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(options: CreateAgentOptions): AgentEntity {
    const fm: AgentFrontmatter = {
      name: options.name,
      description: options.description,
      skills: options.skills ?? [],
    };
    const content = serializeMd(fm, options.body ?? "");
    const slug = slugify(options.name);
    writeFile(agentFile(this.baseDir, slug), content);
    return this.read(slug);
  }

  update(agentName: string, options: UpdateAgentOptions): AgentEntity {
    const entity = this.read(agentName);
    const fm = { ...entity.frontmatter };
    if (options.name !== undefined) fm.name = options.name;
    if (options.description !== undefined) fm.description = options.description;
    if (options.skills !== undefined) fm.skills = options.skills;

    const body = options.body ?? entity.body;
    writeFile(entity.path, serializeMd(fm, body));

    if (options.name !== undefined) {
      const newSlug = slugify(options.name);
      const oldSlug = slugify(entity.frontmatter.name);
      if (newSlug !== oldSlug) {
        return this.rename(oldSlug, newSlug);
      }
    }
    return this.read(agentName);
  }

  delete(agentName: string): void {
    deleteFile(this.agentPath(agentName));
    const dir = agentDir(this.baseDir, agentName);
    try {
      const fs = require("fs") as typeof import("fs");
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {/* ignore */}
  }

  autoValidate(agentName: string): AgentEntity {
    const entity = this.read(agentName);
    const expectedSlug = slugify(entity.frontmatter.name);
    if (expectedSlug !== agentName) {
      return this.rename(agentName, expectedSlug);
    }
    return entity;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  validate(agentName: string): ValidationResult {
    const issues = [];
    const p = this.agentPath(agentName);
    if (!fileExists(p)) {
      return { valid: false, issues: [{ severity: "error", message: `AGENT.md not found at ${p}` }] };
    }
    const entity = this.read(agentName);
    if (!entity.frontmatter.name) {
      issues.push({ severity: "error" as const, field: "name", message: "name is required" });
    }
    if (!entity.frontmatter.description) {
      issues.push({ severity: "warning" as const, field: "description", message: "description is empty" });
    }
    // Check all declared skills exist
    for (const s of entity.frontmatter.skills) {
      const local = agentLocalSkillFile(this.baseDir, agentName, s);
      const global = skillFile(this.baseDir, s);
      if (!fileExists(local) && !fileExists(global)) {
        issues.push({
          severity: "error" as const,
          field: "skills",
          message: `Skill "${s}" not found in agent-local or base-dir`,
        });
      }
    }
    return { valid: issues.filter((i) => i.severity === "error").length === 0, issues };
  }

  // ── Skill resolution ───────────────────────────────────────────────────────

  resolveSkills(agentName: string, skillNames: string[]): SkillEntity[] {
    const resolved: SkillEntity[] = [];
    for (const s of skillNames) {
      // Try agent-local first
      const localPath = agentLocalSkillFile(this.baseDir, agentName, s);
      if (fileExists(localPath)) {
        const raw = readFile(localPath);
        const { frontmatter, body } = parseMd(raw);
        resolved.push({ path: localPath, frontmatter: frontmatter as any, body });
        continue;
      }
      // Fall back to base-dir
      const entity = this.skillMgr.tryRead(s);
      if (entity) resolved.push(entity);
    }
    return resolved;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private rename(oldSlug: string, newSlug: string): AgentEntity {
    const oldDir = agentDir(this.baseDir, oldSlug);
    const newDir = agentDir(this.baseDir, newSlug);
    const fs = require("fs") as typeof import("fs");
    fs.renameSync(oldDir, newDir);
    return this.read(newSlug);
  }
}
