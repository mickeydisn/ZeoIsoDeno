/**
 * actionDrawAncientCrater.ts
 *
 * An old eroded impact crater — flat worn rim, shallow bowl, overgrown.
 * No lava. Softer and more irregular than the volcanic crater.
 *
 *   approach    r=50  flat earth, wide blend
 *   rim         r=28  low eroded ring, lvl +rimHeight, mossy rock
 *   inner slope r=20  gentle drop from rim inward, dark earth
 *   bowl        r=10  shallow flat floor, overgrown green
 *   bowl centre r=4   slightly deeper, pooled dark earth
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";

const C = {
  EARTH:        [102, 88,  65,  255] as number[],
  MOSSY_ROCK:   [75,  85,  65,  255] as number[],
  DARK_EARTH:   [72,  62,  48,  255] as number[],
  OVERGROWN:    [68,  88,  58,  255] as number[],
  POOL:         [55,  65,  52,  255] as number[],
};

export type AncientCraterParams = {
  baseLvl?:   number;
  radius?:    number;   // outer rim radius (default: 28)
  rimHeight?: number;   // how much the rim rises above baseLvl (default: 4)
  bowlDepth?: number;   // how far below baseLvl the bowl floor sits (default: 3)
};

export function actionDrawAncientCrater(
  x: number,
  y: number,
  { baseLvl = 0, radius = 28, rimHeight = 4, bowlDepth = 3 }: AncientCraterParams = {},
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  const bowlR  = Math.round(radius * 0.36);  // ~10 at default
  const slopeR = Math.round(radius * 0.71);  // ~20 at default

  // ── 1. Approach — wide flat earth
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 50 }),
    cmd.colorSquare     ({ x, y, size: 50, color: C.EARTH }),
    cmd.colorNoiseShape ({ x, y, size: 50, shape: "square", color: C.EARTH, noiseAmp: 12 }),
  );

  // ── 2. Rim — low eroded ring, gradient from peak down to baseLvl at edge
  b.push(
    cmd.lvlGradientShape({ x, y, size: radius, shape: "circle", fromLvl: baseLvl, toLvl: baseLvl + rimHeight }),
    cmd.colorSquare     ({ x, y, size: radius, color: C.MOSSY_ROCK }),
    cmd.colorNoiseShape ({ x, y, size: radius, shape: "circle", color: C.MOSSY_ROCK, noiseAmp: [8, 12, 6] }),
  );

  // ── 3. Inner slope — drops from rim height toward bowl
  b.push(
    cmd.lvlGradientShape({ x, y, size: slopeR, shape: "circle", fromLvl: baseLvl - bowlDepth, toLvl: baseLvl + rimHeight }),
    cmd.colorSquare     ({ x, y, size: slopeR, color: C.DARK_EARTH }),
    cmd.colorNoiseShape ({ x, y, size: slopeR, shape: "circle", color: C.DARK_EARTH, noiseAmp: 10 }),
  );

  // ── 4. Bowl floor — flat, overgrown
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: bowlR }),
    cmd.lvlUpSquare     ({ x, y, size: bowlR, lvl: baseLvl - bowlDepth }),
    cmd.colorSquare     ({ x, y, size: bowlR, color: C.OVERGROWN }),
    cmd.colorNoiseShape ({ x, y, size: bowlR, shape: "circle", color: C.OVERGROWN, noiseAmp: [5, 12, 5] }),
  );

  // ── 5. Bowl centre — slightly deeper pool
  const centreR = Math.round(radius * 0.14);  // ~4 at default
  b.push(
    cmd.lvlFlatSquare     ({ x, y, size: centreR }),
    cmd.lvlUpSquare       ({ x, y, size: centreR, lvl: baseLvl - bowlDepth - 1 }),
    cmd.colorGradientShape({ x, y, size: centreR, shape: "circle", fromColor: C.POOL, toColor: C.OVERGROWN }),
  );

  // ── 6. Smoothing
  b.push(
    cmd.colorSmoothShape({ x, y, size: radius, shape: "circle", smoothRadius: 2, strength: 0.3 }),
    cmd.lvlSmoothBorder ({ x, y, size: radius, shape: "circle", avgRadius: 4 }),
    cmd.lvlSmoothBorder ({ x, y, size: radius, shape: "circle", avgRadius: 3 }),
    cmd.lvlAvgBorder    ({ x, y, size: radius }),
    cmd.lvlAvgBorder    ({ x, y, size: radius }),
  );

  return b.build();
}
