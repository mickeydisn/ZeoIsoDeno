import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import { gameAction, TGameHandlerAction , TGameHandlerContext } from "../contexts.ts";



// ------------------- PRIVATE ------------------
async function _getBlobUrlFromAsset(_ctx: TGameHandlerContext, assetId: string): Promise<string | null> {
  toolRegistry.setActiveAssetId(assetId);
  const assetLoader = _ctx.gameloop.assetLoader;
  if (assetLoader && assetId) {
    try {
      const canvas = assetLoader.getAsset(assetId);
      if (canvas) {
        const blob = await canvas.convertToBlob();
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      }
    } catch (error) {
      console.error("Error generating asset preview:", error);
      return null;
    }
  }
  return null;
}


// -------------------------------------
export interface EventSetBuildingConfig extends TBaseMessage<"setBuildingConfig"> {
  configId: string;
}
const setBuildingConfig: TGameHandlerAction<EventSetBuildingConfig> = 
  gameAction<EventSetBuildingConfig>("setBuildingConfig", 
   (data: EventSetBuildingConfig, _ctx: TGameHandlerContext) => {
  console.log("setBuildingConfig received:", data.configId);
  toolRegistry.setBuildingConfig(data.configId);
});

// -------------------------------------
export interface EventSetBuildingParams extends TBaseMessage<"setBuildingParams"> {
  growLoop: number;
  endLoop: number;
}
const setBuildingParams: TGameHandlerAction<EventSetBuildingParams> = 
  gameAction<EventSetBuildingParams>("setBuildingParams", 
   (data: EventSetBuildingParams, _ctx: TGameHandlerContext) => {

  console.log("setBuildingParams received:", data.growLoop, data.endLoop);
  toolRegistry.setBuildingParams(data.growLoop);
});

// -------------------------------------
export interface EventSetActiveTool extends TBaseMessage<"setActiveTool"> {
  toolId: string;
}
const setActiveTool: TGameHandlerAction<EventSetActiveTool> = 
  gameAction<EventSetActiveTool>("setActiveTool", 
   (data: EventSetActiveTool, _ctx: TGameHandlerContext) => {
  toolRegistry.setActive(data.toolId);
});

// -------------------------------------
export interface EventSetBrushSize extends TBaseMessage<"setBrushSize"> {
  size: number;
}
const setBrushSize: TGameHandlerAction<EventSetBrushSize> = 
  gameAction<EventSetBrushSize>("setBrushSize", 
   (data: EventSetBrushSize, _ctx: TGameHandlerContext) => {
  toolRegistry.setBrushSize(data.size);
});

// -------------------------------------
export interface EventSetColor extends TBaseMessage<"setColor"> {
  r: number;
  g: number;
  b: number;
}
const setColor: TGameHandlerAction<EventSetColor> = 
  gameAction<EventSetColor>("setColor", 
   (data: EventSetColor, _ctx: TGameHandlerContext) => {

  toolRegistry.setActiveColor(data.r, data.g, data.b);
});

// -------------------------------------
export interface EventSetActiveAsset extends TBaseMessage<"setActiveAsset"> {
  assetId: string;
}
const setActiveAsset: TGameHandlerAction<EventSetActiveAsset> = 
  gameAction<EventSetActiveAsset>("setActiveAsset", 
 async  (data: EventSetActiveAsset, _ctx: TGameHandlerContext) => {

  console.log("setActiveAsset received:", data.assetId);
  const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
  if (blobUrl) {
    _ctx.handler.send({
      action: "assetPreview",
      blobUrl: blobUrl,
    });
  }
});

// -------------------------------------
export interface EventGetAsset extends TBaseMessage<"getAsset"> {
  assetId: string;
}
const getAsset: TGameHandlerAction<EventGetAsset> = 
  gameAction<EventGetAsset>("getAsset", 
   async (data: EventGetAsset, _ctx: TGameHandlerContext) => {
  const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
  if (blobUrl) {
      return { blobUrl: blobUrl };
  }
});

// -------------------------------------
export interface EventToolClick extends TBaseMessage<"toolClick"> {
  gridX?: number;
  gridY?: number;
  x?: number;
  y?: number;
}
const toolClick: TGameHandlerAction<EventToolClick> = 
  gameAction<EventToolClick>("toolClick", 
   (data: EventToolClick, _ctx: TGameHandlerContext) => {
  const x = data.gridX !== undefined
    ? data.gridX + gobalMapState.x - 1
    : data.x !== undefined
    ? data.x
    : gobalMapState.x;
  const y = data.gridY !== undefined
    ? data.gridY + gobalMapState.y - 1
    : data.y !== undefined
    ? data.y
    : gobalMapState.y;

  const _result = toolRegistry.executeAt(x, y);

  _ctx.handler.send({
    action: "toolExecuted",
    toolId: toolRegistry.getActiveId(),
    success: true,
  });
});

// -------------------------------------


export const toolHandlers = [
  setActiveTool,
  setBrushSize,
  setColor,
  setActiveAsset,
  getAsset,
  setBuildingConfig,
  setBuildingParams,
  toolClick,
] as const;
