/**
 * SkillManager – CRUD + validation for Skill entities.
 */

import * as path from "path";
import { CONFIG } from "./config";
import type {
  SkillEntity,
  SkillFrontmatter,
  ValidationResult,
  CreateSkillOptions,
  UpdateSkillOptions,
} from "./types";
import {
  skillFile,
  skillDir,
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

export class SkillManager {
  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {}

  // ── Paths ──────────────────────────────────────────────────────────────────

  skillPath(skillName: string): string {
    return skillFile(this.baseDir, skillName);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  read(skillName: string): SkillEntity {
    const p = this.skillPath(skillName);
    if (!fileExists(p)) throw new Error(`Skill not found: ${skillName}`);
    const raw = readFile(p);
    const { frontmatter, body } = parseMd(raw);
    return {
      path: p,
      frontmatter: frontmatter as SkillFrontmatter,
      body,
    };
  }

  /** Return null instead of throwing when skill does not exist. */
  tryRead(skillName: string): SkillEntity | null {
    try {
      return this.read(skillName);
    } catch {
      return null;
    }
  }

  list(): SkillEntity[] {
    const skillsRoot = path.join(this.baseDir, CONFIG.DIRS.SKILLS);
    const dirs = listDirs(skillsRoot);
    return dirs
      .map((d) => this.tryRead(d))
      .filter((s): s is SkillEntity => s !== null);
  }

  exists(skillName: string): boolean {
    return fileExists(this.skillPath(skillName));
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(options: CreateSkillOptions): SkillEntity {
    const fm: SkillFrontmatter = {
      name: options.name,
      description: options.description,
    };
    const content = serializeMd(fm, options.body ?? "");
    const p = this.skillPath(slugify(options.name));
    writeFile(p, content);
    return this.read(slugify(options.name));
  }

  update(skillName: string, options: UpdateSkillOptions): SkillEntity {
    const entity = this.read(skillName);
    const fm = { ...entity.frontmatter };
    if (options.name !== undefined) fm.name = options.name;
    if (options.description !== undefined) fm.description = options.description;

    const body = options.body ?? entity.body;
    writeFile(entity.path, serializeMd(fm, body));

    // Auto-rename folder/file if name changed
    if (options.name !== undefined) {
      const newSlug = slugify(options.name);
      const oldSlug = slugify(entity.frontmatter.name);
      if (newSlug !== oldSlug) {
        return this.rename(oldSlug, newSlug);
      }
    }
    return this.read(skillName);
  }

  delete(skillName: string): void {
    const p = this.skillPath(skillName);
    deleteFile(p);
    // Optionally remove dir if empty
    const dir = skillDir(this.baseDir, skillName);
    try {
      const fs = require("fs") as typeof import("fs");
      if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    } catch {/* ignore */}
  }

  /**
   * Auto-validate: rename the skill folder to match the `name` field in its frontmatter.
   */
  autoValidate(skillName: string): SkillEntity {
    const entity = this.read(skillName);
    const expectedSlug = slugify(entity.frontmatter.name);
    if (expectedSlug !== skillName) {
      return this.rename(skillName, expectedSlug);
    }
    return entity;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  validate(skillName: string): ValidationResult {
    const issues = [];
    const p = this.skillPath(skillName);
    if (!fileExists(p)) {
      return { valid: false, issues: [{ severity: "error", message: `SKILL.md not found at ${p}` }] };
    }
    const entity = this.read(skillName);
    if (!entity.frontmatter.name) {
      issues.push({ severity: "error" as const, field: "name", message: "name is required" });
    }
    if (!entity.frontmatter.description) {
      issues.push({ severity: "warning" as const, field: "description", message: "description is empty" });
    }
    const slug = slugify(entity.frontmatter.name ?? "");
    if (slug !== skillName) {
      issues.push({
        severity: "warning" as const,
        field: "name",
        message: `Folder name "${skillName}" does not match slugified name "${slug}"`,
      });
    }
    return { valid: issues.filter((i) => i.severity === "error").length === 0, issues };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private rename(oldSlug: string, newSlug: string): SkillEntity {
    const oldPath = this.skillPath(oldSlug);
    const newPath = this.skillPath(newSlug);
    moveFile(oldPath, newPath);
    return this.read(newSlug);
  }
}
