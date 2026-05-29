import { defineAction } from "../../utils/types.ts";
import { withShape } from "../../utils/withShape.ts";
import { BaseTileActionConfig } from "../../utils/types.ts";

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
  {
    label: "Toggle-Blocked",
    fields: [
      { key: "isBlock", type: "boolean", label: "Blocked", default: true },
    ],
  },
);

// ---------------------
// Square variant (auto-generated)
// ---------------------

export const setBlockedSquare = withShape(setBlocked, "setBlockedSquare");
