import { gobalGameState } from "../gameState.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import type { Potion } from "../gameState.ts";
import { mapDB } from "../../../map/persistence/db/mapWebDatabase.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

// -------------------------------------
export interface EventSyncInventory extends TBaseMessage<"syncInventory"> {
  inventory: Potion[];
}
export const syncInventory: TGameHandlerAction<EventSyncInventory> = gameAction<
  EventSyncInventory
>("syncInventory", (data: EventSyncInventory, _ctx: TGameHandlerContext) => {
  // Sync the inventory from main thread into the worker's game state
  // so potionTool.ts can look up potions by ID.
  gobalGameState.playerState.inventory = data.inventory;
  console.log(
    `[syncInventory] Synced ${data.inventory.length} potions to worker state`,
  );
});

// -------------------------------------
export interface EventSavePotion extends TBaseMessage<"savePotion"> {
  potion: Potion;
}
export const savePotion: TGameHandlerAction<EventSavePotion> = gameAction<
  EventSavePotion
>("savePotion", async (data: EventSavePotion, _ctx: TGameHandlerContext) => {
  console.log(
    "[savePotion] Persisting potion:",
    data.potion.id,
    data.potion.name,
  );
  try {
    await mapDB.savePotion(gobalGameState.playerState.username, data.potion);
    // Sync to local player state in worker
    const idx = gobalGameState.playerState.inventory.findIndex(
      (p) => p.id === data.potion.id,
    );
    if (idx !== -1) {
      gobalGameState.playerState.inventory[idx] = data.potion;
    } else {
      gobalGameState.playerState.inventory.push(data.potion);
    }
    // Notify client that DB save is complete
    _ctx.handler.send({
      action: "potionDBSynced",
      potions: [...gobalGameState.playerState.inventory],
    });
  } catch (err) {
    console.error("[savePotion] Error:", err);
    _ctx.handler.send({
      action: "potionDBSynced",
      error: String(err),
      potions: [...gobalGameState.playerState.inventory],
    });
  }
});

// -------------------------------------
export interface EventDeletePotion extends TBaseMessage<"deletePotion"> {
  potionId: string;
}
export const deletePotion: TGameHandlerAction<EventDeletePotion> = gameAction<
  EventDeletePotion
>(
  "deletePotion",
  async (data: EventDeletePotion, _ctx: TGameHandlerContext) => {
    console.log("[deletePotion] Deleting potion:", data.potionId);
    try {
      await mapDB.deletePotion(data.potionId);
      const idx = gobalGameState.playerState.inventory.findIndex(
        (p) => p.id === data.potionId,
      );
      if (idx !== -1) {
        gobalGameState.playerState.inventory.splice(idx, 1);
      }
      _ctx.handler.send({
        action: "potionDBSynced",
        potions: [...gobalGameState.playerState.inventory],
      });
    } catch (err) {
      console.error("[deletePotion] Error:", err);
      _ctx.handler.send({
        action: "potionDBSynced",
        error: String(err),
        potions: [...gobalGameState.playerState.inventory],
      });
    }
  },
);

// -------------------------------------
