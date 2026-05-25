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
    y: number
) => {

    const size = _ctx.conf.DRAW_TILE_COUNT;
    const xx = size - x - 1;
    const yy = size - y - 1;
    // Get the Matrix to display
    const metaTile = _ctx.tilesMatrix.tiles[xx][yy];
    // Factor applied to raw level difference to get display level
    const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * _ctx.conf.SCALE_SIZE / _ctx.conf.SCALE_MOD;
    // Calculate the tile's current display level (Z coordinate)
    const currentlvl = (metaTile.lvl - _ctx.tilesMatrix.avgLvl) * LVL_DISPLAY_SCALE;
   // Update Shared GridLvl Matrix Buffer

    const items = [];
    // draw of .
    items.push({
       t: "Svg", 
       key: "astronautB_" + _ctx.mapState.direction,
      off : {
        x: (_ctx.mapState.xf - _ctx.mapState.x) / _ctx.conf.SCALE_MOD,
        y: (_ctx.mapState.yf - _ctx.mapState.y) / _ctx.conf.SCALE_MOD
      } 
    });

    if (_ctx.conf.DRAW_TILE_COUNT < 60 ) {
        // Create tile shape at average height (not individual tile height)
        const shape2 = Shape.SurfaceFlat(new Point(xx, yy, currentlvl - 1), 1, 1, 1);
        _ctx.canvasCtx.strokeStyle = "#FF0000";
        drawShapePaths(_ctx, shape2);
      // 4. Draw Each Item (Z-sorted locally)
      items
        .sort((a: any, b: any) => (a.lvl || 0) - (b.lvl || 0))
        .forEach((item: any) => _drawTileItem(_ctx, xx, yy, metaTile, item, currentlvl));
    }


  }
