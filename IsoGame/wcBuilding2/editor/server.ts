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

    if (config.version !== "1.0") {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `Invalid config version: expected '1.0', got '${config.version}'`,
      };
      return;
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
  try {
    const { originalName, newName } = ctx.params;

    if (!originalName || !newName) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Missing originalName or newName parameter",
      };
      return;
    }

    // Validate new name format
    if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Invalid name format. Only alphanumeric characters, hyphens, and underscores are allowed.",
      };
      return;
    }

    // Check if new name already exists
    const newFilePath = `${getBuildingsDir()}/${newName}.json`;
    try {
      await Deno.stat(newFilePath);
      ctx.response.status = 409;
      ctx.response.body = {
        success: false,
        error: `A building config with name "${newName}" already exists`,
      };
      return;
    } catch {
      // File doesn't exist — good
    }

    // Read original config
    const originalFilePath = `${getBuildingsDir()}/${originalName}.json`;
    let config: BuildingConfig;

    try {
      const content = await Deno.readTextFile(originalFilePath);
      config = JSON.parse(content);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: `Original building config not found: ${originalName}`,
      };
      return;
    }

    // Update the config ID to the new name
    config.id = newName;

    // Ensure directory exists
    await ensureDir(getBuildingsDir());

    // Write new file
    await Deno.writeTextFile(newFilePath, JSON.stringify(config, null, 2));

    ctx.response.body = {
      success: true,
      path: newFilePath,
      newName,
    };
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: `Failed to save as new config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// ============================================================================
// POST /editor/save-as/asset-collection/:originalName/:newName — Save Asset Collection as New
// ============================================================================

editorRouter.post(
  "/editor/save-as/asset-collection/:originalName/:newName",
  async (ctx) => {
    try {
      const { originalName, newName } = ctx.params;

      if (!originalName || !newName) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Missing originalName or newName parameter",
        };
        return;
      }

      // Validate new name format
      if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Invalid name format. Only alphanumeric characters, hyphens, and underscores are allowed.",
        };
        return;
      }

      // Check if new name already exists
      const newFilePath = `${getAssetCollectionsDir()}/${newName}.json`;
      try {
        await Deno.stat(newFilePath);
        ctx.response.status = 409;
        ctx.response.body = {
          success: false,
          error: `An asset collection config with name "${newName}" already exists`,
        };
        return;
      } catch {
        // File doesn't exist — good
      }

      // Read original config
      const originalFilePath = `${getAssetCollectionsDir()}/${originalName}.json`;
      let config: AssetCollectionConfig;

      try {
        const content = await Deno.readTextFile(originalFilePath);
        config = JSON.parse(content);
      } catch {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: `Original asset collection config not found: ${originalName}`,
        };
        return;
      }

      // Update the config ID to the new name
      config.id = newName;

      // Ensure directory exists
      await ensureDir(getAssetCollectionsDir());

      // Write new file
      await Deno.writeTextFile(newFilePath, JSON.stringify(config, null, 2));

      ctx.response.body = {
        success: true,
        path: newFilePath,
        newName,
      };
      ctx.response.status = 200;
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: `Failed to save as new config: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
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

    const filePath = `${Deno.cwd()}/img/asset_opti/${key}.png`;

    try {
      await Deno.stat(filePath);
    } catch {
      ctx.response.status = 404;
      ctx.response.body = `Asset not found: ${key}`;
      return;
    }

    const file = await Deno.readFile(filePath);
    ctx.response.headers.set("Content-Type", "image/png");
    ctx.response.headers.set("Cache-Control", "public, max-age=86400");
    ctx.response.body = file;
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = `Failed to load asset: ${error instanceof Error ? error.message : String(error)}`;
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the absolute path to the buildings config directory.
 */
function getBuildingsDir(): string {
  return `${Deno.cwd()}/IsoGame/wcBuilding2/editor/conf/buildings`;
}

/**
 * Get the absolute path to the asset collections config directory.
 */
function getAssetCollectionsDir(): string {
  return `${Deno.cwd()}/IsoGame/wcBuilding2/editor/conf/asset-collections`;
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
async function ensureDir(dir: string): Promise<void> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

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