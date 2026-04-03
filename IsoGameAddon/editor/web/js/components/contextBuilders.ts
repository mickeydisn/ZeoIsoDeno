/**
 * Context Builder Functions
 * Pure data transformation functions that prepare config data for rendering
 */

import type { TileConfig, BuildingConfig, AssetCollectionConfig } from "../../../types.ts";
import type { TileEditContext } from "../panels/tile.ts";

/**
 * Build a TileEditContext from a BuildingConfig.
 */
export function buildTileEditContextFromBuilding(
  config: BuildingConfig,
  onSave: (tile: TileConfig) => void
): TileEditContext {
  // Collect face keys
  const faceKeys = new Set<string>();
  for (const key of Object.keys(config.faceLinkWeight || {})) {
    faceKeys.add(key);
  }
  for (const [a, b] of config.faceLinks || []) {
    faceKeys.add(a);
    faceKeys.add(b);
  }
  for (const tile of [...(config.tiles || []), ...(config.startTiles || [])]) {
    for (const f of tile.face || []) {
      if (f) faceKeys.add(f);
    }
  }

  return {
    parentCollection: config.id,
    isStartTile: false,
    sourceInfo: `Building: ${config.id}`,
    faceKeys: Array.from(faceKeys).sort(),
    collectionParams: {},
    templateParams: [],
    onSave,
  };
}

/**
 * Build a TileEditContext from an AssetCollectionConfig.
 */
export function buildTileEditContextFromAssetCollection(
  config: AssetCollectionConfig,
  onSave: (tile: TileConfig) => void
): TileEditContext {
  // Collect template params
  const templateParams = Object.keys(config.paramsSchema || {})
    .filter((key) => config.paramsSchema?.[key]?.type === "color")
    .map((key) => key);

  return {
    parentCollection: config.id,
    isStartTile: false,
    sourceInfo: `Collection: ${config.id}`,
    faceKeys: [],
    collectionParams: config.params,
    templateParams,
    onSave,
  };
}