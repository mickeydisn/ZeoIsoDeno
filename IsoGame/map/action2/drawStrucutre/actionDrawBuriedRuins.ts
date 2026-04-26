/**
 * actionDrawBuriedRuins.ts
 *
 * A partially sunken square structure. Broken wall segments at cardinal
 * and diagonal positions, uneven interior floor, eroded corners.
 *
 *   approach   — flat earth blending in
 *   mound      — slight rise where the structure pushed up the ground
 *   wall ring  — fragmented square ring, thickness 1, lvl + wallLvl
 *   gaps       — missing wall segments (erosion) at random-ish positions
 *   interior   — uneven sunken floor with lvlNoiseShape
 *   rubble     — scattered higher points inside from collapsed walls
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";
import { compass }              from "../builder/compass.ts";

const C = {
  EARTH:       [100, 88,  65,  255] as number[],
  STONE:       [85,  82,  78,  255] as number[],
  DARK_STONE:  [60,  57,  54,  255] as number[],
  CRACKED:     [75,  70,  62,  255] as number[],
  RUBBLE:      [68,  65,  60,  255] as number[],
  INTERIOR:    [70,  65,  55,  255] as number[],
};

export type BuriedRuinsParams = {
  baseLvl?:  number;
  size?:     number;   // half-extent of the outer wall ring (default: 18)
  wallLvl?:  number;   // how high the wall sits above baseLvl (default: 3)
  depth?:    number;   // how far the interior is sunken below baseLvl (default: 2)
  erosion?:  number;   // 0–1 factor controlling how many wall segments are broken (default: 0.4)
};

export function actionDrawBuriedRuins(
  x: number,
  y: number,
  { baseLvl = 0, size = 18, wallLvl = 3, depth = 2, erosion = 0.4 }: BuriedRuinsParams = {},
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  const interiorSize = size - 1;

  // ── 1. Approach — wide flat earth mound
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: size + 15 }),
    cmd.colorSquare     ({ x, y, size: size + 15, color: C.EARTH }),
    cmd.colorNoiseShape ({ x, y, size: size + 15, shape: "square", color: C.EARTH, noiseAmp: 10 }),
  );

  // ── 2. Mound — slight rise where the buried structure pushed up ground
  b.push(
    cmd.lvlGradientShape({ x, y, size: size + 4, shape: "circle", fromLvl: baseLvl + 1, toLvl: baseLvl }),
    cmd.colorSquare     ({ x, y, size: size + 4, color: C.CRACKED }),
    cmd.colorNoiseShape ({ x, y, size: size + 4, shape: "circle", color: C.CRACKED, noiseAmp: 8 }),
  );

  // ── 3. Full wall disc — painted first, interior cut out after
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size }),
    cmd.lvlUpSquare     ({ x, y, size, lvl: baseLvl + wallLvl }),
    cmd.colorSquare     ({ x, y, size, color: C.STONE }),
    cmd.colorNoiseShape ({ x, y, size, shape: "square", color: C.STONE, noiseAmp: [7, 6, 5] }),
  );

  // ── 4. Interior — sunken, uneven floor
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: interiorSize }),
    cmd.lvlUpSquare     ({ x, y, size: interiorSize, lvl: baseLvl - depth }),
    cmd.colorSquare     ({ x, y, size: interiorSize, color: C.INTERIOR }),
    cmd.colorNoiseShape ({ x, y, size: interiorSize, shape: "square", color: C.INTERIOR, noiseAmp: [6, 5, 4] }),
  );

  // ── 5. Wall erosion gaps — break wall segments at compass positions
  //    erosion controls how many of the 8 compass positions are broken
  const wallPoints = compass(x, y, size);
  const allDirs = (["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const);

  // Deterministic erosion pattern based on position — not random so it's stable
  const brokenDirs = allDirs.filter((_, i) => {
    const hash = (x * 31 + y * 17 + i * 7) % 100;
    return hash < erosion * 100;
  });

  for (const dir of brokenDirs) {
    const pt = wallPoints[dir];
    b.push(
      cmd.lvlFlatSquare ({ ...pt, size: 1 }),
      cmd.lvlUpSquare   ({ ...pt, size: 1, lvl: baseLvl - 1 }),
      cmd.colorSquare   ({ ...pt, size: 1, color: C.RUBBLE }),
    );
  }

  // ── 6. Rubble inside — collapsed wall fragments, slightly raised points
  const rubblePoints = compass(x, y, Math.round(interiorSize * 0.6));
  const rubbleDirs = (["NE", "SW", "NW", "SE"] as const).filter((_, i) => {
    const hash = (x * 13 + y * 29 + i * 11) % 100;
    return hash < erosion * 80;
  });

  for (const dir of rubbleDirs) {
    const pt = rubblePoints[dir];
    b.push(
      cmd.lvlUpSquare   ({ ...pt, size: 1, lvl: baseLvl }),
      cmd.colorSquare   ({ ...pt, size: 1, color: C.DARK_STONE }),
      cmd.colorNoiseShape({ ...pt, size: 1, shape: "circle", color: C.DARK_STONE, noiseAmp: 6 }),
    );
  }

  // ── 7. Smoothing
  b.push(
    cmd.colorSmoothShape({ x, y, size: size + 6, shape: "circle", smoothRadius: 1, strength: 0.25 }),
    cmd.lvlSmoothBorder ({ x, y, size: size + 4, shape: "circle", avgRadius: 3 }),
    cmd.lvlAvgBorder    ({ x, y, size: size + 4 }),
    cmd.lvlAvgBorder    ({ x, y, size: size + 4 }),
  );

  return b.build();
}
