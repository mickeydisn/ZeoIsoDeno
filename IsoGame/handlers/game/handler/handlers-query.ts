import { FactoryMap } from "@iso-game/map/factory/factoryMap.ts";
import { gobalGameState } from "../gameState.ts";
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
} from "@iso-game/handlers/game/tools/buildingConfigRegistry.ts";

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

export interface EventGetFullBuildingConfig
  extends TBaseMessage<"getFullBuildingConfig"> {
  configId: string;
}

const getFullBuildingConfigHandler: TGameHandlerAction<
  EventGetFullBuildingConfig
> = gameAction<EventGetFullBuildingConfig>(
  "getFullBuildingConfig",
  (
    data: EventGetFullBuildingConfig,
    _ctx: TGameHandlerContext,
  ) => {
    const entry = getBuildingConfigEntry(data.configId);
    if (!entry) return { config: null };

    // Create a config instance to get the full initialized config
    const config = createBuildingConfig(data.configId, {
      growLoopCount: entry.defaultGrowLoop,
      endLoopMax: entry.defaultEndLoop,
    });

    if (!config) return { config: null };

    // Return the full config as a serializable object
    return {
      config: {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        growLoopCount: config.growLoopCount,
        endLoopMax: config.endLoopMax,
        mainLvl: config.mainLvl,
        faceLinkWeight: config.faceLinkWeight,
        faceLinks: config.faceLinks,
        startTileOptions: config.startTileOptions,
        listTileOptions: config.listTileOptions,
        listFaceKey: config.listFaceKey,
      },
    };
  },
);

// -------------------------------------
// -------------------------------------
// -------------------------------------

export const queryHandlers = [
  query_infoCell,
  getBuildingConfigListHandler,
  getFullBuildingConfigHandler,
] as const;

// -------------------------------------
// -------------------------------------
// -------------------------------------
