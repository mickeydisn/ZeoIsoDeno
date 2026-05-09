import { DrawContext } from "@iso-game/mapIso/_render/type.ts";
import { Point } from "@iso-game/mapIso/iso/point.ts";
import { PointIso } from "@iso-game/mapIso/simpleIso/IsometricProjector.ts";



// Constants derived from an assumed 128x128 asset size for centering on a tile.
// The offsets adjust the image position so its visual base is anchored to the tile's center point (0, 0, Z) in screen space.
// const ASSET_WIDTH = 128; // 224
// const ASSET_HEIGHT = 172; // 192 Assuming asset height includes transparent padding/shadows
const ASSET_WIDTH = 192 / 2; // 224
const ASSET_HEIGHT = 224 / 2; // 192 Assuming asset height includes transparent padding/shadows
const TILE_2D_WIDTH = ASSET_WIDTH; // 224

const ASSET_OFFSET_X = -TILE_2D_WIDTH / 2 // (-ASSET_WIDTH / 2) + (ASSET_WIDTH / 4); // (-64) + (32) = -32 (The original code used -127+64 which is -63, let's use the actual center)
const ASSET_OFFSET_Y = (-ASSET_HEIGHT + 1) // (-ASSET_HEIGHT) + (ASSET_WIDTH / 2) - 1; // (-172) + 64 - 1 = -109 (Aligning the visual base, using ASSET_HEIGHT as the full image height)



  /** Draws an isometric asset (image/svg) on the tile. */
export const drawAsset = (
    _ctx : DrawContext,

    x: number,
    y: number,
    itemConf: any,
    currentlvl: number,

  ) => {
    if (!_ctx.assetLoader) {
      console.warn("AssetLoader not initialized.");
      return;
    }

    try {
      const key = itemConf.key;
      // Cyclically select asset key if an array is provided
      let keySelect = Array.isArray(key)
        ? key[_ctx.frameCount % key.length]
        : key;
        
      let cimage = _ctx.assetLoader.getAsset(keySelect);
      
      // If exact key not found, try appending directional suffix
      if (!cimage) {
        const directions = ["_NE", "_NW", "_SW", "_SE"];
        for (const dir of directions) {
          cimage = _ctx.assetLoader.getAsset(keySelect + dir);
          if (cimage) {
            keySelect = keySelect + dir;
            break;
          }
        }
      }
      
      if (cimage) {
        const off = itemConf.off ? itemConf.off : { x: 0, y: 0 };
        const lvl = currentlvl + (itemConf.lvl || 0) * _ctx.conf.SCALE_SIZE;
        const p2 = _ctx.isoProject.translatePoint(new PointIso(x + off.x, y + off.y, lvl))
        
        const p = _ctx.isomer.translatePoint(
          new Point(x + off.x, y + off.y, lvl),
        );
        const scale = _ctx.conf.SCALE_SIZE;
        // Use named constants for offsets
        _ctx.canvasCtx.save();
        // this.canvasCtx.globalAlpha = 0.5;
        _ctx.canvasCtx.drawImage(
          cimage,
          p2.x + ASSET_OFFSET_X * scale,
          p2.y + ASSET_OFFSET_Y * scale,
          ASSET_WIDTH * scale,
          ASSET_HEIGHT * scale,
        );
        _ctx.canvasCtx.restore();
      }
    } catch (e) {
      console.error(`Error drawing asset: ${itemConf.key}`, e);
    }
  }
