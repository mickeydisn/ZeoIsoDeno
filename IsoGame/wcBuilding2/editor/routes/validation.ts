/**
 * Validation Routes — Editor HTTP Endpoints
 *
 * Extracted from server.ts: all validation-related endpoints.
 * Handles validation, tile reference validation, and sanitization
 * of building configurations.
 *
 * Endpoints:
 * - POST /editor/validate/building              — Validate building config
 * - POST /editor/validate-tile-refs/building    — Validate tile references
 * - POST /editor/sanitize/building              — Sanitize building config
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import type { BuildingConfig, TileConfig } from "../types.ts";
import {
  validateBuildingConfig,
  sanitizeBuildingConfig,
  formatValidationSummary,
  formatTileRefValidationSummary,
  validateTileReferences,
} from "../validation.ts";

const router = new Router();

// POST /editor/validate/building
router.post("/editor/validate/building", async (ctx) => {
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

// POST /editor/validate-tile-refs/building
router.post("/editor/validate-tile-refs/building", async (ctx) => {
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

// POST /editor/sanitize/building
router.post("/editor/sanitize/building", async (ctx) => {
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

export { router as validationRouter };