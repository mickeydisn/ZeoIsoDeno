/**
 * Asset Preview Service
 *
 * Extracts and resizes asset preview images from spritesheets.
 * Provides graceful fallback when sharp is unavailable.
 */

import sharp from "npm:sharp";
import type { TypeAssetImageConfig, TypeAssetGroupConfig } from "../../../IsoGame/mapIso/asset/assetOptiConfig.ts";

// ============================================================================
// Types
// ============================================================================

export interface AssetPreviewConfig {
  src: string;
  top: number;
  imgHeight: number;
  imgWidth: number;
  scall?: boolean;
}

export interface PreviewResult {
  buffer: Uint8Array;
  contentType: "image/png";
}

export interface PreviewError {
  error: string;
}

// ============================================================================
// Cut Configuration
// ============================================================================

const W_CUT_SIZE = 192; // 256 - 64
const H_CUT_SIZE = 224; // 256 - 32

const DIRECTION_COLUMNS: Record<string, number> = {
  NE: 0,
  NW: 1,
  SW: 2,
  SE: 3,
  N: 4,
  W: 5,
  S: 6,
  E: 7,
};

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Parse an asset key to extract the base label and direction.
 * Keys can be formatted as: "label", "label_DIRECTION", or "label#filters"
 */
export function parseAssetKey(
  key: string
): { assetLabel: string; direction: string } {
  const [baseKey] = key.split("#");
  const directionMatch = baseKey.match(/^(.+?)_(NE|NW|SE|SW|N|S|E|W)$/);
  const assetLabel = directionMatch ? directionMatch[1] : baseKey;
  const direction = directionMatch ? directionMatch[2] : "NE";
  return { assetLabel, direction };
}

/**
 * Lookup an asset configuration from the assetOptiConfig.
 * Returns the preview config or null if not found.
 */
export async function lookupAssetConfig(
  assetLabel: string
): Promise<AssetPreviewConfig | null> {
  const { assetOptiConfig } = await import(
    "../../../IsoGame/mapIso/asset/assetOptiConfig.ts"
  );

  for (const group of assetOptiConfig as TypeAssetGroupConfig[]) {
    const imageConfig = group.images.find((img: TypeAssetImageConfig) => img.label === assetLabel);
    if (imageConfig) {
      return {
        src: group.src,
        top: imageConfig.top,
        imgHeight: group.imgHeight,
        imgWidth: group.imgWidth,
        scall: group.scall,
      };
    }
  }

  return null;
}

/**
 * Check if a file exists at the given path.
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a standalone PNG file directly.
 * Returns the file data or null if not found.
 */
export async function loadStandaloneImage(
  path: string
): Promise<{ buffer: Uint8Array; contentType: "image/png" } | null> {
  if (!(await fileExists(path))) {
    return null;
  }

  const file = await Deno.readFile(path);
  return { buffer: new Uint8Array(file), contentType: "image/png" };
}

/**
 * Extract and resize a sprite from a spritesheet based on asset config.
 * 
 * This replicates the AssetLoaderOpti logic for calculating cut positions:
 * - Direction determines the column (0=NE, 1=NW, 2=SW, 3=SE, etc.)
 * - Top value determines the row
 * - Scale factor adjusts the extraction region and resize dimensions
 */
export async function extractSpriteFromSpritesheet(
  spritesheetPath: string,
  config: AssetPreviewConfig,
  direction: string
): Promise<PreviewResult> {
  const spritesheetExists = await fileExists(spritesheetPath);
  if (!spritesheetExists) {
    throw new Error(`Spritesheet not found: ${spritesheetPath}`);
  }

  const scall = config.scall ? 0.7 : 1;
  const column = DIRECTION_COLUMNS[direction] ?? 0;
  const rowIndex = config.top / config.imgHeight;

  // Calculate source rectangle for extraction
  const srcX =
    W_CUT_SIZE * column + Math.floor(W_CUT_SIZE * ((1 - scall) / 2));
  const srcY = H_CUT_SIZE * rowIndex + Math.floor(H_CUT_SIZE * (1 - scall));
  const srcW = Math.floor(W_CUT_SIZE * scall);
  const srcH = H_CUT_SIZE + 128;

  const extractedImage = await sharp(spritesheetPath)
    .extract({ left: srcX, top: srcY, width: srcW, height: srcH })
    .resize({
      width: W_CUT_SIZE,
      height: Math.floor(H_CUT_SIZE / scall) + 128,
      fit: "fill",
    })
    .png()
    .toBuffer();

  return { buffer: new Uint8Array(extractedImage), contentType: "image/png" };
}

/**
 * Generate a placeholder PNG image when sharp is unavailable.
 * Returns a minimal valid PNG (1x1 pixel, transparent).
 */
export function generatePlaceholderPng(): Uint8Array {
  // Minimal valid PNG: 1x1 transparent pixel
  // This is a well-known base64-encoded 1x1 transparent PNG
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Full asset preview generation service.
 * 
 * Tries the following in order:
 * 1. Standalone PNG file in asset_opti directory
 * 2. Spritesheet extraction using assetOptiConfig
 * 3. Placeholder PNG if sharp is unavailable
 */
export async function generateAssetPreview(
  key: string
): Promise<PreviewResult | PreviewError> {
  // Try standalone PNG first
  const standalonePath = `${Deno.cwd()}/img/asset_opti/${key}.png`;
  const standaloneResult = await loadStandaloneImage(standalonePath);
  if (standaloneResult) {
    return standaloneResult;
  }

  // Parse key to extract label and direction
  const { assetLabel, direction } = parseAssetKey(key);

  // Load asset config to find the spritesheet
  const config = await lookupAssetConfig(assetLabel);
  if (!config) {
    return { error: `Asset not found: ${key} (label: ${assetLabel})` };
  }

  // Load the spritesheet using sharp
  const spritesheetPath = `${Deno.cwd()}/${config.src.replace(/^\.\//, "")}`;
  const spritesheetExists = await fileExists(spritesheetPath);
  if (!spritesheetExists) {
    return { error: `Spritesheet not found: ${spritesheetPath}` };
  }

  try {
    return await extractSpriteFromSpritesheet(spritesheetPath, config, direction);
  } catch (error: unknown) {
    // Graceful fallback when sharp fails
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`sharp failed for key "${key}": ${message}, using placeholder`);
    return {
      buffer: generatePlaceholderPng(),
      contentType: "image/png" as const,
    };
  }
}