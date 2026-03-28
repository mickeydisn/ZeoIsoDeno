import { WcConfTile } from "../../wcAbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";

// --------------------------------------

export class WcAsset_WallRLab {
  tag: string = "WR_";

  PREFIX = "Lab5_";
  public WALL_SUFFIX: string; // '#H200_S20_C135_B105'
  public ROOF_SUFFIX: string; // '#H200_S20_C135_B105'

  constructor(
    WALL_SUFFIX: string = "#H210_C115_S35_B120",
    ROOF_SUFFIX: string = "#H0_S1_C128_B64",
  ) {
    this.WALL_SUFFIX = WALL_SUFFIX;
    this.ROOF_SUFFIX = ROOF_SUFFIX;
  }

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner(): WcConfTile {
    return {
      face: ["r", "l", "out", "out"].map((
        p,
      ) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // --------------------------------------

  // ["Wr", "Wl", "Wout", "Wout"]
  get Corner_Round(): WcConfTile {
    return {
      face: ["r", "l", "out", "out"].map((
        p,
      ) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ----------------
  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall_Open(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: "structure_closed",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_split", // IN
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  //  ["Wr", "Win", "Wl", "Wout"],
  get Wall(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  // ["Wr", "Win", "Wl", "Wout"],
  get Wall_DS(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ["Wr", "Win", "Wl", "Wout"],
  get Wall_WS(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_window",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ----------------

  // --------------------------------------

  // ["Win2", "Win2", "Wl2", "Wr2"]
  get InnerCorner(): WcConfTile {
    return {
      face: ["in", "in", "l", "r"].map((
        p,
      ) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: .8,
          key: this.PREFIX + "corridor_cross",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  //  ["Ai", "Ai", "Ai", "Ai"],
  get Inside_Full(): WcConfTile {
    return {
      face: ["in", "in", "in", "in"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: .8,
          key: "platform_center",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ==========================================================================

  // ----------------
  //  ["Wr", "Win", "Wl", "WoutD"],
  get Wall_ToCorridor(): WcConfTile {
    return {
      face: ["r", "in", "l", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: .8,
          key: this.PREFIX + "corridor_split",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cross",
          keyR: 1,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  //  ["Cin", "Wout", "Cin", "Wout"],
  get Corridor_DD(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: .8,
          key: this.PREFIX + "corridor_detailed",
          keyR: 2,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ==========================================================================

  // =========================================
  // =========================================
  // =========================================
  // =========================================

  // ==========================================================================
}
