/**
 * actionDrawSpawn.ts — rewritten with cmd + TileCommandBuilder + compass
 */

import { BaseTileActionConfig } from "../actions/types.ts";
import { cmd }                  from "../builder/cmd.ts";
import { TileCommandBuilder, GREY } from "../builder/tileCommandBuilder.ts";
import { compass, diagonals, cardinals } from "../builder/compass.ts";
import { assetFactory, ASSET_PRESETS }  from "../builder/assetKey.ts";
import { CompassDir } from "../builder/compass.ts";

// ─── Asset factories ──────────────────────────────────────────────────────────

const col   = assetFactory("columnLarge",        ASSET_PRESETS.STONE);
const fence = assetFactory("fence_planksDouble",  ASSET_PRESETS.STONE);
const crypt = assetFactory("crypt",               ASSET_PRESETS.STONE);

// Each cardinal arm maps to its isometric facing direction
const CARDINAL_DIRS: [CompassDir, CompassDir][] = [
  ["E", "NE"],
  ["W", "SW"],
  ["N", "NW"],
  ["S", "SE"],
];

// ─── Script ───────────────────────────────────────────────────────────────────

export function actionDrawSpawn(x: number, y: number): BaseTileActionConfig[] {
  const b  = new TileCommandBuilder();
  const c2 = compass(x, y, 2);

  // ── Ground prep
  b.push(
    cmd.clearItemSquare ({ x, y, size: 5 }),
    cmd.colorSquare     ({ x, y, size: 5, color: GREY }),
    cmd.lvlFlatSquare   ({ x, y, size: 5 }),
  );

  // ── Centre structure
  b.push(cmd.itemAddKey({ x, y, assetKey: crypt("NE") }));

  // ── Cardinal gates — fence + column + block
  for (const [cardDir, assetDir] of CARDINAL_DIRS) {
    const pt = c2[cardDir];
    b.push(
      cmd.itemAddKey  ({ ...pt, assetKey: fence(assetDir) }),
      cmd.itemAddKey  ({ ...pt, assetKey: col(assetDir)   }),
      cmd.setBlocked  ({ ...pt, isBlock: true             }),
    );
  }

  // ── Frise mask
  b.push(cmd.setFriseSquare({ x, y, size: 5, isFrise: true }));

  // corners at r=2 — not frised
  for (const pt of diagonals(x, y, 2)) {
    b.push(cmd.setFrise({ ...pt, isFrise: false }));
  }

  // cardinal outer edge tiles at r=3 — not frised
  for (const pt of cardinals(x, y, 3)) {
    b.push(cmd.setFrise({ ...pt, isFrise: false }));
  }

  // ── Terrain smoothing
  b.push(
    cmd.clearColorSquare ({ x, y, size: 25 }),
    cmd.lvlFlatSquare    ({ x, y, size: 55 }),
    cmd.lvlAvgBorder     ({ x, y, size: 55 }),
    cmd.lvlAvgBorder     ({ x, y, size: 55 }),
    cmd.lvlAvgBorder     ({ x, y, size: 55 }),
    cmd.lvlAvgBorder     ({ x, y, size: 55 }),
  );

  return b.build();

}