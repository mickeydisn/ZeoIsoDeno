/**
 * Config Migration System — Schema Version Migration
 *
 * Provides a framework for migrating building and asset collection configs
 * from older schema versions to the current version.
 *
 * Migration Flow:
 * 1. Load JSON config from disk
 * 2. Check if version === CURRENT_VERSION
 * 3. If older, apply sequential migrations (1.0 → 1.1 → 2.0, etc.)
 * 4. Return migrated config ready for use
 *
 * Adding a new migration:
 * 1. Define new version string (e.g., "1.1")
 * 2. Add migration function MIGRATION_FUNCTIONS["1.0->1.1"]
 * 3. Update CURRENT_VERSION to "1.1"
 * 4. Add "1.1" to SUPPORTED_VERSIONS in types.ts
 */

import { CURRENT_VERSION, SUPPORTED_VERSIONS, SupportedVersion } from "./types.ts";
import type { BuildingConfig, AssetCollectionConfig, AnyConfig } from "./types.ts";

// ============================================================================
// Version Ordering
// ============================================================================

/**
 * Ordered list of versions for migration path resolution.
 * Add new versions to the end of this array.
 */
const VERSION_ORDER: readonly SupportedVersion[] = ["1.0"];

/**
 * Get the index of a version in the version ordering.
 * Returns -1 if version is not recognized.
 */
function getVersionIndex(version: string): number {
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
// Migration Result
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

// ============================================================================
// Migration Function Registry
// ============================================================================

/**
 * A migration function transforms a config from one version to the next.
 * Migration functions are registered with a key like "1.0->1.1".
 *
 * IMPORTANT: Migration functions should be forward-compatible only.
 * They should never downgrade a config to an older version.
 */
type MigrationFn<T extends AnyConfig> = (
  config: T,
  context: MigrationContext
) => T;

export interface MigrationContext {
  /** The migration step being applied (e.g., "1.0->1.1") */
  migrationStep: string;
  /** Accumulated warnings during migration */
  warnings: string[];
}

/**
 * Registry of migration functions keyed by migration path (e.g., "1.0->1.1").
 * Add new migration functions here when introducing schema changes.
 */
const BUILDING_MIGRATIONS = new Map<string, MigrationFn<BuildingConfig>>();
const ASSET_COLLECTION_MIGRATIONS = new Map<string, MigrationFn<AssetCollectionConfig>>();

/**
 * Register a migration function for building configs.
 */
export function registerBuildingMigration(fromVersion: string, toVersion: string, fn: MigrationFn<BuildingConfig>): void {
  const key = `${fromVersion}->${toVersion}`;
  BUILDING_MIGRATIONS.set(key, fn);
}

/**
 * Register a migration function for asset collection configs.
 */
export function registerAssetCollectionMigration(
  fromVersion: string,
  toVersion: string,
  fn: MigrationFn<AssetCollectionConfig>
): void {
  const key = `${fromVersion}->${toVersion}`;
  ASSET_COLLECTION_MIGRATIONS.set(key, fn);
}

// ============================================================================
// Default Migrations (No-op for 1.0 since it's the current version)
// ============================================================================

// Example migration for future use (uncomment when adding 1.1):
// registerBuildingMigration("1.0", "1.1", (config, ctx) => {
//   ctx.warnings.push("Migrated from 1.0 to 1.1");
//   return {
//     ...config,
//     version: "1.1",
//     // Add new fields or transform existing ones here
//   };
// });

// ============================================================================
// Migration Engine
// ============================================================================

/**
 * Get the migration path from one version to another.
 * Returns an array of [from, to] pairs representing each migration step.
 */
function getMigrationPath(fromVersion: string, toVersion: string): Array<[string, string]> {
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

/**
 * Migrate a building config from its current version to the target version.
 *
 * @param config - The building config to migrate
 * @param targetVersion - The version to migrate to (defaults to CURRENT_VERSION)
 * @returns MigrationResult with details of the migration
 */
export function migrateBuildingConfig(
  config: BuildingConfig,
  targetVersion: SupportedVersion = CURRENT_VERSION,
): MigrationResult {
  const originalVersion = config.version;
  const warnings: string[] = [];
  const appliedMigrations: string[] = [];

  // Already current version
  if (originalVersion === targetVersion) {
    return {
      success: true,
      originalVersion,
      migratedVersion: originalVersion,
      wasMigrated: false,
      appliedMigrations: [],
      warnings: [],
    };
  }

  // Unknown version — try to migrate anyway treating it as the oldest known
  if (getVersionIndex(originalVersion) === -1) {
    warnings.push(
      `Unknown version "${originalVersion}" — treating as version "${VERSION_ORDER[0]}" and attempting migration`
    );
  }

  // Get migration path
  const steps = getMigrationPath(
    getVersionIndex(originalVersion) === -1 ? VERSION_ORDER[0] : originalVersion,
    targetVersion
  );

  if (steps.length === 0) {
    // No migration path exists
    return {
      success: false,
      originalVersion,
      migratedVersion: originalVersion,
      wasMigrated: false,
      appliedMigrations: [],
      warnings: [`No migration path from "${originalVersion}" to "${targetVersion}"`],
    };
  }

  // Apply migrations sequentially
  let migratedConfig: BuildingConfig = config;
  for (const [fromVersion, toVersion] of steps) {
    const key = `${fromVersion}->${toVersion}`;
    const migrationFn = BUILDING_MIGRATIONS.get(key);

    if (!migrationFn) {
      return {
        success: false,
        originalVersion,
        migratedVersion: fromVersion,
        wasMigrated: appliedMigrations.length > 0,
        appliedMigrations,
        warnings: [...warnings, `No migration registered for: ${key}`],
      };
    }

    const ctx: MigrationContext = {
      migrationStep: key,
      warnings: [],
    };

    try {
      migratedConfig = migrationFn(migratedConfig, ctx);
      warnings.push(...ctx.warnings);
      appliedMigrations.push(key);
    } catch (error) {
      return {
        success: false,
        originalVersion,
        migratedVersion: fromVersion,
        wasMigrated: appliedMigrations.length > 0,
        appliedMigrations,
        warnings: [
          ...warnings,
          `Migration failed at ${key}: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  return {
    success: true,
    originalVersion,
    migratedVersion: migratedConfig.version,
    wasMigrated: true,
    appliedMigrations,
    warnings,
  };
}

/**
 * Migrate an asset collection config from its current version to the target version.
 *
 * @param config - The asset collection config to migrate
 * @param targetVersion - The version to migrate to (defaults to CURRENT_VERSION)
 * @returns MigrationResult with details of the migration
 */
export function migrateAssetCollectionConfig(
  config: AssetCollectionConfig,
  targetVersion: SupportedVersion = CURRENT_VERSION,
): MigrationResult {
  const originalVersion = config.version;
  const warnings: string[] = [];
  const appliedMigrations: string[] = [];

  // Already current version
  if (originalVersion === targetVersion) {
    return {
      success: true,
      originalVersion,
      migratedVersion: originalVersion,
      wasMigrated: false,
      appliedMigrations: [],
      warnings: [],
    };
  }

  // Unknown version
  if (getVersionIndex(originalVersion) === -1) {
    warnings.push(
      `Unknown version "${originalVersion}" — treating as version "${VERSION_ORDER[0]}" and attempting migration`
    );
  }

  // Get migration path
  const steps = getMigrationPath(
    getVersionIndex(originalVersion) === -1 ? VERSION_ORDER[0] : originalVersion,
    targetVersion
  );

  if (steps.length === 0) {
    return {
      success: false,
      originalVersion,
      migratedVersion: originalVersion,
      wasMigrated: false,
      appliedMigrations: [],
      warnings: [`No migration path from "${originalVersion}" to "${targetVersion}"`],
    };
  }

  // Apply migrations sequentially
  let migratedConfig: AssetCollectionConfig = config;
  for (const [fromVersion, toVersion] of steps) {
    const key = `${fromVersion}->${toVersion}`;
    const migrationFn = ASSET_COLLECTION_MIGRATIONS.get(key);

    if (!migrationFn) {
      return {
        success: false,
        originalVersion,
        migratedVersion: fromVersion,
        wasMigrated: appliedMigrations.length > 0,
        appliedMigrations,
        warnings: [...warnings, `No migration registered for: ${key}`],
      };
    }

    const ctx: MigrationContext = {
      migrationStep: key,
      warnings: [],
    };

    try {
      migratedConfig = migrationFn(migratedConfig, ctx);
      warnings.push(...ctx.warnings);
      appliedMigrations.push(key);
    } catch (error) {
      return {
        success: false,
        originalVersion,
        migratedVersion: fromVersion,
        wasMigrated: appliedMigrations.length > 0,
        appliedMigrations,
        warnings: [
          ...warnings,
          `Migration failed at ${key}: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  return {
    success: true,
    originalVersion,
    migratedVersion: migratedConfig.version,
    wasMigrated: true,
    appliedMigrations,
    warnings,
  };
}

/**
 * Migrate any config (building or asset collection) to the current version.
 * Type-safe dispatcher based on config.type.
 *
 * @param config - The config to migrate
 * @param targetVersion - The version to migrate to
 * @returns The migrated config and migration result
 */
export function migrateConfig<T extends AnyConfig>(
  config: T,
  targetVersion: SupportedVersion = CURRENT_VERSION,
): { config: T; result: MigrationResult } {
  if (config.type === "building") {
    const result = migrateBuildingConfig(config as BuildingConfig, targetVersion);
    return { config: result.success ? config as T : config, result };
  } else if (config.type === "assetCollection") {
    const result = migrateAssetCollectionConfig(config as AssetCollectionConfig, targetVersion);
    return { config: result.success ? config as T : config, result };
  }

  return {
    config,
    result: {
      success: false,
      originalVersion: "unknown",
      migratedVersion: "unknown",
      wasMigrated: false,
      appliedMigrations: [],
      warnings: [`Unknown config type: ${(config as any).type}`],
    },
  };
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

// ============================================================================
// Export
// ============================================================================

export { BUILDING_MIGRATIONS, ASSET_COLLECTION_MIGRATIONS };