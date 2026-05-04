import { World } from "../../../../IsoGame/word.ts";
import { MessageHandler } from "./worker/messageHandler.ts";
import { CanvasMapDrawers } from "../../../../IsoGame/mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "../../../../IsoGame/mapIso/asset/assetLoaderOpti.ts";
import { getAllHandlers } from "./worker/handlers/index.ts";
import { mapState } from "../../../../IsoGame/mapIso/mapState.ts";

export type GameHandlerData = any;

export class GameWorker {
  public world = new World();
  public handler: MessageHandler;

  public assetLoader!: AssetLoaderOpti;
  private canvasMap!: OffscreenCanvas;
  public canvasMapDrawer!: CanvasMapDrawers;

  framId: number = 0;
  private _shouldRun = false;

  constructor() {
    this.handler = new MessageHandler(self);
    self.onmessage = (e) => this.handler.handleIncoming(e.data);

    const handlers = getAllHandlers(this);
    this.handler.append(Object.entries(handlers));
  }

  // ============================================================================
  // == LOOP
  // ============================================================================

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
      // console.log("Draw");

      this.world.tick();
      this.canvasMapDrawer.direction = mapState.direction;
      this.canvasMapDrawer.drawUpdate(
        mapState.x,
        mapState.y,
        (mapState.xf - mapState.x) / mapState.isoConf.tileScaleMod,
        (mapState.yf - mapState.y) / mapState.isoConf.tileScaleMod,
      );
    }
    requestAnimationFrame(this.updateFram.bind(this));
    // setTimeout(this.updateFram.bind(this), 1);
  }
}

// ============================================================================
// ============================================================================

new GameWorker();

// ============================================================================
// ============================================================================
