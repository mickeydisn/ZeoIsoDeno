/**
 * Migration Helpers — Version Checking and Path Resolution
 *
 * Extracted from migration.ts: contains version comparison utilities,
 * migration path resolution, and shared type definitions for the
 * migration system.
 *
 * Separates fix/repair logic (in sanitizer.ts) and version/path
 * utilities (in this file) from the core migration engine (in migration.ts).
 */

import { CURRENT_VERSION, SUPPORTED_VERSIONS, type SupportedVersion } from "./types.ts";

// ============================================================================
// Version Ordering
// ============================================================================

/**
 * Ordered list of versions for migration path resolution.
 * Add new versions to the end of this array.
 */
export const VERSION_ORDER: readonly SupportedVersion[] = ["1.0", "1.1"];

/**
 * Get the index of a version in the version ordering.
 * Returns -1 if version is not recognized.
 */
export function getVersionIndex(version: string): number {
  return VERSION_ORDER.indexOf((VERSION_ORDER as readonly string[]).find((v) => v === version) as SupportedVersion);
}

/**
 * Check if a version is supported (either current or older migratable version).
 */
export function isSupportedVersion(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version as SupportedVersion);
}

/**
 * Compare two version strings.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const aIdx = VERSION_ORDER.indexOf(a as SupportedVersion);
  const bIdx = VERSION_ORDER.indexOf(b as SupportedVersion);

  if (aIdx === -1 && bIdx === -1) return 0;
  if (aIdx === -1) return -1;
  if (bIdx === -1) return 1;

  if (aIdx < bIdx) return -1;
  if (aIdx > bIdx) return 1;
  return 0;
}

// ============================================================================
// Migration Result and Context Types
// ============================================================================

export interface MigrationResult {
  /** Whether migration was successful */
  success: boolean;
  /** Original version before migration */
  originalVersion: string;
  /** Current version after migration */
  migratedVersion: string;
  /** Whether any migration was applied */
  wasMigrated: boolean;
  /** List of migration steps that were applied */
  appliedMigrations: string[];
  /** Any warnings or informational messages about the migration */
  warnings: string[];
}

export interface MigrationContext {
  /** The migration step being applied (e.g., "1.0->1.1") */
  migrationStep: string;
  /** Accumulated warnings during migration */
  warnings: string[];
}

// ============================================================================
// Migration Function Type
// ============================================================================

import type { AnyConfig } from "./types.ts";

/**
 * A migration function transforms a config from one version to the next.
 * Migration functions are registered with a key like "1.0->1.1".
 *
 * IMPORTANT: Migration functions should be forward-compatible only.
 * They should never downgrade a config to an older version.
 */
export type MigrationFn<T extends AnyConfig> = (
  config: T,
  context: MigrationContext
) => T;

// ============================================================================
// Migration Path Resolution
// ============================================================================

/**
 * Get the migration path from one version to another.
 * Returns an array of [from, to] pairs representing each migration step.
 */
export function getMigrationPath(fromVersion: string, toVersion: string): Array<[string, string]> {
  const steps: Array<[string, string]> = [];
  let currentVersion = fromVersion;

  while (compareVersions(currentVersion, toVersion) < 0) {
    const currentIdx = getVersionIndex(currentVersion);
    if (currentIdx === -1 || currentIdx >= VERSION_ORDER.length - 1) {
      // Cannot migrate further — no known path
      break;
    }
    const nextVersion = VERSION_ORDER[currentIdx + 1];
    steps.push([currentVersion, nextVersion]);
    currentVersion = nextVersion;
  }

  return steps;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a config needs migration.
 */
export function needsMigration(config: AnyConfig): boolean {
  return config.version !== CURRENT_VERSION;
}

/**
 * Get human-readable description of a config's version status.
 */
export function getVersionStatus(config: AnyConfig): string {
  if (config.version === CURRENT_VERSION) {
    return `Up to date (v${config.version})`;
  }

  const comparison = compareVersions(config.version, CURRENT_VERSION);
  if (comparison < 0) {
    return `Outdated (v${config.version} → v${CURRENT_VERSION})`;
  }
  if (comparison > 0) {
    return `Future version (v${config.version}) — may not be compatible`;
  }
  return `Unknown version (v${config.version})`;
}