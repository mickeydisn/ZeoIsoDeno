/**
 * actionDrawCrevasse.ts
 *
 * A deep linear trench cut into terrain using withLine.
 * Steep lvl drop along the line, dark rock walls, smooth border on each side.
 *
 *   centre line  — deepest point, near-black rock
 *   wall sides   — lvlGradientShape perpendicular, dark basalt
 *   border       — smoothed back into surrounding terrain
 */

import { BaseTileActionConfig } from "../utils/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";

const C = {
  EARTH:       [100, 88, 68, 255] as number[],
  ROCK:        [80,  76, 72, 255] as number[],
  DARK_ROCK:   [52,  48, 45, 255] as number[],
  VOID:        [30,  28, 26, 255] as number[],
};

export type CrevasseParams = {
  baseLvl?:  number;
  depth?:    number;   // how far below baseLvl the floor drops
  tx:        number;   // target x — end point of the trench
  ty:        number;   // target y — end point of the trench
  width?:    number;   // half-thickness of the trench (default: 3)
};

export function actionDrawCrevasse(
  x: number,
  y: number,
  { baseLvl = 0, depth = 12, tx, ty, width = 3 }: CrevasseParams,
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  // ── 1. Flatten a wide band around the whole line into base terrain
  b.push(
    cmd.colorNoiseShape({ x, y, size: width + 8, shape: "circle", color: C.EARTH, noiseAmp: 10 }),
  );

  // ── 2. Wide color band along the line — rock starts here
  b.push(
    cmd.colorLine({ x, y, tx, ty, thickness: width + 4, color: C.ROCK }),
    cmd.colorNoise({ x, y, color: C.ROCK, noiseAmp: 8 }),
  );

  // ── 3. Wall sides — dark rock, lvl dips toward the trench centre
  b.push(
    cmd.lvlSetLine({ x, y, tx, ty, thickness: width, lvl: baseLvl - Math.floor(depth * 0.5) }),
    cmd.colorLine({ x, y, tx, ty, thickness: width, color: C.DARK_ROCK }),
    cmd.colorNoiseLine({ x, y, tx, ty, thickness: width, color: C.DARK_ROCK, noiseAmp: [6, 5, 4] }),
  );

  // ── 4. Trench floor — deepest point, near-black
  b.push(
    cmd.lvlSetLine({ x, y, tx, ty, thickness: 1, lvl: baseLvl - depth }),
    cmd.colorLine({ x, y, tx, ty, thickness: 1, color: C.VOID }),
    cmd.colorNoiseLine({ x, y, tx, ty, thickness: 1, color: C.VOID, noiseAmp: 5 }),
  );

  // ── 5. Smooth the border back into surrounding terrain
  b.push(
    cmd.colorSmoothShape({ x, y, size: width + 6, shape: "circle", smoothRadius: 2, strength: 0.35 }),
    cmd.lvlSmoothBorder ({ x, y, size: width + 4, shape: "circle", avgRadius: 3 }),
    cmd.lvlSmoothBorder ({ x, y, size: width + 4, shape: "circle", avgRadius: 2 }),
  );

  return b.build();
}
