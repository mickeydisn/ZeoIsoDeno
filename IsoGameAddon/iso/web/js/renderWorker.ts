import { AssetLoaderOpti } from "../../../../IsoGame/mapIso/asset/assetLoaderOpti.ts";
import { CanvasMapDrawers } from "../../../../IsoGame/mapIso/canvasMapDrawer.ts";
import { World } from "../../../../IsoGame/word.ts";

type RenderHandlerData = any;

class RenderWorker {
  private assetLoader = new AssetLoaderOpti();
  private canvesMap!: CanvasMapDrawers;

  constructor() {
    self.onmessage = (e) => this.handlers.get(e.data.action)?.(e.data);
  }

  private init = (data: RenderHandlerData) => {
    console.log("=== Init Render Worker");
    this.canvesMap = new CanvasMapDrawers(data.word as World, 1600, 800, {
      DRAW_TILE_COUNT: 40 * 2,
      SCALE_SIZE: 1 / 2,
      SCALE_MOD: 1,
    }, this.assetLoader);
  };

  private handlers = new Map<string, (_data: RenderHandlerData) => void>([
    ["init", this.init.bind(this)],
  ]);
  addHandels(key: string, func: (_data: RenderHandlerData) => void) {
    this.handlers.set(key, func);
  }
}

new RenderWorker();
