import { defineAction } from "../types.ts";
import { withShape } from "../withShape.ts";
import { BaseTileActionConfig } from "../types.ts";

// ---------------------
// Config
// ---------------------

export type SetFriseConfig = BaseTileActionConfig & {
  isFrise?: boolean;
};

// ---------------------
// Single-tile action
// ---------------------

export const setFrise = defineAction<"setFrise", SetFriseConfig>(
  "setFrise",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.isFrise = conf.isFrise ?? false;
    ctx.listTilesUpdated.add(tile);
  },
);

// ---------------------
// Square variant (auto-generated)
// ---------------------

export const setFriseSquare = withShape(setFrise, "setFriseSquare");
