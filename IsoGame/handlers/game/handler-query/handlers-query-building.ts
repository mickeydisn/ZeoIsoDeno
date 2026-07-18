import { TBaseMessage } from "../../../etc/handlers/types/type.ts";
import {
  gameAction,
  TGameHandlerAction,
  TGameHandlerContext,
} from "@iso-game/handlers/game/contexts.ts";
import {
  createBuildingConfig,
  getBuildingConfigEntry,
  getBuildingConfigList,
} from "@iso-game/tools/building/buildingConfigRegistry.ts";

// -------------------------------------

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

export const listHandlersQueryBuilding = [
  getBuildingConfigListHandler,
  getFullBuildingConfigHandler,
] as const;

// -------------------------------------
// -------------------------------------
// -------------------------------------
