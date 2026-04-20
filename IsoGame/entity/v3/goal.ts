import type { CityEntity } from "./cityEntity.ts";
import type { EntityMemory } from "./entityMemory.ts";

// ─────────────────────────────────────────────────────────────
//  GoalStatus
// ─────────────────────────────────────────────────────────────

export type GoalStatus = "running" | "done";

// ─────────────────────────────────────────────────────────────
//  Goal
//
//  A self-contained unit of intent.
//  - owns its own short-term memory  (private fields)
//  - receives entity long-term memory via run()
//  - signals completion by returning "done"
// ─────────────────────────────────────────────────────────────

export interface Goal {
  readonly id: string;
  run(entity: CityEntity, mem: EntityMemory): GoalStatus;
}

// ─────────────────────────────────────────────────────────────
//  Script
//
//  An ordered list of goal factories with loop control.
//  "loop" repeats the whole script indefinitely.
//  "once" runs each entry once then stops (entity idles).
// ─────────────────────────────────────────────────────────────

export type ScriptMode = "loop" | "once";

export interface ScriptEntry {
  factory:       () => Goal;
  waitAfter?:    number;  // idle ticks after this goal completes
}

export interface Script {
  mode:    ScriptMode;
  entries: ScriptEntry[];
}

// ─────────────────────────────────────────────────────────────
//  ScriptRunner
//
//  Drives a Script: advances through entries, handles wait,
//  loops or halts when the script ends.
//  Owned by CityEntity, invisible to goals.
// ─────────────────────────────────────────────────────────────

export class ScriptRunner {
  private index   = 0;
  private waitTicks = 0;
  private current: Goal | null = null;
  private finished = false;

  constructor(private script: Script) {}

  tick(entity: CityEntity, mem: EntityMemory): void {
    if (this.finished) return;

    if (this.waitTicks > 0) { this.waitTicks--; return; }

    // Instantiate next goal if needed
    if (!this.current) {
      const entry = this.script.entries[this.index];
      if (!entry) {
        if (this.script.mode === "loop") {
          this.index = 0;
        } else {
          this.finished = true;
        }
        return;
      }
      this.current = entry.factory();
    }

    const status = this.current.run(entity, mem);

    if (status === "done") {
      const entry = this.script.entries[this.index];
      this.waitTicks = entry.waitAfter ?? 0;
      this.current = null;
      this.index++;
    }
  }

  // Replace the running script mid-life (e.g. react to an event)
  replace(script: Script): void {
    this.script   = script;
    this.index    = 0;
    this.waitTicks = 0;
    this.current  = null;
    this.finished = false;
  }
}
