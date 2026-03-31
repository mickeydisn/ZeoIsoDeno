import {
  CanvasMapDrawers,
  CanvasMapDrawersConf,
} from "../../../IsoGame/mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "../../../IsoGame/mapIso/asset/assetLoaderOpti.ts";
import { World } from "../../../IsoGame/word.ts";

export class GameWorker {
  private world = new World();

  private handler: MessageHandler;
  x: number = 0;
  y: number = 0;
  xf: number = 0;
  yf: number = 0;

  private assetLoader!: AssetLoaderOpti;
  private canvasMap!: OffscreenCanvas;
  private canvasMapDrawer!: CanvasMapDrawers;
  private sharedMapLvl!: Float32Array;

  framId: number = 0;
  private _shouldRun = false;

  constructor() {
    this.handler = new MessageHandler(self);
    // Setup message handlers using the new appendHandlers method
    this.handler.appendHandlers(this.getGameWorkerHandlers());
  }

  // ============================================================================
  // INIT
  // ============================================================================

  private initWorker = async (_data: GameHandlerData) => {
    console.log("=== InitGameWorker");

    console.log("== Load Asset");
    this.assetLoader = await AssetLoaderOpti.create();

    console.log("== Load Word");
    this.world.init();

    this.handler.send({ action: "callback_initWorker" });
  };

  // ============================================================================
  // SET SHARED / INIT RENDER
  // ============================================================================

  private setCanvasMap = (data: GameHandlerData) => {
    // Check for correct message type if necessary, here we assume it's setCanvasMap
    const canvas = (data as any).canvas as OffscreenCanvas;
    this.canvasMap = canvas;
  };

  private initCanvasMap = (data: GameHandlerData) => {
    const config = data as any;
    console.log("=== Init Render Worker");
    this.canvasMapDrawer = new CanvasMapDrawers(
      this.world,
      config.width || 1600,
      config.height || 800,
      config.mapConf as CanvasMapDrawersConf || {
        DRAW_TILE_COUNT: 40,
        SCALE_SIZE: 1, 
        SCALE_MOD: 1,
      },
      this.assetLoader,
      this.canvasMap,
    );

    this.handler.send(
      {
        action: "callback_initCanvasMap",
        mapConf: config.mapConf,
        mapLvlBuffer: this.canvasMapDrawer.bufferMapLvl,
        mapInfoBuffer: this.canvasMapDrawer.bufferMapInfo,
      },
    );
  };
  

  // ============================================================================
  // == LOOP
  // ============================================================================

  // FPS, startLoop, stopLoop, and updateFram remain unchanged...
  // ----------------------------------------------------------------------------
  // FPS
  lastFrameTime = performance.now();
  frameTimes: number[] = [];

  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60) this.frameTimes.shift(); // Keep last 60 frames

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) /
      this.frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);
    this.handler.send({ action: "FPS", fps: fps });
  }

  startLoop() {
    console.log("GameWorker: # START #");
    this._shouldRun = true;
    this.updateFram();
  }

  stopLoop() {
    console.log("GameWorker: # STOP #");
    this._shouldRun = false;
  }

  // 🌟 Read Matrix & Update Grid Efficiently
  updateFram() {
    if (!this._shouldRun) {
      return;
    }
    this.framId = (this.framId + 1) % 1024;
    if (this.framId % 4 == 0) {
      this.updateFPS();
      console.log("Draw");

      this.world.tick();

      this.canvasMapDrawer.drawUpdate(
        this.x,
        this.y,
        this.xf - this.x,
        this.yf - this.y,
      );
    }
    requestAnimationFrame(this.updateFram.bind(this));
  }
}

// ============================================================================
// ============================================================================

new GameWorker();

// ============================================================================
// ============================================================================