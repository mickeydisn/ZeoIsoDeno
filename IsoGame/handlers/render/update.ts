import { TRenderHandlerContext } from "@iso-game/handlers/render/contexts.ts";
import { drawHoverOverlay } from "@iso-game/mapIso/render/drawHoverOverlay.ts";
import { drawPlayer } from "@iso-game/mapIso/render/drawPlayer.ts";
import { drawTile } from "@iso-game/mapIso/render/drawTile.ts";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../game/gameState.ts";

export const drawUpdate = (
  _ctx: TRenderHandlerContext,
  centreX: number,
  centreY: number,
  offx: number = 0,
  offy: number = 0,
) => {
  _ctx.tilesMatrix.setOff(offx, offy);
  _ctx.tilesMatrix.setCenter(centreX, centreY);
  // Use the maximum of 1 or the scaled modifier for isomer
  _ctx.isomer.mapGridMod = Math.max(1, 1 / 8);
  _ctx.isomer.setOffset(offx, offy);

  _ctx.isoProject.updateConf({
    mapGridMod: Math.max(1, 1 / 8),
    offsetX: offx,
    offsetY: offy,
  });
  _drawIso(_ctx);
};

const _drawIso = (
  _ctx: TRenderHandlerContext,
) => {
  const size = _ctx.conf.mapGridSize;
  _ctx.canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Clear all temporary tile items after each render frame
  for (let x = 0; x < _ctx.tilesMatrix.size; x++) {
    for (let y = 0; y < _ctx.tilesMatrix.size; y++) {
      if (_ctx.tilesMatrix.tiles[x]?.[y]) {
        _ctx.tilesMatrix.tiles[x][y].clearTemporatyItem();
      }
    }
  }

  // Draw tiles: loop from 1 to size-1 to avoid boundary checks
  // when accessing neighbors (yy-1, xx-1) inside drawTile.
  for (let x = 1; x < size - 1; x++) {
    for (let y = 1; y < size - 1; y++) {
      // this.drawTile(x, y);
      drawTile(_ctx, x, y);

      if (x == size / 2 && y == size / 2) {
        // this.drawPlayer(x, y)
        drawPlayer(_ctx, x, y);
      }
    }
  }

  // Draw grid overlay to show tile boundaries
  // this.drawGridOverlay();
  // this.drawHoverOverlay();
  drawHoverOverlay(_ctx);
  // iso.addImage();
  _cleanCache(_ctx);
};

/**
 * Memory Optimization: Cleans the cache by removing tiles far outside the current view.
 * Uses a margin of 2x the current visible extent.
 */

const _cleanCache = (
  _ctx: TRenderHandlerContext,
) => {
  // Calculate the map's current visible radius in world units

  // Define an aggressive margin (2x view extent)
  const KEEP_MARGIN_X = _ctx.conf.mapGridSize;
  const KEEP_MARGIN_Y = _ctx.conf.mapGridSize;

  const xMin = _ctx.tilesMatrix.x - KEEP_MARGIN_X;
  const xMax = _ctx.tilesMatrix.x + KEEP_MARGIN_X;
  const yMin = _ctx.tilesMatrix.y - KEEP_MARGIN_Y;
  const yMax = _ctx.tilesMatrix.y + KEEP_MARGIN_Y;

  // Iterate and delete out-of-bounds tiles (key format is "x:y")
  for (const key of _ctx.tileCache.keys()) {
    const parts = key.split(":");
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);

    if (x < xMin || x > xMax || y < yMin || y > yMax) {
      _ctx.tileCache.delete(key);
      console.log("tileDelete");
    }
  }
};
