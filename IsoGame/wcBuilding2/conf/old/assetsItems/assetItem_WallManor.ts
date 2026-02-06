import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_WallManor {
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

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_A(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "Corner",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 1,
        key: this.WALL_PREFIX + "Corner",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "Corner",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_B(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "CornerRound",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 1,
        key: this.WALL_PREFIX + "CornerDiagonal",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
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

  // ["Wr", "Win", "Wl", "Wout"]
  get Flat_DWR(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 1,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "Door",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ["Wr", "Win", "Wl", "Wout"]
  get Flat_WWR(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 1,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: 0,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ["Wr", "Win", "Wl", "Wout"]
  get Flat_WWW(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "Window",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
      {
        h: 1,
        key: this.WALL_PREFIX + "WindowGlass",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
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

  // ["Win", "Win", "Wl", "Wr"]
  get InnerCorner_A(): WcConfTileAsset[] {
    return [
      {
        h: 2,
        key: this.ROOF_PREFIX + "CornerInner",
        keyR: 3,
        sufix: this.ROOF_SUFFIX,
      },
    ];
  }

  // ==========================================================================
}
