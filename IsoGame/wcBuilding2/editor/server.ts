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
 * - POST /editor/save/building/:name                 — Save building JSON to disk
 * - POST /editor/save-as/building/:originalName/:newName — Save building as new file
 * - POST /editor/duplicate/building/:name/:newName   — Duplicate building config
 * - POST /editor/preview/generate                    — Run building generation preview
 * - GET  /editor/assets/list                         — List available game assets
 * - GET  /editor/asset-preview/:key                  — Get asset image for preview
 * - GET  /editor/load/building/:name                 — Load existing JSON building config
 * - POST /editor/validate/building                   — Validate building config
 * - POST /editor/validate-tile-refs/building         — Validate tile references
 * - POST /editor/sanitize/building                   — Sanitize building config
 * - GET  /editor/registry/building/:name/metadata    — Get config metadata
 * - DELETE /editor/config/building/:name             — Delete building config
 * - POST /editor/migrate/building                    — Migrate building config
 * - GET  /editor/versions                            — Get current and supported versions
 *
 * Asset collection endpoints are handled by assetCollectionRouter.
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { ConfigExtractor } from "./extractor.ts";
import { WcBuildFactoryGenarator } from "../wcBuildFactory.ts";
import type { BuildingConfig, TileConfig } from "./types.ts";
import { World } from "../../word.ts";
import { validateBuildingConfig, sanitizeBuildingConfig, formatValidationSummary, formatTileRefValidationSummary, validateTileReferences } from "./validation.ts";
import { CURRENT_VERSION, SUPPORTED_VERSIONS } from "./types.ts";
import { getBuildingsDir } from "./configPaths.ts";
import { buildTempConfig } from "./services/previewBuilder.ts";
import { generateAssetPreview } from "./services/assetPreview.ts";
import { assetCollectionRouter } from "./routes/assetCollection.ts";
import { buildingRouter } from "./routes/building.ts";

// ============================================================================
// Editor Router
// ============================================================================

const editorRouter = new Router();

// Register sub-routers
editorRouter.use(assetCollectionRouter.routes(), assetCollectionRouter.allowedMethods());
editorRouter.use(buildingRouter.routes(), buildingRouter.allowedMethods());

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
    const tsBuildings = ConfigExtractor.listBuildingClasses();
    const tsAssetCollections = ConfigExtractor.listAssetCollectionClasses();

    const jsonBuildings: string[] = [];
    const buildingsDir = getBuildingsDir();

    try {
      for await (const entry of Deno.readDir(buildingsDir)) {
        if (entry.name.endsWith(".json")) {
          jsonBuildings.push(entry.name.replace(".json", ""));
        }
      }
    } catch {
      // Directory doesn't exist yet — that's fine
    }

    ctx.response.body = {
      tsBuildings,
      tsAssetCollections,
      jsonBuildings,
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
// POST /editor/preview/generate — Run Building Generation Preview
// ============================================================================

editorRouter.post("/editor/preview/generate", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const configJson: BuildingConfig = await ctx.request.body.json();

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

    const tempConf = buildTempConfig(configJson);
    const world = World.getInstance();
    const generator = new WcBuildFactoryGenarator(world, tempConf);
    const success = generator.start2(0, 0);

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
    const assets: Array<{ key: string; category: string; filename: string }> = [];

    try {
      for await (const entry of Deno.readDir(assetDir)) {
        if (entry.isFile && entry.name.endsWith(".png")) {
          const key = entry.name.replace(".png", "");
          const match = key.match(/^([A-Za-z]+)/);
          const category = match ? match[1] : "Other";

          assets.push({ key, category, filename: entry.name });
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

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
// POST /editor/validate/building — Validate Building Config
// ============================================================================

editorRouter.post("/editor/validate/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

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
// POST /editor/validate-tile-refs/building — Validate Tile References
// ============================================================================

editorRouter.post("/editor/validate-tile-refs/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    let body: { collections?: Record<string, { tiles: TileConfig[] }> } = {};
    try {
      body = ctx.request.hasBody ? (await ctx.request.body.json()) as { collections?: Record<string, { tiles: TileConfig[] }> } : {};
    } catch { /* no body provided */ }

    const loadedCollections = new Map<string, { tiles: TileConfig[] }>();
    if (body.collections) {
      for (const [id, coll] of Object.entries(body.collections)) {
        loadedCollections.set(id, coll);
      }
    }

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
// POST /editor/sanitize/building — Sanitize Building Config
// ============================================================================

editorRouter.post("/editor/sanitize/building", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const config: BuildingConfig = await ctx.request.body.json();

    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    const sanitized = sanitizeBuildingConfig(structuredClone(config));
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
// GET /editor/registry/building/:name/metadata — Get Config Metadata
// ============================================================================

editorRouter.get("/editor/registry/building/:name/metadata", async (ctx) => {
  try {
    const { name } = ctx.params;

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing name parameter" };
      return;
    }

    const filePath = `${getBuildingsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: `Building config not found: ${name}` };
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
  const { key } = ctx.params;

  if (!key) {
    ctx.response.status = 400;
    ctx.response.body = "Missing key parameter";
    return;
  }

  const result = await generateAssetPreview(key);

  if ("error" in result) {
    if (result.error.includes("not found")) {
      ctx.response.status = 404;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = result.error;
    return;
  }

  ctx.response.headers.set("Content-Type", "image/png");
  ctx.response.headers.set("Cache-Control", "public, max-age=86400");
  ctx.response.body = result.buffer;
  ctx.response.status = 200;
});

// ============================================================================
// Export
// ============================================================================

export { editorRouter };