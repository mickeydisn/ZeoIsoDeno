import {
  assetFileConfig,
  TypeAssetFileConfig,
} from "./assetPalletConfig.ts";
// import { canvasFilterStrToValue, colorVariation } from "./assetUtils.ts";

export type TypeCanvasFilterConf = {
  color?: string;
};
const canvasFilterStrToValue = (str: string): TypeCanvasFilterConf => ({
  color: str,
});
const colorVariation = (
  sourceCanvas: OffscreenCanvas,
  conf: TypeCanvasFilterConf,
): OffscreenCanvas | undefined => {
  // Mock implementation for color variation (e.g., tinting)
  const newCanvas = new OffscreenCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = newCanvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.drawImage(sourceCanvas, 0, 0);
  // Apply a mock filter or color change based on conf
  if (conf.color) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = conf.color;
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  }
  return newCanvas;
};

// Assuming this constant is intended to be the base scaling factor for the canvas
const SCALE_SIZE = 1;

export type TypeAsset = {
  group: string;
  label: string;
  cimage: OffscreenCanvas;
};

// A row is defined as exactly 4 assets (NE, NW, SW, SE)
export type TypeAssetRow = [TypeAsset, TypeAsset, TypeAsset, TypeAsset];

export type TypeAssetSheet = {
  name: string;
  cimage: OffscreenCanvas; // The large image representing the full sheet
  assets: Array<TypeAssetRow>;
};

export type TypeAssetIndex = Record<string, TypeAsset>;

// Assuming `assetFileConfig` is imported from elsewhere, as in the original code
// declare const assetFileConfig: TypeAssetFileConfig[];

export class AssetLoaderPallet {
  private assetList: TypeAssetFileConfig[];
  assetTree: TypeAssetIndex = {};
  assetSheets: TypeAssetSheet[] = [];
  countLoad: number = 0;

  constructor(assetList: TypeAssetFileConfig[] = []) {
    // Use injected or default config
    this.assetList = assetList.length > 0 ? assetList : (assetFileConfig as TypeAssetFileConfig[] | undefined) || [];
  }

  /**
   * Static factory method to create an instance and handle async loading.
   * @param assetList Optional list of asset configs to load.
   */
  static async create(
    assetList?: TypeAssetFileConfig[],
  ): Promise<AssetLoaderPallet> {
    const loader = new AssetLoaderPallet(assetList);
    await loader.loadAssetFiles();
    console.log("Assets loaded into assetSheets:", loader.assetSheets.length);
    return loader;
  }

  /**
   * Loads all asset images concurrently.
   */
  async loadAssetFiles(): Promise<void> {
    // Helper function to fetch and create an ImageBitmap
    const loadImageBitmap = async (url: string): Promise<ImageBitmap> => {
      const response = await fetch(url);
      // createImageBitmap is efficient and avoids <img> element
      return createImageBitmap(await response.blob());
    };

    const promises = this.assetList.map(
      async (assetInfo: TypeAssetFileConfig): Promise<void> => {
        this.countLoad++;
        try {
          // Prepend asset path correctly (e.g., using import.meta.url or a proper base path)
          // Adjusting the path from "../../" to a more relative/defined path is safer in a real app.
          const image: ImageBitmap = await loadImageBitmap("../../" + assetInfo.src);
          this.loadAssetImage(assetInfo, image);
        } catch (e) {
          console.error(`Failed to load asset: ${assetInfo.src}`, e);
        }
      },
    );
    await Promise.all(promises);
  }

  /**
   * Extracts and processes individual assets from the loaded sprite sheet.
   */
  private loadAssetImage(
    assetInfo: TypeAssetFileConfig,
    sourceImg: ImageBitmap,
  ): void {
    // Defined constants for cut sizes based on common sprite sheet dimensions (256x256 tiles)
    const wCutSize = 256 - 64; // 192
    const hCutSize = 256 - 32; // 224
    const scall = assetInfo.scall ? 0.7 : 1.0;

    const __cutImage = (wId: number, hId: number): OffscreenCanvas => {
      // Dimensions of the destination canvas are fixed
      const destCanvas = new OffscreenCanvas(
        256 * SCALE_SIZE,
        256 * SCALE_SIZE,
      );
      // Use non-null assertion `!` because `OffscreenCanvas` contexts are usually guaranteed.
      const ctx = destCanvas.getContext("2d", { willReadFrequently: true })!;

      // Calculate source coordinates and dimensions for the cut
      const sX = wCutSize * wId + Math.floor(wCutSize * ((1 - scall) / 2));
      const sY = hCutSize * hId + Math.floor(hCutSize * (1 - scall));
      const sWidth = Math.floor(wCutSize * scall);
      // sHeight is a bit unusual, calculating to extend below the cut area
      const sHeight = hCutSize + 128; // This seems to be an arbitrary extension

      // Calculate destination coordinates and dimensions on the new canvas
      const dX = 32 * SCALE_SIZE;
      const dY = 0 + (assetInfo.scall ? 32 : 0);
      const dWidth = wCutSize * SCALE_SIZE;
      const dHeight = Math.floor(hCutSize / scall) * SCALE_SIZE + 128; // This also seems complex/arbitrary

      // Draw the cut portion of the source image onto the destination canvas
      ctx.drawImage(
        sourceImg as unknown as CanvasImageSource, // Assert type for compatibility
        sX,
        sY,
        sWidth,
        sHeight,
        dX,
        dY,
        dWidth,
        dHeight,
      );
      return destCanvas;
    };

    // Calculate the number of rows (tiles) in the asset sheet
    const n = Math.round(sourceImg.height / hCutSize);
    const assetRows: TypeAssetRow[] = [];

    // Process each row (tile set)
    for (let idx = 0; idx < n; idx++) {
      const labelBase = `${assetInfo.group}_${String(idx)}`;
      
      // Creating the row with the 4 assets (NE, NW, SW, SE)
      const assets: TypeAssetRow = [
        {
          group: assetInfo.group,
          label: `${labelBase}_NE`,
          cimage: __cutImage(0, idx),
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_NW`,
          cimage: __cutImage(1, idx),
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_SW`,
          cimage: __cutImage(2, idx),
        },
        {
          group: assetInfo.group,
          label: `${labelBase}_SE`,
          cimage: __cutImage(3, idx),
        },
      ];

      // Index assets by their label for quick lookup
      assets.forEach((a) => {
        this.assetTree[a.label] = a;
      });
      assetRows.push(assets);
    }

    // Create an OffscreenCanvas with the same dimensions as the ImageBitmap
    const offscreenCanvas = new OffscreenCanvas(sourceImg.width, sourceImg.height);
    // Get the 2D rendering context
    const ctx = offscreenCanvas.getContext('2d');
    // Draw the ImageBitmap onto the OffscreenCanvas
    if (ctx) {
      ctx.drawImage(sourceImg, 0, 0);
    }

    // Store the complete sheet data
    const assetSheet: TypeAssetSheet = {
      name: assetInfo.group,
      cimage : offscreenCanvas,
      assets: assetRows,
    };
    this.assetSheets.push(assetSheet);
  }

  /**
   * Retrieves an asset by key, creating a color-varied version if the base asset
   * exists and a color filter is specified.
   * @param key The asset label, optionally followed by a filter (e.g., "asset_0_NE#blue")
   * @returns The OffscreenCanvas for the asset, or undefined.
   */
  getAsset(key: string): OffscreenCanvas | undefined {
    // 1. Check for the exact key (e.g., "asset_0_NE" or "asset_0_NE#blue" if already cached)
    if (this.assetTree[key]) {
      return this.assetTree[key].cimage;
    }

    // 2. Asset not found, check if it's a filtered version (e.g., "asset_0_NE#blue")
    const parts = key.split("#");
    if (parts.length < 2) {
      // Not found and no filter specified
      return undefined;
    }

    const [keyParent, canvasFilter] = parts;
    const parentAsset = this.assetTree[keyParent];

    if (parentAsset) {
      const parentCimage = parentAsset.cimage;
      
      // Parse the filter string (e.g., "blue") into a config object
      const canvasFilterConf = canvasFilterStrToValue(canvasFilter);

      // Create the new color-varied canvas
      const newCimage = colorVariation(
        parentCimage,
        canvasFilterConf,
      );

      if (newCimage) {
        // Cache the new asset for future lookups
        this.assetTree[key] = {
          ...parentAsset, // Retain group and base label
          label: key, // Use the full key as the label
          cimage: newCimage,
        };
        return newCimage;
      }
    }

    // 3. Fallback if the parent asset doesn't exist or filtering failed
    return undefined;
  }
}