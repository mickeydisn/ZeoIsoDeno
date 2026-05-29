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

import {
  WcAbstractBuildConf,
  WcConfTile,
} from "../../IsoGame/map/generator/wcBuilding2/wcAbstractBuildConf.ts";
import type { WcConfRawTile } from "../../IsoGame/map/generator/wcBuilding2/wcAbstractBuildConf.ts";

import type {
  AssetCollectionConfig,
  AssetCollectionRef,
  BuildingConfig,
  ParamSchemaEntry,
  TileConfig,
  TileGroupConfig,
  TileGroupItem,
} from "./types.ts";

/**
 * Interface for dynamic asset collection instances with optional methods and properties
 */
interface AssetCollectionInstance {
  groupAsset?: (options: Record<string, unknown>) => WcConfTile[];
  groupInit?: () => void;
  tag?: string;
  [key: string]: unknown;
}

/**
 * Interface for building configuration instances with dynamic asset collection properties
 */
interface BuildingConfigInstance extends WcAbstractBuildConf {
  [key: string]: unknown;
}

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
      version: "1.1",
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
      groups: (conf as BuildingConfigInstance).groups as
        | TileGroupConfig[]
        | undefined,
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

    const instance = new entry.class(params) as AssetCollectionInstance;
    const tiles: TileConfig[] = [];

    if (entry.usesGroupAsset) {
      const groupAssetMethod = instance.groupAsset?.bind(instance);
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
        const groupInitMethod = instance.groupInit?.bind(instance);
        if (typeof groupInitMethod === "function") {
          groupInitMethod(); // Called for side effects on start tiles
        }
      }
    } else if (entry.tileGetters) {
      for (const getter of entry.tileGetters) {
        if (getter in instance) {
          const tile = instance[getter];
          if (
            tile && typeof tile === "object" && "face" in tile &&
            "weight" in tile
          ) {
            tiles.push({
              ...this.tileToJson(tile as WcConfTile),
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
      version: "1.1",
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
      groups: instance.groups as TileGroupConfig[] | undefined,
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
      {
        prop: "fencePlatform",
        classRef: "WcAsset_FencePlatform",
        id: "FencePlatform",
      },
      { prop: "enter", classRef: "WcAsset_Enter", id: "Enter" },
      { prop: "fenceGrave", classRef: "WcAsset_FenceGrave", id: "FenceGrave" },
      { prop: "wallManor", classRef: "WcAsset_WallManor", id: "WallManor" },
      { prop: "corridor", classRef: "WcAsset_CorridorLab", id: "CorridorLab" },
      {
        prop: "corridor",
        classRef: "WcAsset_CorridorPipe",
        id: "CorridorPipe",
      },
      { prop: "wallRLab", classRef: "WcAsset_WallRLab", id: "WallRLab" },
      {
        prop: "corridorLab",
        classRef: "WcAsset_CorridorLab",
        id: "CorridorLab",
      },
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
      const instance = (conf as BuildingConfigInstance)[entry.prop];
      if (instance && typeof instance === "object") {
        const key = entry.classRef;
        if (seen.has(key)) continue;
        seen.add(key);

        const tag = (instance as AssetCollectionInstance).tag || "";
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
  // Tile Group Detection & Compression
  // ============================================================================

  /**
   * Create a consistent hash key from a face array for grouping
   */
  private static faceToKey(face: (string | null)[]): string {
    return face.map((f) => f ?? "null").join("|");
  }

  /**
   * Detect tile groups by common face signature
   * Groups tiles that share identical face property
   */
  static detectTileGroups(
    tiles: TileConfig[],
    minGroupSize: number = 2,
  ): { groups: TileGroupConfig[]; remainingTiles: TileConfig[] } {
    const faceGroups = new Map<string, TileConfig[]>();

    // Group tiles by face signature
    for (const tile of tiles) {
      const faceKey = this.faceToKey(tile.face);
      if (!faceGroups.has(faceKey)) {
        faceGroups.set(faceKey, []);
      }
      faceGroups.get(faceKey)!.push(tile);
    }

    const groups: TileGroupConfig[] = [];
    const remainingTiles: TileConfig[] = [];
    let groupCounter = 0;

    // Process groups
    for (const [faceKey, groupTiles] of faceGroups.entries()) {
      if (groupTiles.length >= minGroupSize) {
        // Create group config
        const group: TileGroupConfig = {
          id: `group_${groupCounter++}`,
          face: [...groupTiles[0].face],
          weight: groupTiles.reduce((sum, t) => sum + (t.weight ?? 1), 0) /
            groupTiles.length,
          items: groupTiles.map((tile) => {
            // Create group item without face property
            const { face, ...item } = tile;
            return item as TileGroupItem;
          }),
        };
        groups.push(group);
      } else {
        // Add small groups/individual tiles back to remaining
        remainingTiles.push(...groupTiles);
      }
    }

    return { groups, remainingTiles };
  }

  /**
   * Detect rotation variant groups (sets of 4 tiles that are exact rotations)
   *
   * Rotation variants have faces that are cyclic shifts of each other.
   * For example: [A,B,C,D], [D,A,B,C], [C,D,A,B], [B,C,D,A]
   *
   * Groups tiles by their canonical (lexicographically smallest) cyclic shift,
   * then forms groups only when exactly 4 tiles with distinct faces are found.
   */
  static detectRotationGroups(
    tiles: TileConfig[],
  ): { groups: TileGroupConfig[]; remainingTiles: TileConfig[] } {
    // Helper to compute all cyclic shifts of a face array
    const getCyclicShifts = (face: (string | null)[]): (string | null)[][] => {
      const shifts: (string | null)[][] = [];
      for (let i = 0; i < 4; i++) {
        shifts.push(face.slice(i).concat(face.slice(0, i)));
      }
      return shifts;
    };

    // Get canonical form: lexicographically smallest cyclic shift as a string key
    const getCanonicalKey = (face: (string | null)[]): string => {
      const shifts = getCyclicShifts(face);
      const sorted = shifts.map((s) => s.join(",")).sort();
      return sorted[0];
    };

    // Group tiles by their canonical face key
    const canonicalGroups = new Map<string, TileConfig[]>();

    for (const tile of tiles) {
      const face = tile.face || [null, null, null, null];
      const key = getCanonicalKey(face);
      if (!canonicalGroups.has(key)) {
        canonicalGroups.set(key, []);
      }
      canonicalGroups.get(key)!.push(tile);
    }

    const groups: TileGroupConfig[] = [];
    const remainingTiles: TileConfig[] = [];
    let groupCounter = 0;

    for (const [canonicalKey, groupTiles] of canonicalGroups.entries()) {
      // Only form rotation groups with exactly 4 tiles having distinct faces
      if (groupTiles.length === 4) {
        const faceStrings = groupTiles.map((t) =>
          (t.face || [null, null, null, null]).map((f) => f ?? "null").join(",")
        );
        const uniqueFaces = new Set(faceStrings);

        if (uniqueFaces.size === 4) {
          // Parse canonical face back to array
          const canonicalFace = canonicalKey.split(",").map((f) =>
            f === "null" ? null : f
          );

          // Create rotation group with canonical face
          const group: TileGroupConfig = {
            id: `rotation_group_${groupCounter++}`,
            face: canonicalFace,
            weight: groupTiles.reduce((sum, t) => sum + (t.weight ?? 1), 0) /
              groupTiles.length,
            items: groupTiles.map((tile) => {
              const { face, ...item } = tile;
              return item as TileGroupItem;
            }),
          };
          groups.push(group);
          continue;
        }
      }

      // Not a complete rotation group, add all to remaining
      remainingTiles.push(...groupTiles);
    }

    return { groups, remainingTiles };
  }

  /**
   * Compress tiles array into groups using configured thresholds
   */
  static compressTileGroups(tiles: TileConfig[], options: {
    enableCompression: boolean;
    minGroupSize?: number;
    detectRotations?: boolean;
  }): { groups: TileGroupConfig[]; tiles: TileConfig[] } {
    if (!options.enableCompression) {
      return { groups: [], tiles: [...tiles] };
    }

    const minSize = options.minGroupSize ?? 3;
    let currentTiles = [...tiles];
    const allGroups: TileGroupConfig[] = [];

    // First pass: simple face grouping
    const { groups: faceGroups, remainingTiles } = this.detectTileGroups(
      currentTiles,
      minSize,
    );
    allGroups.push(...faceGroups);
    currentTiles = remainingTiles;

    // Second pass: rotation group detection (if enabled)
    if (options.detectRotations) {
      const { groups: rotationGroups, remainingTiles: rotationRemaining } = this
        .detectRotationGroups(currentTiles);
      allGroups.push(...rotationGroups);
      currentTiles = rotationRemaining;
    }

    return {
      groups: allGroups,
      tiles: currentTiles,
    };
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
