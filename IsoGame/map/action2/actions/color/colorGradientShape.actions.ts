/**
 * gradientShape.actions.ts
 *
 * Radial gradient actions — interpolate a value from the centre of a shape
 * outward to its edge, using Euclidean distance normalised to [0, 1].
 *
 *   colorGradientShape — blends from `fromColor` (centre) to `toColor` (edge)
 *   lvlGradientShape   — blends from `fromLvl`  (centre) to `toLvl`   (edge)
 *
 * t = 0 at centre tile, t = 1 at the furthest tile in the shape.
 * Shape and size work identically to all other shape actions.
 */

import { iterShape } from "../../utils/geometry.ts";
import { BaseTileActionConfig, defineAction } from "../../utils/types.ts";
import { ShapeConfig } from "../../utils/withShape.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo = 0, hi = 255): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/**
 * Normalised radial distance from (cx, cy) for point (px, py)
 * within a shape of given size. Returns t ∈ [0, 1].
 *
 * Uses Euclidean distance regardless of shape — the shape only
 * controls which tiles are included, not how t is computed.
 * This gives a natural circular gradient even inside a square selection.
 */
function radialT(
  px: number, py: number,
  cx: number, cy: number,
  size: number,
): number {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return size === 0 ? 0 : Math.min(1, dist / size);
}

// ─── colorGradientShape ───────────────────────────────────────────────────────

export type ColorGradientShapeConfig = BaseTileActionConfig & ShapeConfig & {
  /** Color at the centre of the shape. Required. */
  fromColor: number[];
  /** Color at the edge of the shape. Required. */
  toColor: number[];
};

export const colorGradientShape = defineAction<"colorGradientShape", ColorGradientShapeConfig>(
  "colorGradientShape",
  (conf, ctx) => {
    const { x, y, fromColor, toColor } = conf;
    const size  = conf.size;
    const shape = conf.shape ?? "square";

    // Normalise both colors to RGBA
    const from = fromColor.length === 3 ? [...fromColor, 255] : [...fromColor];
    const to   = toColor.length   === 3 ? [...toColor,   255] : [...toColor];

    for (const p of iterShape(x, y, size, shape)) {
      const t    = radialT(p.x, p.y, x, y, size);
      const tile = ctx.fm.getTile(p.x, p.y);
      tile.color = [
        clamp(lerp(from[0], to[0], t)),
        clamp(lerp(from[1], to[1], t)),
        clamp(lerp(from[2], to[2], t)),
        clamp(lerp(from[3], to[3], t)),
      ];
      ctx.listTilesUpdated.add(tile);
    }
  },
  {
    label: "Color Gradient",
    description: "Blends from a centre color outward to an edge color",
    fields: [
      { key: "fromColor", type: "color", label: "Centre Color", default: [255, 255, 255] },
      { key: "toColor", type: "color", label: "Edge Color", default: [0, 0, 0] },
      { key: "size", type: "range", label: "Area Size", default: 5, min: 1, max: 41, step: 2 },
    ],
  },
);

// ─── lvlGradientShape ─────────────────────────────────────────────────────────

export type LvlGradientShapeConfig = BaseTileActionConfig & ShapeConfig & {
  /** Level at the centre of the shape. Required. */
  fromLvl: number;
  /** Level at the edge of the shape. Required. */
  toLvl: number;
};

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
