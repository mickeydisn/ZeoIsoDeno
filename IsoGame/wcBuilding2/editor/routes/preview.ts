/**
 * Preview Routes — Editor HTTP Endpoints
 *
 * Extracted from server.ts: all preview-related endpoints.
 * Handles generation of building previews and asset preview images.
 *
 * Endpoints:
 * - POST /editor/preview/generate       — Run building generation preview
 * - GET  /editor/asset-preview/:key     — Get asset image for preview
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import type { BuildingConfig } from "../types.ts";
import { World } from "../../../word.ts";
import { WcBuildFactoryGenarator } from "../../wcBuildFactory.ts";
import { WcBuildTile } from "../../wcBuildTile.ts";
import { buildTempConfig } from "../services/previewBuilder.ts";
import { generateAssetPreview } from "../services/assetPreview.ts";

/**
 * Interface for generation result returned from preview generation
 */
interface GenerationResult {
  success: boolean;
  tiles: Array<{
    x: number;
    y: number;
    tileType: string;
    face: (string | null)[][];
    isConfigured: boolean;
  }>;
  iterations: number;
  stats: {
    totalTiles: number;
    configuredTiles: number;
  };
}

const router = new Router();

// POST /editor/preview/generate
router.post("/editor/preview/generate", async (ctx) => {
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

    // WcBuildFactoryGenarator extends WcBuildFactory which has public allTiles property
    const allTiles: WcBuildTile[] = generator.allTiles || [];
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

// GET /editor/asset-preview/:key
router.get("/editor/asset-preview/:key", async (ctx) => {
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

export { router as previewRouter };