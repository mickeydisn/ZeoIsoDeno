/**
 * ConfigPaths — Centralized Path Construction for Building Editor
 *
 * Provides a single source of truth for all file paths used by the
 * building editor's server, loader, and related modules. Supports
 * both relative and absolute paths.
 *
 * Usage:
 *   import { configPaths } from "./configPaths.ts";
 *   const dir = configPaths.getBuildingsDir();
 *   const path = configPaths.getBuildingPath("house_a");
 */

// ============================================================================
// Base Configuration
// ============================================================================

/**
 * Base directory for all editor configuration files.
 * Defaults to `IsoGame/wcBuilding2/editor/conf` relative to the project root.
 * Can be overridden via environment variable `EDITOR_CONF_BASE_DIR`.
 */
const BASE_DIR: string = (() => {
  const envOverride = Deno.env.get("EDITOR_CONF_BASE_DIR");
  if (envOverride) {
    return envOverride.startsWith("/")
      ? envOverride
      : `${Deno.cwd()}/${envOverride}`;
  }
  return `${Deno.cwd()}/IsoGame/wcBuilding2/editor/conf`;
})();

// ============================================================================
// Directory Paths
// ============================================================================

/**
 * Get the absolute path to the buildings config directory.
 */
export function getBuildingsDir(): string {
  return `${BASE_DIR}/buildings`;
}

/**
 * Get the absolute path to the asset collections config directory.
 */
export function getAssetCollectionsDir(): string {
  return `${BASE_DIR}/asset-collections`;
}

// ============================================================================
// File Paths
// ============================================================================

/**
 * Get the full file path for a named building config.
 * @param name — Building config name (without extension)
 * @returns Absolute path to the JSON file
 */
export function getBuildingPath(name: string): string {
  return `${getBuildingsDir()}/${name}.json`;
}

/**
 * Get the full file path for a named asset collection config.
 * @param name — Asset collection name (without extension)
 * @returns Absolute path to the JSON file
 */
export function getAssetCollectionPath(name: string): string {
  return `${getAssetCollectionsDir()}/${name}.json`;
}

// ============================================================================
// Configuration Object (for import as a single unit)
// ============================================================================

/**
 * Centralized paths object for convenient destructuring import.
 */
export const configPaths = {
  getBuildingsDir,
  getAssetCollectionsDir,
  getBuildingPath,
  getAssetCollectionPath,
};

// ============================================================================
// Directory Utilities
// ============================================================================

/**
 * Ensure a directory exists, creating it recursively if necessary.
 * @param dir — Directory path to ensure
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Ensure the buildings config directory exists.
 */
export async function ensureBuildingsDir(): Promise<void> {
  await ensureDir(getBuildingsDir());
}

/**
 * Ensure the asset collections config directory exists.
 */
export async function ensureAssetCollectionsDir(): Promise<void> {
  await ensureDir(getAssetCollectionsDir());
}