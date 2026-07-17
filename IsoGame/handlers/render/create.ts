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
  gobalGameState,
} from "@iso-game/states/game/gameState.ts";

import { DEFAULT_ISO_CONFIG, IsoConfig } from "@iso-game/mapIso/render/type.ts";
import { Isomer } from "@iso-game/mapIso/utils/iso/isomer.ts";
import { IsometricProjector } from "@iso-game/mapIso/utils/simpleIso/IsometricProjector.ts";
import { TilesMatrixAvg } from "@iso-game/map/object/tilesMatrix.ts";
import { gobalRenderState } from "../../states/render/renderState.ts";

export const createHander = (
  worker: Window & typeof globalThis,
  canvas?: Canvas,
) => {
  const drawConf: IsoConfig = DEFAULT_ISO_CONFIG;

  const offScreenCanvas = canvas
    ? canvas
    : _createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
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

  // const assetLoader = await AssetLoaderOpti.create();

  const frameCount: number = 0;
  const gameState = gobalGameState;
  const renderState = gobalRenderState;

  const renderHandlerConfig = {
    worker: worker,
    tag: "render" as const,
    conf: drawConf,
    isomer,
    isoProject,

    assetLoader: undefined,
    canvasCtx,

    frameCount,
    currentDiplayBox: [],
    gameState,
    renderState,
    tilesMatrix,
    tileCache: new Map(),
  };
  return new RenderMessageHandler(
    renderHandlerConfig,
    indexRenderHandler,
  );
};
