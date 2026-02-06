import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_FencePlatform {
  WALL_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================

  // ["Cout", "Cout", "Cr", "Cl"],
  get Corner(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "platform_cornerOpen",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ["Cin", "Cl", "Cout", "Cr"]
  get Flat(): WcConfTileAsset[] {
    return [
      { h: 0, key: "platform_side", keyR: 0, sufix: this.WALL_SUFFIX },
    ];
  }

  // ["Cin", "Cin", "Cl", "Cr"]
  get InnerCorner(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "platform_cornerDot",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ==========================================================================
}
