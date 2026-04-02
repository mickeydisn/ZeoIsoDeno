/**
 * DuplicateConfig — Shared Duplicate/Save-As Logic
 *
 * Extracts the duplicated save-as/duplicate logic from server.ts endpoints
 * into a single reusable async function. Both building and asset collection
 * duplication share the same flow: validate, read, update ID, write.
 *
 * Usage:
 *   import { duplicateConfig } from "./services/duplicateConfig.ts";
 *   const result = await duplicateConfig('building', originalName, newName);
 */

import type { BuildingConfig, AssetCollectionConfig } from "../types.ts";
import {
  getBuildingPath,
  getAssetCollectionPath,
  ensureBuildingsDir,
  ensureAssetCollectionsDir,
} from "../configPaths.ts";

// ============================================================================
// Types
// ============================================================================

export type ConfigType = "building" | "asset-collection";

export interface DuplicateResult {
  success: boolean;
  path?: string;
  newName?: string;
  error?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validateName(name: string): string | null {
  if (!NAME_PATTERN.test(name)) {
    return "Invalid name format. Only alphanumeric characters, hyphens, and underscores are allowed.";
  }
  return null;
}

function getFilePath(type: ConfigType, name: string): string {
  return type === "building"
    ? getBuildingPath(name)
    : getAssetCollectionPath(name);
}

async function ensureDir(type: ConfigType): Promise<void> {
  if (type === "building") {
    return ensureBuildingsDir();
  }
  return ensureAssetCollectionsDir();
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readConfig(
  type: ConfigType,
  name: string,
): Promise<BuildingConfig | AssetCollectionConfig> {
  const filePath = getFilePath(type, name);
  const content = await Deno.readTextFile(filePath);
  if (type === "building") {
    return JSON.parse(content) as BuildingConfig;
  }
  return JSON.parse(content) as AssetCollectionConfig;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Duplicate a configuration file with a new name.
 * Reads the original config, updates its ID to the new name,
 * and writes it to a new file.
 *
 * @param type — Config type: 'building' or 'asset-collection'
 * @param originalName — Name of the existing config to duplicate
 * @param newName — Name for the new duplicate
 * @returns Result object with success status and path or error
 */
export async function duplicateConfig(
  type: ConfigType,
  originalName: string,
  newName: string,
): Promise<DuplicateResult> {
  // Validate names
  const originalNameError = validateName(originalName);
  if (originalNameError) {
    return { success: false, error: originalNameError };
  }

  const newNameError = validateName(newName);
  if (newNameError) {
    return { success: false, error: newNameError };
  }

  // Check if target already exists
  const newFilePath = getFilePath(type, newName);
  if (await fileExists(newFilePath)) {
    const configLabel = type === "building" ? "building config" : "asset collection config";
    return {
      success: false,
      error: `A ${configLabel} with name "${newName}" already exists`,
    };
  }

  // Read original config
  let config: BuildingConfig | AssetCollectionConfig;
  try {
    config = await readConfig(type, originalName);
  } catch {
    const configLabel = type === "building" ? "building" : "asset collection";
    return {
      success: false,
      error: `Original ${configLabel} config not found: ${originalName}`,
    };
  }

  // Update the config ID to the new name
  config.id = newName;

  // Ensure directory exists
  await ensureDir(type);

  // Write new file
  try {
    await Deno.writeTextFile(newFilePath, JSON.stringify(config, null, 2));
  } catch (error) {
    return {
      success: false,
      error: `Failed to write config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return {
    success: true,
    path: newFilePath,
    newName,
  };
}