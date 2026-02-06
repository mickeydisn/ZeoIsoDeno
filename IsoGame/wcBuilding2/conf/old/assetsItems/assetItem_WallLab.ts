import { WcConfTileAsset } from "../../../AbstractBuildConf.ts";

export class AssetItem_WallLab {
  public WALL_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(
    WALL_SUFFIX: string = "#H0_S20_C128_B100",
  ) {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================

  // ----------------

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_A(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_corner",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_corner",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // --------------------------------------

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_B(): WcConfTileAsset[] {
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
      {
        h: .8,
        key: "corridor_cornerRound",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ----------------
  //  ["Wr", "Win", "Wl", "Wout"]
  get Wall_CS(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "structure_closed",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_split", // IN
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //  ["Wr", "Win", "Wl", "Wout"]
  get Wall_FS(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_wall",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_split",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  //  ["Wr", "Win", "Wl", "Wout"]
  get Wall_DS(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_detailed",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_split",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  //  ["Wr", "Win", "Wl", "Wout"]
  get Wall_WS(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_window",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_split",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ----------------

  // ["Wr", "Win", "Wl", "Wout"]
  get Corridor_DD(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_detailed",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: .8,
        key: "corridor_detailed",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // --------------------------------------

  // ["Wl", "Wr", "Ai", "Ai"],
  get InnerCorner(): WcConfTileAsset[] {
    return [
      {
        h: .8,
        key: "corridor_cross",
        keyR: 3,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
  // ==========================================================================

  // ----------------
  // ["A", "A", "Wl", "Wr"],
  get Wall_ToCorridor(): WcConfTileAsset[] {
    return [
      {
        h: .8,
        key: "corridor_split",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
      {
        h: 0,
        key: "corridor_cross",
        keyR: 1,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  get Coridor(): WcConfTileAsset[] {
    return [
      {
        h: 0,
        key: "corridor_",
        keyR: 0,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }

  // ==========================================================================

  // ["Ai", "Ai", "Ai", "Ai"],
  get InsideWall(): WcConfTileAsset[] {
    return [
      {
        h: .8,
        key: "platform_center",
        keyR: 2,
        sufix: this.WALL_SUFFIX,
      },
    ];
  }
}
