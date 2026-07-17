import { FactoryMap } from "@iso-game/map/factory/factoryMap.ts";
import { gobalGameState } from "@iso-game/states/game/gameState.ts";

import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";
import {
  createBuildingConfig,
  getBuildingConfigEntry,
  getBuildingConfigList,
} from "@iso-game/tools/buildingConfigRegistry.ts";

// -------------------------------------

export interface EventQueryInfoCell extends TBaseMessage<"query_infoCell"> {
  x: number;
  y: number;
}
const query_infoCell: TGameHandlerAction<EventQueryInfoCell> = gameAction<
  EventQueryInfoCell
>("query_infoCell", (data: EventQueryInfoCell, _ctx: TGameHandlerContext) => {
  const x = data.x !== undefined ? data.x : gobalGameState.x;
  const y = data.y !== undefined ? data.y : gobalGameState.y;
  const tile = FactoryMap.getInstance().getTile(x, y);
  return tile.toJsonInfo();
});

// -------------------------------------

export const listHandlersQueryCell = [
  query_infoCell,
] as const;
