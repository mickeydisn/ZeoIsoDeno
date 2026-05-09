import { TileInfo } from "@iso-game/map/object/tile.ts";
import { TBaseMessage } from "../../../../../../IsoGame/etc/handlers/types/type.ts";
import { screenAction, TScreenHandlerAction, TScreenHandlerContext } from "@iso-web/js/handlers/contexts.ts";
import { handleAssetGroups, handleAssetPreview, initAssetGroups } from "@iso-web/js/menu/sections/assetMenu.ts";
import { InfoCardManager } from "@iso-web/js/menu/infoCard.ts";


// ----

export interface EventMainInit extends TBaseMessage<"callback_initWorker"> {
  action: "callback_initWorker";
}


export interface EventInfoCell extends TBaseMessage<"infoCell"> {
  data: TileInfo;
}



export interface EventPickedColor extends TBaseMessage<"pickedColor"> {
  r: number;
  g: number;
  b: number;
}



export interface EventBuildingConfigList extends TBaseMessage <"buildingConfigList">{
  configs: Array<{
    id: string;
    name: string;
    description: string;
    defaultGrowLoop: number;
    defaultEndLoop: number;
  }>;
}

export interface EventToolExecuted extends TBaseMessage<"toolExecuted">{
  action: "toolExecuted";
  toolId: string | null;
  success: boolean;
}

export interface EventToolList extends TBaseMessage<"toolList"> {
  tools: Array<{
    id: string;
    name: string;
    icon: string;
    category: string;
  }>;
}



// -------------------------------------------------

export interface EventInfoFPS extends TBaseMessage<"FPS"> {
  fps: number;
}
const FPS: TScreenHandlerAction<EventInfoFPS> = 
  screenAction<EventInfoFPS>("FPS", 
   (data: EventInfoFPS, _ctx: TScreenHandlerContext) => {
  const fpsDisplay = document.getElementById("fps")!;
    fpsDisplay.textContent = `FPS: ${data.fps}`;
});

// -------------------------------------------------


export interface EventAssetGroups extends TBaseMessage<"assetGroups"> {
  groups: Array<{
    group: string;
    images: string[];
  }>;
}
const assetGroups: TScreenHandlerAction<EventAssetGroups> = 
  screenAction<EventAssetGroups>("assetGroups", 
  (data: EventAssetGroups, _ctx: TScreenHandlerContext) => {
    initAssetGroups(_ctx.worker, _ctx.handler);
    handleAssetGroups(data.groups);
});



// -------------------------------------------------


export interface EventAssetPreview extends TBaseMessage<"assetPreview"> {
  blobUrl: string;
}

const assetPreview: TScreenHandlerAction<EventAssetPreview> = 
  screenAction<EventAssetPreview>("assetPreview", 
  (data: EventAssetPreview, _ctx: TScreenHandlerContext) => {
    handleAssetPreview(data.blobUrl);
});


// -------------------------------------------------

export interface EventInfoCardPosition extends TBaseMessage<"infoCardPosition"> {
  cardId: string;
  x: number; y: number;
}
const infoCardPosition: TScreenHandlerAction<EventInfoCardPosition> = 
  screenAction<EventInfoCardPosition>("infoCardPosition", 
   (data: EventInfoCardPosition, _ctx: TScreenHandlerContext) => {
      InfoCardManager.getInstance().updatePos(data.cardId, data.x, data.y)
      // console.warn("==> infoCardPosition", data)
});


// -------------------------------------------------
// -------------------------------------------------
// -------------------------------------------------

export const initScreenHandler = [
  FPS,
  assetGroups,
  assetPreview,
  infoCardPosition,
] as const;


