import { FactoryMap } from "@iso-game/map/factory/factoryMap.ts";
import { gobalGameState } from "../gameState.ts";
import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "../contexts.ts";
import { getBuildingConfigList } from "@iso-game/handlers/game/tools/buildingConfigRegistry.ts";

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

export interface EventGetBuildingConfigList
  extends TBaseMessage<"getBuildingConfigList"> {}

const getBuildingConfigListHandler: TGameHandlerAction<
  EventGetBuildingConfigList
> = gameAction<EventGetBuildingConfigList>(
  "getBuildingConfigList",
  (
    _data: EventGetBuildingConfigList,
    _ctx: TGameHandlerContext,
  ) => {
    return {
      configs: getBuildingConfigList(),
    };
  },
);

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const queryHandlers = [
  query_infoCell,
  getBuildingConfigListHandler,
] as const;

// -------------------------------------
// -------------------------------------
// -------------------------------------
