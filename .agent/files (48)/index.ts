/**
 * agent-fs – public API
 *
 * Usage:
 *   import { SkillManager, AgentManager, StoryManager, TaskManager, LogManager, TaskExecutor } from "agent-fs";
 *
 * All managers accept an optional `baseDir` constructor argument.
 * If omitted, CONFIG.BASE_DIR is used (defaults to `./workspace` or $AGENT_FS_BASE_DIR).
 */

export { CONFIG } from "./config";
export type { Config } from "./config";

export * from "./types";

export { SkillManager } from "./skill";
export { AgentManager } from "./agent";
export { StoryManager } from "./story";
export { TaskManager, LogManager } from "./task";
export { TaskExecutor } from "./executor";

// ─── Convenience factory ──────────────────────────────────────────────────────

import { CONFIG } from "./config";
import { SkillManager } from "./skill";
import { AgentManager } from "./agent";
import { StoryManager } from "./story";
import { TaskManager, LogManager } from "./task";
import { TaskExecutor } from "./executor";

export interface AgentFsClient {
  skills: SkillManager;
  agents: AgentManager;
  stories: StoryManager;
  tasks: TaskManager;
  logs: LogManager;
  executor: TaskExecutor;
  baseDir: string;
}

/**
 * Create a fully configured client for a given workspace directory.
 *
 * @example
 * ```ts
 * const fs = createClient("/path/to/workspace");
 * const skill = fs.skills.create({ name: "my-skill", description: "..." });
 * ```
 */
export function createClient(baseDir?: string): AgentFsClient {
  const dir = baseDir ?? CONFIG.BASE_DIR;
  return {
    baseDir: dir,
    skills: new SkillManager(dir),
    agents: new AgentManager(dir),
    stories: new StoryManager(dir),
    tasks: new TaskManager(dir),
    logs: new LogManager(dir),
    executor: new TaskExecutor(dir),
  };
}
