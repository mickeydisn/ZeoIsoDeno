/**
 * Preview Builder Service
 *
 * Provides functions to build temporary WcAbstractBuildConf from JSON
 * configuration and convert tile JSON back to WcConfTile for preview generation.
 *
 * These functions were extracted from server.ts to improve modularity and type safety.
 */

import type { BuildingConfig, TileConfig } from "../types.ts";
import { WcAbstractBuildConf, WcConfRawGroup, WcConfTile } from "../../../IsoGame/generator/wcBuilding2/wcAbstractBuildConf.ts";
import { confsGroup_to_confsTile } from "../../../IsoGame/generator/wcBuilding2/wcUtils.ts";

// ============================================================================
// Type Definitions
// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of converting a TileConfig JSON object to WcConfTile.
 * Provides explicit typing instead of returning `any`.
 */
export interface TileFromJsonResult {
  /** Face configuration for 4 directions: [NW, NE, SE, SW] */
  face: [string | null, string | null, string | null, string | null];
  /** Selection weight */
  weight: number;
  /** Visual asset definitions */
  assets?: Array<{
    key?: string;
    keyR?: number;
    sufix?: string | number | boolean;
    h?: number;
    off?: { x: number; y: number };
  }>;
  /** Function definitions */
  functions?: Array<{
    key?: string;
    keyR?: number;
    sufix?: string;
    size?: number;
    off?: { x: number; y: number };
  }>;
  /** Allow terrain modification on this tile */
  allowMove?: boolean;
  /** Decorative tile (no collision) */
  isFrise?: boolean;
  /** Empty tile (no assets rendered) */
  empty?: boolean;
  /** Top color override [R, G, B] */
  colorT?: [number, number, number];
  /** Base color override [R, G, B] */
  color?: [number, number, number];
  /** Height override */
  h?: number;
  /** Level override */
  lvl?: number;
}

// ============================================================================
// Preview Builder Functions
// ============================================================================

/**
 * Build a temporary WcAbstractBuildConf from JSON config for preview generation.
 * Expands unique faceLinks to bidirectional pairs and maps tiles to game format.
 *
 * @param json - Building configuration in JSON format
 * @returns WcAbstractBuildConf ready for use with WcBuildFactoryGenarator
 */
export function buildTempConfig(json: BuildingConfig): WcAbstractBuildConf {
  const conf = new WcAbstractBuildConf({
    growLoopCount: json.params?.growLoopCount ?? 50,
    endLoopMax: json.params?.endLoopMax ?? 200,
  });

  // Copy face link weights
  conf.faceLinkWeight = { ...json.faceLinkWeight };

  // Expand unique faceLinks to bidirectional pairs
  conf.faceLinks = json.faceLinks.flatMap(
    ([a, b]: [string, string]) => [
      [a, b] as [string, string],
      [b, a] as [string, string],
    ],
  );

  // Map start tiles
  conf.startTileOptions = (json.startTiles || []).map(
    (tile) => tileFromJSON(tile) as unknown as WcConfTile,
  );

  // Map tiles — expand groups if present
  if (json.groups && json.groups.length > 0) {
    const expandedGroupTiles = confsGroup_to_confsTile(json.groups as unknown as WcConfRawGroup[]);
    conf.listTileOptions = [
      ...(json.tiles || []).map((tile) => tileFromJSON(tile) as unknown as WcConfTile),
      ...expandedGroupTiles,
    ];
  } else {
    conf.listTileOptions = (json.tiles || []).map(
      (tile) => tileFromJSON(tile) as unknown as WcConfTile,
    );
  }

  return conf;
}

/**
 * Convert a TileConfig JSON object back to a WcConfTile-compatible result.
 *
 * This function reconstructs a tile object from its serialized JSON form,
 * preserving all optional fields (assets, functions, colors, flags).
 *
 * @param jsonTile - Tile configuration from JSON
 * @returns TileFromJsonResult compatible with WcConfTile
 */
export function tileFromJSON(jsonTile: TileConfig): TileFromJsonResult {
  const tile: TileFromJsonResult = {
    face: jsonTile.face as [string | null, string | null, string | null, string | null],
    weight: jsonTile.weight,
  };

  if (jsonTile.assets?.length) {
    tile.assets = jsonTile.assets.map((a) => ({ ...a }));
  }
  if (jsonTile.functions?.length) {
    tile.functions = jsonTile.functions.map((f) => ({ ...f }));
  }
  if (jsonTile.allowMove !== undefined) tile.allowMove = jsonTile.allowMove;
  if (jsonTile.isFrise !== undefined) tile.isFrise = jsonTile.isFrise;
  if (jsonTile.empty !== undefined) tile.empty = jsonTile.empty;
  if (jsonTile.color) tile.color = [...jsonTile.color];
  if (jsonTile.colorT) tile.colorT = [...jsonTile.colorT];
  if (jsonTile.h !== undefined) tile.h = jsonTile.h;
  if (jsonTile.lvl !== undefined) tile.lvl = jsonTile.lvl;

  return tile;
}