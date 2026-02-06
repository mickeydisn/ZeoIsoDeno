import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_WallHouse {
  ROOF_PREFIX = "roof";
  WALL_PREFIX = "wall";

  public WALL_SUFFIX: string; // '#H200_S20_C135_B105'
  public ROOF_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(
    WALL_SUFFIX: string = "#H210_C115_S35_B120",
    ROOF_SUFFIX: string = "#H0_S1_C128_B64",
  ) {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }
  // ==========================================================================

  // ----------------

  // ["Wr", "Wl", "Wi", "Wi"]
  get Corner_A(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "Corner",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "Corner",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ["Wr", "Wl", "Wi", "Wi"]
  get Corner_B(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "CornerRound",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "CornerDiagonal",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ----------------
  //  ["Wr", "A", "Wl", "Wi"]
  get Wall_DF(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "Door",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //  ["Wr", "A", "Wl", "Wi"]
  get Wall_FF(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //  ["Wr", "A", "Wl", "Wi"]
  get Wall_WF(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //  ["Wr", "A", "Wl", "Wi"]
  get Wall_WW(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "Window",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  // ----------------
  // ["A", "A", "Wl", "Wr"],
  get InnerCorner_A(): WcConfTileAsset[] {
    return [
      {
        h: 1,
        key: this.ROOF_PREFIX + "CornerInner",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
    ];
  }

  // ==========================================================================
}
