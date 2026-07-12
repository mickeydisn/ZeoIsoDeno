// Define a compatible canvas type for both Deno and browser
type Canvas = OffscreenCanvas;
type ImageType = HTMLImageElement;
type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

function createCanvas(width: number, height: number): Canvas {
  return new OffscreenCanvas(width, height) as Canvas;
}

import { Isomer } from "./utils/iso/isomer.ts";
import { TilesMatrixAvg } from "../map/object/tilesMatrix.ts";
import { World } from "../word.ts";
import { AssetLoaderOpti } from "./asset/assetLoaderOpti.ts";
import { IsometricProjector } from "./utils/simpleIso/IsometricProjector.ts";
import {
  DEFAULT_ISO_CONFIG,
  DrawContext,
  MapGridLaout,
} from "./render/type.ts";
import { drawTile } from "./render/drawTile.ts";
import { drawPlayer } from "./render/drawPlayer.ts";
import { _drawTileItem } from "./render/utils/drawTileUtils.ts";
import { drawHoverOverlay } from "@iso-game/mapIso/render/drawHoverOverlay.ts";
import { msgToScreen } from "@iso-game/handlers/handlers.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  gobalGameState,
} from "../handlers/game/gameState.ts";

// --- Main Drawer Class ---
export class CanvasMapDrawers {
  _ctx: TGameHandlerContext;
  _drawCtx: DrawContext;
  world: World;

  private tileCache: Map<string, OffscreenCanvas | ImageBitmap> = new Map();

  frameSubCount: number;
  frameCount: number;

  constructor(
    _ctx: TGameHandlerContext,
    width: number,
    height: number,
    conf: MapGridLaout,
    assetLoadder: AssetLoaderOpti,
    canvas?: Canvas,
  ) {
    this._ctx = _ctx;
    this.world = _ctx.world;

    // Use mapGridSize instead of mapGridSize
    const drawConf: MapGridLaout = {
      ...DEFAULT_ISO_CONFIG,
      ...conf,
      mapGridSize: conf.mapGridSize ||
        DEFAULT_ISO_CONFIG.mapGridSize,
    };

    const offScreenCanvas = canvas ? canvas : createCanvas(width, height);
    const canvasCtx = offScreenCanvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    const isomer = new Isomer(
      offScreenCanvas,
      drawConf.mapGridSize,
      drawConf.mapGridTileScale,
      drawConf.mapGridMod,
    );
    const isoProject = new IsometricProjector({
      originX: offScreenCanvas.width / 2,
      originY: offScreenCanvas.height / 2 +
        drawConf.mapGridSize * 16 * drawConf.mapGridTileScale,
      mapGridTileScale: drawConf.mapGridTileScale,
      mapGridMod: drawConf.mapGridMod,
    });

    const tilesMatrix = new TilesMatrixAvg(
      drawConf.mapGridSize,
      0,
      0,
      drawConf.mapGridMod,
    );

    this.frameSubCount = 0;
    this.frameCount = 0;

    // -------------------------

    this._drawCtx = {
      handler: _ctx.handler,
      isomer: isomer,
      isoProject: isoProject,

      assetLoader: assetLoadder,
      canvasCtx: canvasCtx,

      conf: drawConf,
      gameState: gobalGameState,
      tilesMatrix: tilesMatrix,

      frameCount: 0,
      currentDiplayBox: [],
    };

    console.log("=== GameContext- Init");
  }

  // --------------------------------------

  drawUpdate(
    centreX: number,
    centreY: number,
    offx: number = 0,
    offy: number = 0,
  ) {
    this._drawCtx.tilesMatrix.setOff(offx, offy);
    this._drawCtx.tilesMatrix.setCenter(centreX, centreY);
    // Use the maximum of 1 or the scaled modifier for isomer
    this._drawCtx.isomer.mapGridMod = Math.max(1, 1 / 8);
    this._drawCtx.isomer.setOffset(offx, offy);

    this._drawCtx.isoProject.updateConf({
      mapGridMod: Math.max(1, 1 / 8),
      offsetX: offx,
      offsetY: offy,
    });

    this._drawCtx.currentDiplayBox.length = 0;
    this.drawIso();
    this._ctx.handler.send(msgToScreen.infoCardPositions({
      cards: this._drawCtx.currentDiplayBox,
    }));
  }

  drawIso() {
    const size = this._drawCtx.conf.mapGridSize;
    this._drawCtx.canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Clear all temporary tile items after each render frame
    for (let x = 0; x < this._drawCtx.tilesMatrix.size; x++) {
      for (let y = 0; y < this._drawCtx.tilesMatrix.size; y++) {
        if (this._drawCtx.tilesMatrix.tiles[x]?.[y]) {
          this._drawCtx.tilesMatrix.tiles[x][y].clearTemporatyItem();
        }
      }
    }

    // Draw tiles: loop from 1 to size-1 to avoid boundary checks
    // when accessing neighbors (yy-1, xx-1) inside drawTile.
    for (let x = 1; x < size - 1; x++) {
      for (let y = 1; y < size - 1; y++) {
        // this.drawTile(x, y);
        drawTile(this._drawCtx, x, y);
        if (x == size / 2 && y == size / 2) {
          // this.drawPlayer(x, y)
          drawPlayer(this._drawCtx, x, y);
        }
      }
    }

    for (let x = 1; x < size - 1; x++) {
      for (let y = 1; y < size - 1; y++) {
        // this.drawTile(x, y);
      }
    }

    // Draw grid overlay to show tile boundaries

    // this.drawGridOverlay();
    // this.drawHoverOverlay();
    // drawGridOverlay(this._drawCtx);
    drawHoverOverlay(this._drawCtx);
  }
}
