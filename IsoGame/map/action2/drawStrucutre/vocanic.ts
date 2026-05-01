/**
 * actionDrawVolcanicCrater.ts
 *
 * Builds a volcanic crater using only lvl and color operations.
 *
 * Structure (from outside in):
 *
 *   [  approach  ] flat terrain, blends into map        r = 80
 *   [  foothills ] slight rise, sandy/rocky color       r = 40
 *   [  outer rim ] peak elevation ring, grey rock       r = 26
 *   [  inner wall] steep drop inward, dark basalt       r = 18
 *   [  inner rim ] secondary raised lip, scorched rock  r = 12
 *   [  crater pit] low and flat, deep red lava floor    r =  6
 *   [  lava core ] dead flat, brightest orange/red      r =  2
 */

import { BaseTileActionConfig } from "../utils/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder } from "../builder/tileCommandBuilder.ts";
// ─── Color palette ────────────────────────────────────────────────────────────

const C = {
  // Terrain
  GROUND:       [110, 95,  70,  255] as number[],   // sandy earth
  ROCK:         [90,  85,  80,  255] as number[],   // grey rock
  DARK_BASALT:  [55,  50,  48,  255] as number[],   // scorched dark rock
  SCORCHED:     [70,  55,  45,  255] as number[],   // burnt rock
  // Lava
  LAVA_DEEP:    [180, 30,  10,  255] as number[],   // deep red magma
  LAVA_MID:     [210, 80,  10,  255] as number[],   // orange lava
  LAVA_BRIGHT:  [240, 140, 20,  255] as number[],   // bright lava core
};

// ─── Script ───────────────────────────────────────────────────────────────────

export function actionDrawVolcanicCrater(
  x: number,
  y: number,
  baseLvl: number = 0,
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  // ── 1. Approach — flatten a wide area to base level, sandy ground color
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 80 }),
    cmd.colorSquare      ({ x, y, size: 80, color: C.GROUND }),
    cmd.colorNoiseShape  ({ x, y, size: 80, shape: "circle", color: C.GROUND, noiseAmp: 12 }),
  );

  // ── 2. Foothills — gentle rise, rocky color starts here
  b.push(
    cmd.lvlRampShape     ({ x, y, size: 40, shape: "circle", fromLvl: baseLvl, toLvl: baseLvl + 4, dir: { dx: 0, dy: 0 } }),
    cmd.colorSquare      ({ x, y, size: 40, color: C.ROCK }),
    cmd.colorNoiseShape  ({ x, y, size: 40, shape: "circle", color: C.ROCK, noiseAmp: 15 }),
  );

  // ── 3. Outer rim — peak elevation ring
  //    We raise the full rim area then flatten inward on the next step
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 26 }),
    cmd.colorSquare      ({ x, y, size: 26, color: C.ROCK }),
  );

  // Raise rim to peak
  b.push(
    cmd.lvlUpSquare      ({ x, y, size: 26, lvl: baseLvl + 14 }),
  );

  // Apply rim color with noise
  b.push(
    cmd.colorNoiseShape  ({ x, y, size: 26, shape: "circle", color: C.ROCK, noiseAmp: [8, 6, 5] }),
  );

  // ── 4. Inner wall — drops steeply from rim down toward crater
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 18 }),
    cmd.lvlUpSquare      ({ x, y, size: 18, lvl: baseLvl + 8 }),
    cmd.colorSquare      ({ x, y, size: 18, color: C.DARK_BASALT }),
    cmd.colorNoiseShape  ({ x, y, size: 18, shape: "circle", color: C.DARK_BASALT, noiseAmp: 10 }),
  );

  // ── 5. Inner rim — secondary raised lip before the drop to lava
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 12 }),
    cmd.lvlUpSquare      ({ x, y, size: 12, lvl: baseLvl + 10 }),
    cmd.colorSquare      ({ x, y, size: 12, color: C.SCORCHED }),
    cmd.colorNoiseShape  ({ x, y, size: 12, shape: "circle", color: C.SCORCHED, noiseAmp: 12 }),
  );

  // ── 6. Crater pit — sunken flat floor, deep red lava
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 6 }),
    cmd.lvlUpSquare      ({ x, y, size: 6, lvl: baseLvl + 2 }),
    cmd.colorSquare      ({ x, y, size: 6, color: C.LAVA_DEEP }),
    cmd.colorNoiseShape  ({ x, y, size: 6, shape: "circle", color: C.LAVA_DEEP, noiseAmp: [20, 10, 5] }),
  );

  // ── 7. Lava core — dead flat, brightest point
  b.push(
    cmd.lvlFlatSquare    ({ x, y, size: 2 }),
    cmd.lvlUpSquare      ({ x, y, size: 2, lvl: baseLvl + 1 }),
    cmd.colorSquare      ({ x, y, size: 2, color: C.LAVA_BRIGHT }),
    cmd.colorNoiseShape  ({ x, y, size: 2, shape: "circle", color: C.LAVA_BRIGHT, noiseAmp: [15, 20, 5] }),
  );

  // ── 8. Smoothing passes
  //    Color: blend each zone transition naturally
  b.push(
    cmd.colorSmoothShape ({ x, y, size: 80, shape: "circle", smoothRadius: 2, strength: 0.4 }),
    cmd.colorSmoothShape ({ x, y, size: 80, shape: "circle", smoothRadius: 1, strength: 0.3 }),
  );

  //    Lvl: smooth only the outer border so it blends cleanly into the map
  b.push(
    cmd.lvlSmoothBorder  ({ x, y, size: 80, shape: "circle", avgRadius: 4 }),
    cmd.lvlSmoothBorder  ({ x, y, size: 80, shape: "circle", avgRadius: 3 }),
    cmd.lvlAvgBorder     ({ x, y, size: 80 }),
    cmd.lvlAvgBorder     ({ x, y, size: 80 }),
  );

  return b.build();
}