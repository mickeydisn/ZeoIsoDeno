

import { TBaseMessage} from "../../../etc/handlers/types/type.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import { renderAction, TRenderHandlerAction , TRenderHandlerContext } from "../contexts.ts";
import { CanvasMapDrawersConf } from "@iso-game/mapIso/render/type.ts";
import { TypeAssetGroupConfig, TypeAssetImageConfig } from "@iso-game/mapIso/asset/assetOptiConfig.ts";


// -------------------------------------

export interface EventInitWorker extends TBaseMessage<"iniRender"> {}

const iniRender : TRenderHandlerAction<EventInitWorker> = 
  renderAction<EventInitWorker>("iniRender", 
  async (_data: EventInitWorker, _ctx: TRenderHandlerContext) => {
  console.log("# Init Render Worker");

  console.log("## AssetLoader");
  _ctx.assetLoader = await AssetLoaderOpti.create();

  // Send asset groups to main thread for asset browser
  const assetGroups = _ctx.assetLoader.assetList.map((g: TypeAssetGroupConfig) => ({
    group: g.group,
    images: g.images.map((i: TypeAssetImageConfig) => i.label), 
  }));
  _ctx.handler.send({
    action: "assetGroups",
    groups: assetGroups,
  });


});


// -------------------------------------


export interface EventSetCanvasMap extends TBaseMessage<"setOffScreenRender"> {
  canvas: OffscreenCanvas;
}

const setOffScreenRender : TRenderHandlerAction<EventSetCanvasMap> = 
  renderAction<EventSetCanvasMap>("setOffScreenRender", 
   (data: EventSetCanvasMap, _ctx: TRenderHandlerContext) => {
    const canvas = data.canvas as OffscreenCanvas;
    _ctx.canvasMap = canvas;
});

// -------------------------------------

export interface EventInitCanvasMap extends TBaseMessage<"initRenderMap"> {
  mapConf: {
    DRAW_TILE_COUNT: number;
    SCALE_SIZE: number;
    SCALE_MOD: number;
  };
  width?: number;
  height?: number;
}

const initRenderMap : TRenderHandlerAction<EventInitCanvasMap> = 
  renderAction<EventInitCanvasMap>("initRenderMap", 
   (data: EventInitCanvasMap, _ctx: TRenderHandlerContext) => {
  console.log("=== Init Render Canvas");

  const isoConf = data.mapConf as CanvasMapDrawersConf || {
    DRAW_TILE_COUNT: 40,
    SCALE_SIZE: 1.2,
    SCALE_MOD: 1,
  }
  _ctx.conf.DRAW_TILE_COUNT = isoConf.DRAW_TILE_COUNT
  _ctx.conf.SCALE_SIZE = isoConf.SCALE_SIZE
  _ctx.conf.SCALE_MOD = isoConf.SCALE_MOD
  // mapState._isoProject = 
  // mapState._tilesMatrix = _ctx.gameloop.canvasMapDrawer.tilesMatrix
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const initRenderHandlers = [
  iniRender,
  setOffScreenRender,
  initRenderMap,
] as const;