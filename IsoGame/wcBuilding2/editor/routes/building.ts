/**
 * Building Routes — Editor HTTP Endpoints
 *
 * Extracted from server.ts: all `/editor/*building*` endpoints.
 * Handles extraction, saving, loading, duplication, deletion, and migration
 * of building configurations.
 *
 * Endpoints:
 * - POST /editor/extract/building/:className
 * - POST /editor/save/building/:name
 * - POST /editor/save-as/building/:originalName/:newName
 * - POST /editor/duplicate/building/:name/:newName
 * - GET  /editor/load/building/:name
 * - DELETE /editor/config/building/:name
 * - POST /editor/migrate/building
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { ConfigExtractor } from "../extractor.ts";
import type { BuildingConfig } from "../types.ts";
import { CURRENT_VERSION, SUPPORTED_VERSIONS } from "../types.ts";
import {
  getBuildingsDir,
  ensureDir,
} from "../configPaths.ts";
import { duplicateConfig } from "../services/duplicateConfig.ts";
import {
  migrateBuildingConfig,
  isSupportedVersion,
  needsMigration,
  getVersionStatus,
} from "../migration.ts";

const router = new Router();

// POST /editor/extract/building/:className
router.post("/editor/extract/building/:className", async (ctx) => {
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

// POST /editor/save/building/:name
router.post("/editor/save/building/:name", async (ctx) => {
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

    const config: BuildingConfig = await ctx.request.body.json();

    if (config.type !== "building") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid config type: expected 'building'",
      };
      return;
    }

    if (config.version !== CURRENT_VERSION) {
      if (isSupportedVersion(config.version)) {
        const migrationResult = migrateBuildingConfig(config);
        if (!migrationResult.success) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: `Config version ${config.version} migration failed: ${migrationResult.warnings.join(", ")}`,
          };
          return;
        }
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

    const dir = getBuildingsDir();
    await ensureDir(dir);

    const filePath = `${dir}/${name}.json`;
    await Deno.writeTextFile(filePath, JSON.stringify(config, null, 2));

    ctx.response.body = { success: true, path: filePath };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: `Failed to save building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// POST /editor/save-as/building/:originalName/:newName
router.post("/editor/save-as/building/:originalName/:newName", async (ctx) => {
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

// POST /editor/duplicate/building/:name/:newName
router.post("/editor/duplicate/building/:name/:newName", async (ctx) => {
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

// GET /editor/load/building/:name
router.get("/editor/load/building/:name", async (ctx) => {
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

// DELETE /editor/config/building/:name
router.delete("/editor/config/building/:name", async (ctx) => {
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

    await Deno.remove(filePath);

    ctx.response.body = { success: true, deleted: name };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to delete building config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// POST /editor/migrate/building
router.post("/editor/migrate/building", async (ctx) => {
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

export { router as buildingRouter };