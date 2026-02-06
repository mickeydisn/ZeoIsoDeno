/*
import {
  createCanvas,
  EmulatedCanvas2D,
  Image,
  loadImage,
} from "https://deno.land/x/canvas@v1.4.2/mod.ts";
*/
// import { Canvas, Image } from "jsr:@gfx/canvas@0.5.6";

/*
import {
  Canvas,
  CanvasRenderingContext2D,
  Image,
} from "https://deno.land/x/skia_canvas@0.2.0/mod.ts";
*/

// Define a compatible canvas type for both Deno and browser
type CanvasType = OffscreenCanvas; // | import("jsr:@gfx/canvas@0.5.6").Canvas;
// type ImageType = ImageBitmap; // | import("jsr:@gfx/canvas@0.5.6").Image;

import {
  assetOptiConfig,
  TypeAssetGroupConfig,
  TypeAssetImageConfig,
} from "./assetOptiConfig.ts";
import { canvasFilterStrToValue, colorVariation } from "./assetUtils.ts";

const SCALE_SIZE = 1;

export type TypeAsset = {
  group: string;
  label: string;
  cimage: OffscreenCanvas;
};

export class AssetLoaderOpti {
  assetList: TypeAssetGroupConfig[];
  assetTree: Record<string, TypeAsset> = {};
  countLoad: number = 0;

  constructor() {
    this.assetList = assetOptiConfig;
  }

  // Static method to create an instance and handle async loading
  static async create(
    assetList?: TypeAssetGroupConfig[],
  ): Promise<AssetLoaderOpti> {
    const loader = new AssetLoaderOpti();
    await loader.loadAssetFiles(assetList || assetOptiConfig); // Load the assets after instantiation
    console.log("assetTree", loader.assetTree);
    return loader;
  }

  async loadAssetFiles(assetList?: TypeAssetGroupConfig[]) {
    const assList = assetList ? assetList : this.assetList;

    async function loadImage(url: string): Promise<ImageBitmap> {
      const response = await fetch(url);
      return createImageBitmap(await response.blob()); // No <img>, direct GPU data
    }
    /*
    function loadImage(src: string): Promise<ImageType> {
      return new Promise((resolve, reject) => {
        const img = new HTMLImageElement();
        img.onload = () => resolve(img);
        img.onerror = (err: Event | string) => reject(err);
        img.src = src;
      });
    }
    */

    const promises = assList.map(
      async (assetInfo: TypeAssetGroupConfig): Promise<void> => {
        this.countLoad++;
        try {
          const image: ImageBitmap = await loadImage("../../" + assetInfo.src);
          this.loadAssetImage(assetInfo, image);
        } catch (e) {
          console.error(e);
        }
        return;
      },
    );
    await Promise.all(promises);
  }

  // Function to create a canvas and draw an image on it
  private createCanvasContext(image: ImageBitmap) {
    const canvas = new OffscreenCanvas(image.width, image.height); // Create a canvas with the same dimensions as the image
    const ctx = canvas.getContext("2d"); // Get the 2d drawing context
    if (ctx == null) return;
    const drawableImage = image as unknown as CanvasImageSource;

    // Draw the image on the canvas
    ctx.drawImage(drawableImage, 0, 0); // Draw the image at position (0, 0)

    return ctx; // Return the context
  }

  private loadAssetImage(
    assetInfo: TypeAssetGroupConfig,
    sourceImg: ImageBitmap,
  ): void {
    const wCutSize = 256 - 64;
    const hCutSize = 256 - 32;
    const scall = assetInfo.scall ? .7 : 1;

    assetInfo.images.map((info: TypeAssetImageConfig, idx: number) => {
      const __cutImage = (wId: number, hId: number) => {
        const destCanvas = new OffscreenCanvas(
          256 * SCALE_SIZE,
          256 * SCALE_SIZE,
        );
        const ctx = destCanvas.getContext("2d", { willReadFrequently: true });
        if (ctx == null) return destCanvas;
        // Draw the cut portion of the source image onto the destination canvas
        ctx.drawImage(
          sourceImg,
          
          wCutSize * wId + Math.floor(wCutSize * ((1 - scall) / 2)),
          hCutSize * hId + Math.floor(hCutSize * (1 - scall)),
          Math.floor(wCutSize * scall),
          hCutSize + 128,
          
          32 * SCALE_SIZE,
          0 + (assetInfo.scall ? 32 : 0),
          wCutSize * SCALE_SIZE,
          Math.floor(hCutSize / scall) * SCALE_SIZE + 128,

        );
        // dest.ctx.drawImage(cutImg,0, 0, dest.width, dest.height);
        return destCanvas;
      };

      this.assetTree[info.label + "_NE"] = {
        "group": assetInfo.group,
        "label": info.label + "_NE",
        "cimage": __cutImage(0, idx),
      };
      this.assetTree[info.label + "_NW"] = {
        "group": assetInfo.group,
        "label": info.label + "_NW",
        "cimage": __cutImage(1, idx),
      };
      this.assetTree[info.label + "_SW"] = {
        "group": assetInfo.group,
        "label": info.label + "_SW",
        "cimage": __cutImage(2, idx),
      };
      this.assetTree[info.label + "_SE"] = {
        "group": assetInfo.group,
        "label": info.label + "_SE",
        "cimage": __cutImage(3, idx),
      };

      if (info["8axes"]) {
        this.assetTree[info.label + "_N"] = {
          "group": assetInfo.group,
          "label": info.label + "_N",
          "cimage": __cutImage(4, idx),
        };
        this.assetTree[info.label + "_W"] = {
          "group": assetInfo.group,
          "label": info.label + "_W",
          "cimage": __cutImage(5, idx),
        };
        this.assetTree[info.label + "_S"] = {
          "group": assetInfo.group,
          "label": info.label + "_S",
          "cimage": __cutImage(6, idx),
        };
        this.assetTree[info.label + "_E"] = {
          "group": assetInfo.group,
          "label": info.label + "_E",
          "cimage": __cutImage(7, idx),
        };
      }
    });
  }

  getAsset(key: string) {
    if (this.assetTree[key]) {
      return this.assetTree[key].cimage;
    } else {
      const [keyParent, canvasFilter] = key.split("#");

      if (this.assetTree[keyParent]) {
        const parentCimage = this.assetTree[keyParent].cimage;

        const canvasFilterConf = canvasFilterStrToValue(
          canvasFilter,
        );

        const newCimage = colorVariation(
          parentCimage,
          canvasFilterConf,
        );
        if (newCimage) {
          this.assetTree[key] = {
            ...this.assetTree[keyParent],
            cimage: newCimage,
          };
          return this.assetTree[key].cimage;
        }
      }
      // return this.assetTree[keyParent].cimage;
    }
  }
}
