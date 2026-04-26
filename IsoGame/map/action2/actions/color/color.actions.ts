import { BaseTileActionConfig, defineAction } from "../types.ts";
import { withLine, withShape } from "../withShape.ts";

// ---------------------
// Config
// ---------------------

export type ColorConfig = BaseTileActionConfig & {
  color?: number[];  // [r, g, b] or [r, g, b, a]
  size?: number;
};

// ---------------------
// Shared helper: normalise a color tuple to always have an alpha channel
// ---------------------

function normaliseColor(color: number[] = [0, 0, 0, 255]): number[] {
  return color.length === 3 ? [...color, 255] : color;
}

// ---------------------
// color — sets the color of a single tile
// ---------------------

export const color = defineAction<"color", ColorConfig>(
  "color",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.color = normaliseColor(conf.color);
    ctx.listTilesUpdated.add(tile);
  },
);

// ---------------------
// colorSquare — sets the same color across an N×N square
// ---------------------

export const colorSquare = withShape(color, "colorSquare");
export const colorLine = withLine(color, "colorLine");

// ---------------------
// clearColor — resets the color of a single tile
// ---------------------

export const clearColor = defineAction<"clearColor", BaseTileActionConfig>(
  "clearColor",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    tile.clearColor();
    ctx.listTilesUpdated.add(tile);
  },
);

export const clearColorSquare = withShape(clearColor, "clearColorSquare");
