import { FactoryMap } from "../../factory/factoryMap.ts";
import { Tile } from "../../object/tile.ts";

// ---------------------
// Action context passed to every action's execute()
// ---------------------

export type ActionContext = {
  fm: FactoryMap;
  listTilesUpdated: Set<Tile>;
  listTilesWithTempItems: Tile[];
};

// ---------------------
// Base config — every action config extends this
// ---------------------

export type BaseTileActionConfig = {
  func: string;
  x: number;
  y: number;
};

// ---------------------
// A self-contained action descriptor
// K is the literal key type (e.g. "lvlFlatSquare"), not widened to string.
// This lets cmd.ts recover C from the registry without losing type info.
// ---------------------

export type TileAction<K extends string, C extends BaseTileActionConfig> = {
  readonly key: K;
  execute(conf: C, ctx: ActionContext): void;
};

// ---------------------
// Helper: create a typed action with zero boilerplate.
// K is inferred as the literal type of the key argument.
// ---------------------

export function defineAction<K extends string, C extends BaseTileActionConfig>(
  key: K,
  execute: (conf: C, ctx: ActionContext) => void,
): TileAction<K, C> {
  return { key, execute };
}

// ---------------------
// Re-export shape/line config types so call-sites import from one place
// ---------------------

export type { ShapeConfig, LineConfig } from "./withShape.ts";
export type { Shape }                   from "./geometry.ts";