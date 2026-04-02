/**
 * Extraction Engine — Core ConfigExtractor Logic
 *
 * This module contains the ConfigExtractor class and related extraction functions,
 * extracted from extractor.ts to separate core extraction logic from type definitions
 * and registry management.
 *
 * Handles two asset collection patterns:
 * 1. Getter-based (WallHouse, WallManor, WallRLab): Tiles from individual getters
 * 2. groupAsset-based (FenceSimple, FencePlatform, FenceGrave): Tiles from groupAsset()
 *
 * Face links are deduplicated. Runtime value mainLvl is explicitly excluded.
 */

import { WcAbstractBuildConf, WcConfTile } from "../wcAbstractBuildConf.ts";
import type { WcConfRawTile } from "../wcAbstractBuildConf.ts";

import type {
  AssetCollectionConfig,
  AssetCollectionRef,
  BuildingConfig,
  ParamSchemaEntry,
  TileConfig,
} from "./types.ts";

import {
  ASSET_COLLECTION_REGISTRY,
  BUILDING_CLASSES,
  BUILDING_SOURCE_FILES,
  REGISTRY_ID_MAP,
} from "./registries.ts";

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
   */
  static extractBuilding(
    className: string,
    params: Record<string, unknown> = {},
  ): BuildingConfig {
    const ConfClass = BUILDING_CLASSES[className];
    if (!ConfClass) {
      throw new Error(`Unknown building config class: ${className}`);
    }

    const conf = new ConfClass(params as Record<string, never>);
    conf.init();

    const assetCollections = this.extractAssetCollectionRefs(conf);
    const faceLinks = this.deduplicateFaceLinks(conf.faceLinks);
    const startTiles = conf.startTileOptions.map((t) => this.tileToJson(t));
    const tiles = conf.listTileOptions.map((t) => this.tileToJson(t));

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

      if (entry.hasGroupInit) {
        const groupInitMethod = (instance as any).groupInit?.bind(instance);
        if (typeof groupInitMethod === "function") {
          groupInitMethod(); // Called for side effects on start tiles
        }
      }
    } else if (entry.tileGetters) {
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
   */
  static extractAssetCollectionRefs(
    conf: WcAbstractBuildConf,
  ): AssetCollectionRef[] {
    const refs: AssetCollectionRef[] = [];
    const seen = new Set<string>();

    const assetCollectionProps: {
      prop: string;
      classRef: string;
      id: string;
    }[] = [
      { prop: "houseSimple", classRef: "WcAsset_WallHouse", id: "WallHouse" },
      { prop: "fence", classRef: "WcAsset_FenceSimple", id: "FenceSimple" },
      { prop: "fencePlatform", classRef: "WcAsset_FencePlatform", id: "FencePlatform" },
      { prop: "enter", classRef: "WcAsset_Enter", id: "Enter" },
      { prop: "fenceGrave", classRef: "WcAsset_FenceGrave", id: "FenceGrave" },
      { prop: "wallManor", classRef: "WcAsset_WallManor", id: "WallManor" },
      { prop: "corridor", classRef: "WcAsset_CorridorLab", id: "CorridorLab" },
      { prop: "corridor", classRef: "WcAsset_CorridorPipe", id: "CorridorPipe" },
      { prop: "wallRLab", classRef: "WcAsset_WallRLab", id: "WallRLab" },
      { prop: "corridorLab", classRef: "WcAsset_CorridorLab", id: "CorridorLab" },
    ];

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
        const params = this.extractAssetParams(instance);

        refs.push({
          id: entry.id,
          classRef: entry.classRef,
          tag,
          params,
          sourceFile: classToSource[entry.classRef] || entry.classRef.toLowerCase(),
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
    };
  }

  // ============================================================================
  // Face Link Deduplication
  // ============================================================================

  /**
   * Deduplicate face links by storing only unique pairs.
   */
  static deduplicateFaceLinks(links: [string, string][]): [string, string][] {
    const seen = new Set<string>();
    const result: [string, string][] = [];

    for (const [a, b] of links) {
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
   */
  private static extractAssetParams(
    instance: unknown,
  ): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    const obj = instance as Record<string, unknown>;

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
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
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
   */
  private static buildParamsSchema(
    params: Record<string, string | number | boolean>,
    _className: string,
  ): Record<string, ParamSchemaEntry> {
    const schema: Record<string, ParamSchemaEntry> = {};

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
        schema[key] = { type: "string", label: "Tag Prefix" };
      } else if (key === "collapseType") {
        schema[key] = { type: "string", label: "Collapse Type" };
      } else if (typeof params[key] === "number") {
        schema[key] = { type: "number", label: key };
      }
    }

    return schema;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * List all available building config class names.
   */
  static listBuildingClasses(): string[] {
    return Object.keys(BUILDING_CLASSES);
  }

  /**
   * List all available asset collection class names.
   */
  static listAssetCollectionClasses(): string[] {
    return Object.keys(ASSET_COLLECTION_REGISTRY);
  }

  /**
   * Get metadata about extractable configurations.
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
        pattern: entry.usesGroupAsset ? "groupAsset" : entry.tileGetters ? "getter" : "unknown",
        classRef: name,
      };
    });

    return { buildings, assetCollections };
  }
}

/**
 * Run extraction of all building configs and asset collections.
 * Useful for validation and testing.
 */
export function extractAllConfigs(): {
  buildings: Record<string, BuildingConfig>;
  assetCollections: Record<string, AssetCollectionConfig>;
} {
  const buildings: Record<string, BuildingConfig> = {};
  const assetCollections: Record<string, AssetCollectionConfig> = {};

  for (const className of ConfigExtractor.listBuildingClasses()) {
    try {
      const id = className.replace("WcBuildConf_", "");
      buildings[id] = ConfigExtractor.extractBuilding(className);
    } catch (e) {
      console.error(`Failed to extract ${className}:`, e);
    }
  }

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