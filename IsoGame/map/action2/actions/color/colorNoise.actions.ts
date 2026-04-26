/**
 * color/colorNoise.action.ts
 *
 * colorNoise       — adds a random per-channel tint to a single tile.
 * colorNoiseShape  — applies colorNoise across a shape.
 * colorSmoothShape — blends each tile's color toward the average of its neighbours.
 */

import { iterShape } from "../geometry.ts";
import { withShape, ShapeConfig, withLine } from "../withShape.ts";
import { BaseTileActionConfig, defineAction } from "../types.ts";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 255): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

function normaliseColor(color: number[] = [0, 0, 0, 255]): number[] {
  return color.length === 3 ? [...color, 255] : [...color];
}

/** Seeded cheap hash — deterministic per (x, y, seed) so previews are stable */
function tileRandom(x: number, y: number, seed: number): number {
  let h = seed ^ (x * 374761393) ^ (y * 668265263);
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 0xffffffff;
}

// ─── colorNoise config ────────────────────────────────────────────────────────

export type ColorNoiseConfig = BaseTileActionConfig & {
  /**
   * Base color to apply before adding noise.
   * If omitted the tile's existing color is used as the base.
   */
  color?: number[];
  /**
   * Maximum ± deviation per channel (R, G, B).
   * Defaults to 20 for all channels.
   */
  noiseAmp?: number | [number, number, number];
  /**
   * Optional seed for deterministic noise (handy for undo / redo stability).
   * Defaults to a random seed generated once at action call time.
   */
  seed?: number;
  /** Whether to affect the alpha channel. Default: false. */
  noisyAlpha?: boolean;
};

// ─── colorNoise (single tile) ─────────────────────────────────────────────────

export const colorNoise = defineAction<"colorNoise", ColorNoiseConfig>(
  "colorNoise",
  (conf, ctx) => {
    const tile = ctx.fm.getTile(conf.x, conf.y);
    const base = normaliseColor(conf.color ?? tile.color ?? [128, 128, 128, 255]);

    const seed = conf.seed ?? conf.x + conf.y;
    const amp  = conf.noiseAmp ?? 20;
    const [ar, ag, ab] = Array.isArray(amp) ? amp : [amp, amp, amp];

    // Three independent random values per tile
    const rr = (tileRandom(conf.x, conf.y, seed)       - 0.5) * 2 * ar;
    const rg = (tileRandom(conf.x, conf.y, seed + 1)   - 0.5) * 2 * ag;
    const rb = (tileRandom(conf.x, conf.y, seed + 2)   - 0.5) * 2 * ab;

    tile.color = [
      clamp(base[0] + rr),
      clamp(base[1] + rg),
      clamp(base[2] + rb),
      conf.noisyAlpha
        ? clamp(base[3] + (tileRandom(conf.x, conf.y, seed + 3) - 0.5) * 2 * 20)
        : base[3],
    ];
    ctx.listTilesUpdated.add(tile);
  },
);

// ─── colorNoiseShape (shape variant with full config inheritance) ──────────────

export type ColorNoiseShapeConfig = ColorNoiseConfig & ShapeConfig & {
  /**
   * If true, a fresh random seed is generated once and shared across all tiles,
   * so relative tile-to-tile variation is preserved but absolute values shift
   * each call. Default: true.
   */
  freshSeedPerCall?: boolean;
};

export const colorNoiseShape = withShape(colorNoise, "colorNoiseShape")
export const colorNoiseLine = withLine(colorNoise, "colorNoiseLine");


// ─── colorSmoothShape ─────────────────────────────────────────────────────────

export type ColorSmoothShapeConfig = BaseTileActionConfig & ShapeConfig & {
  /**
   * Radius of the neighbourhood used for the average (default: 1).
   * Larger values = stronger smoothing.
   */
  smoothRadius?: number;
  /**
   * Blend factor ∈ [0, 1].
   * 0 = no change, 1 = full neighbourhood average.
   * Default: 0.5.
   */
  strength?: number;
};

export const colorSmoothShape = defineAction<"colorSmoothShape", ColorSmoothShapeConfig>(
  "colorSmoothShape",
  (conf, ctx) => {
    const size         = conf.size         ?? 1;
    const shape        = conf.shape        ?? "square";
    const smoothRadius = conf.smoothRadius ?? 1;
    const strength     = conf.strength     ?? 0.5;

    // Snapshot colors BEFORE modifying anything to avoid order-dependency
    const snapshot = new Map<string, number[]>();
    for (const p of iterShape(conf.x, conf.y, size + smoothRadius, shape)) {
      const tile = ctx.fm.getTile(p.x, p.y);
      snapshot.set(`${p.x},${p.y}`, normaliseColor(tile.color));
    }

    for (const p of iterShape(conf.x, conf.y, size, shape)) {
      const tile = ctx.fm.getTile(p.x, p.y);
      const base = snapshot.get(`${p.x},${p.y}`) ?? normaliseColor(tile.color);

      // Collect neighbour colors from the snapshot
      let sr = 0, sg = 0, sb = 0, sa = 0, count = 0;
      for (const n of iterShape(p.x, p.y, smoothRadius, "circle")) {
        const nc = snapshot.get(`${n.x},${n.y}`);
        if (nc) { sr += nc[0]; sg += nc[1]; sb += nc[2]; sa += nc[3]; count++; }
      }

      if (count === 0) continue;

      const avgColor = [sr / count, sg / count, sb / count, sa / count];

      tile.color = [
        clamp(base[0] + (avgColor[0] - base[0]) * strength),
        clamp(base[1] + (avgColor[1] - base[1]) * strength),
        clamp(base[2] + (avgColor[2] - base[2]) * strength),
        clamp(base[3] + (avgColor[3] - base[3]) * strength),
      ];
      ctx.listTilesUpdated.add(tile);
    }
  },
);