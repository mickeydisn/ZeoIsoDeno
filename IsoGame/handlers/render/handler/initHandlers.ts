import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import { AssetLoaderOpti } from "@iso-game/mapIso/asset/assetLoaderOpti.ts";
import {
  renderAction,
  TRenderHandlerAction,
  TRenderHandlerContext,
} from "../contexts.ts";
import { IsoConfig } from "@iso-game/mapIso/render/type.ts";
import {
  TypeAssetGroupConfig,
  TypeAssetImageConfig,
} from "@iso-game/mapIso/asset/assetOptiConfig.ts";

// -------------------------------------

export interface EventInitWorker extends TBaseMessage<"iniRender"> {}

const iniRender: TRenderHandlerAction<EventInitWorker> = renderAction<
  EventInitWorker
>("iniRender", async (_data: EventInitWorker, _ctx: TRenderHandlerContext) => {
  console.log("# Init Render Worker");

  console.log("## AssetLoader");
  _ctx.assetLoader = await AssetLoaderOpti.create();

  // Send asset groups to main thread for asset browser
  const assetGroups = _ctx.assetLoader.assetList.map((
    g: TypeAssetGroupConfig,
  ) => ({
    group: g.group,
    imgType: g.imgType,
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

const setOffScreenRender: TRenderHandlerAction<EventSetCanvasMap> =
  renderAction<EventSetCanvasMap>(
    "setOffScreenRender",
    (data: EventSetCanvasMap, _ctx: TRenderHandlerContext) => {
      const canvas = data.canvas as OffscreenCanvas;
      _ctx.canvasMap = canvas;
    },
  );

// -------------------------------------

export interface EventInitCanvasMap extends TBaseMessage<"initRenderMap"> {
  mapConf: IsoConfig;
  width?: number;
  height?: number;
}

const initRenderMap: TRenderHandlerAction<EventInitCanvasMap> = renderAction<
  EventInitCanvasMap
>("initRenderMap", (data: EventInitCanvasMap, _ctx: TRenderHandlerContext) => {
  console.log("=== Init Render Canvas");

  const isoConf: IsoConfig = {
    mapGridSize: data.mapConf.mapGridSize ?? 40,
    mapGridTileScale: data.mapConf.mapGridTileScale ?? 1.2,
    mapGridMod: data.mapConf.mapGridMod ?? 1,
    showTileBox: data.mapConf.showTileBox ?? false,
    showIsFrise: data.mapConf.showIsFrise ?? true,
    showIsBlock: data.mapConf.showIsBlock ?? true,
  };
  Object.assign(_ctx.conf, isoConf);
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const initRenderHandlers = [
  iniRender,
  setOffScreenRender,
  initRenderMap,
] as const;
