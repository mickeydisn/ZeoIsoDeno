import { Tile } from "../../../object/tile.ts";
import { ActionContext, BaseTileActionConfig, defineAction } from "../types.ts";
import { withShape } from "../withShape.ts";

// ---------------------
// Config  (no extra fields needed beyond base)
// ---------------------

export type ClearAllConfig = BaseTileActionConfig;

// ---------------------
// Shared helper — reused by other action families
// ---------------------

export function clearAllTile(tile: Tile, ctx: ActionContext) {
  tile.isBlock = false;
  tile.isFrise = false;
  tile.clearColor();
  tile.clearItem();
  ctx.listTilesUpdated.add(tile);
}

// ---------------------
// Single-tile action
// ---------------------

export const clearAll = defineAction<"clearAll", ClearAllConfig>(
  "clearAll",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    clearAllTile(tile, ctx);
  },
);

// ---------------------
// Square variant (auto-generated)
// ---------------------

export const clearAllSquare = withShape(clearAll, "clearAllSquare");
