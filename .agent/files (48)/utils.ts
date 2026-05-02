/**
 * Internal utilities – not exported from the package root.
 */

import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "./config";

// ─── Path helpers ────────────────────────────────────────────────────────────

export function pad(n: number): string {
  return String(n).padStart(CONFIG.PAD_WIDTH, "0");
}

export function skillDir(baseDir: string, skillName: string): string {
  return path.join(baseDir, CONFIG.DIRS.SKILLS, skillName);
}

export function skillFile(baseDir: string, skillName: string): string {
  return path.join(skillDir(baseDir, skillName), CONFIG.FILES.SKILL);
}

export function agentDir(baseDir: string, agentName: string): string {
  return path.join(baseDir, CONFIG.DIRS.AGENTS, agentName);
}

export function agentFile(baseDir: string, agentName: string): string {
  return path.join(agentDir(baseDir, agentName), CONFIG.FILES.AGENT);
}

export function agentLocalSkillFile(
  baseDir: string,
  agentName: string,
  skillName: string
): string {
  return path.join(
    agentDir(baseDir, agentName),
    CONFIG.DIRS.SKILLS,
    skillName,
    CONFIG.FILES.SKILL
  );
}

/**
 * Build the story folder name: `000-<slug>` where slug is sanitised from name.
 */
export function storyFolderName(number: number, name: string): string {
  const slug = slugify(name);
  return `${pad(number)}-${slug}`;
}

export function storyDir(baseDir: string, folderName: string): string {
  return path.join(baseDir, CONFIG.DIRS.STORIES, folderName);
}

export function storyFile(baseDir: string, folderName: string): string {
  return path.join(storyDir(baseDir, folderName), CONFIG.FILES.STORY);
}

export function taskFileName(number: number, name: string): string {
  return `TASK-${pad(number)}-${slugify(name)}.md`;
}

export function logFileName(
  taskNumber: number,
  logNumber: number,
  name: string
): string {
  return `LOG-${pad(taskNumber)}-${pad(logNumber)}-${slugify(name)}.md`;
}

export function logDir(storyDirPath: string): string {
  return path.join(storyDirPath, CONFIG.PATTERNS.LOG_DIR);
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── FS helpers ──────────────────────────────────────────────────────────────

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function listDir(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath);
}

export function listDirs(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((d: import("fs").Dirent) => d.isDirectory())
    .map((d: import("fs").Dirent) => d.name);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function moveFile(from: string, to: string): void {
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
}

// ─── Next increment helpers ───────────────────────────────────────────────────

/**
 * Scans a directory for files matching a pattern that has a leading numeric group
 * and returns max + 1 (starting at 1).
 */
export function nextIncrement(dirPath: string, pattern: RegExp): number {
  const entries = listDir(dirPath);
  let max = 0;
  for (const entry of entries) {
    const m = entry.match(pattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

/**
 * Returns next story folder number by scanning the stories dir.
 */
export function nextStoryNumber(baseDir: string): number {
  const storiesPath = path.join(baseDir, CONFIG.DIRS.STORIES);
  const dirs = listDirs(storiesPath);
  let max = 0;
  for (const d of dirs) {
    const m = d.match(/^(\d+)-/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

// ─── Frontmatter parser / serializer ─────────────────────────────────────────

export interface ParsedMd {
  frontmatter: Record<string, unknown>;
  body: string;
}

const FM_DELIMITER = "---";

/**
 * Very lightweight YAML-subset parser.
 * Supports: string, string[], multiline string (| block not supported – use regular string).
 */
export function parseMd(raw: string): ParsedMd {
  const lines = raw.split("\n");
  if (lines[0].trim() !== FM_DELIMITER) {
    return { frontmatter: {}, body: raw };
  }

  const closeIdx = lines.findIndex((l, i) => i > 0 && l.trim() === FM_DELIMITER);
  if (closeIdx === -1) {
    return { frontmatter: {}, body: raw };
  }

  const fmLines = lines.slice(1, closeIdx);
  const body = lines.slice(closeIdx + 1).join("\n").trimStart();
  const frontmatter = parseFmLines(fmLines);

  return { frontmatter, body };
}

function parseFmLines(lines: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Skip blank lines / comments
    if (!line.trim() || line.trimStart().startsWith("#")) {
      i++;
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    // Inline array: key: [a, b, c]
    if (rest.startsWith("[")) {
      result[key] = parseInlineArray(rest);
      i++;
      continue;
    }

    // Multi-line list: key:\n  - a\n  - b
    if (rest === "") {
      const items: string[] = [];
      i++;
      while (i < lines.length && lines[i].trimStart().startsWith("-")) {
        items.push(lines[i].trimStart().slice(1).trim());
        i++;
      }
      result[key] = items.length > 0 ? items : "";
      continue;
    }

    // Comma-separated value as array: key: a, b, c  (custom shorthand used in spec)
    if (rest.includes(",")) {
      result[key] = rest.split(",").map((s) => s.trim()).filter(Boolean);
      i++;
      continue;
    }

    result[key] = unquote(rest);
    i++;
  }
  return result;
}

function parseInlineArray(s: string): string[] {
  const inner = s.replace(/^\[/, "").replace(/\].*$/, "");
  return inner.split(",").map((v) => unquote(v.trim())).filter(Boolean);
}

function unquote(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

export function serializeMd(
  frontmatter: Record<string, unknown>,
  body = ""
): string {
  const lines: string[] = [FM_DELIMITER];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    } else if (typeof value === "string" && value.includes("\n")) {
      lines.push(`${key}: |-`);
      for (const l of value.split("\n")) {
        lines.push(`  ${l}`);
      }
    } else {
      const v = value === null || value === undefined ? "" : String(value);
      lines.push(`${key}: ${v}`);
    }
  }
  lines.push(FM_DELIMITER);
  if (body) {
    lines.push("", body);
  }
  return lines.join("\n") + "\n";
}

// ─── Section extractor (for LOG body) ────────────────────────────────────────

export function extractSection(body: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `###\\s*${escapedHeading}[:\\s]*\\n([\\s\\S]*?)(?=\\n###|$)`,
    "i"
  );
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

export function buildLogBody(
  prompts: string,
  taskContent: string,
  result: string
): string {
  return [
    `### prompts:`,
    prompts,
    ``,
    `### task-content:`,
    taskContent,
    ``,
    `### result:`,
    result,
  ].join("\n");
}
