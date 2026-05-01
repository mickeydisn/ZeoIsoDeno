import { TilesMatrix } from "../../../object/tilesMatrix.ts";
import { ActionContext, BaseTileActionConfig, defineAction } from "../../utils/types.ts";
import { withLine, withShape } from "../../utils/withShape.ts";

// ---------------------
// Config
// ---------------------

export type LvlConfig = BaseTileActionConfig & {
  lvl?: number;
  size?: number;
};

// ---------------------
// Shared helper: compute avg lvl over an N×N box and apply to the centre tile
// ---------------------

function applyAvgLvl(
  x: number,
  y: number,
  size: number,
  ctx: ActionContext,
): void {
  const tile = ctx.fm.getTile(x, y);
  const box = new TilesMatrix(size, x, y);
  let sum = 0;
  let count = 0;
  box.tiles.forEach((row) =>
    row.forEach((cell) => {
      sum += cell.lvl;
      count++;
      ctx.listTilesUpdated.add(cell);
    })
  );
  tile.lvl = sum / count;
}

// ---------------------
// clearLvl
// ---------------------

export const clearLvl = defineAction<"clearLvl", BaseTileActionConfig>(
  "clearLvl",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.clearLvl();
    ctx.listTilesUpdated.add(tile);
  },
);

export const clearLvlSquare = withShape(clearLvl, "clearLvlSquare");
// ---------------------
// lvlSet — sets the level to an explicit value
// ---------------------

export const lvlSet = defineAction<"lvlSet", LvlConfig>(
  "lvlSet",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    if (conf.lvl !== undefined) tile.lvl = conf.lvl;
    ctx.listTilesUpdated.add(tile);
  },
);

// ─── lvlSetShape ──────────────────────────────────────────────────────────────

export const lvlSetShape = withShape(lvlSet, "lvlSetShape");
export const lvlSetLine = withLine(lvlSet, "lvlSetLine");


// ---------------------
// lvlUp — increments level by conf.lvl
// ---------------------

export const lvlUp = defineAction<"lvlUp", LvlConfig>(
  "lvlUp",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.lvl += conf.lvl ?? 0;
    ctx.listTilesUpdated.add(tile);
  },
);

export const lvlUpSquare = withShape(lvlUp, "lvlUpSquare");

// ---------------------
// lvlFlatSquare — sets every tile in the box to the centre tile's level
// ---------------------

export const lvlFlatSquare = defineAction<"lvlFlatSquare", LvlConfig>(
  "lvlFlatSquare",
  (conf, ctx) => {
    const centre = ctx.fm.getTile(conf.x, conf.y);
    const box = new TilesMatrix(conf.size ?? 1, conf.x, conf.y);
    box.tiles.forEach((row) =>
      row.forEach((cell) => {
        cell.lvl = centre.lvl;
        ctx.listTilesUpdated.add(cell);
      })
    );
  },
);

// ---------------------
// lvlAvgSquare — smooths every tile in the box using a 3×3 neighbourhood avg
// ---------------------

export const lvlAvgSquare = defineAction<"lvlAvgSquare", LvlConfig>(
  "lvlAvgSquare",
  (conf, ctx) => {
    const size = conf.size ?? 1;
    const box = new TilesMatrix(size, conf.x, conf.y);
    box.tiles.forEach((row) =>
      row.forEach((cell) => applyAvgLvl(cell.x, cell.y, 3, ctx))
    );
  },
);

// ---------------------
// lvlAvgBorder — smooths the ring of tiles just outside the selection box
// ---------------------

export const lvlAvgBorder = defineAction<"lvlAvgBorder", LvlConfig>(
  "lvlAvgBorder",
  (conf, ctx) => {
    const { x, y } = conf;
    const size = conf.size ?? 1;
    const fCenter = Math.floor(size / 2);

    const rangeX = Array.from({ length: size }, (_, i) => i - fCenter + x);
    const rangeY = Array.from({ length: size }, (_, i) => i - fCenter + y);

    rangeX.forEach((xx) => {
      applyAvgLvl(xx, y - fCenter - 1, 5, ctx);
      applyAvgLvl(xx, y + (size - fCenter), 5, ctx);
    });
    rangeY.forEach((yy) => {
      applyAvgLvl(x - fCenter - 1, yy, 5, ctx);
      applyAvgLvl(x + (size - fCenter), yy, 5, ctx);
    });
  },
);
