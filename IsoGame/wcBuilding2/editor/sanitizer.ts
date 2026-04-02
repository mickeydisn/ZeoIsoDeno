/**
 * Config Sanitizer — Fix Common Building Configuration Issues
 *
 * Provides utilities to sanitize and repair building configurations before
 * saving or loading. This separates fix/repair logic from validation/checking
 * logic in the validation module.
 */

import type { BuildingConfig, TileGroupConfig } from "./types.ts";

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

  // Sanitize tile groups
  if (config.groups) {
    config.groups = config.groups.map((group: TileGroupConfig) => {
      // Normalize group face
      const sanitizedGroup: TileGroupConfig = {
        ...group,
        face: normalizeFaceArray(group.face),
        // Ensure weight is valid number or default to 1
        weight: typeof group.weight === 'number' && !isNaN(group.weight) ? group.weight : 1,
        // Ensure items array exists
        items: group.items || []
      };

      // Sanitize group items (no face property)
      sanitizedGroup.items = sanitizedGroup.items.map(item => ({
        ...item,
        // Ensure weight is valid number or default to 1
        weight: typeof item.weight === 'number' && !isNaN(item.weight) ? item.weight : 1
      }));

      return sanitizedGroup;
    });
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
  config.groups = config.groups || [];
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