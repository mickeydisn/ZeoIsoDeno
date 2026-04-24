/**
 * Assets Manager Server — Deno HTTP Endpoints
 *
 * This module provides isolated HTTP endpoints for the Assets Manager interface.
 * All endpoints are mounted under `/assets-manager/*` to avoid conflicts with other routes.
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { generateAssetPreview } from "./services/assetPreview.ts";
import type { TypeAssetGroupConfig } from "../../IsoGame/mapIso/asset/assetOptiConfig.ts";

// ============================================================================
// Assets Manager Router
// ============================================================================

const assetsManagerRouter = new Router();

// ============================================================================
// Base endpoints
// ============================================================================

assetsManagerRouter.get("/assets-manager/status", (ctx) => {
  ctx.response.body = {
    success: true,
    status: "online",
    message: "Assets Manager server is running"
  };
  ctx.response.status = 200;
});

// ============================================================================
// Asset Group endpoints
// ============================================================================

assetsManagerRouter.get("/assets-manager/groups", async (ctx) => {
  console.log("assets-manager/groups")
  try {
    const { assetOptiConfig } = await import(
      "../../IsoGame/mapIso/asset/assetOptiConfig.ts"
    );
    
    const groups = (assetOptiConfig as TypeAssetGroupConfig[]).map((group, index) => ({
      id: index,
      name: group.name || `Group ${index}`,
      src: group.src,
      assetCount: group.images.length
    }));

    ctx.response.body = {
      success: true,
      groups
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to load asset groups: ${error instanceof Error ? error.message : String(error)}`
    };
  }
});

assetsManagerRouter.get("/assets-manager/group/:groupId/assets", async (ctx) => {

  try {
    const groupId = parseInt(ctx.params.groupId);
    console.log("assets-manager/groups", groupId)
    
    if (isNaN(groupId)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid group ID" };
      return;
    }

    const { assetOptiConfig } = await import(
      "../../IsoGame/mapIso/asset/assetOptiConfig.ts"
    );

    const groups = assetOptiConfig as TypeAssetGroupConfig[];
    
    if (groupId < 0 || groupId >= groups.length) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Group not found" };
      return;
    }

    const group = groups[groupId];
    
    ctx.response.body = {
      success: true,
      group: {
        id: groupId,
        name: group.name,
        src: group.src,
        imgHeight: group.imgHeight,
        imgWidth: group.imgWidth,
        scall: group.scall
      },
      assets: group.images.map((img, idx) => ({
        id: idx,
        label: img.label,
        top: img.top,
        previewUrl: `/assets-manager/asset/${img.label}/preview`
      }))
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to load group assets: ${error instanceof Error ? error.message : String(error)}`
    };
  }
});

assetsManagerRouter.get("/assets-manager/asset/:key/preview", async (ctx) => {
  try {
    const key = ctx.params.key;
    console.log("assets-manager/asset", key)
    const result = await generateAssetPreview(key);
    
    if ('error' in result) {
      ctx.response.status = 404;
      ctx.response.body = result;
      return;
    }

    ctx.response.headers.set("Content-Type", result.contentType);
    ctx.response.headers.set("Cache-Control", "public, max-age=3600");
    ctx.response.body = result.buffer;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      error: `Failed to generate preview: ${error instanceof Error ? error.message : String(error)}`
    };
  }
});

// ============================================================================
// Export
// ============================================================================

export { assetsManagerRouter };
