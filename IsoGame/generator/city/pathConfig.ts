export type CityPathParam = {
  count: number;
  mainRoad: CityPathParamSection_MainRoad;
  crossingRoad: CityPathParamSection_Cross;
  connectRoad: CityPathParamSection_Connect;
  mainBuilding: CityPathParamSection_Building;
};

export type CityPathParamSection = {
  length: number;
  minDist: number;
  color: [number, number, number];
  color2: [number, number, number];

  powerCost: number;
  powerIter: number;
};

export type CityPathParamSectionGrow = CityPathParamSection & {
  alphaStep: number;
  crossDist: number;
  extend: boolean;
  fareKeep: number;
  fareDepthLimit: number;
};

export type CityPathParamSection_MainRoad = CityPathParamSectionGrow;

export type CityPathParamSection_Cross = CityPathParamSectionGrow & {
  powerCondition: number;
};
export type CityPathParamSection_Building = CityPathParamSectionGrow & {
  count: number;
  powerCondition: number;
  buildList: string[];
};

export type CityPathParamSection_Connect = CityPathParamSection;

export const DEFAULT_CITY_PARAM: CityPathParam = {
  count: 40,
  mainRoad: {
    length: 18,
    crossDist: 20,
    minDist: 15,
    color: [64, 64, 64],
    color2: [46, 46, 46],

    alphaStep: 5,
    extend: true,
    fareKeep: 3,
    fareDepthLimit: 2,

    powerCost: 1,
    powerIter: 10,
  },
  crossingRoad: {
    length: 18,
    crossDist: 20,
    minDist: 14,
    color: [64, 64, 64],
    color2: [50, 50, 64],

    alphaStep: 4,
    extend: false,
    fareKeep: 1,
    fareDepthLimit: 3,

    powerCondition: 3,
    powerCost: -2,
    powerIter: 5,
  },
  connectRoad: {
    length: 20,
    minDist: 12,

    color: [64, 64, 64],
    color2: [50, 64, 50],

    powerCost: 1,
    powerIter: 10,
  },

  mainBuilding: {
    buildList: [
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      // "WcBuildConf_HouseA",
      //# "WcBuildConf_HouseA",
      //# "WcBuildConf_GraveA",
      //# "WcBuildConf_LabPipeA",
      "WcBuildConf_LabBorderA",
      "WcBuildConf_RLabA",
      // "WcBuildConf_ManorA",
      // "WcBuildConf_ManorA",

      //
    ],

    count: 60,
    length: 8,
    crossDist: 0,
    minDist: 2,
    color: [256, 256, 256],
    color2: [64, 64, 64],

    alphaStep: 4,
    extend: false,
    fareKeep: 4,
    fareDepthLimit: 3,

    powerCondition: 3,
    powerCost: -1000,
    powerIter: 0,
  },
};
