import { DrawContext, LVL_Z_SCALE_FACTOR } from "./type.ts";
import { Shape } from "../utils/iso/shape.ts";
import { Point } from "../utils/iso/point.ts";
import { _drawTileItem } from "./utils/drawTileUtils.ts";
import { drawShapePaths } from "./utils/drawShapePaths.ts";
import { toolRegistry } from "../../handlers/game/tools/toolRegistry.ts";

const _drawHoverOverlayTile = (
  _ctx: DrawContext,
  xx: number,
  yy: number,
  color: string = "rgba(255, 220, 50, 0.35)",
) => {
  const size = _ctx.conf.mapGridSize;
  // Bounds check
  if (xx < 1 || xx >= size - 1 || yy < 1 || yy >= size - 1) return;

  // Check if tilesMatrix and the tile exist
  if (!_ctx.tilesMatrix?.tiles?.[xx]?.[yy]) return;

  // Get the tile's display level from the matrix
  const metaTile = _ctx.tilesMatrix.tiles[xx][yy];
  const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * _ctx.conf.mapGridTileScale /
    _ctx.conf.mapGridMod;
  const currentlvl = (metaTile.lvl - _ctx.tilesMatrix.avgLvl) *
    LVL_DISPLAY_SCALE;
  const height = 1;

  const shape = Shape.SurfaceFlat(
    new Point(xx, yy, currentlvl - height),
    1,
    1,
    height,
  );
  drawShapePaths(_ctx, shape, color); // Display hover coordinates for debugging
};

/**
 * Draws a semi-transparent overlay on the hovered tile for visual feedback.
 */
export const drawHoverOverlay = (
  _ctx: DrawContext,
) => {
  // Directly use these coordinates without additional transformation
  const xx = Math.round(_ctx.gameState.mouseWorldX);
  const yy = Math.round(_ctx.gameState.mouseWorldY);

  // Bounds check
  const size = _ctx.conf.mapGridSize;
  if (xx < 1 || xx >= size - 1 || yy < 1 || yy >= size - 1) return;
  // Check if tilesMatrix and the tile exist
  if (!_ctx.tilesMatrix?.tiles?.[xx]?.[yy]) return;

  // Check for current tools config.
  const bsize = toolRegistry.getBrushSize();
  if (bsize > 1) {
    const rangeX = Array.from(
      { length: bsize },
      (_, index) =>
        (_ctx.conf.mapGridMod * index) -
        (_ctx.conf.mapGridMod * Math.floor(bsize / 2)) + xx,
    );
    const rangeY = Array.from(
      { length: bsize },
      (_, index) =>
        (_ctx.conf.mapGridMod * index) -
        (_ctx.conf.mapGridMod * Math.floor(bsize / 2)) + yy,
    );

    rangeX.forEach((rx, _idx) => {
      rangeY.forEach((ry, _idy) => {
        _drawHoverOverlayTile(_ctx, rx, ry);
      });
    });
    return;
  }
  _drawHoverOverlayTile(_ctx, xx, yy, "rgba(255, 50, 50, 0.35)");
};
