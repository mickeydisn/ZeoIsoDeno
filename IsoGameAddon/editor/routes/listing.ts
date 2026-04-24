/**
 * Listing Routes — Editor HTTP Endpoints
 *
 * Extracted from server.ts: all listing-related endpoints.
 * Lists extractable classes, configs, and available game assets.
 *
 * Endpoints:
 * - GET  /editor/list/classes        — List extractable TS classes
 * - GET  /editor/list                — List all configs (TS + JSON)
 * - GET  /editor/assets/list         — List available game assets
 */

import { Router } from "https://deno.land/x/oak/mod.ts";
import { ConfigExtractor } from "../extractor.ts";
import { getBuildingsDir, getAssetCollectionsDir } from "../configPaths.ts";

const ASSET_DIR = "img/asset-opti";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

const router = new Router();

// GET /editor/list/classes
router.get("/editor/list/classes", (ctx) => {
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

// GET /editor/list
router.get("/editor/list", async (ctx) => {
  try {
    const tsBuildings = ConfigExtractor.listBuildingClasses();
    const tsAssetCollections = ConfigExtractor.listAssetCollectionClasses();

    const jsonBuildings: string[] = [];
    const jsonAssetCollections: string[] = [];
    const buildingsDir = getBuildingsDir();
    const assetCollectionsDir = getAssetCollectionsDir();

    // Read JSON building configs
    try {
      for await (const entry of Deno.readDir(buildingsDir)) {
        if (entry.name.endsWith(".json")) {
          jsonBuildings.push(entry.name.replace(".json", ""));
        }
      }
    } catch {
      // Directory doesn't exist yet — that's fine
    }

    // Read JSON asset collection configs
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

// GET /editor/assets/list
router.get("/editor/assets/list", async (ctx) => {
  try {
    const assets: Array<{ key: string; category: string; filename: string }> = [];
    const categories = new Set<string>();

    try {
      for await (const entry of Deno.readDir(ASSET_DIR)) {
        if (entry.isDirectory) {
          // Category subdirectory
          const category = entry.name;
          categories.add(category);
          const categoryPath = `${ASSET_DIR}/${category}`;
          for await (const file of Deno.readDir(categoryPath)) {
            if (file.isFile && IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
              const key = `${category}/${file.name.replace(/\.[^.]+$/, "")}`;
              assets.push({ key, category, filename: file.name });
            }
          }
        } else if (entry.isFile && IMAGE_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
          // Root-level asset file
          const key = entry.name.replace(/\.[^.]+$/, "");
          categories.add("root");
          assets.push({ key, category: "root", filename: entry.name });
        }
      }
    } catch {
      // Asset directory doesn't exist or isn't readable
    }

    assets.sort((a, b) => a.key.localeCompare(b.key));

    ctx.response.body = {
      assets,
      categories: Array.from(categories).sort(),
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

export { router as listingRouter };