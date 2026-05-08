import { World } from "@iso-game/word.ts";
import { CanvasMapDrawers } from "@iso-game/mapIso/canvasMapDrawer.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { mapState } from "@iso-game/mapIso/mapState.ts";
import { GameMessageHandler, indexGameHandler } from "./handlers/handlers.ts";

export class GameWorker {
  public world = new World();
  public handler: GameMessageHandler

  public assetLoader!: AssetLoaderOpti;
  public canvasMap!: OffscreenCanvas;
  public canvasMapDrawer!: CanvasMapDrawers;

  framId: number = 0;
  private _shouldRun = false;

  constructor() {

    this.handler = new GameMessageHandler({
        tag: "game",
        worker: self,
        gameloop: this,
        world: this.world,
      },
      indexGameHandler,
    );
    self.onmessage = (e) => this.handler.handleIncoming(e.data);
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
