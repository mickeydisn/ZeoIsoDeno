import { World } from "@iso-game/word.ts";
import { CanvasMapDrawers } from "@iso-game/mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import {
  GameMessageHandler,
  indexGameHandler,
  RenderMessageHandler,
} from "@iso-game/handlers/handlers.ts";
import { createHander } from "../../../../IsoGame/handlers/render/create.ts";
import { drawUpdate } from "@iso-game/handlers/render/update.ts";

export class GameWorker {
  public world = new World();
  public gameHandler: GameMessageHandler;
  // public renderHandler: RenderMessageHandler

  public assetLoader!: AssetLoaderOpti;
  public canvasMap!: OffscreenCanvas;
  public canvasMapDrawer!: CanvasMapDrawers;

  framId: number = 0;
  private _shouldRun = false;

  constructor() {
    this.gameHandler = new GameMessageHandler({
      tag: "game",
      worker: self,
      gameloop: this,
      world: this.world,
    }, indexGameHandler);
    // this.renderHandler =
    // createHander(self, this.canvasMap)
    self.onmessage = (e) => {
      return this.gameHandler.handleIncoming(e.data); // || this.renderHandler.handleIncoming(e.data)
    };
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
    this.gameHandler.send({ action: "FPS", fps: fps });
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
      //this.canvasMapDrawer.direction = mapState.direction;
      /*
      drawUpdate(
        this.renderHandler.ctx,
        gobalMapState.x,
        gobalMapState.y,
        (gobalMapState.xf - gobalMapState.x) / gobalMapState.isoConf.tileScaleMod,
        (gobalMapState.yf - gobalMapState.y) / gobalMapState.isoConf.tileScaleMod,
      );
      */

      this.canvasMapDrawer.drawUpdate(
        gobalMapState.x,
        gobalMapState.y,
        (gobalMapState.xf - gobalMapState.x) /
          gobalMapState.isoConf.tileScaleMod,
        (gobalMapState.yf - gobalMapState.y) /
          gobalMapState.isoConf.tileScaleMod,
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
