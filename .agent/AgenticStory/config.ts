/**
 * agent-fs configuration constants
 * Centralised config for the entire package.
 */

export const CONFIG = {
  /** Root directory that contains skills/, agents/, story/ */
  BASE_DIR: process.env.AGENT_FS_BASE_DIR ?? "./workspace",

  DIRS: {
    SKILLS: "skills",
    AGENTS: "agents",
    STORIES: "story",
  },

  FILES: {
    SKILL: "SKILL.md",
    AGENT: "AGENT.md",
    STORY: "STORY.md",
  },

  PATTERNS: {
    /** TASK-000-<name>.md */
    TASK: /^TASK-(\d{3})-(.+)\.md$/,
    /** LOG-000-001-<name>.md */
    LOG: /^LOG-(\d{3})-(\d{3})-(.+)\.md$/,
    /** log/ subfolder */
    LOG_DIR: "log",
  },

  /** Tokens that mark a task as incomplete */
  INCOMPLETE_TOKENS: ["[ ]", "TODO"],

  /** Zero-pad width for incremental numbers */
  PAD_WIDTH: 3,
} as const;

export type Config = typeof CONFIG;
