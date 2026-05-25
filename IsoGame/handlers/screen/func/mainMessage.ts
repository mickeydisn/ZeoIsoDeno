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
import { mapDB } from "@iso-game/map/persistence/db/mapWebDatabase.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";

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

export interface EventPotionUsed
  extends TBaseMessage<"potionUsed"> {
  potionId: string;
  remainingUses: number;
  success: boolean;
  reason?: string;
}
const potionUsed: TScreenHandlerAction<EventPotionUsed> = screenAction<
  EventPotionUsed
>("potionUsed", async (data: EventPotionUsed, _ctx: TScreenHandlerContext) => {
  // Persist updated player state to IndexedDB
  try {
    const username = gobalMapState.playerState.username;
    const potion = gobalMapState.playerState.inventory.find(p => p.id === data.potionId);
    if (potion) {
      await mapDB.savePotion(username, potion);
    } else if (data.success) {
      await mapDB.deletePotion(data.potionId);
    }
  } catch (err) {
    console.error("[PotionUsed] Failed to persist:", err);
  }

  // Show feedback
  if (data.success) {
    const msg = data.remainingUses > 0
      ? `\u{1F9EA} Potion used! ${data.remainingUses} use${data.remainingUses !== 1 ? "s" : ""} remaining.`
      : "\u{1F9EA} Potion used \u2014 last use consumed.";
    if (!document.getElementById("potion-use-indicator")) {
      const indicator = document.createElement("div");
      indicator.textContent = msg;
      indicator.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#4a7;color:#fff;padding:12px 24px;border-radius:8px;font-family:monospace;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.5);";
      indicator.id = "potion-use-indicator";
      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 3000);
    }
  } else {
    console.warn("[PotionUsed] Failed:", data.reason ?? "Unknown error");
    const indicator = document.createElement("div");
    indicator.textContent = `\u274C Potion failed: ${data.reason ?? "Unknown error"}`;
    indicator.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#a44;color:#fff;padding:12px 24px;border-radius:8px;font-family:monospace;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.5);";
    indicator.id = "potion-use-indicator";
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 3000);
  }
});

// -------------------------------------------------
// -------------------------------------------------
// -------------------------------------------------

export const initScreenHandler = [
  FPS,
  assetGroups,
  assetPreview,
  infoCardPositions,
  potionUsed,
] as const;
