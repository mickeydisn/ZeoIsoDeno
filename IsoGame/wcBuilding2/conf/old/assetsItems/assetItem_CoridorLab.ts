import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_CoridorLab {
  public WALL_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(WALL_SUFFIX: string) {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================

  // ["A", "Wi", "WiD", "Wi"]
  get Door(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "platform_center",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
      { h: 0, key: "corridor_end", keyR: 2, sufix: this.WALL_SUFFIX },
    ];
  }

  // ----------------

  //  ["A", "Wi", "A", "Wi"],
  get Flat(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  //  ["A", "Wi", "A", "Wi"],
  get Flat_Detail(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_detailed",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  //  ["A", "Wi", "A", "Wi"],
  get Flat_Window(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_window",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  // ----------------

  //["A", "A", "Wi", "Wi"]
  get Corner(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_corner",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //["A", "A", "Wi", "Wi"]
  get Corner_Round(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "platform_center",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: 0,
        key: "corridor_cornerRound",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ----------------

  //["A", "A", "A", "Wi"]
  get TJoin(): WcConfTileAsset[] {
    return [
      { h: 0, key: "corridor_split", keyR: 0, sufix: this.WALL_SUFFIX },
    ];
  }
  // ["A", "A", "A", "A"]
  get CrossJoin(): WcConfTileAsset[] {
    return [
      { h: 0, key: "corridor_cross", keyR: 0, sufix: this.WALL_SUFFIX },
    ];
  }
  //

  // ==========================================================================
}
