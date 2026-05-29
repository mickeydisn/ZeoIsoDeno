/**
 * lvlRamp.action.ts
 *
 * lvlRampShape — interpolates tile heights across a shape from `fromLvl`
 *               to `toLvl`, along an axis defined by a direction vector.
 */

import { iterShape } from "../../utils/geometry.ts";
import { BaseTileActionConfig, defineAction } from "../../utils/types.ts";
import { ShapeConfig } from "../../utils/withShape.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Projects point (px, py) onto the axis from (ax, ay) to (bx, by).
 * Returns t ∈ [0, 1] clamped.
 */
function projectOntoAxis(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq === 0) return 0;
  const t = ((px - ax) * vx + (py - ay) * vy) / lenSq;
  return Math.min(1, Math.max(0, t));
}

// ─── Config ───────────────────────────────────────────────────────────────────

export type LvlRampShapeConfig = BaseTileActionConfig & ShapeConfig & {
  /**
   * Height at the start of the ramp.
   * Defaults to the current height of the centre tile if omitted.
   */
  fromLvl?: number;

  /** Height at the far end of the ramp. Required. */
  toLvl: number;

  /**
   * Direction of the ramp as a unit-ish offset from centre.
   * { dx: 1, dy: 0 }  → left-to-right
   * { dx: 0, dy: 1 }  → top-to-bottom
   * { dx: 1, dy: 1 }  → diagonal
   * Defaults to { dx: 1, dy: 0 }.
   */
  dir?: { dx: number; dy: number };
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const lvlRampShape = defineAction<"lvlRampShape", LvlRampShapeConfig>(
  "lvlRampShape",
  (conf, ctx) => {
    const { x, y, toLvl } = conf;
    const size = conf.size;
    const shape = conf.shape ?? "square";
    const dir = conf.dir ?? { dx: 1, dy: 0 };

    // Use centre tile's current level as fromLvl if not provided
    const fromLvl = conf.fromLvl ?? ctx.fm.getTile(x, y).lvl;

    // Axis: extends from -dir*size to +dir*size through centre
    const ax = x - dir.dx * size;
    const ay = y - dir.dy * size;
    const bx = x + dir.dx * size;
    const by = y + dir.dy * size;

    for (const p of iterShape(x, y, size, shape)) {
      const t = projectOntoAxis(p.x, p.y, ax, ay, bx, by);
      const tile = ctx.fm.getTile(p.x, p.y);
      tile.lvl = lerp(fromLvl, toLvl, t);
      ctx.listTilesUpdated.add(tile);
    }
  },
  {
    label: "Level-Ramp",
    description: "Interpolates tile heights across a shape",
    fields: [
      {
        key: "fromLvl",
        type: "number",
        label: "Start Level",
        default: 0,
        min: 0,
        max: 255,
      },
      {
        key: "toLvl",
        type: "number",
        label: "End Level",
        default: 10,
        min: 0,
        max: 255,
      },
      {
        key: "size",
        type: "range",
        label: "Area Size",
        default: 5,
        min: 1,
        max: 41,
        step: 2,
      },
    ],
  },
);
