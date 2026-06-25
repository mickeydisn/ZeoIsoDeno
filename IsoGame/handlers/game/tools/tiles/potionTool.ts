import { defineTool, ToolConfigBrush, ToolContext } from "../type.ts";
import { toolRegistry } from "../toolRegistry.ts";
import { gobalGameState } from "../../gameState.ts";
import { TilesActions } from "@iso-game/map/action/tilesActions.ts";
import { mapDB } from "../../../../map/persistence/db/mapWebDatabase.ts";
import { TGameHandlerContext } from "@iso-game/handlers/game/contexts.ts";

/**
 * Use Potion Tool
 * When activated, executes the potion's action chain at the clicked tile position.
 * The active potion is looked up via toolRegistry.getActivePotionId().
 * NOTE: The inventory is synced from the main thread via "syncInventory" message.
 */
export const usePotionTool = defineTool<"use_potion", ToolConfigBrush>(
  "use_potion",
  "Use Potion",
  "🧪",
  "structure",
  async (conf: ToolConfigBrush, _ctx: TGameHandlerContext) => {
    const potionId = toolRegistry.getActivePotionId();
    if (!potionId) {
      return { success: false, reason: "No active potion set" };
    }

    const inventory = gobalGameState.playerState.inventory;
    const idx = inventory.findIndex((p) => p.id === potionId);
    if (idx === -1) {
      toolRegistry.setActivePotionId(null);
      console.warn(
        `Potion with id ${potionId} not found in inventory. Clearing active potion.`,
        inventory,
      );
      return { success: false, reason: "Potion not found in inventory" };
    }

    const potion = inventory[idx];
    if (potion.remainingUses <= 0) {
      inventory.splice(idx, 1);
      toolRegistry.setActivePotionId(null);
      return { success: false, reason: "Potion has no remaining uses" };
    }

    // Decrement uses
    potion.remainingUses -= 1;
    console.log("---------------------------", potion, _ctx);
    // Build action configs injecting x,y
    const confs = potion.actions.map((entry) => ({
      func: entry.func,
      x: conf.x,
      y: conf.y,
      ...entry.config,
    }));

    // Execute all actions
    TilesActions.getInstance().doActions(confs);

    await mapDB.savePotion(gobalGameState.playerState.username, potion);
    _ctx.handler.send({
      action: "potionDBSynced",
      potions: [...gobalGameState.playerState.inventory],
    });

    // Keep potion in inventory even at 0 uses (don't delete).
    // The UI filters out 0-use potions from the select dropdown.
    // DB persistence is handled by the toolClick handler.

    return {
      success: true,
      potionId: potion.id,
      remainingUses: potion.remainingUses,
    };
  },
);

/**
 * Export all potion tools for registration
 */
export const potionTools = [
  usePotionTool,
];
