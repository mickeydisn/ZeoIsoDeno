import { PointIso } from "../utils/simpleIso/IsometricProjector.ts";
import { DrawContext, LVL_Z_SCALE_FACTOR } from "./type.ts";
import { Color } from "../utils/iso/color.ts";
import {
  _drawTileBack,
  _drawTileFloor,
  _drawTileFront,
  _drawTileItem,
} from "./utils/drawTileUtils.ts";
import { msgToScreen } from "../../handlers/handlers.ts";
import { gobalMapState } from "@iso-game/handlers/game/mapState.ts";

/**
 * Draws the base tile geometry, including floor and borders.
 */
export const drawTile = (
  _ctx: DrawContext,
  x: number,
  y: number,
) => {
  const size = _ctx.conf.DRAW_TILE_COUNT;
  const xx = size - x - 1;
  const yy = size - y - 1;

  // Get the Matrix to display
  const metaTile = _ctx.tilesMatrix.tiles[xx][yy];

  // Factor applied to raw level difference to get display level
  const LVL_DISPLAY_SCALE = LVL_Z_SCALE_FACTOR * _ctx.conf.SCALE_SIZE /
    _ctx.conf.SCALE_MOD;

  // Calculate the tile's current display level (Z coordinate)
  const currentlvl = (metaTile.lvl - _ctx.tilesMatrix.avgLvl) *
    LVL_DISPLAY_SCALE;

  // Update Shared GridLvl Matrix Buffer
  // _ctx.mapLvl[xx * size + yy] = currentlvl;

  // Get Tile Floor color and properties
  const height = 1;
  const color = new Color(
    metaTile.color[0],
    metaTile.color[1],
    metaTile.color[2],
    1, // Alpha
  );

  // South-East Border (comparing with tile at yy-1)
  const lvlYNeighbor = _ctx.tilesMatrix.tiles[xx][yy - 1].lvl;
  const diffLvlSE = yy == 1
    ? 30 * LVL_DISPLAY_SCALE
    : (metaTile.lvl - lvlYNeighbor) * LVL_DISPLAY_SCALE;
  // South-West Border (comparing with tile at xx-1)
  const lvlXNeighbor = _ctx.tilesMatrix.tiles[xx - 1][yy].lvl;
  const diffLvlSW = xx == 1
    ? 30 * LVL_DISPLAY_SCALE
    : (metaTile.lvl - lvlXNeighbor) * LVL_DISPLAY_SCALE;

  const drawFrontTile = (
    p: { x: number; y: number; xoff: number; yoff: number },
  ) => {
    _drawTileFront(_ctx, p, currentlvl, color, diffLvlSE, diffLvlSW);
  };
  const drawBackTile = (
    p: { x: number; y: number; xoff: number; yoff: number },
  ) => {
    _drawTileBack(_ctx, p, currentlvl, color, diffLvlSE, diffLvlSW);
  };

  let offx = (gobalMapState.xf - gobalMapState.x) / _ctx.conf.SCALE_MOD;
  let offy = (gobalMapState.yf - gobalMapState.y) / _ctx.conf.SCALE_MOD;
  // offx = offx > 0 ? offx : 1 + offx;
  // offy = offy >= 0 ? offy : 1 + offy ;
  offx = 0.5 + offx / 2;
  offy = 0.5 + offy / 2;

  _ctx.canvasCtx.save();

  if (yy == 1) {
    drawFrontTile({ x: xx, y: yy, xoff: 0, yoff: offy });
    _ctx.canvasCtx.globalAlpha = 1 - offy;
  } else if (xx == 1) {
    drawFrontTile({ x: xx, y: yy, xoff: offx, yoff: 0 });
    _ctx.canvasCtx.globalAlpha = 1 - offx;
  } else if (yy == size - 2) {
    drawBackTile({ x: xx, y: yy, xoff: 0, yoff: 1 - offy });
    _ctx.canvasCtx.globalAlpha = offy;
  } else if (xx == size - 2) {
    drawBackTile({ x: xx, y: yy, xoff: 1 - offx, yoff: 0 });
    _ctx.canvasCtx.globalAlpha = offx;
  } else {
    _drawTileFloor(_ctx, xx, yy, currentlvl, color, diffLvlSE, diffLvlSW);
  }

  // _ctx.drawTileBase(metaTile, xx, yy, currentlvl, diffLvlSE, diffLvlSW);

  // ----------------------
  // ----------------------

  // 3. Collect Items/Entities for Display
  // Flatten entities items into the main list
  const entitiesItems = metaTile.entities.flatMap((x: any) => x.items);

  const items = [
    ...metaTile.items,
    ...metaTile.temporatyItems,
    ...entitiesItems,
  ];

  // ----------------------
  // Handle CityNode item
  if (metaTile.cityNode) {
    items.push({ t: "Svg", key: metaTile.cityNode.asset.key });
  }

  // ----------------------
  // Handle Box Node

  if (metaTile.itemsBox && _ctx.conf.SCALE_MOD == 1) {
    items.push({ t: "Svg", key: "statue_column_NE#C100_H60" });

    const dist_x = Math.abs((size / 2) - (xx + 1.5) + offx);
    const dist_y = Math.abs((size / 2) - (yy + 1.5) + offy);
    let dist_factor = 1 - Math.max(dist_x, dist_y) / (size / 2);
    dist_factor = dist_factor * dist_factor * dist_factor;
    dist_factor = dist_factor > .95 ? 1 : dist_factor;
    const p = _ctx.isoProject.tileToScreen(new PointIso(xx, yy, currentlvl));
    _ctx.currentDiplayBox.push({
      cardId: `tileCard_${metaTile.x}_${metaTile.y}`,
      x: p.x,
      y: p.y - 32,
      distance: dist_factor,
    });
  }

  // ----------------------
  // Handle CityNode item
  if (_ctx.conf.DRAW_TILE_COUNT <= 80) {
    // 4. Draw Each Item (Z-sorted locally)
    items
      .sort((a: any, b: any) => (a.lvl || 0) - (b.lvl || 0))
      .forEach((item: any) =>
        _drawTileItem(_ctx, xx, yy, metaTile, item, currentlvl)
      );
  }

  _ctx.canvasCtx.restore();
};
