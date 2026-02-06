import { WcConfTile } from "../../AbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";

export class wcAsset_CoridorPipe2 {
  WALL_SUFFIX: string; // '#H200_S20_C135_B105'

  tag: string = "CP2_";

  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================
  // ["A", "Wout", "WoutD", "Wout"],
  get Door2(): WcConfTile {
    return {
      face: ["in", "out", "outD", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 1, key: "pipe_end", keyR: 2, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  // ["A", "Wout", "WoutD", "Wout"],
  get Door(): WcConfTile {
    return {
      face: ["in", "out", "outD", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 1, key: "pipe_entrance", keyR: 2, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  // ----------------

  //  ["A", "Wout", "A", "Wout"]
  get Flat(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  //  ["A", "Wout", "A", "Wout"]
  get Flat_NoSupport(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 1, key: "pipe_straight", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  // ["A", "Wout", "A", "Wout"]
  get Flat_Open(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 1, key: "pipe_open", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  // ["A", "Wout", "A", "Wout"]
  get Flat_Ring(): WcConfTile {
    return {
      face: ["in", "out", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_ring", keyR: 0, sufix: this.WALL_SUFFIX },
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
        { h: 1, key: "pipe_corner", keyR: 3, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  //["A", "A", "Wout", "Wout"],
  get Corner_Round(): WcConfTile {
    return {
      face: ["in", "in", "out", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 1, key: "pipe_cornerRound", keyR: 3, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  // pipe_cornerDiagonal
  // ----------------

  //["A", "A", "A", "Wout"],
  get TJoin(): WcConfTile {
    return {
      face: ["in", "in", "in", "out"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_split", keyR: 3, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  // ["A", "A", "A", "A"]
  get CrossJoin(): WcConfTile {
    return {
      face: ["in", "in", "in", "in"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "pipe_supportHigh", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "pipe_cross", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  get Silo(): WcConfTile {
    return {
      face: ["silo", "silo", "silo", "silo"].map((
        p,
      ) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: .8, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: .2, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }
  get SiloUP(): WcConfTile {
    return {
      face: ["silo", "silo", "silo", "silo"].map((
        p,
      ) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "supports_high", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: .8, key: "rocket_fuelB", keyR: 0, sufix: this.WALL_SUFFIX },
        { h: 1, key: "rocket_finsA", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  // ==========================================================================
}
