import { WcConfTile } from "../../AbstractBuildConf.ts";
import { WcFace } from "../../wcBuildFace.ts";

export class WcAsset_FencePlatform_old {
  WALL_SUFFIX: string; // '#H200_S20_C135_B105'

  tag: string = "FP_";

  constructor(WALL_SUFFIX = "#H170_S120_C70_B115") {
    this.WALL_SUFFIX = WALL_SUFFIX;
  }

  // ==========================================================================

  get Corner(): WcConfTile {
    return {
      face: ["out", "out", "r", "l"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_cornerOpen",
          keyR: 1,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  get Flat(): WcConfTile {
    return {
      face: ["in", "l", "out", "r"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        { h: 0, key: "platform_side", keyR: 0, sufix: this.WALL_SUFFIX },
      ],
    };
  }

  get InnerCorner(): WcConfTile {
    return {
      face: ["in", "in", "l", "r"].map((p) => (this.tag + p)) as WcFace,
      weight: 0,
      assets: [
        {
          h: 0,
          key: "platform_cornerDot",
          keyR: 1,
          sufix: this.WALL_SUFFIX,
        },
      ],
    };
  }

  // ==========================================================================
}
