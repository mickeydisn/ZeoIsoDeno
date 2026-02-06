import {
  AbstractWcBuildConf,
  WcConfRawTile,
  WcConfTile,
} from "../AbstractBuildConf.ts";
import { wcAsset_CoridorLab } from "./assetsCollection/wcAsset_CoridorLab.ts";
import {
  WcAsset_FencePlatform,
  WcAsset_FenceSimple,
} from "./assetsCollection/wcAsset_Fence2.ts";

export class WcBuildConf_LabBorderA extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;

  private fence: WcAsset_FenceSimple;
  private fencePlatform: WcAsset_FencePlatform;
  private corridor: wcAsset_CoridorLab;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      FENCE_PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C100_B115`,
    };

    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.corridor = new wcAsset_CoridorLab(this.colorConf.WALL_SUFFIX);

    this.faceLinkWeight = {
      //
      "X": 0,

      // F
      "F_out": 0,
      "F_l": 1,
      "F_r": 1,
      "F_in": 5,

      "0": 1,

      // FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 15,

      // CL
      "CL_outD": 0,
      "CL_out": 0,
      "CL_r": 20,
      "CL_l": 20,
      "CL_in": 25,
    };

    this.faceLinks = [
      ["X", "X"],

      ["X", "F_out"],

      ["F_l", "F_r"],

      ["F_in", "FP_out"],

      ["FP_l", "FP_r"],

      ["FP_in", "CL_out"],

      ["FP_in", "CL_outD"],

      ["CL_in", "CL_in"],
    ];
  }

  override get __TILE_START_RAW(): WcConfTile[] {
    return [
      {
        face: ["X", "X", "X", "X"],
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
        { ...this.fence.Flat, weight: 1 },
        { ...this.fence.InnerCorner, weight: 1 },
      ], {
        allowMove: true,
        isFrise: false,
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
      // FP
      ...applyGroup([
        { ...this.fencePlatform.Corner, weight: 0 },
        { ...this.fencePlatform.Flat, weight: 4 },
        { ...this.fencePlatform.InnerCorner, weight: 5 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // CL
      ...applyGroup([
        { ...this.corridor.Door, weight: 0 },
        { ...this.corridor.Flat, weight: 30 },
        { ...this.corridor.Flat_Detail, weight: 10 },
        { ...this.corridor.Flat_Window, weight: 10 },
        { ...this.corridor.Corner, weight: 10 },
        { ...this.corridor.Corner_Round, weight: 10 },
        { ...this.corridor.TJoin, weight: 100 },
        { ...this.corridor.CrossJoin, weight: 100 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
