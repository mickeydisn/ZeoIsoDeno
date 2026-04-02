/**
 * JSON Schema Type Definitions for Building Configuration Editor
 *
 * These interfaces define the structure for serialized building configurations
 * and asset collections, designed for round-trip consistency (extract → edit → save → load).
 *
 * Key design principles:
 * - JSON-first storage (editor works with JSON, TS generation is optional)
 * - Mirror existing WcConfTile structure
 * - Preserve composition (source getter/collection traceability)
 * - Deduplicated faceLinks (unique pairs, expanded to bidirectional at load time)
 * - Exclude runtime-only values (mainLvl is set during generation)
 */

// ============================================================================
// Re-export game types for reference (read-only, not modified)
// ============================================================================
export type { WcFace, WcKeyFace } from "../wcBuildFace.ts";

// ============================================================================
// Local type mirrors for game types (used in TileConfig)
// These are standalone definitions to avoid import issues in the editor context.
// ============================================================================

/**
 * Asset definition within a tile configuration.
 * Mirrors the game's WcConfTileAsset interface.
 */
export interface WcConfTileAsset {
  /** Asset key in the loader (e.g., "wallDoor", "roofCorner") */
  key?: string;
  /** Rotation index (0-3 for 90° increments) */
  keyR?: number;
  /** Color filter suffix (e.g., "#H210_C115_S35_B120" or template like "{WALL_SUFFIX}") */
  sufix?: string | number | boolean;
  /** Height layer (0 = ground, 1 = wall, 2 = roof) */
  h?: number;
  /** Position offset {x, y} */
  off?: { x: number; y: number };
}

/**
 * Function definition within a tile configuration.
 * Mirrors the game's WcConfTileFunction interface.
 */
export interface WcConfTileFunction {
  /** Function name (e.g., "lvlAvgSquare") */
  key?: string;
  keyR?: number;
  sufix?: string;
  /** Grid size for the function (e.g., 5 for a 5x5 average) */
  size?: number;
  off?: { x: number; y: number };
}

// ============================================================================
// Version Constants
// ============================================================================

/**
 * Current schema version for building and asset collection configurations.
 * Increment this when making breaking changes to the schema.
 *
 * Version History:
 * - "1.0": Initial schema version (current)
 */
export const CURRENT_VERSION = "1.0" as const;

/**
 * All supported schema versions that the system can read and migrate.
 * Older configs will be automatically migrated to CURRENT_VERSION on load.
 */
export const SUPPORTED_VERSIONS = ["1.0"] as const;

export type SupportedVersion = typeof SUPPORTED_VERSIONS[number];

// ============================================================================
// Building Configuration JSON Schema
// ============================================================================

/**
 * Reference to an asset collection used by a building configuration.
 * Contains enough information to load and instantiate the collection.
 */
export interface AssetCollectionRef {
  /** Unique identifier for this collection reference within the building */
  id: string;
  /** TypeScript class name (e.g., "WcAsset_WallHouse") */
  classRef: string;
  /** Tag prefix used for face key generation (e.g., "WH_") */
  tag: string;
  /** Runtime parameters (WALL_SUFFIX, ROOF_SUFFIX, etc.) */
  params: Record<string, string | number | boolean>;
  /** Source module file name (e.g., "wcAsset_WallHouse") */
  sourceFile: string;
}

/**
 * Complete building configuration serialized to JSON.
 * Used by the editor for editing and by the loader for runtime instantiation.
 */
export interface BuildingConfig {
  /** Schema version for future compatibility (e.g., "1.0", "1.1", "2.0") */
  version: typeof CURRENT_VERSION;
  /** Always "building" for building configurations */
  type: "building";
  /** Human-readable identifier (e.g., "HouseA", "GraveA") */
  id: string;
  /** Metadata for traceability and loading */
  metadata: {
    /** TypeScript class name (e.g., "WcBuildConf_HouseA") */
    classRef: string;
    /** Source module file name (e.g., "buildConf_HouseA") */
    sourceFile: string;
    /** Registry ID for runtime loading (e.g., "house_a") */
    registryId: string;
  };
  /** Generation parameters (explicitly excludes mainLvl which is runtime-only) */
  params: {
    /** Number of grow loop iterations for building generation */
    growLoopCount: number;
    /** Maximum iterations for closing loop */
    endLoopMax: number;
  };
  /** References to asset collections used by this building */
  assetCollections: AssetCollectionRef[];
  /** Weight mapping for face keys (used during weighted tile selection) */
  faceLinkWeight: Record<string, number>;
  /** Unique face link pairs (deduplicated; bidirectional expansion happens at load time) */
  faceLinks: [string, string][];
  /** Entrance/start tile definitions */
  startTiles: TileConfig[];
  /** All tile definitions for the building */
  tiles: TileConfig[];
}

// ============================================================================
// Asset Collection JSON Schema
// ============================================================================

/**
 * Parameter schema entry for asset collection parameters.
 * Provides type hints and labels for UI rendering.
 */
export interface ParamSchemaEntry {
  /** Type hint for UI rendering: "color" for suffix params, "string" for text, "number" for numeric */
  type: "color" | "string" | "number" | "boolean";
  /** Human-readable label for the parameter */
  label: string;
}

/**
 * Complete asset collection configuration serialized to JSON.
 * Asset collections define reusable tile sets (walls, fences, corridors, etc.)
 * that are referenced by building configurations.
 */
export interface AssetCollectionConfig {
  /** Schema version for future compatibility (e.g., "1.0", "1.1", "2.0") */
  version: typeof CURRENT_VERSION;
  /** Always "assetCollection" for asset collections */
  type: "assetCollection";
  /** Human-readable identifier (e.g., "WallHouse", "FenceSimple") */
  id: string;
  /** Metadata for traceability and loading */
  metadata: {
    /** TypeScript class name (e.g., "WcAsset_WallHouse") */
    classRef: string;
    /** Source module file name (e.g., "wcAsset_WallHouse") */
    sourceFile: string;
  };
  /** Tag prefix used for face key generation (e.g., "WH_", "F_", "FP_") */
  tag: string;
  /** Runtime parameters (color suffixes, etc.) */
  params: Record<string, string | number | boolean>;
  /** Schema for params — used by editor UI for specialized inputs */
  paramsSchema?: Record<string, ParamSchemaEntry>;
  /** All tile definitions in this collection */
  tiles: TileConfig[];
}

// ============================================================================
// Tile Configuration
// ============================================================================

/**
 * Extended tile configuration for JSON serialization.
 * Extends WcConfTile with traceability fields to track tile origin.
 */
export interface TileConfig {
  /** Unique identifier for this tile within its parent config */
  id?: string;
  /** Face configuration for 4 directions: [NW, NE, SE, SW] */
  face: (string | null)[];
  /** Selection weight (0 = never auto-selected during generation) */
  weight: number;

  // --- Optional asset definitions ---
  /** Visual asset definitions (images to render for this tile) */
  assets?: WcConfTileAsset[];
  /** Function definitions (e.g., {func: "lvlAvgSquare", size: 5}) */
  functions?: WcConfTileFunction[];

  // --- Boolean flags ---
  /** Allow terrain modification on this tile */
  allowMove?: boolean;
  /** Decorative tile (no collision) */
  isFrise?: boolean;
  /** Empty tile (no assets rendered) */
  empty?: boolean;

  // --- Optional numeric/color overrides ---
  /** Top color override [R, G, B] */
  colorT?: [number, number, number];
  /** Base color override [R, G, B] */
  color?: [number, number, number];
  /** Height override */
  h?: number;
  /** Level override — NOTE: mainLvl is set at runtime, not stored in config */
  lvl?: number;

  // --- Traceability fields (for round-trip consistency) ---
  /** Name of the getter that produced this tile (e.g., "Corner", "Wall_Door") */
  sourceGetter?: string;
  /** ID of the tile in the source asset collection */
  sourceTileId?: string;
  /** Name of the source asset collection */
  sourceCollection?: string;
}

// ============================================================================
// Type Guards / Utility Types
// ============================================================================

/**
 * Discriminated union for all config types.
 * Enables type-safe handling of both building and asset collection configs.
 */
export type AnyConfig = BuildingConfig | AssetCollectionConfig;

/**
 * Type guard to check if a config is a building configuration.
 */
export function isBuildingConfig(config: AnyConfig): config is BuildingConfig {
  return config.type === "building";
}

/**
 * Type guard to check if a config is an asset collection.
 */
export function isAssetCollectionConfig(
  config: AnyConfig,
): config is AssetCollectionConfig {
  return config.type === "assetCollection";
}

// ============================================================================
// Registry Re-exports (centralized in registries.ts)
// ============================================================================

export {
  ASSET_COLLECTION_REGISTRY,
  BUILDING_CLASSES,
  REGISTRY_ID_MAP,
} from "./registries.ts";
export type { AssetCollectionClassEntry } from "./registries.ts";
