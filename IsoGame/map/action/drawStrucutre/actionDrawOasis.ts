/**
 * actionDrawOasis.ts
 *
 * A sunken circle below baseLvl. Blue-green color gradient at the centre
 * (water), sandy color ring outward (wet sand → dry sand), smooth border.
 *
 *   approach  r=40  flat dry sand, warm beige
 *   wet sand  r=radius  damp sandy ring, color gradient to water
 *   water     r=waterR  blue-green radial gradient, deepest at centre
 *   deep pool r=2   darkest water point
 */

import { BaseTileActionConfig } from "../utils/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";

const C = {
  DRY_SAND:   [195, 172, 112, 255] as number[],
  WET_SAND:   [158, 138, 88,  255] as number[],
  DAMP_EDGE:  [120, 130, 90,  255] as number[],
  SHALLOWS:   [78,  138, 118, 255] as number[],
  WATER:      [45,  105, 115, 255] as number[],
  DEEP:       [28,  72,  92,  255] as number[],
};

export type OasisParams = {
  baseLvl?: number;
  depth?:   number;   // how far below baseLvl the water floor sits (default: 5)
  radius?:  number;   // outer radius of the oasis including wet sand ring (default: 20)
};

export function actionDrawOasis(
  x: number,
  y: number,
  { baseLvl = 0, depth = 5, radius = 20 }: OasisParams = {},
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  const waterR = Math.round(radius * 0.6);
  const deepR  = Math.round(radius * 0.15);

  // ── 1. Approach — flat dry sand
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 40 }),
    cmd.colorSquare     ({ x, y, size: 40, color: C.DRY_SAND }),
    cmd.colorNoiseShape ({ x, y, size: 40, shape: "square", color: C.DRY_SAND, noiseAmp: [15, 12, 8] }),
  );

  // ── 2. Wet sand ring — color gradient from damp edge to dry, slight lvl dip
  b.push(
    cmd.lvlGradientShape  ({ x, y, size: radius, shape: "circle", fromLvl: baseLvl - 1, toLvl: baseLvl }),
    cmd.colorGradientShape({ x, y, size: radius, shape: "circle", fromColor: C.DAMP_EDGE, toColor: C.WET_SAND }),
    cmd.colorNoiseShape   ({ x, y, size: radius, shape: "circle", color: C.WET_SAND, noiseAmp: [12, 10, 6] }),
  );

  // ── 3. Water — sunken bowl, blue-green gradient from shallows to deep
  b.push(
    cmd.lvlGradientShape  ({ x, y, size: waterR, shape: "circle", fromLvl: baseLvl - depth, toLvl: baseLvl - 1 }),
    cmd.colorGradientShape({ x, y, size: waterR, shape: "circle", fromColor: C.WATER, toColor: C.SHALLOWS }),
    cmd.colorNoiseShape   ({ x, y, size: waterR, shape: "circle", color: C.WATER, noiseAmp: [5, 8, 10] }),
  );

  // ── 4. Deep pool centre — darkest, flattest
  b.push(
    cmd.lvlFlatSquare     ({ x, y, size: deepR }),
    cmd.lvlUpSquare       ({ x, y, size: deepR, lvl: baseLvl - depth }),
    cmd.colorGradientShape({ x, y, size: deepR, shape: "circle", fromColor: C.DEEP, toColor: C.WATER }),
  );

  // ── 5. Smoothing
  b.push(
    cmd.colorSmoothShape({ x, y, size: radius, shape: "circle", smoothRadius: 2, strength: 0.35 }),
    cmd.lvlSmoothBorder ({ x, y, size: radius, shape: "circle", avgRadius: 3 }),
    cmd.lvlSmoothBorder ({ x, y, size: radius, shape: "circle", avgRadius: 2 }),
    cmd.lvlAvgBorder    ({ x, y, size: radius }),
    cmd.lvlAvgBorder    ({ x, y, size: radius }),
  );

  return b.build();
}
