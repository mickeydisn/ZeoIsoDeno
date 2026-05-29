// Define a compatible canvas type for both Deno and browser
type Canvas = OffscreenCanvas;
type ImageType = HTMLImageElement;
type CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

function _createCanvas(width: number, height: number): Canvas {
  return new OffscreenCanvas(width, height) as Canvas;
}

import {
  indexRenderHandler,
  RenderMessageHandler,
} from "@iso-game/handlers/handlers.ts";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  gobalMapState,
} from "@iso-game/handlers/game/mapState.ts";
import {
  CanvasMapDrawersConf,
  CanvasMapDrawersConfDefault,
} from "@iso-game/mapIso/render/type.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";

export const createHander = (
  worker: Window & typeof globalThis,
  canvas?: Canvas,
) => {
  const drawConf: CanvasMapDrawersConf = CanvasMapDrawersConfDefault;

  const offScreenCanvas = canvas
    ? canvas
    : _createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const canvasCtx = offScreenCanvas.getContext(
    "2d",
  ) as CanvasRenderingContext2D;

  const isomer = new Isomer(
    offScreenCanvas,
    drawConf.DRAW_TILE_COUNT,
    drawConf.SCALE_SIZE,
    drawConf.SCALE_MOD,
  );
  const isoProject = new IsometricProjector({
    originX: offScreenCanvas.width / 2,
    originY: offScreenCanvas.height / 2 +
      drawConf.DRAW_TILE_COUNT * 16 * drawConf.SCALE_SIZE,
    SCALE_SIZE: drawConf.SCALE_SIZE,
    SCALE_MOD: drawConf.SCALE_MOD,
  });

  const tilesMatrix = new TilesMatrixAvg(
    drawConf.DRAW_TILE_COUNT,
    0,
    0,
    drawConf.SCALE_MOD,
  );

  // const assetLoader = await AssetLoaderOpti.create();

  const frameCount: number = 0;
  const mapState = gobalMapState;

  const renderHandlerConfig = {
    worker: worker,
    tag: "render" as const,
    conf: drawConf,
    isomer,
    isoProject,

    assetLoader: undefined,
    canvasCtx,

    frameCount,
    mapState,
    tilesMatrix,
    tileCache: new Map(),
  };
  return new RenderMessageHandler(
    renderHandlerConfig,
    indexRenderHandler,
  );
};
