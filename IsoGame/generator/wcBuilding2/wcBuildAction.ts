import { FactoryMap } from "../../map/factory/factoryMap.ts";
import { Tile } from "../../map/object/tile.ts";
import { World } from "../../word.ts";
import { WcAbstractBuildConf } from "./wcAbstractBuildConf.ts";
import { WcBuildConf_HouseA } from "./conf/buildConf_HouseA.ts";
import { WcBuildConf_LabBorderA } from "./conf/buildConf_LabBorderA.ts";
import { WcBuildConf_ManorA } from "./conf/buildConf_ManorA.ts";
import { WcBuildFactoryGenarator } from "./wcBuildFactory.ts";
import { WcBuildConf_RLabA } from "./conf/buildConf_RLabA.ts";
import { WcBuildConf_GraveA } from "./conf/buildConf_GraveA.ts";
import { WcBuildConf_LabPipeA } from "./conf/buildConf_LabPipeA.ts";

/* -----------------*/

const indexBuildingConfigClass: Record<string, typeof WcAbstractBuildConf> = {
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA,
};

export const BUILDING_CONF_KEYS = [];

/* -----------------*/

export type TypeWcBuildsAction = {
  func: (conf: TypeWcBuildsActionConfig) => void;
  conf: TypeWcBuildsActionConfig;
};

export interface TypeWcBuildsActionConfig {
  func: string;
  x: number;
  y: number;
}

// 1. Union of all config types
interface TypeWcBuildsActionConfig_createBuilding
  extends TypeWcBuildsActionConfig {
  func: "createBuilding";
  buildingType: string;
  x: number;
  y: number;
  growLoopCount: number;
  endLoopMax: number;
}
export interface TypeWcBuildsActionConfig_destroyBuilding
  extends TypeWcBuildsActionConfig {
  func: "destroyBuilding";
  destroyRadius: number;
}

// 2. Union of all config types
type TypeWcBuildsActions =
  | TypeWcBuildsActionConfig_createBuilding
  | TypeWcBuildsActionConfig_destroyBuilding; // Add more as needed

// 4. Map `func` to its handler
type HandlerMap = {
  [T in TypeWcBuildsActions as T["func"]]: (conf: T) => void;
};

// ----------------------

// ----------------------

export class WcBuildActions {
  private static instance: WcBuildActions;
  public static getInstance(): WcBuildActions {
    return WcBuildActions.instance ??= new WcBuildActions();
  }


  world: World;
  fm: FactoryMap;
  index: HandlerMap;

  constructor() {
    this.world = World.getInstance();
    this.fm = FactoryMap.getInstance();

    this.index = {
      // doFunction: this.doFunction.bind(this),
      "createBuilding": (conf: TypeWcBuildsActionConfig_createBuilding) => {
        const typeBuildingConf: typeof WcAbstractBuildConf =
          indexBuildingConfigClass[conf.buildingType];

        console.log(Object.keys(indexBuildingConfigClass))
        console.log('', conf.buildingType, typeBuildingConf)

        const buildingConf = new typeBuildingConf({
          growLoopCount: conf.growLoopCount ? conf.growLoopCount : 50,
          endLoopMax: conf.endLoopMax ? conf.endLoopMax : 200,
        });
        const building = new WcBuildFactoryGenarator(
          this.world,
          buildingConf,
        );
        building.start2(conf.x, conf.y);
      },
      "destroyBuilding": (_conf: TypeWcBuildsActionConfig_destroyBuilding) => {
      },
    };
  }
  //--------------------

  doAction(conf: TypeWcBuildsActions) {
    const handler = this.index[conf.func];
    if (handler) {
      (handler as (arg: typeof conf) => void)(conf);
    }
  }

  doActions(confs: TypeWcBuildsActions[]) {
    for (const conf of confs) {
      this.doAction(conf);
    }
  }
}
