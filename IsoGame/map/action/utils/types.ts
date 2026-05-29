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
// Action meta — optional descriptor for the UI (craft dialog, help, etc.)
// ---------------------

export type ActionFieldType = "number" | "range" | "color" | "boolean" | "select" | "text";

export interface ActionField {
  key: string;
  type: ActionFieldType;
  label: string;
  default: number | string | boolean | number[];
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface ActionMeta {
  label: string;
  description?: string;
  fields: ActionField[];
}

// ---------------------
// A self-contained action descriptor
// K is the literal key type (e.g. "lvlFlatSquare"), not widened to string.
// This lets cmd.ts recover C from the registry without losing type info.
// ---------------------

export type TileAction<K extends string, C extends BaseTileActionConfig> = {
  readonly key: K;
  execute(conf: C, ctx: ActionContext): void;
  meta?: ActionMeta;
};

// ---------------------
// Helper: create a typed action with zero boilerplate.
// K is inferred as the literal key type of the key argument.
// ---------------------

export function defineAction<K extends string, C extends BaseTileActionConfig>(
  key: K,
  execute: (conf: C, ctx: ActionContext) => void,
  meta?: ActionMeta,
): TileAction<K, C> {
  return { key, execute, meta };
}

// ---------------------
// Re-export shape/line config types so call-sites import from one place
// ---------------------

export type { ShapeConfig, LineConfig } from "./withShape.ts";
export type { Shape }                   from "./geometry.ts";