import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_InsideManor {
  ROOF_PREFIX = "roofHigh";
  WALL_PREFIX = "wall";

  public WALL_SUFFIX: string; // '#H200_S20_C135_B105'
  public ROOF_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(
    WALL_SUFFIX: string = "#H0_S20_C128_B100",
    ROOF_SUFFIX: string = "#H0_S1_C128_B64",
  ) {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }

  // ==========================================================================
  //  ["A", "A", "A", "A"]
  get Inside_Full_A(): WcConfTileAsset[] {
    return [
      {
        h: 3,
        key: this.ROOF_PREFIX + "Point",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 2,
        key: this.WALL_PREFIX + "Block",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ==========================================================================
}
