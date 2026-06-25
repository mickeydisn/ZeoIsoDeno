import { DrawContext, LVL_Z_SCALE_FACTOR } from "./type.ts";
import { Shape } from "../utils/iso/shape.ts";
import { Point } from "../utils/iso/point.ts";
import { _drawTileItem } from "./utils/drawTileUtils.ts";
import { drawShapePaths } from "./utils/drawShapePaths.ts";

/**
 * Draws a grid overlay showing tile boundaries.
 * Grid is drawn at the average height (plan) of the grid, not aligned with individual tile heights.
 */
export const drawGridOverlay = (
  _ctx: DrawContext,
) => {
  const size = _ctx.conf.mapGridSize;

  // Grid line color - semi-transparent red
  // const gridColor = 'rgba(255, 0, 255, 0.9)';
  const gridColor2 = "rgba(0, 0, 255, 1)";
  _ctx.canvasCtx.lineWidth = 1;

  // Draw grid lines at average height (plan of the grid)
  // Use fixed height of 0 (average level) for all grid lines
  const height = 1;

  // Draw grid lines for each tile
  for (let x = 1; x < size - 1; x++) {
    for (let y = 1; y < size - 1; y++) {
      const xx = size - x - 1;
      const yy = size - y - 1;

      if (!_ctx.tilesMatrix?.tiles?.[xx]?.[yy]) continue;
      // Get the Matrix to display
      const metaTile = _ctx.tilesMatrix.tiles[xx][yy];
      // Factor applied to raw level difference to get display level
      const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR *
        _ctx.conf.mapGridTileScale /
        _ctx.conf.mapGridMod;
      // Calculate the tile's current display level (Z coordinate)
      const currentlvl = (metaTile.lvl - _ctx.tilesMatrix.avgLvl) *
        LVL_DISPLAY_SCALE;

      // Create tile shape at average height (not individual tile height)
      const shape2 = Shape.SurfaceFlat(
        new Point(xx, yy, currentlvl - height),
        1,
        1,
        height,
      );
      _ctx.canvasCtx.strokeStyle = gridColor2;
      drawShapePaths(_ctx, shape2);

      // Create tile shape at average height (not individual tile height)
      // const shape = Shape.SurfaceFlat(new Point(xx, yy, 0 - height), 1, 1, height);
      // this.canvasCtx.strokeStyle = gridColor;
      // this.drawShapePaths(shape, undefined, `${metaTile.x},${metaTile.y}`); // Display grid coordinates for debugging
      // this.drawShapePaths(shape, undefined, `${xx}.${yy}`); // No text, just grid lines
    }
  }
};
