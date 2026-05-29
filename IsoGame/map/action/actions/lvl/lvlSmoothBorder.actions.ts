/**
 * lvlSmoothBorder.action.ts
 *
 * Smooths the ring of tiles immediately outside a shape selection
 * by averaging each border tile against its circular neighbourhood.
 *
 * Useful after lvlFlatSquare / lvlRampShape to blend the edge
 * back into the surrounding terrain without touching the interior.
 */

import { iterShape } from "../../utils/geometry.ts";
import { BaseTileActionConfig, defineAction } from "../../utils/types.ts";
import { ShapeConfig } from "../../utils/withShape.ts";

// ─── Config ───────────────────────────────────────────────────────────────────

export type LvlSmoothBorderConfig = BaseTileActionConfig & ShapeConfig & {
  /**
   * Radius of the neighbourhood used for averaging each border tile.
   * Larger = smoother, but affects more surrounding terrain.
   * Default: 2.
   */
  avgRadius?: number;
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const lvlSmoothBorder = defineAction<
  "lvlSmoothBorder",
  LvlSmoothBorderConfig
>(
  "lvlSmoothBorder",
  (conf, ctx) => {
    const { x, y } = conf;
    const size = conf.size;
    const shape = conf.shape ?? "square";
    const avgRadius = conf.avgRadius ?? 2;

    // Build the inner shape footprint
    const inner = new Set<string>();
    for (const p of iterShape(x, y, size, shape)) {
      inner.add(`${p.x},${p.y}`);
    }

    // Expand by 1 to get the border ring (outer - inner)
    const border = new Set<string>();
    for (const p of iterShape(x, y, size + 1, shape)) {
      const k = `${p.x},${p.y}`;
      if (!inner.has(k)) border.add(k);
    }

    // Average each border tile against its circular neighbourhood.
    // Read-then-write: we snapshot lvl before writing to avoid
    // order-dependency between border tiles.
    const snapshot = new Map<string, number>();
    for (const k of border) {
      const [bx, by] = k.split(",").map(Number);
      snapshot.set(k, ctx.fm.getTile(bx, by).lvl);
    }
    // Also snapshot neighbourhood tiles that are outside the border
    for (const k of border) {
      const [bx, by] = k.split(",").map(Number);
      for (const n of iterShape(bx, by, avgRadius, "circle")) {
        const nk = `${n.x},${n.y}`;
        if (!snapshot.has(nk)) {
          snapshot.set(nk, ctx.fm.getTile(n.x, n.y).lvl);
        }
      }
    }

    // Write averaged values
    for (const k of border) {
      const [bx, by] = k.split(",").map(Number);
      let sum = 0, count = 0;
      for (const n of iterShape(bx, by, avgRadius, "circle")) {
        const nk = `${n.x},${n.y}`;
        const lvl = snapshot.get(nk);
        if (lvl !== undefined) {
          sum += lvl;
          count++;
        }
      }
      const tile = ctx.fm.getTile(bx, by);
      tile.lvl = count > 0 ? sum / count : tile.lvl;
      ctx.listTilesUpdated.add(tile);
    }
  },
  {
    label: "Level-Smooth-Border",
    description: "Smooths the ring around a shape selection",
    fields: [
      {
        key: "avgRadius",
        type: "number",
        label: "Average Radius",
        default: 2,
        min: 1,
        max: 10,
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
