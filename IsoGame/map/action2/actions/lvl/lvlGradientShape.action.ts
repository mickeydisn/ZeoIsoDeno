/**
 * lvlGradientShape.action.ts
 *
 * Interpolates tile heights radially from the centre of a shape outward.
 * t = 0 at centre (fromLvl), t = 1 at the edge (toLvl).
 *
 * Uses Euclidean distance regardless of shape — shape controls which tiles
 * are included, not how t flows. Natural circular gradient in all cases.
 *
 * @example — dome hill
 *   cmd.lvlGradientShape({ x, y, size: 20, shape: "circle", fromLvl: 10, toLvl: 0 })
 *
 * @example — sunken bowl
 *   cmd.lvlGradientShape({ x, y, size: 15, shape: "circle", fromLvl: -5, toLvl: 0 })
 *
 * @example — diamond mountain
 *   cmd.lvlGradientShape({ x, y, size: 30, shape: "diamond", fromLvl: 25, toLvl: 0 })
 */

import { iterShape } from "../geometry.ts";
import { BaseTileActionConfig, defineAction } from "../types.ts";
import { ShapeConfig } from "../withShape.ts";

// ─── Config ───────────────────────────────────────────────────────────────────

export type LvlGradientShapeConfig = BaseTileActionConfig & ShapeConfig & {
  /** Level at the centre of the shape (t = 0). Required. */
  fromLvl: number;
  /** Level at the edge of the shape (t = 1). Required. */
  toLvl: number;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Euclidean distance from (cx, cy) to (px, py), normalised to [0, 1]
 * by dividing by size. Clamped so edge tiles land exactly at t = 1.
 */
function radialT(
  px: number, py: number,
  cx: number, cy: number,
  size: number,
): number {
  const dx = px - cx;
  const dy = py - cy;
  return Math.min(1, Math.sqrt(dx * dx + dy * dy) / size);
}

// ─── Action ───────────────────────────────────────────────────────────────────

export const lvlGradientShape = defineAction<"lvlGradientShape", LvlGradientShapeConfig>(
  "lvlGradientShape",
  (conf, ctx) => {
    const { x, y, fromLvl, toLvl } = conf;
    const size  = conf.size;
    const shape = conf.shape ?? "square";

    for (const p of iterShape(x, y, size, shape)) {
      const t    = radialT(p.x, p.y, x, y, size);
      const tile = ctx.fm.getTile(p.x, p.y);
      tile.lvl   = lerp(fromLvl, toLvl, t);
      ctx.listTilesUpdated.add(tile);
    }
  },
);
