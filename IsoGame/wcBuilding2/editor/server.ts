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
import type { BuildingConfig } from "./types.ts";
import { CURRENT_VERSION, SUPPORTED_VERSIONS } from "./types.ts";
import { getBuildingsDir } from "./configPaths.ts";
import { assetCollectionRouter } from "./routes/assetCollection.ts";
import { buildingRouter } from "./routes/building.ts";
import { previewRouter } from "./routes/preview.ts";
import { validationRouter } from "./routes/validation.ts";

// ============================================================================
// Editor Router
// ============================================================================

const editorRouter = new Router();

// Register sub-routers
editorRouter.use(assetCollectionRouter.routes(), assetCollectionRouter.allowedMethods());
editorRouter.use(buildingRouter.routes(), buildingRouter.allowedMethods());
editorRouter.use(previewRouter.routes(), previewRouter.allowedMethods());
editorRouter.use(validationRouter.routes(), validationRouter.allowedMethods());

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
// Export
// ============================================================================

export { editorRouter };
