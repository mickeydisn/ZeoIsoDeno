/**
 * actionDrawDrownedTemple.ts
 *
 * Builds a sunken ancient temple using only lvl and color operations.
 *
 * Cross-section (E–W slice through centre):
 *
 *  approach  │foothills│  wall  │courtyard│  wall  │foothills│ approach
 *  flat +0   │ rise +2 │ peak+8 │ sink -3 │ peak+8 │ rise +2 │ flat +0
 *
 * Top-down layout (r = radius from centre):
 *
 *   r=55  approach     — flat terrain blend into map
 *   r=35  foothills    — gentle rise, earthy
 *   r=22  outer wall   — thick raised ring, grey stone
 *   r=14  courtyard    — sunken flat interior, mossy
 *   r=5   altar ring   — raised inner platform, dark stone
 *   r=2   altar top    — peak, radial gradient crown
 *
 *   + corner towers at the 4 diagonal compass points of the wall ring
 *   + gateway gaps cut into the wall at the 4 cardinal points
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder }   from "../builder/tileCommandBuilder.ts";
import { compass }              from "../builder/compass.ts";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  EARTH:        [105, 88,  65,  255] as number[],
  STONE:        [88,  85,  82,  255] as number[],
  DARK_STONE:   [62,  60,  58,  255] as number[],
  MOSSY_STONE:  [72,  82,  65,  255] as number[],
  ALTAR_BASE:   [55,  52,  50,  255] as number[],
  ALTAR_TOP:    [40,  38,  36,  255] as number[],
  RUNE_GLOW:    [80,  110, 90,  255] as number[],
};

// ─── Script ───────────────────────────────────────────────────────────────────

export function actionDrawDrownedTemple(
  x: number,
  y: number,
  baseLvl: number = 0,
): BaseTileActionConfig[] {
  const b = new TileCommandBuilder();

  // ── 1. Approach — wide flat earth base
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 55 }),
    cmd.colorSquare     ({ x, y, size: 55, color: C.EARTH }),
    cmd.colorNoiseShape ({ x, y, size: 55, shape: "square", color: C.EARTH, noiseAmp: 10 }),
  );

  // ── 2. Foothills — gentle rise toward the temple mound
  b.push(
    cmd.lvlGradientShape({ x, y, size: 35, shape: "circle", fromLvl: baseLvl + 3, toLvl: baseLvl }),
    cmd.colorSquare     ({ x, y, size: 35, color: C.STONE }),
    cmd.colorNoiseShape ({ x, y, size: 35, shape: "circle", color: C.STONE, noiseAmp: 8 }),
  );

  // ── 3. Outer wall — raised thick ring
  //    Paint the full wall disc first, then cut out the interior
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 22 }),
    cmd.lvlUpSquare     ({ x, y, size: 22, lvl: baseLvl + 8 }),
    cmd.colorSquare     ({ x, y, size: 22, color: C.STONE }),
    cmd.colorNoiseShape ({ x, y, size: 22, shape: "square", color: C.STONE, noiseAmp: [6, 5, 5] }),
  );

  // ── 4. Corner towers — taller, darker, at the 4 diagonal wall corners
  const towerRadius = 5;
  const towerOffset = 18; // distance from centre to tower centre
  const towers = compass(x, y, towerOffset);
  for (const pt of [towers.NE, towers.NW, towers.SE, towers.SW]) {
    b.push(
      cmd.lvlGradientShape({ ...pt, size: towerRadius, shape: "circle", fromLvl: baseLvl + 12, toLvl: baseLvl + 8 }),
      cmd.colorGradientShape({ ...pt, size: towerRadius, shape: "circle", fromColor: C.DARK_STONE, toColor: C.STONE }),
      cmd.colorNoiseShape ({ ...pt, size: towerRadius, shape: "circle", color: C.DARK_STONE, noiseAmp: 5 }),
    );
  }

  // ── 5. Gateway gaps — cut the wall down at the 4 cardinal midpoints
  //    Each gateway is a narrow notch (size 2) at wall level → courtyard level
  const gateOffset = 22;
  const gates = compass(x, y, gateOffset);
  for (const pt of [gates.N, gates.E, gates.S, gates.W]) {
    b.push(
      cmd.lvlFlatSquare ({ ...pt, size: 2 }),
      cmd.lvlUpSquare   ({ ...pt, size: 2, lvl: baseLvl + 1 }),
      cmd.colorSquare   ({ ...pt, size: 2, color: C.MOSSY_STONE }),
    );
  }

  // ── 6. Courtyard interior — sunken below ground, mossy
  b.push(
    cmd.lvlFlatSquare   ({ x, y, size: 14 }),
    cmd.lvlUpSquare     ({ x, y, size: 14, lvl: baseLvl - 3 }),
    cmd.colorSquare     ({ x, y, size: 14, color: C.MOSSY_STONE }),
    cmd.colorNoiseShape ({ x, y, size: 14, shape: "circle", color: C.MOSSY_STONE, noiseAmp: [5, 10, 5] }),
  );

  // ── 7. Altar ring — raised inner platform
  b.push(
    cmd.lvlGradientShape({ x, y, size: 5, shape: "circle", fromLvl: baseLvl + 4, toLvl: baseLvl - 1 }),
    cmd.colorGradientShape({ x, y, size: 5, shape: "circle", fromColor: C.ALTAR_BASE, toColor: C.MOSSY_STONE }),
    cmd.colorNoiseShape ({ x, y, size: 5, shape: "circle", color: C.ALTAR_BASE, noiseAmp: 4 }),
  );

  // ── 8. Altar top — peak with rune glow gradient
  b.push(
    cmd.lvlGradientShape  ({ x, y, size: 2, shape: "circle", fromLvl: baseLvl + 6, toLvl: baseLvl + 4 }),
    cmd.colorGradientShape({ x, y, size: 2, shape: "circle", fromColor: C.RUNE_GLOW, toColor: C.ALTAR_TOP }),
  );

  // ── 9. Smoothing — color transitions and terrain border blend
  b.push(
    cmd.colorSmoothShape({ x, y, size: 55, shape: "circle", smoothRadius: 2, strength: 0.3 }),
  );
  b.push(
    cmd.lvlSmoothBorder ({ x, y, size: 55, shape: "circle", avgRadius: 4 }),
    cmd.lvlSmoothBorder ({ x, y, size: 55, shape: "circle", avgRadius: 3 }),
    cmd.lvlAvgBorder    ({ x, y, size: 55 }),
    cmd.lvlAvgBorder    ({ x, y, size: 55 }),
  );

  return b.build();
}
