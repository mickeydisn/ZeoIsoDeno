/**
 * Config Validation — Face Key and Tile Consistency Checks
 *
 * Validates building configurations loaded from JSON to ensure:
 * - All face keys in tile faces are referenced in faceLinks
 * - All face keys in faceLinks appear in at least one tile
 * - Tiles have valid face arrays (4 elements)
 * - faceLinkWeight exists for all face keys used in faceLinks
 * - Tile references (sourceCollection, sourceTileId) are valid
 * - Asset keys in tiles reference existing game assets
 *
 * Returns warnings and errors that can be displayed to the user.
 */

import type { BuildingConfig, TileConfig, AssetCollectionRef } from "./types.ts";
import { sanitizeBuildingConfig } from "./sanitizer.ts";

// Re-export for backward compatibility
export { sanitizeBuildingConfig };

// ============================================================================
// Validation Result Types
// ============================================================================

export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  tileIndex?: number;
  tileId?: string;
  faceKey?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalTiles: number;
    uniqueFaceKeysInTiles: Set<string>;
    uniqueFaceKeysInLinks: Set<string>;
    orphanedFaceKeys: string[];
    missingWeightEntries: string[];
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a BuildingConfig for face key consistency.
 *
 * @param config - The building configuration to validate
 * @returns ValidationResult with issues and statistics
 */
export function validateBuildingConfig(config: BuildingConfig): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Validate basic structure
  validateBasicStructure(config, issues);

  // Collect face keys from tiles and faceLinks
  const faceKeysInTiles = collectFaceKeysFromTiles(config, issues);
  const faceKeysInLinks = collectFaceKeysFromLinks(config, issues);

  // Check for orphaned face keys (in links but not in any tile)
  const orphanedFaceKeys = findOrphanedFaceKeys(faceKeysInTiles, faceKeysInLinks);
  for (const key of orphanedFaceKeys) {
    issues.push({
      severity: ValidationSeverity.WARNING,
      message: `Face key "${key}" is referenced in faceLinks but does not appear in any tile`,
      faceKey: key,
    });
  }

  // Check for face keys in tiles not referenced in faceLinks
  const unreferencedFaceKeys = findUnreferencedFaceKeys(faceKeysInTiles, faceKeysInLinks);
  for (const key of unreferencedFaceKeys) {
    issues.push({
      severity: ValidationSeverity.INFO,
      message: `Face key "${key}" appears in tiles but is not referenced in faceLinks`,
      faceKey: key,
    });
  }

  // Check for missing weight entries
  const missingWeights = findMissingWeightEntries(config, faceKeysInLinks);
  for (const key of missingWeights) {
    issues.push({
      severity: ValidationSeverity.WARNING,
      message: `Face key "${key}" is used in faceLinks but has no weight entry in faceLinkWeight`,
      faceKey: key,
    });
  }

  // Validate start tiles
  validateStartTiles(config, issues);

  const allFaceKeys = new Set([...faceKeysInTiles, ...faceKeysInLinks]);

  return {
    valid: issues.filter((i) => i.severity === ValidationSeverity.ERROR).length === 0,
    issues,
    stats: {
      totalTiles: (config.tiles || []).length,
      uniqueFaceKeysInTiles: faceKeysInTiles,
      uniqueFaceKeysInLinks: faceKeysInLinks,
      orphanedFaceKeys,
      missingWeightEntries: missingWeights,
    },
  };
}

/**
 * Validate the basic structure of a building config.
 */
function validateBasicStructure(config: BuildingConfig, issues: ValidationIssue[]): void {
  // Check required fields
  if (!config.id) {
    issues.push({
      severity: ValidationSeverity.ERROR,
      message: "Config is missing required field: id",
    });
  }

  if (!config.tiles) {
    issues.push({
      severity: ValidationSeverity.ERROR,
      message: "Config is missing required field: tiles",
    });
    return;
  }

  if (!config.faceLinks) {
    issues.push({
      severity: ValidationSeverity.ERROR,
      message: "Config is missing required field: faceLinks",
    });
  }

  if (!config.faceLinkWeight) {
    issues.push({
      severity: ValidationSeverity.WARNING,
      message: "Config is missing optional field: faceLinkWeight (may affect generation)",
    });
  }

  // Check tiles array
  const tiles = config.tiles || [];
  if (tiles.length === 0) {
    issues.push({
      severity: ValidationSeverity.ERROR,
      message: "Config has no tiles — generation will fail",
    });
  }
}

/**
 * Collect all face keys from tile face arrays and validate face structure.
 */
function collectFaceKeysFromTiles(
  config: BuildingConfig,
  issues: ValidationIssue[]
): Set<string> {
  const faceKeys = new Set<string>();
  const tiles = config.tiles || [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const tileIndex = i;
    const tileId = tile.id || `tile_${i}`;

    // Check if face array exists
    if (!tile.face) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `Tile "${tileId}" is missing face array`,
        tileIndex,
        tileId,
      });
      continue;
    }

    // Check face array length (should be 4: NW, NE, SE, SW)
    if (tile.face.length !== 4) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `Tile "${tileId}" has invalid face array length: ${tile.face.length} (expected 4)`,
        tileIndex,
        tileId,
      });
      continue;
    }

    // Check for all-null face (empty tile)
    const hasAnyFace = tile.face.some((f) => f !== null);
    if (!hasAnyFace) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        message: `Tile "${tileId}" has all-null face array — may cause generation issues`,
        tileIndex,
        tileId,
      });
    }

    // Collect non-null face keys
    for (const f of tile.face) {
      if (f) {
        faceKeys.add(f);
      }
    }
  }

  return faceKeys;
}

/**
 * Collect all face keys from faceLinks.
 */
function collectFaceKeysFromLinks(
  config: BuildingConfig,
  issues: ValidationIssue[]
): Set<string> {
  const faceKeys = new Set<string>();
  const faceLinks = config.faceLinks || [];

  for (let i = 0; i < faceLinks.length; i++) {
    const [a, b] = faceLinks[i];

    if (!a && !b) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        message: `faceLinks[${i}] has both null face keys — this entry is meaningless`,
      });
      continue;
    }

    if (a) faceKeys.add(a);
    if (b) faceKeys.add(b);
  }

  return faceKeys;
}

/**
 * Find face keys that are in faceLinks but not in any tile.
 */
function findOrphanedFaceKeys(
  inTiles: Set<string>,
  inLinks: Set<string>
): string[] {
  const orphaned: string[] = [];
  for (const key of inLinks) {
    if (!inTiles.has(key)) {
      orphaned.push(key);
    }
  }
  return orphaned.sort();
}

/**
 * Find face keys that are in tiles but not in faceLinks.
 */
function findUnreferencedFaceKeys(
  inTiles: Set<string>,
  inLinks: Set<string>
): string[] {
  const unreferenced: string[] = [];
  for (const key of inTiles) {
    if (!inLinks.has(key)) {
      unreferenced.push(key);
    }
  }
  return unreferenced.sort();
}

/**
 * Find face keys used in faceLinks that don't have weight entries.
 */
function findMissingWeightEntries(
  config: BuildingConfig,
  faceKeysInLinks: Set<string>
): string[] {
  const missing: string[] = [];
  const weights = config.faceLinkWeight || {};

  for (const key of faceKeysInLinks) {
    if (weights[key] === undefined) {
      missing.push(key);
    }
  }

  return missing.sort();
}

/**
 * Validate start tiles configuration.
 */
function validateStartTiles(config: BuildingConfig, issues: ValidationIssue[]): void {
  const startTiles = config.startTiles || [];

  if (startTiles.length === 0) {
    issues.push({
      severity: ValidationSeverity.ERROR,
      message: "Config has no start tiles — generation has no entry point",
    });
    return;
  }

  for (let i = 0; i < startTiles.length; i++) {
    const tile = startTiles[i];
    const tileId = tile.id || `startTile_${i}`;

    if (!tile.face) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `Start tile "${tileId}" is missing face array`,
        tileId,
      });
      continue;
    }

    if (tile.face.length !== 4) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `Start tile "${tileId}" has invalid face array length: ${tile.face.length} (expected 4)`,
        tileId,
      });
    }
  }
}

// ============================================================================
// Tile Reference Validation
// ============================================================================

/**
 * Result of tile reference validation.
 */
export interface TileReferenceValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalTiles: number;
    tilesWithSourceCollection: number;
    validCollectionRefs: number;
    invalidCollectionRefs: number;
    unknownAssetKeys: string[];
  };
}

/**
 * Validate tile references in a BuildingConfig.
 *
 * Checks:
 * - Tiles with sourceCollection reference a collection in assetCollections
 * - Tiles with sourceTileId reference a tile in the referenced collection (if collection is loaded)
 * - Asset keys in tiles are valid (non-empty strings)
 *
 * @param config - The building configuration to validate
 * @param loadedCollections - Map of collection ID to collection config (optional, for sourceTileId validation)
 * @returns TileReferenceValidationResult with issues and statistics
 */
export function validateTileReferences(
  config: BuildingConfig,
  loadedCollections: Map<string, { tiles: TileConfig[] }> = new Map()
): TileReferenceValidationResult {
  const issues: ValidationIssue[] = [];

  // Build set of valid collection IDs from assetCollections
  const validCollectionIds = new Set<string>();
  if (config.assetCollections) {
    for (const ref of config.assetCollections) {
      validCollectionIds.add(ref.id);
    }
  }

  let tilesWithSourceCollection = 0;
  let validCollectionRefs = 0;
  let invalidCollectionRefs = 0;
  const assetKeys = new Set<string>();

  const tiles = config.tiles || [];
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const tileId = tile.id || `tile_${i}`;

    // Validate sourceCollection reference
    if (tile.sourceCollection) {
      tilesWithSourceCollection++;

      if (validCollectionIds.has(tile.sourceCollection)) {
        validCollectionRefs++;

        // If collection is loaded, validate sourceTileId
        if (tile.sourceTileId) {
          const collection = loadedCollections.get(tile.sourceCollection);
          if (collection) {
            const tileExists = collection.tiles.some((t) => t.id === tile.sourceTileId);
            if (!tileExists) {
              issues.push({
                severity: ValidationSeverity.ERROR,
                message: `Tile "${tileId}" references tile "${tile.sourceTileId}" in collection "${tile.sourceCollection}" but it doesn't exist`,
                tileIndex: i,
                tileId,
              });
              invalidCollectionRefs++;
            }
          }
          // If collection not loaded, we can't validate the tile reference
        }
      } else {
        invalidCollectionRefs++;
        issues.push({
          severity: ValidationSeverity.ERROR,
          message: `Tile "${tileId}" references collection "${tile.sourceCollection}" but it is not defined in assetCollections`,
          tileIndex: i,
          tileId,
          faceKey: tile.sourceCollection,
        });
      }
    }

    // Collect asset keys for validation
    if (tile.assets) {
      for (const asset of tile.assets) {
        if (asset.key) {
          assetKeys.add(asset.key);
        } else {
          issues.push({
            severity: ValidationSeverity.WARNING,
            message: `Tile "${tileId}" has an asset without a key`,
            tileIndex: i,
            tileId,
          });
        }
      }
    }
  }

  // Validate asset keys are valid filenames
  const invalidAssetKeys: string[] = [];
  for (const key of assetKeys) {
    // Basic validation: non-empty, no path separators, valid filename characters
    if (!key || /[/\\]/.test(key)) {
      invalidAssetKeys.push(key);
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `Asset key "${key}" contains invalid characters`,
        faceKey: key,
      });
    }
  }

  return {
    valid: issues.filter((i) => i.severity === ValidationSeverity.ERROR).length === 0,
    issues,
    stats: {
      totalTiles: tiles.length,
      tilesWithSourceCollection,
      validCollectionRefs,
      invalidCollectionRefs,
      unknownAssetKeys: invalidAssetKeys,
    },
  };
}

/**
 * Format validation issues as a user-readable summary.
 */
export function formatValidationSummary(result: ValidationResult): string {
  const errors = result.issues.filter((i) => i.severity === ValidationSeverity.ERROR);
  const warnings = result.issues.filter((i) => i.severity === ValidationSeverity.WARNING);
  const infos = result.issues.filter((i) => i.severity === ValidationSeverity.INFO);

  const lines: string[] = [];

  if (errors.length > 0) {
    lines.push(`❌ ${errors.length} error(s):`);
    for (const e of errors) {
      lines.push(`   - ${e.message}`);
    }
  }

  if (warnings.length > 0) {
    lines.push(`⚠️ ${warnings.length} warning(s):`);
    for (const w of warnings) {
      lines.push(`   - ${w.message}`);
    }
  }

  if (infos.length > 0) {
    lines.push(`ℹ️ ${infos.length} info(s):`);
    for (const i of infos) {
      lines.push(`   - ${i.message}`);
    }
  }

  if (lines.length === 0) {
    return "✅ Config is valid";
  }

  return lines.join("\n");
}

/**
 * Format tile reference validation issues as a user-readable summary.
 */
export function formatTileRefValidationSummary(result: TileReferenceValidationResult): string {
  const errors = result.issues.filter((i) => i.severity === ValidationSeverity.ERROR);
  const warnings = result.issues.filter((i) => i.severity === ValidationSeverity.WARNING);
  const infos = result.issues.filter((i) => i.severity === ValidationSeverity.INFO);

  const lines: string[] = [];

  if (result.stats.invalidCollectionRefs > 0) {
    lines.push(`❌ ${result.stats.invalidCollectionRefs} invalid collection reference(s)`);
  }

  if (result.stats.tilesWithSourceCollection > 0) {
    lines.push(
      `📦 ${result.stats.validCollectionRefs}/${result.stats.tilesWithSourceCollection} valid collection references`
    );
  }

  if (errors.length > 0) {
    lines.push(`❌ ${errors.length} error(s):`);
    for (const e of errors) {
      lines.push(`   - ${e.message}`);
    }
  }

  if (warnings.length > 0) {
    lines.push(`⚠️ ${warnings.length} warning(s):`);
    for (const w of warnings) {
      lines.push(`   - ${w.message}`);
    }
  }

  if (infos.length > 0) {
    lines.push(`ℹ️ ${infos.length} info(s):`);
    for (const i of infos) {
      lines.push(`   - ${i.message}`);
    }
  }

  if (lines.length === 0) {
    return "✅ Tile references are valid";
  }

  return lines.join("\n");
}
