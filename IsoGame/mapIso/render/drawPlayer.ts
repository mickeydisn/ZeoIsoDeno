import { DrawContext, LVL_Z_SCALE_FACTOR } from "./type.ts";
import { Shape } from "../utils/iso/shape.ts";
import { Point } from "../utils/iso/point.ts";
import { _drawTileItem } from "./utils/drawTileUtils.ts";
import { drawShapePaths } from "./utils/drawShapePaths.ts";

/**
 * Draws the base tile geometry, including floor and borders.
 */
export const drawPlayer = (
  _ctx: DrawContext,
  x: number,
  y: number,
) => {
  const size = _ctx.conf.mapGridSize;
  const xx = size - x - 1;
  const yy = size - y - 1;
  // Get the Matrix to display
  const metaTile = _ctx.tilesMatrix.tiles[xx][yy];
  // Factor applied to raw level difference to get display level
  const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * _ctx.conf.mapGridTileScale /
    _ctx.conf.mapGridMod;
  // Calculate the tile's current display level (Z coordinate)
  const currentlvl = (metaTile.lvl - _ctx.tilesMatrix.avgLvl) *
    LVL_DISPLAY_SCALE;
  // Update Shared GridLvl Matrix Buffer

  const items = [];
  // draw of .
  items.push({
    t: "Svg",
    key: "astronautB_" + _ctx.gameState.direction,
    off: {
      x: (_ctx.gameState.xf - _ctx.gameState.x) / _ctx.conf.mapGridMod,
      y: (_ctx.gameState.yf - _ctx.gameState.y) / _ctx.conf.mapGridMod,
    },
  });

  if (_ctx.conf.mapGridSize < 60) {
    // Create tile shape at average height (not individual tile height)
    const shape2 = Shape.SurfaceFlat(
      new Point(xx, yy, currentlvl - 1),
      1,
      1,
      1,
    );
    _ctx.canvasCtx.strokeStyle = "#FF0000";
    drawShapePaths(_ctx, shape2);
    // 4. Draw Each Item (Z-sorted locally)
    items
      .sort((a: any, b: any) => (a.lvl || 0) - (b.lvl || 0))
      .forEach((item: any) =>
        _drawTileItem(_ctx, xx, yy, metaTile, item, currentlvl)
      );
  }
};
