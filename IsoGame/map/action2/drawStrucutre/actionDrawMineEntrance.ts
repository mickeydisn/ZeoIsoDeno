/**
 * actionDrawMineEntrance.ts
 *
 * A small sunken pit with a ramp descending into it on one side.
 * Dark interior, wooden-support color hints, rough rock walls.
 *
 *   approach    — flat earth, slightly disturbed
 *   spoil mound — excavated earth piled around the pit edges
 *   pit walls   — dark rock, steep lvl drop
 *   pit floor   — flat, very dark, deepest point
 *   ramp        — lvlRampShape on one side, descending into the pit
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";
import { compass }              from "../builder/compass.ts";

const C = {
  EARTH:      [98,  84,  62,  255] as number[],
  SPOIL:      [82,  70,  50,  255] as number[],
  ROCK_WALL:  [60,  56,  52,  255] as number[],
  DARK_ROCK:  [42,  38,  35,  255] as number[],
  PIT_FLOOR:  [28,  25,  22,  255] as number[],
  RAMP:       [70,  62,  50,  255] as number[],
};

// Ramp direction presets — which side the ramp descends from
export type RampDir = "N" | "S" | "E" | "W";

const RAMP_DIR_VECTORS: Record<RampDir, { dx: number; dy: number }> = {
  N: { dx:  0, dy: -1 },
  S: { dx:  0, dy:  1 },
  E: { dx:  1, dy:  0 },
  W: { dx: -1, dy:  0 },
};

export type MineEntranceParams = {
  baseLvl?:  number;
  size?:     number;    // half-extent of the pit (default: 6)
  depth?:    number;    // how far below baseLvl the pit floor sits (default: 8)
  rampDir?:  RampDir;  // which side the ramp descends from (default: "S")
};

export function actionDrawMineEntrance(
  x: number,
  y: number,
  { baseLvl = 0, size = 6, depth = 8, rampDir = "S" }: MineEntranceParams = {},
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  const dir    = RAMP_DIR_VECTORS[rampDir];
  const rampPt = compass(x, y, size)[rampDir];

  // ── 1. Approach — flat earth, wide area
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: size + 14 }),
    cmd.colorSquare     ({ x, y, size: size + 14, color: C.EARTH }),
    cmd.colorNoiseShape ({ x, y, size: size + 14, shape: "square", color: C.EARTH, noiseAmp: 10 }),
  );

  // ── 2. Spoil mound — excavated earth piled around the pit
  b.push(
    cmd.lvlGradientShape({ x, y, size: size + 5, shape: "circle", fromLvl: baseLvl, toLvl: baseLvl + 2 }),
    cmd.colorSquare     ({ x, y, size: size + 5, color: C.SPOIL }),
    cmd.colorNoiseShape ({ x, y, size: size + 5, shape: "circle", color: C.SPOIL, noiseAmp: 12 }),
  );

  // ── 3. Pit walls — steep dark rock gradient from baseLvl down
  b.push(
    cmd.lvlGradientShape({ x, y, size, shape: "square", fromLvl: baseLvl - depth, toLvl: baseLvl }),
    cmd.colorSquare     ({ x, y, size, color: C.ROCK_WALL }),
    cmd.colorNoiseShape ({ x, y, size, shape: "square", color: C.ROCK_WALL, noiseAmp: [7, 6, 5] }),
  );

  // ── 4. Pit floor — flat, very dark
  const floorSize = Math.max(1, size - 2);
  b.push(
    cmd.lvlFlatSquare     ({ x, y, size: floorSize }),
    cmd.lvlUpSquare       ({ x, y, size: floorSize, lvl: baseLvl - depth }),
    cmd.colorGradientShape({ x, y, size: floorSize, shape: "circle", fromColor: C.PIT_FLOOR, toColor: C.DARK_ROCK }),
    cmd.colorNoiseShape   ({ x, y, size: floorSize, shape: "circle", color: C.PIT_FLOOR, noiseAmp: 5 }),
  );

  // ── 5. Ramp — lvlRampShape on the chosen side descending into pit
  //    Positioned at the wall, angled so it bridges baseLvl → pit floor
  b.push(
    cmd.lvlRampShape({ ...rampPt, size: size, shape: "square", fromLvl: baseLvl, toLvl: baseLvl - depth, dir }),
    cmd.colorSquare ({ ...rampPt, size: 2, color: C.RAMP }),
    cmd.colorNoiseShape({ ...rampPt, size: 2, shape: "circle", color: C.RAMP, noiseAmp: 8 }),
  );

  // ── 6. Smoothing — tight, we want the pit edges to stay sharp
  b.push(
    cmd.colorSmoothShape({ x, y, size: size + 6, shape: "circle", smoothRadius: 1, strength: 0.2 }),
    cmd.lvlSmoothBorder ({ x, y, size: size + 4, shape: "circle", avgRadius: 3 }),
    cmd.lvlAvgBorder    ({ x, y, size: size + 4 }),
  );

  return b.build();
}
