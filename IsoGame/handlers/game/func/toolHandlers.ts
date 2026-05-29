import { toolRegistry } from "../tools/toolRegistry.ts";
import { gobalMapState } from "@iso-game/handlers/game/mapState.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import type { Potion } from "@iso-game/handlers/game/mapState.ts";
import { mapDB } from "../../../map/persistence/db/mapWebDatabase.ts";
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
const setBuildingConfig: TGameHandlerAction<EventSetBuildingConfig> =
  gameAction<EventSetBuildingConfig>(
    "setBuildingConfig",
    (data: EventSetBuildingConfig, _ctx: TGameHandlerContext) => {
      console.log("setBuildingConfig received:", data.configId);
      toolRegistry.setBuildingConfig(data.configId);
    },
  );

// -------------------------------------
export interface EventSetBuildingParams
  extends TBaseMessage<"setBuildingParams"> {
  growLoop: number;
  endLoop: number;
}
const setBuildingParams: TGameHandlerAction<EventSetBuildingParams> =
  gameAction<EventSetBuildingParams>(
    "setBuildingParams",
    (data: EventSetBuildingParams, _ctx: TGameHandlerContext) => {
      console.log("setBuildingParams received:", data.growLoop, data.endLoop);
      toolRegistry.setBuildingParams(data.growLoop);
    },
  );

// -------------------------------------
export interface EventSetActiveTool extends TBaseMessage<"setActiveTool"> {
  toolId: string;
  potionId?: string | null; // optional potion ID for potion tools
}
const setActiveTool: TGameHandlerAction<EventSetActiveTool> = gameAction<
  EventSetActiveTool
>("setActiveTool", (data: EventSetActiveTool, _ctx: TGameHandlerContext) => {
  console.log("setActiveTool received:", data.toolId, data.potionId);
  toolRegistry.setActive(data.toolId);
  // If a potionId is provided, set it on the registry so the use_potion tool can read it
  if (data.potionId !== undefined) {
    toolRegistry.setActivePotionId(data.potionId);
  }
});

// -------------------------------------
export interface EventSetBrushSize extends TBaseMessage<"setBrushSize"> {
  size: number;
}
const setBrushSize: TGameHandlerAction<EventSetBrushSize> = gameAction<
  EventSetBrushSize
>("setBrushSize", (data: EventSetBrushSize, _ctx: TGameHandlerContext) => {
  toolRegistry.setBrushSize(data.size);
});

// -------------------------------------
export interface EventSetColor extends TBaseMessage<"setColor"> {
  r: number;
  g: number;
  b: number;
}
const setColor: TGameHandlerAction<EventSetColor> = gameAction<EventSetColor>(
  "setColor",
  (data: EventSetColor, _ctx: TGameHandlerContext) => {
    toolRegistry.setActiveColor(data.r, data.g, data.b);
  },
);

// -------------------------------------
export interface EventSetActiveAsset extends TBaseMessage<"setActiveAsset"> {
  assetId: string;
}
const setActiveAsset: TGameHandlerAction<EventSetActiveAsset> = gameAction<
  EventSetActiveAsset
>(
  "setActiveAsset",
  async (data: EventSetActiveAsset, _ctx: TGameHandlerContext) => {
    console.log("setActiveAsset received:", data.assetId);
    const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
    if (blobUrl) {
      _ctx.handler.send({
        action: "assetPreview",
        blobUrl: blobUrl,
      });
    }
  },
);

// -------------------------------------
export interface EventGetAsset extends TBaseMessage<"getAsset"> {
  assetId: string;
}
const getAsset: TGameHandlerAction<EventGetAsset> = gameAction<EventGetAsset>(
  "getAsset",
  async (data: EventGetAsset, _ctx: TGameHandlerContext) => {
    const blobUrl = await _getBlobUrlFromAsset(_ctx, data.assetId);
    if (blobUrl) {
      return { blobUrl: blobUrl };
    }
  },
);

// -------------------------------------
export interface EventToolClick extends TBaseMessage<"toolClick"> {
  gridX?: number;
  gridY?: number;
  x?: number;
  y?: number;
}
const toolClick: TGameHandlerAction<EventToolClick> = gameAction<
  EventToolClick
>("toolClick", async (data: EventToolClick, _ctx: TGameHandlerContext) => {
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

  const _result = toolRegistry.executeAt(x, y, _ctx);

  // If a potion was used, persist the inventory change to IndexedDB (server truth)
  if (
    _result && typeof _result === "object" && "potionId" in (_result as any)
  ) {
    console.log("------------------- Potion");
    const result = _result as { potionId: string; remainingUses: number };
    try {
      // Always save the potion (even at 0 uses) — the UI hides depleted potions
      // but they stay in the DB so the player can see history.
      const potion = gobalMapState.playerState.inventory.find(
        (p) => p.id === result.potionId,
      );
      if (potion) {
        console.log("-------------------", potion);
        await mapDB.savePotion(gobalMapState.playerState.username, potion);
      }
    } catch (err) {
      console.error("[toolClick] Failed to persist potion to DB:", err);
    }
    // Notify client with authoritative inventory state after DB persist
    _ctx.handler.send({
      action: "potionDBSynced",
      potions: [...gobalMapState.playerState.inventory],
    });
  }

  _ctx.handler.send({
    action: "toolExecuted",
    toolId: toolRegistry.getActiveId(),
    success: true,
    potionResult:
      _result && typeof _result === "object" && "potionId" in (_result as any)
        ? (_result as {
          success: boolean;
          potionId: string;
          remainingUses: number;
          reason?: string;
        })
        : undefined,
  });
});

// -------------------------------------
export interface EventSyncInventory extends TBaseMessage<"syncInventory"> {
  inventory: Potion[];
}
const syncInventory: TGameHandlerAction<EventSyncInventory> = gameAction<
  EventSyncInventory
>("syncInventory", (data: EventSyncInventory, _ctx: TGameHandlerContext) => {
  // Sync the inventory from main thread into the worker's game state
  // so potionTool.ts can look up potions by ID.
  gobalMapState.playerState.inventory = data.inventory;
  console.log(
    `[syncInventory] Synced ${data.inventory.length} potions to worker state`,
  );
});

// -------------------------------------
export interface EventSavePotion extends TBaseMessage<"savePotion"> {
  potion: Potion;
}
const savePotion: TGameHandlerAction<EventSavePotion> = gameAction<
  EventSavePotion
>("savePotion", async (data: EventSavePotion, _ctx: TGameHandlerContext) => {
  console.log(
    "[savePotion] Persisting potion:",
    data.potion.id,
    data.potion.name,
  );
  try {
    await mapDB.savePotion(gobalMapState.playerState.username, data.potion);
    // Sync to local player state in worker
    const idx = gobalMapState.playerState.inventory.findIndex(
      (p) => p.id === data.potion.id,
    );
    if (idx !== -1) {
      gobalMapState.playerState.inventory[idx] = data.potion;
    } else {
      gobalMapState.playerState.inventory.push(data.potion);
    }
    // Notify client that DB save is complete
    _ctx.handler.send({
      action: "potionDBSynced",
      potions: [...gobalMapState.playerState.inventory],
    });
  } catch (err) {
    console.error("[savePotion] Error:", err);
    _ctx.handler.send({
      action: "potionDBSynced",
      error: String(err),
      potions: [...gobalMapState.playerState.inventory],
    });
  }
});

// -------------------------------------
export interface EventDeletePotion extends TBaseMessage<"deletePotion"> {
  potionId: string;
}
const deletePotion: TGameHandlerAction<EventDeletePotion> = gameAction<
  EventDeletePotion
>(
  "deletePotion",
  async (data: EventDeletePotion, _ctx: TGameHandlerContext) => {
    console.log("[deletePotion] Deleting potion:", data.potionId);
    try {
      await mapDB.deletePotion(data.potionId);
      const idx = gobalMapState.playerState.inventory.findIndex(
        (p) => p.id === data.potionId,
      );
      if (idx !== -1) {
        gobalMapState.playerState.inventory.splice(idx, 1);
      }
      _ctx.handler.send({
        action: "potionDBSynced",
        potions: [...gobalMapState.playerState.inventory],
      });
    } catch (err) {
      console.error("[deletePotion] Error:", err);
      _ctx.handler.send({
        action: "potionDBSynced",
        error: String(err),
        potions: [...gobalMapState.playerState.inventory],
      });
    }
  },
);

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
  syncInventory,
  savePotion,
  deletePotion,
] as const;
