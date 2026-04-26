import { defineAction } from "../types.ts";
import { withShape } from "../withShape.ts";
import { BaseTileActionConfig } from "../types.ts";

// ---------------------
// Config
// ---------------------

export type SetBlockedConfig = BaseTileActionConfig & {
  isBlock?: boolean;
};

// ---------------------
// Single-tile action
// ---------------------

export const setBlocked = defineAction<"setBlocked", SetBlockedConfig>(
  "setBlocked",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.isBlock = conf.isBlock ?? false;
    ctx.listTilesUpdated.add(tile);
  },
);

// ---------------------
// Square variant (auto-generated)
// ---------------------

export const setBlockedSquare = withShape(setBlocked, "setBlockedSquare");
