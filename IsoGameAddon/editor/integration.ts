/**
 * Integration Wrapper — Optional bridge between the editor and game code
 *
 * This module provides a wrapper approach for integrating JSON-loaded building configs
 * into the game WITHOUT modifying existing game code.
 *
 * Usage pattern:
 *   import { wrapCreateBuilding } from "../editor/integration.ts";
 *   const createBuildingWithJSON = wrapCreateBuilding(originalCreateBuilding);
 *
 * The wrapper intercepts building creation calls and tries JSON config first,
 * then falls back to the original TypeScript-based creation.
 *
 * IMPORTANT: This integration is OPTIONAL. The game works without it via the
 * existing registry and TypeScript class instantiation.
 */

import { ConfigLoader } from "./loader.ts";
import { WcAbstractBuildConf } from "../../IsoGame/map/generator/wcBuilding2/wcAbstractBuildConf.ts";

// ============================================================================
// Type definitions for the wrapper
// ============================================================================

/**
 * Original building creation function signature from game code.
 * This is what the wrapper replaces.
 */
export type OriginalCreateBuildingFn = (
  buildingType: string,
  options: { growLoopCount: number; endLoopMax: number },
) => WcAbstractBuildConf | null;

/**
 * Wrapped building creation function that supports JSON configs.
 */
export type WrappedCreateBuildingFn = (
  buildingType: string,
  options: { growLoopCount: number; endLoopMax: number },
) => Promise<WcAbstractBuildConf | null>;

// ============================================================================
// Wrapper function
// ============================================================================

/**
 * Wrap an existing building creation function to add JSON config support.
 *
 * The wrapped function will:
 * 1. Try loading from JSON config file first (edited configs)
 * 2. Fall back to the original function if JSON not found (TypeScript classes)
 *
 * This enables edited configs to take effect WITHOUT modifying game code.
 *
 * @param originalFn — Original building creation function from game code
 * @returns Async wrapper function that supports JSON configs
 *
 * @example
 * ```typescript
 * // In your game initialization code:
 * import { wrapCreateBuilding } from "../editor/integration.ts";
 * import { originalCreateBuilding } from "./wcBuildAction.ts";
 *
 * const createBuilding = wrapCreateBuilding(originalCreateBuilding);
 *
 * // Now use createBuilding() — it will try JSON first
 * const conf = await createBuilding("house_a", { growLoopCount: 50, endLoopMax: 200 });
 * ```
 */
export function wrapCreateBuilding(
  originalFn: OriginalCreateBuildingFn,
): WrappedCreateBuildingFn {
  return async (
    buildingType: string,
    options: { growLoopCount: number; endLoopMax: number },
  ): Promise<WcAbstractBuildConf | null> => {
    try {
      // Try JSON first via ConfigLoader
      const jsonConf = await ConfigLoader.loadBuilding(buildingType, options);
      if (jsonConf) {
        return jsonConf;
      }
    } catch (_e) {
      // JSON not found or invalid — fall through to original
    }

    // Fallback: use original TypeScript-based creation
    return originalFn(buildingType, options);
  };
}

// ============================================================================
// Standalone integration function (if original is not available)
// ============================================================================

/**
 * Standalone building creation function that uses ConfigLoader directly.
 * Use this if you don't have access to the original creation function
 * or want complete JSON-first behavior.
 *
 * @param buildingType — Building config ID (e.g., "house_a")
 * @param options — Generation options
 * @returns WcAbstractBuildConf or null if not found
 */
export async function createBuilding(
  buildingType: string,
  options: { growLoopCount: number; endLoopMax: number },
): Promise<WcAbstractBuildConf | null> {
  try {
    return await ConfigLoader.loadBuilding(buildingType, options);
  } catch (e) {
    console.error(`createBuilding: failed to load "${buildingType}":`, e);
    return null;
  }
}

// ============================================================================
// Integration helper for wcBuildAction.ts
// ============================================================================

/**
 * Helper to replace the createBuilding handler in wcBuildAction.ts.
 *
 * Usage in wcBuildAction.ts:
 * ```typescript
 * import { integrateWithBuildAction } from "../editor/integration.ts";
 *
 * // Replace your existing handler:
 * const handleCreateBuilding = integrateWithBuildAction((id, options) => {
 *   // Your original logic here (will be called as fallback)
 *   return createBuildingConfig(id, options);
 * });
 * ```
 *
 * @param fallbackFn — Original creation function to use as fallback
 * @returns Async function that tries JSON first, then falls back
 */
export function integrateWithBuildAction(
  fallbackFn: OriginalCreateBuildingFn,
): (
  id: string,
  options: { growLoopCount: number; endLoopMax: number },
) => Promise<WcAbstractBuildConf | null> {
  return wrapCreateBuilding(fallbackFn);
}

// ============================================================================
// Utility: Check if a building config has been edited (JSON vs TS)
// ============================================================================

/**
 * Check if a building config has a JSON version saved.
 * Useful for determining whether a config has been edited in the UI.
 *
 * @param id — Building config ID
 * @returns True if JSON config exists
 */
export async function hasEditedConfig(id: string): Promise<boolean> {
  return await ConfigLoader.hasJSONConfig(id);
}

/**
 * Get a list of all building configs that have been edited (have JSON files).
 *
 * @returns Array of edited building IDs
 */
export async function getEditedConfigs(): Promise<string[]> {
  const saved = await ConfigLoader.listSavedConfigs();
  return saved.map((c) => c.id);
}
