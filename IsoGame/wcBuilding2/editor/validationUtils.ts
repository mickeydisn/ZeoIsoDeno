/**
 * Validation Utilities — Shared Types and Formatting Functions
 *
 * Extracted from validation.ts to separate utilities from validation rules.
 * Contains:
 * - Severity type definitions
 * - Internal validation result types (with Set<string> for internal processing)
 * - Serializable validation result types (string[] instead of Set<string> for HTTP responses)
 * - Formatting utilities for validation summaries
 */

// ============================================================================
// Severity Types
// ============================================================================

export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * A single validation issue with severity and context.
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  tileIndex?: number;
  tileId?: string;
  faceKey?: string;
}

/**
 * Internal validation result with Set<string> for internal processing.
 */
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

/**
 * Internal tile reference validation result.
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
 * Serializable validation result with string[] instead of Set<string>.
 * Suitable for HTTP responses and JSON serialization.
 */
export interface SerializableValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalTiles: number;
    uniqueFaceKeysInTiles: string[];
    uniqueFaceKeysInLinks: string[];
    orphanedFaceKeys: string[];
    missingWeightEntries: string[];
  };
}

/**
 * Serializable tile reference validation result.
 */
export interface SerializableTileRefValidationResult {
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

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format validation issues as a user-readable summary.
 */
export function formatValidationSummary(result: SerializableValidationResult): string {
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
export function formatTileRefValidationSummary(result: SerializableTileRefValidationResult): string {
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