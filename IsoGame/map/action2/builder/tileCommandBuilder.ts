/**
 *
 * A minimal typed accumulator for BaseTileActionConfig lists.
 * The value is in cmd giving type-safe construction — the builder
 * is just a clean collector so scripts don't manage raw arrays.
 */

import { BaseTileActionConfig } from "../utils/types.ts";

export const GREY: [number, number, number, number] = [128, 128, 128, 255];

export class TileCommandBuilder {
  private list: BaseTileActionConfig[] = [];

  /** Push one or more typed commands onto the list. */
  push(...cmds: BaseTileActionConfig[]): this {
    this.list.push(...cmds);
    return this;
  }

  /**
   * Merge all commands from another builder.
   * Useful for composing reusable sub-scripts.
   */
  merge(other: TileCommandBuilder): this {
    this.list.push(...other.list);
    return this;
  }

  /** Returns the accumulated list. Does not mutate the builder. */
  build(): BaseTileActionConfig[] {
    return [...this.list];
  }
}