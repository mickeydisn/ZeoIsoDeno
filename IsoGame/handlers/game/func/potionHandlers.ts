import { TilesActions } from "@iso-game/map/action2/tilesActions.ts";
import { gobalMapState } from "@iso-game/mapIso/mapState.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import { gameAction, TGameHandlerAction, TGameHandlerContext } from "../contexts.ts";

// -------------------------------------
export interface EventUsePotion extends TBaseMessage<"usePotion"> {
  potionId: string;
  gridX: number;
  gridY: number;
}
const usePotion: TGameHandlerAction<EventUsePotion> =
  gameAction<EventUsePotion>("usePotion",
   (data: EventUsePotion, _ctx: TGameHandlerContext) => {
  const { potionId, gridX, gridY } = data;

  const inventory = gobalMapState.playerState.inventory;
  const idx = inventory.findIndex((p) => p.id === potionId);
  if (idx === -1) {
    return { success: false, reason: "Potion not found in inventory" };
  }

  const potion = inventory[idx];
  if (potion.remainingUses <= 0) {
    return { success: false, reason: "Potion has no remaining uses" };
  }

  potion.remainingUses--;

  const confs = potion.actions.map((entry) => ({
    func: entry.func,
    x: gridX,
    y: gridY,
    ...entry.config,
  }));

  TilesActions.getInstance().doActions(confs);

  if (potion.remainingUses === 0) {
    inventory.splice(idx, 1);
  }

  _ctx.handler.send({
    action: "potionUsed",
    potionId,
    remainingUses: potion.remainingUses,
    success: true,
  });
});

// -------------------------------------
export const potionHandlers = [
  usePotion,
] as const;