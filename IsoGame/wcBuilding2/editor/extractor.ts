/**
 * Config Extractor — Runtime TS Class → JSON Extraction
 *
 * This module provides the `ConfigExtractor` class that instantiates TypeScript
 * building config classes and asset collections, extracts their tile definitions,
 * face constraints, and parameters, and serializes them into valid JSON.
 *
 * Two asset collection patterns are handled:
 * 1. **Getter-based** (WallHouse, WallManor, WallRLab): Tiles produced by individual
 *    getters like `Corner`, `Wall_Door`, etc. Each getter computes face keys dynamically
 *    using `tag + suffix`.
 * 2. **groupAsset-based** (FenceSimple, FencePlatform, FenceGrave): Tiles produced by
 *    calling `groupAsset({flatW, cornerW, innerW, isFrise})` with weight parameters.
 *
 * Face links are deduplicated (store only unique pairs, not bidirectional duplicates).
 * The runtime value `mainLvl` is explicitly excluded from extracted JSON.
 */

// ============================================================================
// Game imports (read-only)
// ============================================================================
import { WcAbstractBuildConf, WcConfTile } from "../wcAbstractBuildConf.ts";
import type { WcConfRawTile } from "../wcAbstractBuildConf.ts";

// Editor types
import type {
  AssetCollectionClassEntry,
  AssetCollectionConfig,
  AssetCollectionRef,
  BuildingConfig,
  ParamSchemaEntry,
  TileConfig,
} from "./types.ts";

// ============================================================================
// Building Config Class Registry
// Maps class names to constructors for instantiation during extraction.
// ============================================================================
import { WcBuildConf_HouseA } from "../conf/buildConf_HouseA.ts";
import { WcBuildConf_GraveA } from "../conf/buildConf_GraveA.ts";
import { WcBuildConf_ManorA } from "../conf/buildConf_ManorA.ts";
import { WcBuildConf_LabBorderA } from "../conf/buildConf_LabBorderA.ts";
import { WcBuildConf_LabPipeA } from "../conf/buildConf_LabPipeA.ts";
import { WcBuildConf_RLabA } from "../conf/buildConf_RLabA.ts";

// Asset collection class imports
import { WcAsset_WallHouse } from "../conf/assetsCollection/wcAsset_WallHouse.ts";
import { WcAsset_WallManor } from "../conf/assetsCollection/wcAsset_WallManor.ts";
import { WcAsset_WallRLab } from "../conf/assetsCollection/wcAsset_WallRLab.ts";
import {
  FenceCollapseType,
  WcAsset_FenceGrave,
  WcAsset_FencePlatform,
  WcAsset_FenceSimple,
} from "../conf/assetsCollection/wcAsset_Fence2.ts";
import { WcAsset_Enter } from "../conf/assetsCollection/wcAsset_Entrer.ts";
import { WcAsset_CorridorLab } from "../conf/assetsCollection/wcAsset_CorridorLab.ts";
import { WcAsset_CorridorPipe } from "../conf/assetsCollection/wcAsset_CorridorPipe.ts";
import { wcAsset_X } from "../conf/assetsCollection/wcAsset_X.ts";

// Registry ID map
import { REGISTRY_ID_MAP } from "./types.ts";

// ============================================================================
// Registry Definitions
// ============================================================================

/**
 * Maps building config class names to their constructor functions.
 */
export const BUILDING_CLASSES: Record<
  string,
  new (params?: Record<string, unknown>) => WcAbstractBuildConf
> = {
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
};

/**
 * Maps building config class names to their source file names.
 */
const BUILDING_SOURCE_FILES: Record<string, string> = {
  "WcBuildConf_HouseA": "buildConf_HouseA",
  "WcBuildConf_GraveA": "buildConf_GraveA",
  "WcBuildConf_ManorA": "buildConf_ManorA",
  "WcBuildConf_LabBorderA": "buildConf_LabBorderA",
  "WcBuildConf_LabPipeA": "buildConf_LabPipeA",
  "WcBuildConf_RLabA": "buildConf_RLabA",
};

/**
 * Asset collection class registry with per-class extraction configuration.
 * Defines how each class produces tiles.
 */
export const ASSET_COLLECTION_REGISTRY: Record<
  string,
  AssetCollectionClassEntry
> = {
  // Wall-based (getter-based)
  "WcAsset_WallHouse": {
    class: WcAsset_WallHouse as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallHouse",
    tileGetters: [
      "Corner",
      "Corner_B",
      "Wall",
      "Wall_Door",
      "Wall_Windows",
      "Wall_RoofWindows",
      "InnerCorner",
      "InnerCorner_X",
      "Inside_Full",
    ],
  },
  "WcAsset_WallManor": {
    class: WcAsset_WallManor as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallManor",
    tileGetters: [
      "Corner",
      "Wall_Door",
      "Wall",
      "Wall_Windows",
      "InnerCorner",
      "InnerCorner_X",
      "Inside_Full",
    ],
  },
  "WcAsset_WallRLab": {
    class: WcAsset_WallRLab as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_WallRLab",
    tileGetters: [
      "Corner",
      "Corner_Round",
      "Wall",
      "InnerCorner",
      "Inside_Full",
    ],
  },

  // Fence-based (groupAsset-based)
  "WcAsset_FenceSimple": {
    class: WcAsset_FenceSimple as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 10, cornerW: 10, innerW: 0, isFrise: false },
  },
  "WcAsset_FencePlatform": {
    class: WcAsset_FencePlatform as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: {
      flatW: 100,
      cornerW: 500,
      innerW: 400,
      isFrise: true,
    },
  },
  "WcAsset_FenceGrave": {
    class: WcAsset_FenceGrave as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Fence2",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 10, cornerW: 0, innerW: 13, isFrise: true },
  },

  // Entrance (special: has both groupInit and groupAsset)
  "WcAsset_Enter": {
    class: WcAsset_Enter as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_Entrer",
    usesGroupAsset: true,
    hasGroupInit: true,
    groupAssetDefaults: { flatW: 0, cornerW: 0, innerW: 0, isFrise: false },
  },

  // Lab corridors (getter-based)
  "WcAsset_CorridorLab": {
    class: WcAsset_CorridorLab as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_CorridorLab",
    tileGetters: [
      "Flat",
      "Flat_Detail",
      "Flat_Window",
      "Door",
      "Corner",
      "Corner_Round",
      "TJoin",
      "CrossJoin",
    ],
  },
  "WcAsset_CorridorPipe": {
    class: WcAsset_CorridorPipe as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_CorridorPipe",
    tileGetters: [
      "Flat",
      "Flat_NoSupport",
      "Flat_Ring",
      "Flat_Open",
      "Door",
      "Door2",
      "Corner",
      "Corner_Round",
      "TJoin",
      "CrossJoin",
      "Silo",
    ],
  },

  // Generic X tiles
  "WcAsset_X": {
    class: wcAsset_X as unknown as new (
      params?: Record<string, unknown>,
    ) => { tag: string; [key: string]: unknown },
    sourceFile: "wcAsset_X",
    usesGroupAsset: true,
    groupAssetDefaults: { flatW: 0, cornerW: 0, innerW: 0, isFrise: false },
  },
};

// ============================================================================
// ConfigExtractor — Main Extraction Class
// ============================================================================

/**
 * Extracts runtime TS class data into serializable JSON configurations.
 */
export class ConfigExtractor {
  // ============================================================================
  // Building Extraction
  // ============================================================================

  /**
   * Extract a building configuration from its TypeScript class.
   *
   * @param className The building config class name (e.g., "WcBuildConf_HouseA")
   * @param params Optional constructor parameter overrides
   * @returns Complete BuildingConfig JSON object
   */
  static extractBuilding(
    className: string,
    params: Record<string, unknown> = {},
  ): BuildingConfig {
    const ConfClass = BUILDING_CLASSES[className];
    if (!ConfClass) {
      throw new Error(`Unknown building config class: ${className}`);
    }

    // Instantiate and initialize
    const conf = new ConfClass(params as Record<string, never>);
    conf.init();

    // Extract asset collection references from the instance
    const assetCollections = this.extractAssetCollectionRefs(conf);

    // Extract face links and deduplicate
    const faceLinks = this.deduplicateFaceLinks(conf.faceLinks);

    // Extract tiles with traceability
    const startTiles = conf.startTileOptions.map((t) => this.tileToJson(t));
    const tiles = conf.listTileOptions.map((t) => this.tileToJson(t));

    // Build the complete config
    return {
      version: "1.0",
      type: "building",
      id: className.replace("WcBuildConf_", ""),
      metadata: {
        classRef: className,
        sourceFile: BUILDING_SOURCE_FILES[className] || className.toLowerCase(),
        registryId: REGISTRY_ID_MAP[className] || "",
      },
      params: {
        growLoopCount: conf.growLoopCount,
        endLoopMax: conf.endLoopMax,
        // NOTE: mainLvl is explicitly excluded — it is a runtime value set during generation
      },
      assetCollections,
      faceLinkWeight: { ...conf.faceLinkWeight },
      faceLinks,
      startTiles,
      tiles,
    };
  }

  // ============================================================================
  // Asset Collection Extraction
  // ============================================================================

  /**
   * Extract an asset collection from its TypeScript class.
   *
   * @param className The asset collection class name (e.g., "WcAsset_WallHouse")
   * @param params Optional constructor parameters
   * @returns Complete AssetCollectionConfig JSON object
   */
  static extractAssetCollection(
    className: string,
    params: Record<string, unknown> = {},
  ): AssetCollectionConfig {
    const entry = ASSET_COLLECTION_REGISTRY[className];
    if (!entry) {
      throw new Error(`Unknown asset collection class: ${className}`);
    }

    const instance = new entry.class(params);

    const tiles: TileConfig[] = [];

    if (entry.usesGroupAsset) {
      // groupAsset-based pattern (FenceSimple, FencePlatform, FenceGrave, Enter)
      const groupAssetMethod = (instance as any).groupAsset?.bind(instance);
      if (typeof groupAssetMethod === "function") {
        const groupTiles = groupAssetMethod(
          entry.groupAssetDefaults || {
            flatW: 0,
            cornerW: 0,
            innerW: 0,
            isFrise: false,
          },
        );
        for (const t of groupTiles) {
          tiles.push(this.tileToJson(t));
        }
      }

      // Special case: WcAsset_Enter has groupInit() for start tiles
      if (entry.hasGroupInit) {
        const groupInitMethod = (instance as any).groupInit?.bind(instance);
        if (typeof groupInitMethod === "function") {
          const initTiles = groupInitMethod();
          // These are start tiles, mark them differently
          // For now, we add them to the collection as a reference
        }
      }
    } else if (entry.tileGetters) {
      // Getter-based pattern (WallHouse, WallManor, WallRLab, CorridorLab, CorridorPipe)
      for (const getter of entry.tileGetters) {
        if (getter in instance) {
          const tile = (instance as any)[getter];
          if (tile) {
            tiles.push({
              ...this.tileToJson(tile),
              id: getter,
              sourceGetter: getter,
            });
          }
        }
      }
    }

    // Extract params from the instance
    const extractedParams = this.extractAssetParams(instance);
    const paramsSchema = this.buildParamsSchema(extractedParams, className);

    return {
      version: "1.0",
      type: "assetCollection",
      id: className.replace("WcAsset_", ""),
      metadata: {
        classRef: className,
        sourceFile: entry.sourceFile,
      },
      tag: instance.tag || "",
      params: extractedParams,
      paramsSchema,
      tiles,
    };
  }

  // ============================================================================
  // Asset Collection Reference Extraction
  // ============================================================================

  /**
   * Scan a building config instance and extract asset collection references.
   * Identifies which asset collections are used by the building.
   *
   * @param conf The building config instance
   * @returns Array of AssetCollectionRef
   */
  static extractAssetCollectionRefs(
    conf: WcAbstractBuildConf,
  ): AssetCollectionRef[] {
    const refs: AssetCollectionRef[] = [];
    const seen = new Set<string>();

    // Check known property names that hold asset collection instances
    // Each entry has a prop name and a guaranteed classRef for deduplication
    const assetCollectionProps: {
      prop: string;
      classRef: string;
      id: string;
    }[] = [
      // HouseA
      { prop: "houseSimple", classRef: "WcAsset_WallHouse", id: "WallHouse" },
      { prop: "fence", classRef: "WcAsset_FenceSimple", id: "FenceSimple" },
      {
        prop: "fencePlatform",
        classRef: "WcAsset_FencePlatform",
        id: "FencePlatform",
      },
      { prop: "enter", classRef: "WcAsset_Enter", id: "Enter" },
      // GraveA
      { prop: "fenceGrave", classRef: "WcAsset_FenceGrave", id: "FenceGrave" },
      // ManorA
      { prop: "wallManor", classRef: "WcAsset_WallManor", id: "WallManor" },
      // LabBorderA
      { prop: "corridor", classRef: "WcAsset_CorridorLab", id: "CorridorLab" },
      // LabPipeA
      {
        prop: "corridor",
        classRef: "WcAsset_CorridorPipe",
        id: "CorridorPipe",
      },
      // RLabA
      { prop: "wallRLab", classRef: "WcAsset_WallRLab", id: "WallRLab" },
      {
        prop: "corridorLab",
        classRef: "WcAsset_CorridorLab",
        id: "CorridorLab",
      },
    ];

    // Map class refs to source files
    const classToSource: Record<string, string> = {
      "WcAsset_WallHouse": "wcAsset_WallHouse",
      "WcAsset_WallManor": "wcAsset_WallManor",
      "WcAsset_WallRLab": "wcAsset_WallRLab",
      "WcAsset_FenceSimple": "wcAsset_Fence2",
      "WcAsset_FencePlatform": "wcAsset_Fence2",
      "WcAsset_FenceGrave": "wcAsset_Fence2",
      "WcAsset_Enter": "wcAsset_Entrer",
      "WcAsset_CorridorLab": "wcAsset_CorridorLab",
      "WcAsset_CorridorPipe": "wcAsset_CorridorPipe",
    };

    for (const entry of assetCollectionProps) {
      const instance = (conf as any)[entry.prop];
      if (instance) {
        const key = entry.classRef;
        if (seen.has(key)) continue;
        seen.add(key);

        const tag = instance?.tag || "";

        // Extract params from the instance
        const params = this.extractAssetParams(instance);

        refs.push({
          id: entry.id,
          classRef: entry.classRef,
          tag,
          params,
          sourceFile: classToSource[entry.classRef] ||
            entry.classRef.toLowerCase(),
        });
      }
    }

    return refs;
  }

  // ============================================================================
  // Tile JSON Conversion
  // ============================================================================

  /**
   * Convert a WcConfTile to a TileConfig for JSON serialization.
   *
   * @param tile The tile configuration object
   * @returns Serialized TileConfig
   */
  static tileToJson(tile: WcConfTile): TileConfig {
    return {
      face: tile.face ? [...tile.face] : [null, null, null, null],
      weight: tile.weight,
      assets: tile.assets ? tile.assets.map((a) => ({ ...a })) : undefined,
      functions: tile.functions
        ? tile.functions.map((f) => ({ ...f }))
        : undefined,
      allowMove: tile.allowMove,
      isFrise: tile.isFrise,
      empty: tile.empty,
      color: tile.color ? [...tile.color] : undefined,
      colorT: tile.colorT ? [...tile.colorT] : undefined,
      h: tile.h,
      // NOTE: lvl is excluded — it's a runtime value set during generation
    };
  }

  // ============================================================================
  // Face Link Deduplication
  // ============================================================================

  /**
   * Deduplicate face links by storing only unique pairs.
   *
   * The game's init() method doubles faceLinks to make them bidirectional.
   * For JSON storage, we only need unique pairs. The loader will expand
   * them back to bidirectional at load time.
   *
   * @param links Raw face links array (may contain bidirectional duplicates)
   * @returns Deduplicated array of [from, to] pairs
   */
  static deduplicateFaceLinks(links: [string, string][]): [string, string][] {
    const seen = new Set<string>();
    const result: [string, string][] = [];

    for (const [a, b] of links) {
      // Normalize pair to canonical form (sorted alphabetically)
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push([a, b]);
      }
    }

    return result;
  }

  // ============================================================================
  // Parameter Extraction Helpers
  // ============================================================================

  /**
   * Extract parameters from an asset collection instance.
   * Looks for known parameter properties on the instance.
   *
   * @param instance The asset collection instance
   * @returns Record of extracted parameters
   */
  private static extractAssetParams(
    instance: unknown,
  ): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    const obj = instance as Record<string, unknown>;

    // Known param properties to extract
    const paramKeys = [
      "WALL_SUFFIX",
      "ROOF_SUFFIX",
      "suffix",
      "WALL_PREFIX",
      "ROOF_PREFIX",
      "tag",
      "color",
      "collapseType",
    ];

    for (const key of paramKeys) {
      if (key in obj && obj[key] !== undefined) {
        const value = obj[key];
        if (
          typeof value === "string" || typeof value === "number" ||
          typeof value === "boolean"
        ) {
          params[key] = value;
        } else if (Array.isArray(value)) {
          params[key] = JSON.stringify(value);
        }
      }
    }

    return params;
  }

  /**
   * Build a parameter schema for UI rendering.
   * Maps parameter names to type hints and labels.
   *
   * @param params Extracted parameters
   * @param className The asset collection class name
   * @returns Parameter schema record
   */
  private static buildParamsSchema(
    params: Record<string, string | number | boolean>,
    className: string,
  ): Record<string, ParamSchemaEntry> {
    const schema: Record<string, ParamSchemaEntry> = {};

    // Suffix params are color-related
    const colorParams = [
      "WALL_SUFFIX",
      "ROOF_SUFFIX",
      "suffix",
      "FENCE_SUFFIX",
      "FENCE_PLATFORM_SUFFIX",
    ];

    for (const key of Object.keys(params)) {
      if (colorParams.includes(key)) {
        schema[key] = {
          type: "color",
          label: key
            .replace("_SUFFIX", "")
            .replace("_", " ")
            .replace(/([A-Z])/g, " $1")
            .trim() + " Color",
        };
      } else if (key === "tag") {
        schema[key] = {
          type: "string",
          label: "Tag Prefix",
        };
      } else if (key === "collapseType") {
        schema[key] = {
          type: "string",
          label: "Collapse Type",
        };
      } else if (typeof params[key] === "number") {
        schema[key] = {
          type: "number",
          label: key,
        };
      }
    }

    return schema;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * List all available building config class names.
   *
   * @returns Array of class names
   */
  static listBuildingClasses(): string[] {
    return Object.keys(BUILDING_CLASSES);
  }

  /**
   * List all available asset collection class names.
   *
   * @returns Array of class names
   */
  static listAssetCollectionClasses(): string[] {
    return Object.keys(ASSET_COLLECTION_REGISTRY);
  }

  /**
   * Get metadata about extractable configurations.
   *
   * @returns Summary of available classes and their patterns
   */
  static getExtractableSummary(): {
    buildings: string[];
    assetCollections: { name: string; pattern: string; classRef: string }[];
  } {
    const buildings = this.listBuildingClasses();
    const assetCollections = this.listAssetCollectionClasses().map((name) => {
      const entry = ASSET_COLLECTION_REGISTRY[name];
      return {
        name: name.replace("WcAsset_", ""),
        pattern: entry.usesGroupAsset
          ? "groupAsset"
          : entry.tileGetters
          ? "getter"
          : "unknown",
        classRef: name,
      };
    });

    return { buildings, assetCollections };
  }
}

/**
 * Run extraction of all building configs and asset collections.
 * Useful for validation and testing.
 *
 * @returns Object with all extracted configs
 */
export function extractAllConfigs(): {
  buildings: Record<string, BuildingConfig>;
  assetCollections: Record<string, AssetCollectionConfig>;
} {
  const buildings: Record<string, BuildingConfig> = {};
  const assetCollections: Record<string, AssetCollectionConfig> = {};

  // Extract all building configs
  for (const className of ConfigExtractor.listBuildingClasses()) {
    try {
      const id = className.replace("WcBuildConf_", "");
      // Reset random seed for consistent output by not overriding params
      buildings[id] = ConfigExtractor.extractBuilding(className);
    } catch (e) {
      console.error(`Failed to extract ${className}:`, e);
    }
  }

  // Extract all asset collections
  for (const className of ConfigExtractor.listAssetCollectionClasses()) {
    try {
      const id = className.replace("WcAsset_", "");
      assetCollections[id] = ConfigExtractor.extractAssetCollection(className);
    } catch (e) {
      console.error(`Failed to extract ${className}:`, e);
    }
  }

  return { buildings, assetCollections };
}
