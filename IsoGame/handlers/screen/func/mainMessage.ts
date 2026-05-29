import { TileInfo } from "@iso-game/map/object/tile.ts";
import { TBaseMessage } from "@iso-game/etc/handlers/types/type.ts";
import {
  handleAssetGroups,
  handleAssetPreview,
  initAssetGroups,
} from "@iso-web/js/menu/sections/assetMenu.ts";
import { InfoCardManager } from "@iso-web/js/menu/infoCard.ts";
import {
  screenAction,
  TScreenHandlerAction,
  TScreenHandlerContext,
} from "@iso-game/handlers/screen/contexts.ts";
import { gobalMapState } from "@iso-game/handlers/game/mapState.ts";
import type { Potion } from "@iso-game/handlers/game/mapState.ts";

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

export interface EventBuildingConfigList
  extends TBaseMessage<"buildingConfigList"> {
  configs: Array<{
    id: string;
    name: string;
    description: string;
    defaultGrowLoop: number;
    defaultEndLoop: number;
  }>;
}

export interface EventToolExecuted extends TBaseMessage<"toolExecuted"> {
  action: "toolExecuted";
  toolId: string | null;
  success: boolean;
  potionResult?: {
    success: boolean;
    potionId: string;
    remainingUses: number;
    reason?: string;
  };
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
const FPS: TScreenHandlerAction<EventInfoFPS> = screenAction<EventInfoFPS>(
  "FPS",
  (data: EventInfoFPS, _ctx: TScreenHandlerContext) => {
    const fpsDisplay = document.getElementById("fps")!;
    fpsDisplay.textContent = `FPS: ${data.fps}`;
  },
);

// -------------------------------------------------

export interface EventAssetGroups extends TBaseMessage<"assetGroups"> {
  groups: Array<{
    group: string;
    images: string[];
  }>;
}
const assetGroups: TScreenHandlerAction<EventAssetGroups> = screenAction<
  EventAssetGroups
>("assetGroups", (data: EventAssetGroups, _ctx: TScreenHandlerContext) => {
  initAssetGroups(_ctx.worker, _ctx.handler);
  handleAssetGroups(data.groups);
});

// -------------------------------------------------

export interface EventAssetPreview extends TBaseMessage<"assetPreview"> {
  blobUrl: string;
}

const assetPreview: TScreenHandlerAction<EventAssetPreview> = screenAction<
  EventAssetPreview
>("assetPreview", (data: EventAssetPreview, _ctx: TScreenHandlerContext) => {
  handleAssetPreview(data.blobUrl);
});

// -------------------------------------------------

// -------------------------------------------------

export interface EventInfoCardPositions
  extends TBaseMessage<"infoCardPositions"> {
  cards: {
    cardId: string;
    x: number;
    y: number;
    distance: number;
  }[];
}
const infoCardPositions: TScreenHandlerAction<EventInfoCardPositions> =
  screenAction<EventInfoCardPositions>(
    "infoCardPositions",
    (data: EventInfoCardPositions, _ctx: TScreenHandlerContext) => {
      InfoCardManager.getInstance().updateAllPos(data.cards);
      // console.warn("==> infoCardPosition", data)
    },
  );

// -------------------------------------------------
// -------------------------------------------------

// -------------------------------------------------

export interface EventToolExecutedMsg extends TBaseMessage<"toolExecuted"> {
  toolId: string | null;
  success: boolean;
  potionResult?: {
    success: boolean;
    potionId: string;
    remainingUses: number;
    reason?: string;
  };
}
const toolExecuted: TScreenHandlerAction<EventToolExecutedMsg> = screenAction<
  EventToolExecutedMsg
>("toolExecuted", async (data: EventToolExecutedMsg) => {
  // DB persistence is now handled by the worker in toolClick handler.
  // The worker sends back potionDBSynced with authoritative inventory after save.
  // This handler only logs non-potion tool executions.
  if (!data.potionResult) {
    console.log(
      "[toolExecuted] Tool executed:",
      data.toolId,
      "success:",
      data.success,
    );
  }
});

// -------------------------------------------------

export interface EventPotionDBSynced extends TBaseMessage<"potionDBSynced"> {
  action: "potionDBSynced";
  potions: Potion[];
  error?: string;
}
const potionDBSynced: TScreenHandlerAction<EventPotionDBSynced> = screenAction<
  EventPotionDBSynced
>("potionDBSynced", async (data: EventPotionDBSynced) => {
  // Update local inventory to match DB (server truth)
  gobalMapState.playerState.inventory = data.potions;
  // Refresh the potion select dropdown UI
  const { refreshPotionSelect } = await import(
    "@iso-web/js/menu/sections/potionMenu.ts"
  );
  await refreshPotionSelect();
});

// -------------------------------------------------

export const initScreenHandler = [
  FPS,
  assetGroups,
  assetPreview,
  infoCardPositions,
  toolExecuted,
  potionDBSynced,
] as const;
