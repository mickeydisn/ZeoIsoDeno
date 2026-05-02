/**
 * TaskExecutor – builds the TaskExecutionPayload for a given task within a story.
 */

import { CONFIG } from "./config";
import type { TaskExecutionPayload } from "./types";
import { StoryManager } from "./story";
import { TaskManager } from "./task";

export class TaskExecutor {
  private storyMgr: StoryManager;
  private taskMgr: TaskManager;

  constructor(private readonly baseDir: string = CONFIG.BASE_DIR) {
    this.storyMgr = new StoryManager(baseDir);
    this.taskMgr = new TaskManager(baseDir);
  }

  /**
   * Build the execution payload for a specific task.
   *
   * @param storyFolderName  The story folder (e.g. "001-my-story")
   * @param taskFilePath     Absolute path to the TASK*.md file
   */
  buildPayload(storyFolderName: string, taskFilePath: string): TaskExecutionPayload {
    const story = this.storyMgr.read(storyFolderName);
    const task = this.taskMgr.read(taskFilePath);

    // Union agents: task agents + story agents (deduplicated by path)
    const agentPaths = unique([
      ...task.agents.map((a) => a.path),
      ...story.agents.map((a) => a.path),
    ]);

    // Union skills: task skills + task agent skills + story skills + story agent skills
    const allSkillPaths: string[] = [
      ...task.skills.map((s) => s.path),
      ...task.agents.flatMap((a) => a.skills.map((s) => s.path)),
      ...story.skills.map((s) => s.path),
      ...story.agents.flatMap((a) => a.skills.map((s) => s.path)),
    ];
    const skillPaths = unique(allSkillPaths);

    return {
      story: story.path,
      agents: agentPaths,
      skills: skillPaths,
      prompt: task.frontmatter.prompts,
      task: task.path,
    };
  }

  /**
   * Build payloads for all tasks in a story.
   */
  buildAllPayloads(storyFolderName: string): TaskExecutionPayload[] {
    const story = this.storyMgr.read(storyFolderName);
    return story.tasks.map((t) => this.buildPayload(storyFolderName, t.path));
  }

  /**
   * Build payload for the next undone task in a story.
   * Returns null if all tasks are done or story has no tasks.
   */
  buildNextPayload(storyFolderName: string): TaskExecutionPayload | null {
    const story = this.storyMgr.read(storyFolderName);
    for (const task of story.tasks) {
      const { done } = this.taskMgr.isDone(task.path);
      if (!done) {
        return this.buildPayload(storyFolderName, task.path);
      }
    }
    return null;
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}
