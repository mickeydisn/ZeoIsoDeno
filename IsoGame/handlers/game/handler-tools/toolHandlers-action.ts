import { toolRegistry } from "@iso-game/tools/com/toolRegistry.ts";

import { gobalGameState } from "@iso-game/states/game/gameState.ts";

import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import { mapDB } from "../../../map/persistence/db/mapWebDatabase.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";

// -------------------------------------
export interface EventToolClick extends TBaseMessage<"toolClick"> {
  gridX?: number;
  gridY?: number;
  x?: number;
  y?: number;
}
export const toolClick: TGameHandlerAction<EventToolClick> = gameAction<
  EventToolClick
>("toolClick", async (data: EventToolClick, _ctx: TGameHandlerContext) => {
  const x = data.gridX !== undefined
    ? data.gridX + gobalGameState.x - 1
    : data.x !== undefined
    ? data.x
    : gobalGameState.x;
  const y = data.gridY !== undefined
    ? data.gridY + gobalGameState.y - 1
    : data.y !== undefined
    ? data.y
    : gobalGameState.y;

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
      const potion = gobalGameState.playerState.inventory.find(
        (p) => p.id === result.potionId,
      );
      if (potion) {
        console.log("-------------------", potion);
        await mapDB.savePotion(gobalGameState.playerState.username, potion);
      }
    } catch (err) {
      console.error("[toolClick] Failed to persist potion to DB:", err);
    }
    // Notify client with authoritative inventory state after DB persist
    _ctx.handler.send({
      action: "potionDBSynced",
      potions: [...gobalGameState.playerState.inventory],
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
