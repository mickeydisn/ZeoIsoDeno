/**
 * Editor Server — Deno HTTP Endpoints
 *
 * This module provides isolated HTTP endpoints for the Building Config Editor's API.
 * All endpoints are mounted under `/editor/*` to avoid conflicts with game routes.
 *
 * Endpoints:
 * - GET  /editor/list/classes          — List extractable TS classes
 * - GET  /editor/list                  — List all configs (TS + existing JSON)
 * - POST /editor/extract/building/:className         — Extract building config to JSON
 * - POST /editor/extract/asset-collection/:className  — Extract asset collection to JSON
 * - POST /editor/save/building/:name                 — Save building JSON to disk
 * - POST /editor/save/asset-collection/:name         — Save asset collection JSON to disk
 * - POST /editor/preview/generate                    — Run building generation preview
 * - GET  /editor/assets/list                         — List available game assets
 * - GET  /editor/asset-preview/:key                  — Get asset image for preview
 * - GET  /editor/load/building/:name                 — Load existing JSON building config
 * - GET  /editor/load/asset-collection/:name         — Load existing JSON asset collection config
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { ConfigExtractor } from "./extractor.ts";
import { WcBuildFactoryGenarator } from "../wcBuildFactory.ts";
import { WcAbstractBuildConf } from "../wcAbstractBuildConf.ts";
import type { BuildingConfig, AssetCollectionConfig } from "./types.ts";
import { World } from "../../word.ts";
import { validateBuildingConfig, sanitizeBuildingConfig, formatValidationSummary, formatTileRefValidationSummary, ValidationSeverity, validateTileReferences } from "./validation.ts";
import { 
  migrateBuildingConfig, 
  migrateAssetCollectionConfig, 
  isSupportedVersion, 
  getVersionStatus,
  needsMigration 
} from "./migration.ts";
import { CURRENT_VERSION, SUPPORTED_VERSIONS } from "./types.ts";
import {
  getBuildingsDir,
  getAssetCollectionsDir,
  ensureDir,
} from "./configPaths.ts";
import { duplicateConfig } from "./services/duplicateConfig.ts";
import sharp from "npm:sharp";

// ============================================================================
// Editor Router
// ============================================================================

const editorRouter = new Router();

// ============================================================================
// GET /editor/list/classes — List Extractable TS Classes
// ============================================================================

editorRouter.get("/editor/list/classes", (ctx) => {
  try {
    const buildingClasses = ConfigExtractor.listBuildingClasses();
    const assetCollectionClasses = ConfigExtractor.listAssetCollectionClasses();

    ctx.response.body = {
      buildings: buildingClasses,
      assetCollections: assetCollectionClasses,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to list classes: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// GET /editor/list — List All Configs (TS + JSON)
// ============================================================================

editorRouter.get("/editor/list", async (ctx) => {
  try {
    // TS classes from extractor
    const tsBuildings = ConfigExtractor.listBuildingClasses();
    const tsAssetCollections = ConfigExtractor.listAssetCollectionClasses();

    // Scan for existing JSON files
    const jsonBuildings: string[] = [];
    const jsonAssetCollections: string[] = [];

    const buildingsDir = getBuildingsDir();
    const assetCollectionsDir = getAssetCollectionsDir();

    // Scan buildings directory
    try {
      for await (const entry of Deno.readDir(buildingsDir)) {
        if (entry.name.endsWith(".json")) {
          jsonBuildings.push(entry.name.replace(".json", ""));
        }
      }
    } catch {
      // Directory doesn't exist yet — that's fine
    }

    // Scan asset collections directory
    try {
      for await (const entry of Deno.readDir(assetCollectionsDir)) {
        if (entry.name.endsWith(".json")) {
          jsonAssetCollections.push(entry.name.replace(".json", ""));
        }
      }
    } catch {
      // Directory doesn't exist yet — that's fine
    }

    ctx.response.body = {
      tsBuildings,
      tsAssetCollections,
      jsonBuildings,
      jsonAssetCollections,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to list configs: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/extract/building/:className — Extract Building Config
// ============================================================================

editorRouter.post("/editor/extract/building/:className", async (ctx) => {
  try {
    const { className } = ctx.params;

    if (!className) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing className parameter",
      };
      return;
    }

    // Optionally accept params override in request body
    let params: Record<string, unknown> = {};
    if (ctx.request.hasBody) {
      try {
        params = await ctx.request.body.json() as Record<string, unknown>;
      } catch {
        // No body or invalid JSON — use defaults
      }
    }

    const config = ConfigExtractor.extractBuilding(className, params);

    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = config;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to extract building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/extract/asset-collection/:className — Extract Asset Collection
// ============================================================================

editorRouter.post(
  "/editor/extract/asset-collection/:className",
  async (ctx) => {
    try {
      const { className } = ctx.params;

      if (!className) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Missing className parameter",
        };
        return;
      }

      // Optionally accept params override in request body
      let params: Record<string, unknown> = {};
      if (ctx.request.hasBody) {
        try {
          params = await ctx.request.body.json() as Record<string, unknown>;
        } catch {
          // No body or invalid JSON — use defaults
        }
      }

      const config = ConfigExtractor.extractAssetCollection(className, params);

      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.body = config;
      ctx.response.status = 200;
    } catch (error: unknown) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `Failed to extract asset collection: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
);

// ============================================================================
// POST /editor/save/building/:name — Save Building JSON to Disk
// ============================================================================

editorRouter.post("/editor/save/building/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    // Read and validate JSON body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    // Validate required fields
    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    if (config.version !== CURRENT_VERSION) {
      // Check if we can migrate
      if (isSupportedVersion(config.version)) {
        // Attempt migration
        const migrationResult = migrateBuildingConfig(config);
        if (!migrationResult.success) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: `Config version ${config.version} migration failed: ${migrationResult.warnings.join(", ")}`,
          };
          return;
        }
        // Use migrated config
        config.version = migrationResult.migratedVersion as typeof config.version;
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: `Unsupported config version: '${config.version}'. Current version is '${CURRENT_VERSION}'. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
        };
        return;
      }
    }

    // Ensure directory exists
    const dir = getBuildingsDir();
    await ensureDir(dir);

    // Write file
    const filePath = `${dir}/${name}.json`;
    await Deno.writeTextFile(filePath, JSON.stringify(config, null, 2));

    ctx.response.body = {
      success: true,
      path: filePath,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to save building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/save-as/building/:originalName/:newName — Save Building as New JSON File
// ============================================================================

editorRouter.post("/editor/save-as/building/:originalName/:newName", async (ctx) => {
  const { originalName, newName } = ctx.params;
  const result = await duplicateConfig("building", originalName || "", newName || "");

  if (!result.success) {
    if (result.error?.includes("already exists")) {
      ctx.response.status = 409;
    } else if (result.error?.includes("not found")) {
      ctx.response.status = 404;
    } else if (result.error?.includes("Invalid name")) {
      ctx.response.status = 400;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = { success: false, error: result.error };
    return;
  }

  ctx.response.body = { success: true, path: result.path, newName: result.newName };
  ctx.response.status = 200;
});

// ============================================================================
// POST /editor/save-as/asset-collection/:originalName/:newName — Save Asset Collection as New
// ============================================================================

editorRouter.post(
  "/editor/save-as/asset-collection/:originalName/:newName",
  async (ctx) => {
    const { originalName, newName } = ctx.params;
    const result = await duplicateConfig("asset-collection", originalName || "", newName || "");

    if (!result.success) {
      if (result.error?.includes("already exists")) {
        ctx.response.status = 409;
      } else if (result.error?.includes("not found")) {
        ctx.response.status = 404;
      } else if (result.error?.includes("Invalid name")) {
        ctx.response.status = 400;
      } else {
        ctx.response.status = 500;
      }
      ctx.response.body = { success: false, error: result.error };
      return;
    }

    ctx.response.body = { success: true, path: result.path, newName: result.newName };
    ctx.response.status = 200;
  },
);

// ============================================================================
// POST /editor/save/asset-collection/:name — Save Asset Collection JSON to Disk
// ============================================================================

editorRouter.post("/editor/save/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    // Read and validate JSON body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: AssetCollectionConfig = await ctx.request.body.json();

    // Validate required fields
    if (config.type !== "assetCollection") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'assetCollection'",
      };
      return;
    }

    // Ensure directory exists
    const dir = getAssetCollectionsDir();
    await ensureDir(dir);

    // Write file
    const filePath = `${dir}/${name}.json`;
    await Deno.writeTextFile(filePath, JSON.stringify(config, null, 2));

    ctx.response.body = {
      success: true,
      path: filePath,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to save asset collection: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/preview/generate — Run Building Generation Preview
// ============================================================================

editorRouter.post("/editor/preview/generate", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const configJson: BuildingConfig = await ctx.request.body.json();

    // Validate params are within safe range
    const growLoopCount = configJson.params?.growLoopCount ?? 50;
    const endLoopMax = configJson.params?.endLoopMax ?? 200;

    if (growLoopCount < 5 || growLoopCount > 100) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `growLoopCount must be between 5 and 100, got ${growLoopCount}`,
      };
      return;
    }

    if (endLoopMax < 50 || endLoopMax > 1000) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `endLoopMax must be between 50 and 1000, got ${endLoopMax}`,
      };
      return;
    }

    // Build temp config from JSON
    const tempConf = buildTempConfig(configJson);

    // Get World instance for factory
    const world = World.getInstance();

    // Create generator and run
    const generator = new WcBuildFactoryGenarator(world, tempConf);
    const success = generator.start2(0, 0);

    // Extract tile data for preview (cast to access protected members)
    const genResult = (generator as unknown as Record<string, unknown>);
    const allTiles = (genResult.allTiles || []) as Array<{
      x: number; y: number; possibleFace?: (string | null)[][]; isFaceConfigured?: boolean;
    }>;
    const tiles = allTiles.map((tile) => ({
      x: tile.x,
      y: tile.y,
      tileType: tile.possibleFace?.[0]?.join("|") || "none",
      face: tile.possibleFace || [],
      isConfigured: tile.isFaceConfigured,
    }));

    ctx.response.body = {
      success,
      tiles,
      iterations: growLoopCount + endLoopMax,
      stats: {
        totalTiles: tiles.length,
        configuredTiles: tiles.filter((t) => t.isConfigured).length,
      },
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to generate preview: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.error("Preview generation error:", error);
  }
});

// ============================================================================
// GET /editor/assets/list — List Available Game Assets
// ============================================================================

editorRouter.get("/editor/assets/list", async (ctx) => {
  try {
    const assetDir = `${Deno.cwd()}/img/asset_opti`;
    const assets: Array<{
      key: string;
      category: string;
      filename: string;
    }> = [];

    try {
      for await (const entry of Deno.readDir(assetDir)) {
        if (entry.isFile && entry.name.endsWith(".png")) {
          const key = entry.name.replace(".png", "");
          // Infer category from filename prefix (before first number or capital letter)
          const match = key.match(/^([A-Za-z]+)/);
          const category = match ? match[1] : "Other";

          assets.push({
            key,
            category,
            filename: entry.name,
          });
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    // Group by category
    const grouped = assets.reduce((acc, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = [];
      }
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, typeof assets>);

    ctx.response.body = {
      assets,
      categories: Object.keys(grouped).sort(),
      total: assets.length,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to list assets: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// GET /editor/load/building/:name — Load Existing JSON Building Config
// ============================================================================

editorRouter.get("/editor/load/building/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    const filePath = `${getBuildingsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Building config not found: ${name}`,
      };
      return;
    }

    const content = await Deno.readTextFile(filePath);
    const config: BuildingConfig = JSON.parse(content);

    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = config;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to load building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// GET /editor/load/asset-collection/:name — Load Existing JSON Asset Collection Config
// ============================================================================

editorRouter.get("/editor/load/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    const filePath = `${getAssetCollectionsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Asset collection config not found: ${name}`,
      };
      return;
    }

    const content = await Deno.readTextFile(filePath);
    const config: AssetCollectionConfig = JSON.parse(content);

    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = config;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to load asset collection config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/validate/building — Validate Building Config
// ============================================================================

editorRouter.post("/editor/validate/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    // Validate type
    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    // Run validation
    const result = validateBuildingConfig(config);

    ctx.response.body = {
      success: result.valid,
      valid: result.valid,
      issues: result.issues,
      summary: formatValidationSummary(result),
      stats: {
        totalTiles: result.stats.totalTiles,
        uniqueFaceKeysInTiles: Array.from(result.stats.uniqueFaceKeysInTiles),
        uniqueFaceKeysInLinks: Array.from(result.stats.uniqueFaceKeysInLinks),
        orphanedFaceKeys: result.stats.orphanedFaceKeys,
        missingWeightEntries: result.stats.missingWeightEntries,
      },
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to validate config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/validate-tile-refs/building — Validate Tile References in Building Config
// ============================================================================

editorRouter.post("/editor/validate-tile-refs/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    // Validate type
    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    // Read body for optional loaded collections
    let body: { collections?: Record<string, { tiles: any[] }> } = {};
    try {
      body = ctx.request.hasBody ? await ctx.request.body.json() : {};
    } catch { /* no body provided */ }

    // Build loaded collections map for sourceTileId validation
    const loadedCollections = new Map<string, { tiles: any[] }>();
    if (body.collections) {
      for (const [id, coll] of Object.entries(body.collections)) {
        loadedCollections.set(id, coll);
      }
    }

    // Run tile reference validation
    const result = validateTileReferences(config, loadedCollections);

    ctx.response.body = {
      success: result.valid,
      valid: result.valid,
      issues: result.issues,
      summary: formatTileRefValidationSummary(result),
      stats: result.stats,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to validate tile references: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/sanitize/building — Sanitize Building Config (fix common issues)
// ============================================================================

editorRouter.post("/editor/sanitize/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    // Validate type
    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    // Sanitize the config
    const sanitized = sanitizeBuildingConfig(structuredClone(config));

    // Re-validate to show what was fixed
    const result = validateBuildingConfig(sanitized);

    ctx.response.body = {
      success: true,
      config: sanitized,
      validationResult: {
        valid: result.valid,
        issues: result.issues,
        summary: formatValidationSummary(result),
      },
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to sanitize config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// GET /editor/registry/building/:id/metadata — Get Config Metadata
// ============================================================================

editorRouter.get("/editor/registry/building/:name/metadata", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    const filePath = `${getBuildingsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Building config not found: ${name}`,
      };
      return;
    }

    const content = await Deno.readTextFile(filePath);
    let config: BuildingConfig;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      ctx.response.status = 422;
      ctx.response.body = {
        success: false,
        error: `Corrupted JSON file: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
      };
      return;
    }

    // Return metadata with additional info
    ctx.response.body = {
      success: true,
      id: config.id,
      type: config.type,
      version: config.version,
      metadata: config.metadata,
      tileCount: config.tiles?.length || 0,
      assetCollectionCount: config.assetCollections?.length || 0,
      lastModified: (await Deno.stat(filePath)).mtime,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to get config metadata: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// DELETE /editor/config/building/:name — Delete Building Config
// ============================================================================

editorRouter.delete("/editor/config/building/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    const filePath = `${getBuildingsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Building config not found: ${name}`,
      };
      return;
    }

    await Deno.remove(filePath);

    ctx.response.body = {
      success: true,
      deleted: name,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to delete building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// DELETE /editor/config/asset-collection/:name — Delete Asset Collection Config
// ============================================================================

editorRouter.delete("/editor/config/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing name parameter",
      };
      return;
    }

    const filePath = `${getAssetCollectionsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Asset collection config not found: ${name}`,
      };
      return;
    }

    await Deno.remove(filePath);

    ctx.response.body = {
      success: true,
      deleted: name,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to delete asset collection config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/duplicate/building/:name/:newName — Duplicate Building Config
// ============================================================================

editorRouter.post("/editor/duplicate/building/:name/:newName", async (ctx) => {
  const { name, newName } = ctx.params;
  const result = await duplicateConfig("building", name || "", newName || "");

  if (!result.success) {
    if (result.error?.includes("already exists")) {
      ctx.response.status = 409;
    } else if (result.error?.includes("not found")) {
      ctx.response.status = 404;
    } else if (result.error?.includes("Invalid name")) {
      ctx.response.status = 400;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = { success: false, error: result.error };
    return;
  }

  ctx.response.body = { success: true, path: result.path, newName: result.newName };
  ctx.response.status = 200;
});

// ============================================================================
// POST /editor/duplicate/asset-collection/:name/:newName — Duplicate Asset Collection Config
// ============================================================================

editorRouter.post("/editor/duplicate/asset-collection/:name/:newName", async (ctx) => {
  const { name, newName } = ctx.params;
  const result = await duplicateConfig("asset-collection", name || "", newName || "");

  if (!result.success) {
    if (result.error?.includes("already exists")) {
      ctx.response.status = 409;
    } else if (result.error?.includes("not found")) {
      ctx.response.status = 404;
    } else if (result.error?.includes("Invalid name")) {
      ctx.response.status = 400;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = { success: false, error: result.error };
    return;
  }

  ctx.response.body = { success: true, path: result.path, newName: result.newName };
  ctx.response.status = 200;
});

// ============================================================================
// POST /editor/migrate/building — Migrate Building Config to Current Version
// ============================================================================

editorRouter.post("/editor/migrate/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    // Validate type
    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    // Check if migration is needed
    if (!needsMigration(config)) {
      ctx.response.body = {
        success: true,
        config,
        migrationResult: {
          originalVersion: config.version,
          migratedVersion: config.version,
          wasMigrated: false,
          appliedMigrations: [],
          warnings: [],
        },
        versionStatus: getVersionStatus(config),
      };
      ctx.response.status = 200;
      return;
    }

    // Perform migration
    const migrationResult = migrateBuildingConfig(config);

    ctx.response.body = {
      success: migrationResult.success,
      config: migrationResult.success ? config : null,
      migratedConfig: migrationResult.success ? { ...config, version: migrationResult.migratedVersion } : null,
      migrationResult,
      versionStatus: getVersionStatus(config),
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to migrate config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/migrate/asset-collection — Migrate Asset Collection Config
// ============================================================================

editorRouter.post("/editor/migrate/asset-collection", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing request body",
      };
      return;
    }

    const config: AssetCollectionConfig = await ctx.request.body.json();

    // Validate type
    if (config.type !== "assetCollection") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'assetCollection'",
      };
      return;
    }

    // Check if migration is needed
    if (!needsMigration(config)) {
      ctx.response.body = {
        success: true,
        config,
        migrationResult: {
          originalVersion: config.version,
          migratedVersion: config.version,
          wasMigrated: false,
          appliedMigrations: [],
          warnings: [],
        },
        versionStatus: getVersionStatus(config),
      };
      ctx.response.status = 200;
      return;
    }

    // Perform migration
    const migrationResult = migrateAssetCollectionConfig(config);

    ctx.response.body = {
      success: migrationResult.success,
      config: migrationResult.success ? config : null,
      migratedConfig: migrationResult.success ? { ...config, version: migrationResult.migratedVersion } : null,
      migrationResult,
      versionStatus: getVersionStatus(config),
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to migrate config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// GET /editor/versions — Get Current and Supported Versions
// ============================================================================

editorRouter.get("/editor/versions", (ctx) => {
  ctx.response.body = {
    currentVersion: CURRENT_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
  };
  ctx.response.status = 200;
});

// ============================================================================
// GET /editor/asset-preview/:key — Get Asset Image for Preview
// ============================================================================

editorRouter.get("/editor/asset-preview/:key", async (ctx) => {
  try {
    const { key } = ctx.params;

    if (!key) {
      ctx.response.status = 400;
      ctx.response.body = "Missing key parameter";
      return;
    }

    // First, try to load as a standalone PNG file
    const standalonePath = `${Deno.cwd()}/img/asset_opti/${key}.png`;
    try {
      await Deno.stat(standalonePath);
      const file = await Deno.readFile(standalonePath);
      ctx.response.headers.set("Content-Type", "image/png");
      ctx.response.headers.set("Cache-Control", "public, max-age=86400");
      ctx.response.body = file;
      ctx.response.status = 200;
      return;
    } catch {
      // Not a standalone file, try to extract from spritesheet config
    }

    // Parse key to extract from spritesheet: key can be "label" or "label_DIRECTION" or "label#filters"
    const [baseKey] = key.split("#");
    const directionMatch = baseKey.match(/^(.+?)_(NE|NW|SE|SW|N|S|E|W)$/);
    const assetLabel = directionMatch ? directionMatch[1] : baseKey;
    const direction = directionMatch ? directionMatch[2] : "NE";

    // Load asset config to find the spritesheet
    const { assetOptiConfig } = await import("../../mapIso/asset/assetOptiConfig.ts");
    
    let foundConfig: { src: string; top: number; imgHeight: number; imgWidth: number; scall?: boolean } | null = null;
    
    for (const group of assetOptiConfig) {
      const imageConfig = group.images.find(img => img.label === assetLabel);
      if (imageConfig) {
        foundConfig = {
          src: group.src,
          top: imageConfig.top,
          imgHeight: group.imgHeight,
          imgWidth: group.imgWidth,
          scall: group.scall,
        };
        break;
      }
    }

    if (!foundConfig) {
      ctx.response.status = 404;
      ctx.response.body = `Asset not found: ${key} (label: ${assetLabel})`;
      return;
    }

    // Load the spritesheet using sharp (Deno-compatible via npm:)
    const spritesheetPath = `${Deno.cwd()}/${foundConfig.src.replace(/^\.\//, "")}`;
    try {
      await Deno.stat(spritesheetPath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = `Spritesheet not found: ${spritesheetPath}`;
      return;
    }

    // Calculate cut parameters (matching AssetLoaderOpti logic)
    const wCutSize = 192; // 256 - 64
    const hCutSize = 224; // 256 - 32
    const scall = foundConfig.scall ? 0.7 : 1;

    // Direction determines which column to extract (0=NE, 1=NW, 2=SW, 3=SE)
    const directionColumns: Record<string, number> = {
      "NE": 0, "NW": 1, "SW": 2, "SE": 3,
      "N": 4, "W": 5, "S": 6, "E": 7,
    };
    const column = directionColumns[direction] ?? 0;

    // Calculate the row index from the top value
    const rowIndex = foundConfig.top / foundConfig.imgHeight;

    // Calculate source rectangle for extraction
    const srcX = wCutSize * column + Math.floor(wCutSize * ((1 - scall) / 2));
    const srcY = hCutSize * rowIndex + Math.floor(hCutSize * (1 - scall));
    const srcW = Math.floor(wCutSize * scall);
    const srcH = hCutSize + 128;

    // Use sharp to extract and resize the sprite
    const extractedImage = await sharp(spritesheetPath)
      .extract({ left: srcX, top: srcY, width: srcW, height: srcH })
      .resize({
        width: wCutSize,
        height: Math.floor(hCutSize / scall) + 128,
        fit: "fill",
      })
      .png()
      .toBuffer();

    ctx.response.headers.set("Content-Type", "image/png");
    ctx.response.headers.set("Cache-Control", "public, max-age=86400");
    ctx.response.body = extractedImage;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = `Failed to load asset: ${error instanceof Error ? error.message : String(error)}`;
  }
});

/**
 * Build a temporary WcAbstractBuildConf from JSON config for preview generation.
 * Expands unique faceLinks to bidirectional pairs and maps tiles to game format.
 */
function buildTempConfig(json: BuildingConfig): WcAbstractBuildConf {
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
    tileFromJSON,
  );

  // Map tiles
  conf.listTileOptions = (json.tiles || []).map(tileFromJSON);

  return conf;
}

/**
 * Convert a TileConfig JSON object back to a WcConfTile.
 */
function tileFromJSON(jsonTile: {
  face: (string | null)[];
  weight: number;
  assets?: Array<{
    key?: string;
    keyR?: number;
    sufix?: string;
    h?: number;
    off?: { x: number; y: number };
  }>;
  functions?: Array<{ key?: string; keyR?: number; sufix?: string; size?: number; off?: { x: number; y: number } }>;
  allowMove?: boolean;
  isFrise?: boolean;
  empty?: boolean;
  color?: [number, number, number];
  colorT?: [number, number, number];
  h?: number;
  lvl?: number;
}): any {
  const tile: any = {
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

// ============================================================================
// Export
// ============================================================================

export { editorRouter };