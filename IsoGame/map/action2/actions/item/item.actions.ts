import { RecordRawItem } from "../../../factory/factoryTileGenerator.ts";
import { BaseTileActionConfig, defineAction } from "../types.ts";
import { withShape } from "../withShape.ts";

// ---------------------
// Config
// ---------------------

export type ItemKeyConfig = BaseTileActionConfig & {
  assetKey?: string;
  h?: number;
  off?: { x: number; y: number };
};

// ---------------------
// itemAddKey — appends an asset item without clearing existing ones
// ---------------------

export const itemAddKey = defineAction<"itemAddKey", ItemKeyConfig>(
  "itemAddKey",
  (conf, ctx) => {
    if (!conf.assetKey) return;
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.items.push({
      t: "Asset",
      key: conf.assetKey,
      lvl: conf.h ?? 0,
      off: conf.off,
    });
    ctx.listTilesUpdated.add(tile);
  },
);

// ---------------------
// itemForceKey — replaces all items with a single asset
// ---------------------

export const itemForceKey = defineAction<"itemForceKey", ItemKeyConfig>(
  "itemForceKey",
  (conf, ctx) => {
    if (!conf.assetKey) return;
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.clearItem();
    tile.items.push({
      t: "Asset",
      key: conf.assetKey,
      lvl: conf.h ?? 0,
      off: conf.off,
    });
    ctx.listTilesUpdated.add(tile);
  },
);

// ---------------------
// clearItem — removes all items from a tile
// ---------------------

export const clearItem = defineAction<"clearItem", BaseTileActionConfig>(
  "clearItem",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.clearItem();
    ctx.listTilesUpdated.add(tile);
  },
);

export const clearItemSquare = withShape(clearItem, "clearItemSquare");

// ---------------------
// temporaryItemsForceKey — sets a transient display item (preview / selection)
// ---------------------

export const temporaryItemsForceKey = defineAction<"temporatyItemsForceKey", ItemKeyConfig>(
  "temporatyItemsForceKey",            // keep old key for backwards compat
  (conf, ctx) => {
    if (!conf.assetKey) return;
    const tile = ctx.fm.getTile(conf.x, conf.y);
    const record: RecordRawItem = {
      t: "Asset",
      key: conf.assetKey,
      lvl: conf.h ?? 0,
    };
    tile.temporatyItems.splice(0, tile.temporatyItems.length);
    tile.temporatyItems.push(record);
    ctx.listTilesWithTempItems.push(tile);
  },
);
