/**
 * Config Sanitizer — Fix Common Building Configuration Issues
 *
 * Provides utilities to sanitize and repair building configurations before
 * saving or loading. This separates fix/repair logic from validation/checking
 * logic in the validation module.
 */

import type { BuildingConfig } from "./types.ts";

/**
 * Sanitize a BuildingConfig by fixing common issues.
 * This can be applied before saving or loading to improve config validity.
 *
 * @param config - The config to sanitize
 * @returns The sanitized config (mutates original)
 */
export function sanitizeBuildingConfig(config: BuildingConfig): BuildingConfig {
  // Ensure face arrays are valid
  if (config.tiles) {
    config.tiles = config.tiles.map((tile) => ({
      ...tile,
      face: normalizeFaceArray(tile.face),
    }));
  }

  if (config.startTiles) {
    config.startTiles = config.startTiles.map((tile) => ({
      ...tile,
      face: normalizeFaceArray(tile.face),
    }));
  }

  // Ensure faceLinkWeight has entries for all face keys in faceLinks
  if (config.faceLinks) {
    if (!config.faceLinkWeight) {
      config.faceLinkWeight = {};
    }
    for (const [a, b] of config.faceLinks) {
      if (a && config.faceLinkWeight[a] === undefined) {
        config.faceLinkWeight[a] = 1; // Default weight
      }
      if (b && config.faceLinkWeight[b] === undefined) {
        config.faceLinkWeight[b] = 1; // Default weight
      }
    }
  }

  // Ensure arrays exist
  config.tiles = config.tiles || [];
  config.startTiles = config.startTiles || [];
  config.faceLinkWeight = config.faceLinkWeight || {};
  config.faceLinks = config.faceLinks || [];

  return config;
}

/**
 * Normalize a face array to ensure it has exactly 4 elements.
 */
function normalizeFaceArray(face: (string | null)[] | undefined | null): (string | null)[] {
  if (!face) {
    return [null, null, null, null];
  }
  if (face.length === 4) {
    return face;
  }
  // Pad or truncate to 4 elements
  const normalized: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < Math.min(face.length, 4); i++) {
    normalized[i] = face[i] ?? null;
  }
  return normalized;
}