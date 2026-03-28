import {
  WcAbstractBuildConf,
  WcConfRawTile,
  WcConfTile,
} from "../wcAbstractBuildConf.ts";
import { WcFace } from "../wcBuildFace.ts";
import { wcAsset_CoridorLab } from "./assetsCollection/wcAsset_CoridorLab.ts";
import {
  WcAsset_Fence2,
  WcAsset_FencePlatform,
} from "./assetsCollection/wcAsset_Fence2.ts";
import { WcAsset_WallRLab } from "./assetsCollection/wcAsset_WallRLab.ts";

export class WcBuildConf_RLabA extends WcAbstractBuildConf {
  private colorConf: Record<string, string>;

  private fence: WcAsset_Fence2;
  private fencePlatform: WcAsset_FencePlatform;
  private wallRLab: WcAsset_WallRLab;
  private corridorLab: wcAsset_CoridorLab;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C100_B115`,
    };

    this.fence = new WcAsset_Fence2({
      tag: "F2_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.wallRLab = new WcAsset_WallRLab(this.colorConf.WALL_SUFFIX);
    this.corridorLab = new wcAsset_CoridorLab(this.colorConf.WALL_SUFFIX);

    this.faceLinkWeight = {
      "X": 0,

      // F
      "F_out": 0,
      "F_l": 5,
      "F_r": 5,
      "F_in": 10,

      "0": 0,
      "0D": 0,

      // FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 20,
      // "Pin0": 1,

      // "PinD": 1,

      "WR_outD": 0,
      "WR_out": 0,
      "WR_r": 20,
      "WR_l": 20,
      "WR_in": 30,

      "WR_r#IC": 1,
      "WR_l#IC": 1,
      //----------
      "WR_out#CL": 0,

      "CL_outD": 0,
      "CL_out": 0,
      "CL_in": 20,
      // WR
      // "WR_rX": 15,
      // "WR_lX": 15,
    };

    this.faceLinks = [
      ["X", "X"],

      // ------
      ["X", "X"],
      ["X", "F2_out"],
      ["F2_l", "F2_r"],

      ["F2_in", "FP_out"],
      ["FP_l", "FP_r"],
      ["FP_in", "0"],

      // ["PinD", "WoutD"],
      // ["Pin0", "0"],

      ["FP_in", "0"],

      // ------
      // ------
      ["WR_out", "FP_in"],
      ["WR_out", "0"],

      ["WR_l", "WR_r"],
      ["WR_in", "WR_in"],

      // ------
      ["WR_l#IC", "WR_r"],
      ["WR_l", "WR_r#IC"],

      // ------
      // ------
      ["CL_out", "0"],
      ["CL_outD", "0D"],
      ["CL_out", "FP_in"],
      ["CL_outD", "FP_in"],

      ["CL_in", "WR_out#CL"],
      // ["CL_in", "CL_in"],
      // -------------------------------
    ];
  }

  override get __TILE_START_RAW(): WcConfTile[] {
    return [
      {
        face: ["0", "0", "0", "0D"],
        color: [0, 0, 0],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
      },
    ];
  }
  //override
  override get __TILE_LIST_RAW(): WcConfTile[] {
    // ======================================================================
    // ======================================================================
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];

    const applyGroup = (wcConfs: WcConfRawTile[], group: WcConfRawTile) => {
      return wcConfs.map((it) => {
        return {
          ...it,
          ...group,
        };
      }) as WcConfTile[];
    };

    return [
      // --------------------------------------------------
      // X
      ...applyGroup([
        { face: [null, null, null, null] },
        { face: ["X", null, null, null] },
        { face: ["X", "X", null, null] },
        { face: ["X", null, "X", null] },
        { face: ["X", "X", "X", null] },
        { face: ["X", "X", "X", "X"] },
      ], {
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // F
      ...applyGroup([
        { ...this.fence.Corner, weight: 0 },
        { ...this.fence.Flat, weight: 0 },
        { ...this.fence.InnerCorner, weight: 0 },
      ], {
        allowMove: true,
        isFrise: false,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // FP
      ...applyGroup([
        { ...this.fencePlatform.Corner, weight: 0 },
        { ...this.fencePlatform.Flat, weight: 0 },
        { ...this.fencePlatform.InnerCorner, weight: 0 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0", "0", "0", "0"], weight: 0 },
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [128, 128, 128],
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // WR
      ...applyGroup([
        { ...this.wallRLab.Corner_Round, weight: 0 },
        { ...this.wallRLab.Wall, weight: 1 },
        {
          ...this.wallRLab.Wall,
          face: ["r", "in", "l", "out#CL"].map((p) => ("WR_" + p)) as WcFace,
          weight: 1,
        },
        {
          ...this.wallRLab.InnerCorner,
          face: ["in", "in", "l#C", "r#C"].map((p) => ("WR_" + p)) as WcFace,
          weight: 3,
        },
        //{ ...this.wallRLab.Inside_Full, weight: 300 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // WR
      ...applyGroup([
        // { ...this.corridorLab.Flat, weight: 3 },
        { ...this.corridorLab.Door, weight: 3 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
