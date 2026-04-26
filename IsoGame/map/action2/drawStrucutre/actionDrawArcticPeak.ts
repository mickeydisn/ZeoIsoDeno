/**
 * actionDrawArcticPeak.ts
 *
 * A tall sharp mountain peak. Diamond shape for angular silhouette.
 * White-blue color gradient from summit down to tundra grey at the base.
 * Steep lvl falloff, smooth border blending into flat surroundings.
 *
 *   approach  r=50  flat tundra, grey-brown
 *   foothills r=30  gentle rise, cold grey rock
 *   slopes    r=18  steep rise, blue-grey ice rock
 *   snowline  r=8   near-white, heavy snow
 *   summit    r=2   pure white peak, gradient crown
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";

const C = {
  TUNDRA:      [88,  84,  76,  255] as number[],
  COLD_ROCK:   [78,  82,  88,  255] as number[],
  ICE_ROCK:    [90,  98,  110, 255] as number[],
  SNOW:        [185, 195, 210, 255] as number[],
  SUMMIT:      [230, 238, 248, 255] as number[],
};

export type ArcticPeakParams = {
  baseLvl?:  number;
  peakLvl?:  number;   // height of the summit above baseLvl (default: 30)
  radius?:   number;   // outer radius of the mountain base (default: 30)
};

export function actionDrawArcticPeak(
  x: number,
  y: number,
  { baseLvl = 0, peakLvl = 30, radius = 30 }: ArcticPeakParams = {},
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  const snowlineR = Math.round(radius * 0.27);  // ~8 at default
  const slopeR    = Math.round(radius * 0.60);  // ~18 at default
  const hillR     = Math.round(radius * 1.0);   // = radius

  // ── 1. Approach — wide flat tundra
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 50 }),
    cmd.colorSquare     ({ x, y, size: 50, color: C.TUNDRA }),
    cmd.colorNoiseShape ({ x, y, size: 50, shape: "square", color: C.TUNDRA, noiseAmp: 8 }),
  );

  // ── 2. Mountain base — diamond shape, gradient rise from edge to peak
  b.push(
    cmd.lvlGradientShape({ x, y, size: hillR, shape: "diamond", fromLvl: baseLvl + peakLvl, toLvl: baseLvl }),
    cmd.colorSquare     ({ x, y, size: hillR, color: C.COLD_ROCK }),
    cmd.colorNoiseShape ({ x, y, size: hillR, shape: "diamond", color: C.COLD_ROCK, noiseAmp: 10 }),
  );

  // ── 3. Mid slopes — blue-grey ice rock
  b.push(
    cmd.colorGradientShape({ x, y, size: slopeR, shape: "diamond", fromColor: C.ICE_ROCK, toColor: C.COLD_ROCK }),
    cmd.colorNoiseShape   ({ x, y, size: slopeR, shape: "diamond", color: C.ICE_ROCK, noiseAmp: [5, 6, 8] }),
  );

  // ── 4. Snowline — near-white, heavy snow coverage
  b.push(
    cmd.colorGradientShape({ x, y, size: snowlineR, shape: "circle", fromColor: C.SNOW, toColor: C.ICE_ROCK }),
    cmd.colorNoiseShape   ({ x, y, size: snowlineR, shape: "circle", color: C.SNOW, noiseAmp: [6, 8, 10] }),
  );

  // ── 5. Summit crown — pure white gradient peak
  const summitR = Math.round(radius * 0.07);  // ~2 at default
  b.push(
    cmd.colorGradientShape({ x, y, size: summitR, shape: "circle", fromColor: C.SUMMIT, toColor: C.SNOW }),
  );

  // ── 6. Smoothing — gentle color blend, strong terrain border blend
  b.push(
    cmd.colorSmoothShape({ x, y, size: hillR,  shape: "diamond", smoothRadius: 2, strength: 0.25 }),
    cmd.lvlSmoothBorder ({ x, y, size: hillR,  shape: "diamond", avgRadius: 5 }),
    cmd.lvlSmoothBorder ({ x, y, size: hillR,  shape: "diamond", avgRadius: 4 }),
    cmd.lvlAvgBorder    ({ x, y, size: hillR }),
    cmd.lvlAvgBorder    ({ x, y, size: hillR }),
    cmd.lvlAvgBorder    ({ x, y, size: hillR }),
  );

  return b.build();
}
