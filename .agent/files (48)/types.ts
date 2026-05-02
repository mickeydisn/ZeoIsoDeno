/**
 * Shared types for agent-fs
 */

// ─── Front-matter shapes ────────────────────────────────────────────────────

export interface SkillFrontmatter {
  name: string;
  description: string;
  [key: string]: unknown;
}

export interface AgentFrontmatter {
  name: string;
  description: string;
  /** Skill names resolvable from base-dir or agent-local skills/ */
  skills: string[];
  [key: string]: unknown;
}

export interface StoryFrontmatter {
  name: string;
  description: string;
  /** Agent names resolvable from base-dir agents/ */
  agents: string[];
  /** Skill names resolvable from base-dir or selected agents */
  skills: string[];
  [key: string]: unknown;
}

export interface TaskFrontmatter {
  name: string;
  description: string;
  agents: string[];
  skills: string[];
  /** Main prompt string executed for this task */
  prompts: string;
  [key: string]: unknown;
}

export interface LogFrontmatter {
  name: string;
  description: string;
  /** Reference to the parent TASK file path */
  task: string;
  [key: string]: unknown;
}

// ─── Rich entity models ──────────────────────────────────────────────────────

export interface SkillEntity {
  /** Absolute path to SKILL.md */
  path: string;
  frontmatter: SkillFrontmatter;
  body: string;
}

export interface AgentEntity {
  /** Absolute path to AGENT.md */
  path: string;
  frontmatter: AgentFrontmatter;
  body: string;
  /** Resolved skill entities (agent-local + base-dir) */
  skills: SkillEntity[];
}

export interface StoryEntity {
  /** Absolute path to STORY.md */
  path: string;
  /** Parent directory: story/<000>-<name>/ */
  dir: string;
  frontmatter: StoryFrontmatter;
  body: string;
  agents: AgentEntity[];
  skills: SkillEntity[];
  tasks: TaskEntity[];
}

export interface TaskEntity {
  /** Absolute path to TASK*.md */
  path: string;
  /** Parsed incremental number */
  number: number;
  /** Slug part of the filename */
  slug: string;
  frontmatter: TaskFrontmatter;
  body: string;
  agents: AgentEntity[];
  skills: SkillEntity[];
  logs: LogEntity[];
}

export interface LogEntity {
  path: string;
  taskNumber: number;
  logNumber: number;
  slug: string;
  frontmatter: LogFrontmatter;
  prompts: string;
  taskContent: string;
  result: string;
}

// ─── Execution payload ───────────────────────────────────────────────────────

export interface TaskExecutionPayload {
  /** Path to the STORY.md */
  story: string;
  /** Paths to all AGENT.md files (union of task + story agents) */
  agents: string[];
  /** Paths to all SKILL.md files (union of task, agents, story, story-agents) */
  skills: string[];
  /** The main prompt string from the TASK frontmatter */
  prompt: string;
  /** Path to the TASK*.md */
  task: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ─── Completion status ───────────────────────────────────────────────────────

export interface TaskDoneResult {
  done: boolean;
  /** Remaining incomplete tokens found (first 5 max) */
  remaining: string[];
}

export interface StoryDoneResult {
  done: boolean;
  taskResults: Array<{ path: string; done: boolean }>;
}

// ─── CRUD options ─────────────────────────────────────────────────────────────

export interface CreateSkillOptions {
  name: string;
  description: string;
  body?: string;
}

export interface CreateAgentOptions {
  name: string;
  description: string;
  skills?: string[];
  body?: string;
}

export interface CreateStoryOptions {
  name: string;
  description: string;
  agents?: string[];
  skills?: string[];
  body?: string;
}

export interface CreateTaskOptions {
  storyDir: string;
  name: string;
  description: string;
  agents?: string[];
  skills?: string[];
  prompts: string;
  body?: string;
}

export interface CreateLogOptions {
  storyDir: string;
  taskNumber: number;
  name: string;
  description: string;
  task: string;
  prompts?: string;
  taskContent?: string;
  result?: string;
}

export interface UpdateSkillOptions extends Partial<CreateSkillOptions> {}
export interface UpdateAgentOptions extends Partial<CreateAgentOptions> {}
export interface UpdateStoryOptions extends Partial<Omit<CreateStoryOptions, "name">> {
  name?: string;
}
export interface UpdateTaskOptions extends Partial<Omit<CreateTaskOptions, "storyDir">> {}
export interface UpdateLogOptions extends Partial<Omit<CreateLogOptions, "storyDir" | "taskNumber">> {}
