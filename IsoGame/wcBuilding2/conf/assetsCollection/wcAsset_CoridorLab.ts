import { WcConfTile } from "../../AbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";

export class wcAsset_CoridorLab {
  WALL_SUFFIX: string; // '#H200_S20_C135_B105'
  PREFIX : string = "Lab5_"
  tag: string = "CL_";

  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================

  // ["A", "Wout", "WoutD", "Wout"],
  get Door(): WcConfTile {
    return {
      face: ["in", "out", "outD", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key:  "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
        { h: 0, key: this.PREFIX + "corridor_end", keyR: 2, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  //  ["A", "Wout", "A", "Wout"]
  get Flat(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ["A", "Wout", "A", "Wout"]
  get Flat_Detail(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_detailed",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  //  ["A", "Wout", "A", "Wout"]
  get Flat_Window(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_window",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  // ----------------

  //["A", "A", "Wout", "Wout"],
  get Corner(): WcConfTile {
    return {
      face: ["in", "in", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: this.PREFIX + "corridor_corner",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }
  //["A", "A", "Wout", "Wout"],
  get Corner_Round(): WcConfTile {
    return {
      face: ["in", "in", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key:  "platform_center",
          keyR: 0,
          sufix: this.WALL_SUFFIX,
        },
        {
          h: 0,
          key: this.PREFIX + "corridor_cornerRound",
          keyR: 3,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ----------------

  //["A", "A", "A", "Wout"],
  get TJoin(): WcConfTile {
    return {
      face: ["in", "in", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: this.PREFIX + "corridor_split", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  // ["A", "A", "A", "A"]
  get CrossJoin(): WcConfTile {
    return {
      face: ["in", "in", "in", "in"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: this.PREFIX + "corridor_cross", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  // ==========================================================================
}

/*
corridor_cross
corridor_split

corridor_cornerRound
platform_center

corridor_corner
corridor_window
corridor_detailed
corridor_
*/