import { WcConfTile } from "../../wcAbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";

export class WcAsset_WallManor {
  tag: string = "WM_";

  // ROOF_PREFIX = "roof";
  ROOF_PREFIX = "roofHigh";
  WALL_PREFIX = "wall";
  // WALL_PREFIX = "wallWood";

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
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner_X(): WcConfTile {
    return {
      face: ["rX", "lX", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }
  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner(): WcConfTile {
    return {
      face: ["r", "l", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  // ["Wr", "Wl", "Wout", "Wout"],
  get Corner_B(): WcConfTile {
    return {
      face: ["r", "l", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  // ----------------

  //  ["Wr", "Win", "Wl", "Wout"],
  get Door(): WcConfTile {
    return {
      face: ["r", "in", "l", "outD"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  // ["Wr", "Win", "Wl", "Wout"],
  get Wall(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall_Windows(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  // ----------------

  // ["Win", "Win", "Wl", "Wr"],
  get InnerCorner(): WcConfTile {
    return {
      face: ["in", "in", "l", "r"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 2,
          key: this.ROOF_PREFIX + "CornerInner",
          keyR: 3,
          sufix: this.ROOF_SUFFIX,
        },
      ],
    };
  }

  // ==========================================================================
  //  ["A", "A", "A", "A"]
  get Inside_Full(): WcConfTile {
    return {
      face: ["in", "in", "in", "in"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
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
      ],
    };
  }

  // =========================================
  // =========================================
  // =========================================
  // =========================================

  // ==========================================================================
}
