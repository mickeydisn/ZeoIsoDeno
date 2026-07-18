import { toolRegistry } from "@iso-game/tools/toolRegistry.ts";

import { TBaseMessage } from "@iso-game/etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

// ------------------- PRIVATE ------------------
async function _getBlobUrlFromAsset(
  _ctx: TGameHandlerContext,
  assetId: string,
): Promise<string | null> {
  _ctx.toolState.assetStates.setActiveAssetId(assetId);
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
export interface EventSetBuildingConfig
  extends TBaseMessage<"setBuildingConfig"> {
  configId: string;
}
export const setBuildingConfig: TGameHandlerAction<EventSetBuildingConfig> =
  gameAction<EventSetBuildingConfig>(
    "setBuildingConfig",
    (data: EventSetBuildingConfig, _ctx: TGameHandlerContext) => {
      console.log("setBuildingConfig received:", data.configId);
      _ctx.toolState.buildingStates.setBuildingConfig(data.configId);
      toolRegistry.setBuildingConfig(data.configId);
    },
  );

// -------------------------------------
export interface EventSetBuildingParams
  extends TBaseMessage<"setBuildingParams"> {
  growLoop: number;
  endLoop: number;
}
export const setBuildingParams: TGameHandlerAction<EventSetBuildingParams> =
  gameAction<EventSetBuildingParams>(
    "setBuildingParams",
    (data: EventSetBuildingParams, _ctx: TGameHandlerContext) => {
      console.log("setBuildingParams received:", data.growLoop, data.endLoop);
      _ctx.toolState.buildingStates.setBuildingParams(data.growLoop);
      toolRegistry.setBuildingParams(data.growLoop);
    },
  );

// -------------------------------------
export interface EventSetActiveTool extends TBaseMessage<"setActiveTool"> {
  toolId: string;
  potionId?: string | null; // optional potion ID for potion tools
}
export const setActiveTool: TGameHandlerAction<EventSetActiveTool> = gameAction<
  EventSetActiveTool
>("setActiveTool", (data: EventSetActiveTool, _ctx: TGameHandlerContext) => {
  console.log("setActiveTool received:", data.toolId, data.potionId);
  _ctx.toolState.setActive(data.toolId);
  toolRegistry.setActive(data.toolId);
  // If a potionId is provided, set it on the registry so the use_potion tool can read it
  if (data.potionId !== undefined) {
    _ctx.toolState.potionStates.setActivePotionId(data.toolId);
    toolRegistry.setActivePotionId(data.potionId);
  }
});

// -------------------------------------
export interface EventSetBrushSize extends TBaseMessage<"setBrushSize"> {
  size: number;
}
export const setBrushSize: TGameHandlerAction<EventSetBrushSize> = gameAction<
  EventSetBrushSize
>("setBrushSize", (data: EventSetBrushSize, _ctx: TGameHandlerContext) => {
  _ctx.toolState.tileStates.setBrushSize(data.size);
  toolRegistry.setBrushSize(data.size);
});

// -------------------------------------
export interface EventSetColor extends TBaseMessage<"setColor"> {
  r: number;
  g: number;
  b: number;
}
export const setColor: TGameHandlerAction<EventSetColor> = gameAction<
  EventSetColor
>(
  "setColor",
  (data: EventSetColor, _ctx: TGameHandlerContext) => {
    _ctx.toolState.tileStates.setActiveColor(data.r, data.g, data.b);
    toolRegistry.setActiveColor(data.r, data.g, data.b);
  },
);

// -------------------------------------
