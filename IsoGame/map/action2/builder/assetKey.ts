/**
 * assetKey.ts
 * Typed asset key construction — no more stringly-typed asset names.
 *
 * Asset key format: "{name}_{dir}#_{params}"
 * e.g. "columnLarge_NE#_C110_S40_B90"
 */

import { CompassDir } from "./compass.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetDir = CompassDir | "ALL";

export type AssetParams = {
  /** Color / hue shift  (0–360) */
  C?: number;
  /** Saturation        (0–100) */
  S?: number;
  /** Brightness        (0–100) */
  B?: number;
};

// ─── Default presets ──────────────────────────────────────────────────────────

export const ASSET_PRESETS = {
  STONE:  { C: 110, S: 40,  B: 90  } satisfies AssetParams,
  WOOD:   { C: 30,  S: 60,  B: 80  } satisfies AssetParams,
  DARK:   { C: 200, S: 20,  B: 50  } satisfies AssetParams,
  BRIGHT: { C: 60,  S: 80,  B: 120 } satisfies AssetParams,
} as const;

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Constructs a typed asset key string.
 *
 * @example
 * asset("columnLarge", "NE", ASSET_PRESETS.STONE)
 * // → "columnLarge_NE#_C110_S40_B90"
 *
 * asset("crypt", "NE", { C: 110, S: 40, B: 90 })
 * // → "crypt_NE#_C110_S40_B90"
 */
export function asset(
  name: string,
  dir: AssetDir,
  params?: AssetParams,
): string {
  const dirPart = `_${dir}#`;
  if (!params) return `${name}${dirPart}`;

  const paramParts: string[] = [];
  if (params.C !== undefined) paramParts.push(`C${params.C}`);
  if (params.S !== undefined) paramParts.push(`S${params.S}`);
  if (params.B !== undefined) paramParts.push(`B${params.B}`);

  return paramParts.length > 0
    ? `${name}${dirPart}_${paramParts.join("_")}`
    : `${name}${dirPart}`;
}

/**
 * Partially applies params, returning a factory for a given asset name.
 * Useful when the same asset appears in many directions.
 *
 * @example
 * const col   = assetFactory("columnLarge",       ASSET_PRESETS.STONE);
 * const fence = assetFactory("fence_planksDouble", ASSET_PRESETS.STONE);
 *
 * col("NE")   // → "columnLarge_NE#_C110_S40_B90"
 * fence("SW") // → "fence_planksDouble_SW#_C110_S40_B90"
 */
export function assetFactory(
  name: string,
  params?: AssetParams,
): (dir: AssetDir) => string {
  return (dir) => asset(name, dir, params);
}