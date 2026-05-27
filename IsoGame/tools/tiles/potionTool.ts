import { defineTool, ToolConfigBrush, ToolContext } from "../type.ts";
import { toolRegistry } from "../toolRegistry.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { TilesActions } from "@iso-game/map/action2/tilesActions.ts";

/**
 * Use Potion Tool
 * When activated, executes the potion's action chain at the clicked tile position.
 * The active potion is looked up via toolRegistry.getActivePotionId().
 */
export const usePotionTool = defineTool<"use_potion", ToolConfigBrush>(
  "use_potion",
  "Use Potion",
  "🧪",
  "structure",
  (conf: ToolConfigBrush, _ctx: ToolContext) => {
    const potionId = toolRegistry.getActivePotionId();
    if (!potionId) {
      return { success: false, reason: "No active potion set" };
    }

    const inventory = gobalMapState.playerState.inventory;
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
    console.log(
      `Using potion ${potion.id} at (${conf.x}, ${conf.y}). Remaining uses: ${potion.remainingUses}`,
    );
    if (potion.remainingUses <= 0) {
      inventory.splice(idx, 1);
      toolRegistry.setActivePotionId(null);
      return { success: false, reason: "Potion has no remaining uses" };
    }

    // Decrement uses
    potion.remainingUses -= 1;

    // Build action configs injecting x,y
    const confs = potion.actions.map((entry) => ({
      func: entry.func,
      x: conf.x,
      y: conf.y,
      ...entry.config,
    }));

    // Execute all actions
    TilesActions.getInstance().doActions(confs);

    // Remove potion if 0 uses left
    if (potion.remainingUses <= 0) {
      inventory.splice(idx, 1);
    }

    // Notify main thread to persist — returns data for the caller to send
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
