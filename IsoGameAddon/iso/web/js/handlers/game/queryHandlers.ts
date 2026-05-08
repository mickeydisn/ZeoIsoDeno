import { FactoryMap } from "@iso-game/map/factory/factoryMap.ts";
import { mapState } from "@iso-game/mapIso/mapState.ts";
import { TBaseMessage } from "@iso-game/handlers/types/type.ts";
import { gameAction, TGameHandlerAction, TGameHandlerContext } from "@iso-web/js/handlers/contexts.ts";

// -------------------------------------

export interface EventQueryInfoCell extends TBaseMessage<"query_infoCell"> {
  x:number;
  y:number;
}
const query_infoCell: TGameHandlerAction<EventQueryInfoCell> = 
  gameAction<EventQueryInfoCell>("query_infoCell", 
   (data: EventQueryInfoCell, _ctx: TGameHandlerContext) => {
    const x = data.x !== undefined ? data.x : mapState.x;
    const y = data.y !== undefined ? data.y : mapState.y;
    const tile = FactoryMap.getInstance().getTile(x, y);
    return tile.toJsonInfo();
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const queryHandlers = [
  query_infoCell,
] as const;


// -------------------------------------
// -------------------------------------
// -------------------------------------

