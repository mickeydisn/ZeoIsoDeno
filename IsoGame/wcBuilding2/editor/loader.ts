/**
 * ConfigLoader — JSON Config Loader for Runtime
 *
 * Enables loading edited JSON building configs back into the game at runtime.
 * Implements a fallback chain: JSON → TS Registry → TS Class → Error.
 *
 * Usage:
 *   import { ConfigLoader } from "../editor/loader.ts";
 *   const conf = await ConfigLoader.loadBuilding("house_a");
 *
 * Round-trip flow: extract (TS → JSON) → edit (UI) → save (JSON) → load (JSON → TS) → generate
 */

import { WcAbstractBuildConf, WcConfTile, WcConfTileAsset, WcConfTileFunction } from "../wcAbstractBuildConf.ts";
import type { WcFace } from "../wcBuildFace.ts";
import type { BuildingConfig, TileConfig } from "./types.ts";
import { getBuildingConfigEntry } from "../../tools/buildingConfigRegistry.ts";
import { CURRENT_VERSION } from "./types.ts";
import { migrateBuildingConfig, migrateAssetCollectionConfig, MigrationResult, isSupportedVersion } from "./migration.ts";
import { getBuildingPath, getBuildingsDir } from "./configPaths.ts";

// ============================================================================
// Index type for face key indexing
// ============================================================================
type WcKeyTileFace = string;

// Type for building config class constructor
type BuildConfCtor = new (params: { growLoopCount: number; endLoopMax: number }) => WcAbstractBuildConf;

// ============================================================================
// ConfigLoader — Static class for loading JSON configs at runtime
// ============================================================================

export class ConfigLoader {
  /**
   * Load a building configuration by ID, trying JSON first then falling back to TypeScript.
   *
   * Resolution chain:
   * 1. Try JSON file at `IsoGame/wcBuilding2/editor/conf/buildings/{id}.json`
   * 2. Fall back to TS registry via `buildingConfigRegistry.ts`
   * 3. Try instantiating by class name `WcBuildConf_{ClassName}`
   * 4. Throw error if nothing found
   *
   * @param id — Building config ID (e.g., "house_a", "HouseA")
   * @param params — Optional override params for generation
   * @returns A fully initialized WcAbstractBuildConf ready for generation
   */
  static async loadBuilding(
    id: string,
    params: { growLoopCount?: number; endLoopMax?: number } = {},
  ): Promise<WcAbstractBuildConf> {
    // Step 1: Try JSON first
    try {
      const jsonPath = getBuildingPath(id);
      const jsonText = await Deno.readTextFile(jsonPath);
      const jsonConfig: BuildingConfig = JSON.parse(jsonText);

      if (jsonConfig.type === "building") {
        // Migrate config if needed
        const migrationResult = this.migrateConfigIfNeeded(jsonConfig);
        if (!migrationResult.success) {
          console.warn(
            `Building config ${id} migration failed:`,
            migrationResult.warnings.join(", ")
          );
          // Still try to process if version is supported
          if (jsonConfig.version !== CURRENT_VERSION && !isSupportedVersion(jsonConfig.version)) {
            throw new Error(
              `Incompatible config version ${jsonConfig.version}. Expected ${CURRENT_VERSION}. ` +
              `Migration failed: ${migrationResult.warnings.join(", ")}`
            );
          }
        }
        return this.buildFromJSON(jsonConfig, params);
      }
    } catch (e) {
      // JSON file not found or invalid — fall through
      if (e instanceof Error && e.message.includes("not found") || e instanceof Deno.errors.NotFound) {
        // Expected case - file doesn't exist
      } else {
        // Re-throw unexpected errors
        throw e;
      }
    }

    // Step 2: Fall back to TS registry
    const registryEntry = getBuildingConfigEntry(id);
    if (registryEntry) {
      const growLoopCount = params.growLoopCount ?? registryEntry.defaultGrowLoop;
      const endLoopMax = params.endLoopMax ?? registryEntry.defaultEndLoop;
      const conf = registryEntry.createConfig({ growLoopCount, endLoopMax });
      conf.init();
      return conf;
    }

    // Step 3: Try by class name pattern
    const classNameCandidates = [
      id,
      `WcBuildConf_${id}`,
      `WcBuildConf_${id.charAt(0).toUpperCase() + id.slice(1)}`,
    ];

    for (const className of classNameCandidates) {
      try {
        const ctor = await this.tryImportClass(className);
        if (ctor) {
          const growLoopCount = params.growLoopCount ?? 50;
          const endLoopMax = params.endLoopMax ?? 200;
          const conf = new ctor({ growLoopCount, endLoopMax });
          conf.init();
          return conf;
        }
      } catch (_e) {
        // Class not found — try next candidate
      }
    }

    // Step 4: Nothing found
    throw new Error(`Building config not found: ${id}`);
  }

  /**
   * Migrate a config to the current version if needed.
   * Returns the migration result for logging/reporting.
   */
  private static migrateConfigIfNeeded(
    config: BuildingConfig,
  ): MigrationResult {
    if (config.version === CURRENT_VERSION) {
      return {
        success: true,
        originalVersion: config.version,
        migratedVersion: config.version,
        wasMigrated: false,
        appliedMigrations: [],
        warnings: [],
      };
    }

    const result = migrateBuildingConfig(config);
    if (result.success && result.wasMigrated) {
      // Update the config in place with migrated version
      config.version = result.migratedVersion as typeof config.version;
      console.log(
        `Config migrated: ${result.originalVersion} → ${result.migratedVersion} ` +
        `(${result.appliedMigrations.join(", ")})`
      );
    }
    return result;
  }

  /**
   * Convert a JSON BuildingConfig into a WcAbstractBuildConf instance.
   *
   * Key transformations:
   * - Expand unique faceLinks to bidirectional pairs
   * - Rebuild face indices via conf.init()
   * - Set mainLvl at runtime (not stored in JSON)
   *
   * @param json — Parsed BuildingConfig from JSON
   * @param params — Optional generation parameter overrides
   * @returns A fully initialized WcAbstractBuildConf
   */
  private static buildFromJSON(
    json: BuildingConfig,
    params: { growLoopCount?: number; endLoopMax?: number } = {},
  ): WcAbstractBuildConf {
    // Create config instance with generation parameters
    const growLoopCount = params.growLoopCount ?? json.params.growLoopCount ?? 50;
    const endLoopMax = params.endLoopMax ?? json.params.endLoopMax ?? 200;

    const conf = new WcAbstractBuildConf({ growLoopCount, endLoopMax });

    // Copy face link weights
    conf.faceLinkWeight = { ...json.faceLinkWeight };

    // Expand unique faceLinks to bidirectional pairs
    // JSON stores [a, b] only, but runtime needs both [a, b] and [b, a]
    conf.faceLinks = json.faceLinks.flatMap(
      ([a, b]) => [[a, b], [b, a]] as [string, string][],
    );

    // Convert tiles from JSON format to runtime format
    conf.startTileOptions = json.startTiles.map((t) => this.tileFromJSON(t));
    conf.listTileOptions = json.tiles.map((t) => this.tileFromJSON(t));

    // Set mainLvl at runtime (not stored in JSON)
    const mainLvl = 0;
    conf.mainLvl = mainLvl;
    conf.startTileOptions.forEach((t) => {
      t.lvl = mainLvl;
    });
    conf.listTileOptions.forEach((t) => {
      t.lvl = mainLvl;
    });

    // Rebuild face indices — this is critical for generation to work
    conf.init();

    return conf;
  }

  /**
   * Convert a JSON TileConfig into a runtime WcConfTile.
   *
   * @param json — TileConfig from JSON
   * @returns WcConfTile ready for use in generation
   */
  private static tileFromJSON(json: TileConfig): WcConfTile {
    const tileFace: WcFace = [
      json.face[0] ?? null,
      json.face[1] ?? null,
      json.face[2] ?? null,
      json.face[3] ?? null,
    ];

    const tile: WcConfTile = {
      face: tileFace,
      weight: json.weight ?? 0,
    };

    // Copy optional arrays
    if (json.assets && json.assets.length > 0) {
      tile.assets = json.assets.map((a) => this.assetFromJSON(a));
    }

    if (json.functions && json.functions.length > 0) {
      tile.functions = json.functions.map((f) => this.functionFromJSON(f));
    }

    // Copy boolean flags
    if (json.allowMove !== undefined) tile.allowMove = json.allowMove;
    if (json.isFrise !== undefined) tile.isFrise = json.isFrise;
    if (json.empty !== undefined) tile.empty = json.empty;

    // Copy optional overrides
    if (json.colorT) tile.colorT = json.colorT;
    if (json.color) tile.color = json.color;
    if (json.h !== undefined) tile.h = json.h;

    // Note: 'lvl' is set at runtime by the loader, not from JSON
    // Traceability fields (sourceGetter, sourceTileId, sourceCollection) are ignored at runtime

    return tile;
  }

  /**
   * Convert a JSON WcConfTileAsset into a runtime WcConfTileAsset.
   */
  private static assetFromJSON(json: WcConfTileAsset): WcConfTileAsset {
    const asset: WcConfTileAsset = {};
    if (json.key !== undefined) asset.key = json.key;
    if (json.keyR !== undefined) asset.keyR = json.keyR;
    if (json.sufix !== undefined) asset.sufix = json.sufix;
    if (json.h !== undefined) asset.h = json.h;
    if (json.off !== undefined) asset.off = { ...json.off };
    return asset;
  }

  /**
   * Convert a JSON WcConfTileFunction into a runtime WcConfTileFunction.
   */
  private static functionFromJSON(json: WcConfTileFunction): WcConfTileFunction {
    const fn: WcConfTileFunction = {};
    if (json.key !== undefined) fn.key = json.key;
    if (json.keyR !== undefined) fn.keyR = json.keyR;
    if (json.sufix !== undefined) fn.sufix = json.sufix;
    if (json.size !== undefined) fn.size = json.size;
    if (json.off !== undefined) fn.off = { ...json.off };
    return fn;
  }

  /**
   * Attempt to dynamically import a building config class by name.
   * This is used as a fallback when JSON and registry lookups fail.
   *
   * @param className — Full class name (e.g., "WcBuildConf_HouseA")
   * @returns The class constructor, or null if not found
   */
  private static async tryImportClass(className: string): Promise<BuildConfCtor | null> {
    const moduleMap: Record<string, string> = {
      "WcBuildConf_HouseA": "../conf/buildConf_HouseA.ts",
      "WcBuildConf_GraveA": "../conf/buildConf_GraveA.ts",
      "WcBuildConf_ManorA": "../conf/buildConf_ManorA.ts",
      "WcBuildConf_LabBorderA": "../conf/buildConf_LabBorderA.ts",
      "WcBuildConf_LabPipeA": "../conf/buildConf_LabPipeA.ts",
      "WcBuildConf_RLabA": "../conf/buildConf_RLabA.ts",
    };

    const modulePath = moduleMap[className];
    if (!modulePath) return null;

    try {
      const mod = await import(modulePath);
      const cls: BuildConfCtor | undefined = mod[className];
      if (!cls) return null;
      return cls;
    } catch (_e) {
      return null;
    }
  }

  /**
   * Check if a JSON config file exists for the given building ID.
   * Useful for determining whether a building has been edited and saved.
   *
   * @param id — Building config ID
   * @returns True if JSON config exists
   */
  static async hasJSONConfig(id: string): Promise<boolean> {
    try {
      const jsonPath = getBuildingPath(id);
      await Deno.stat(jsonPath);
      return true;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Load a SavedConfig manifest from the conf directory.
   * Returns metadata about saved configs without loading them.
   *
   * @returns Array of { id, version, tileCount } for each saved config
   */
  static async listSavedConfigs(): Promise<
    { id: string; version: string; tileCount: number }[]
  > {
    const configs: { id: string; version: string; tileCount: number }[] = [];
    const dirPath = getBuildingsDir();

    try {
      for await (const entry of Deno.readDir(dirPath)) {
        if (entry.name.endsWith(".json")) {
          try {
            const filePath = `${dirPath}/${entry.name}`;
            const content = await Deno.readTextFile(filePath);
            const json: BuildingConfig = JSON.parse(content);
            configs.push({
              id: entry.name.replace(".json", ""),
              version: json.version || "unknown",
              tileCount: json.tiles?.length ?? 0,
            });
          } catch (_e) {
            // Invalid JSON file — skip
          }
        }
      }
    } catch (_e) {
      // Directory doesn't exist — return empty list
    }

    return configs;
  }
}

// ============================================================================
// Helper: createBuildingConfig from registry (re-export with JSON-aware behavior)
// ============================================================================

/**
 * Create a building config, preferring JSON if available.
 * This is the recommended entry point for game code that wants to support
 * both JSON-edited configs and original TypeScript configs.
 *
 * @param id — Building config ID (e.g., "house_a")
 * @param options — Generation options (growLoopCount, endLoopMax)
 * @returns WcAbstractBuildConf instance, or null if not found
 */
export async function createBuildingConfigFromJSONOrRegistry(
  id: string,
  options: { growLoopCount: number; endLoopMax: number },
): Promise<WcAbstractBuildConf | null> {
  try {
    return await ConfigLoader.loadBuilding(id, options);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to load building config "${id}":`, errMsg);
    return null;
  }
}