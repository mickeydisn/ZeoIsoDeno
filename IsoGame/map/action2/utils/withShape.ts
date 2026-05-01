/**
 * withShape.ts
 * Applies a single-tile action to every tile in a shape (square | diamond | circle).
 * withLine applies a single-tile action along a Bresenham line with thickness.
 */

import { iterShape, bresenham, Shape, Point } from "./geometry.ts";
import { ActionContext, BaseTileActionConfig, TileAction, defineAction } from "./types.ts";

// ─── Shared config fields ─────────────────────────────────────────────────────

export type ShapeConfig = {
  size: number;
  shape?: Shape;
};

export type LineConfig = {
  tx: number;
  ty: number;
  thickness?: number;
};

// ─── withShape ────────────────────────────────────────────────────────────────

/**
 * K  — literal key of the generated action
 * C  — base single-tile config
 * S  — extended shape config (C + ShapeConfig + any extra fields)
 */
export function withShape<
  K extends string,
  C extends BaseTileActionConfig,
  S extends C & ShapeConfig = C & ShapeConfig,
>(
  base: TileAction<string, C>,
  keyOrOverride: K,
): TileAction<K, S> {
  return defineAction<K, S>(keyOrOverride, (conf, ctx) => {
    const size  = conf.size  ?? 1;
    const shape = conf.shape ?? "square";
    const points = [...iterShape(conf.x, conf.y, size, shape)];

    for (const p of points) {
      base.execute({ ...conf, x: p.x, y: p.y }, ctx);
    }
  });
}

// ─── withLine ────────────────────────────────────────────────────────────────

export function withLine<
  K extends string,
  C extends BaseTileActionConfig,
  L extends C & LineConfig = C & LineConfig,
>(
  base: TileAction<string, C>,
  keyOrOverride?: K ,
): TileAction<K, L> {
  const key: K = keyOrOverride as K;
  return defineAction<K, L>(key, (conf, ctx) => {
    const thickness = conf.thickness ?? 1;
    const seen = new Set<string>();
    const points: Point[] = [];

    for (const spine of bresenham(conf.x, conf.y, conf.tx, conf.ty)) {
      for (const p of iterShape(spine.x, spine.y, thickness - 1, "circle")) {
        const k = `${p.x},${p.y}`;
        if (!seen.has(k)) {
          seen.add(k);
          points.push(p);
        }
      }
    }
    for (const p of points) {
      base.execute({ ...conf, x: p.x, y: p.y }, ctx);
    }
  });
}