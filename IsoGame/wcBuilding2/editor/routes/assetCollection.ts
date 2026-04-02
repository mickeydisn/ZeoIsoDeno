/**
 * Asset Collection Routes — Editor HTTP Endpoints
 *
 * Extracted from server.ts: all `/editor/*asset-collection*` endpoints.
 * Handles extraction, saving, loading, duplication, deletion, and migration
 * of asset collection configurations.
 *
 * Endpoints:
 * - POST /editor/extract/asset-collection/:className
 * - POST /editor/save/asset-collection/:name
 * - POST /editor/save-as/asset-collection/:originalName/:newName
 * - POST /editor/duplicate/asset-collection/:name/:newName
 * - GET  /editor/load/asset-collection/:name
 * - DELETE /editor/config/asset-collection/:name
 * - POST /editor/migrate/asset-collection
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { ConfigExtractor } from "../extractor.ts";
import type { AssetCollectionConfig } from "../types.ts";
import {
  getAssetCollectionsDir,
  ensureDir,
} from "../configPaths.ts";
import { duplicateConfig } from "../services/duplicateConfig.ts";
import {
  migrateAssetCollectionConfig,
  needsMigration,
  getVersionStatus,
} from "../migration.ts";

const router = new Router();

// POST /editor/extract/asset-collection/:className
router.post(
  "/editor/extract/asset-collection/:className",
  async (ctx) => {
    try {
      const { className } = ctx.params;
      if (!className) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Missing className parameter" };
        return;
      }

      let params: Record<string, unknown> = {};
      if (ctx.request.hasBody) {
        try {
          params = await ctx.request.body.json() as Record<string, unknown>;
        } catch { /* No body or invalid JSON — use defaults */ }
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

// POST /editor/save/asset-collection/:name
router.post("/editor/save/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing name parameter" };
      return;
    }

    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const config: AssetCollectionConfig = await ctx.request.body.json();

    if (config.type !== "assetCollection") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'assetCollection'",
      };
      return;
    }

    const dir = getAssetCollectionsDir();
    await ensureDir(dir);

    const filePath = `${dir}/${name}.json`;
    await Deno.writeTextFile(filePath, JSON.stringify(config, null, 2));

    ctx.response.body = { success: true, path: filePath };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to save asset collection: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// POST /editor/save-as/asset-collection/:originalName/:newName
router.post(
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

// POST /editor/duplicate/asset-collection/:name/:newName
router.post("/editor/duplicate/asset-collection/:name/:newName", async (ctx) => {
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

// GET /editor/load/asset-collection/:name
router.get("/editor/load/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing name parameter" };
      return;
    }

    const filePath = `${getAssetCollectionsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: `Asset collection config not found: ${name}` };
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

// DELETE /editor/config/asset-collection/:name
router.delete("/editor/config/asset-collection/:name", async (ctx) => {
  try {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing name parameter" };
      return;
    }

    const filePath = `${getAssetCollectionsDir()}/${name}.json`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: `Asset collection config not found: ${name}` };
      return;
    }

    await Deno.remove(filePath);

    ctx.response.body = { success: true, deleted: name };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to delete asset collection config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// POST /editor/migrate/asset-collection
router.post("/editor/migrate/asset-collection", async (ctx) => {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Missing request body" };
      return;
    }

    const config: AssetCollectionConfig = await ctx.request.body.json();

    if (config.type !== "assetCollection") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'assetCollection'",
      };
      return;
    }

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

export { router as assetCollectionRouter };