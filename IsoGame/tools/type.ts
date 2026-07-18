import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";
import { World } from "@iso-game/word.ts";

export type ToolContext = {
  world: World;
};

// ---------------------------------------
// -------------------------------------

export type BaseToolConfig = {
  x: number;
  y: number;
};

export type ToolConfigBrush = BaseToolConfig & {
  brushSize: number;
};

export type ToolConfigBrushColor = BaseToolConfig & {
  brushSize: number;
  color: [number, number, number];
};

type ToolCategory =
  | "layer"
  | "terrain"
  | "color"
  | "asset"
  | "structure"
  | "inspect";

// ---------------------
// A self-contained action descriptor
// K is the literal key type (e.g. "lvlFlatSquare"), not widened to string.
// This lets cmd.ts recover C from the registry without losing type info.
// ---------------------

export type ToolAction<K extends string, C extends BaseToolConfig> = {
  readonly key: K;
  name: string;
  icon: string;
  category: ToolCategory;
  execute(conf: C, ctx: TGameHandlerContext): void;
};

export type AnyToolAction = ToolAction<
  string,
  BaseToolConfig | ToolConfigBrush | ToolConfigBrushColor
>;

// ---------------------
// Helper: create a typed action with zero boilerplate.
// K is inferred as the literal type of the key argument.
// ---------------------

export function defineTool<K extends string, C extends BaseToolConfig>(
  key: K,
  name: string,
  icon: string,
  category: ToolCategory,
  execute: (conf: C, ctx: TGameHandlerContext) => void,
): ToolAction<K, C> {
  return {
    key,
    name,
    icon,
    category,
    execute,
  };
}

// ---------------------------------------
// -------------------------------------
