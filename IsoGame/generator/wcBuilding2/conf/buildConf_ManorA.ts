import {
  WcAbstractBuildConf,
  WcConfRawTile,
  WcConfTile,
} from "../wcAbstractBuildConf.ts";
import {
  WcAsset_FencePlatform,
  WcAsset_FenceSimple,
} from "./assetsCollection/wcAsset_Fence2.ts";
import { WcAsset_WallManor } from "./assetsCollection/wcAsset_WallManor.ts";

export class WcBuildConf_ManorA extends WcAbstractBuildConf {
  private colorConf: Record<string, string>;

  private fence: WcAsset_FenceSimple;
  private fencePlatform: WcAsset_FencePlatform;
  private wallManor: WcAsset_WallManor;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S20_C150_B115`,
    };

    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.wallManor = new WcAsset_WallManor(this.colorConf.WALL_SUFFIX);

    this.faceLinkWeight = {
      //
      "X": 0,

      // F
      "F_out": 1,
      "F_in": 25,
      "F_l": 15,
      "F_r": 15,

      "0": 100,

      // FP
      "FP_out": 1,
      "FP_in": 10,
      "FP_r": 5,
      "FP_l": 5,

      // CL
      "WM_out": 1,
      "WM_outD": 1,
      "WM_in": 25,
      "WM_r": 15,
      "WM_l": 15,
      // "WM_rX": 15,
      // "WM_lX": 15,
    };

    this.faceLinks = [
      ["X", "X"],

      ["X", "F_out"],

      ["F_l", "F_r"],

      ["F_in", "FP_out"],

      ["FP_l", "FP_r"],

      ["FP_in", "0"],
      ["0D", "WM_outD"],

      ["FP_in", "WM_out"],

      // ["WM_l", "WM_rX"],
      // ["WM_lX", "WM_r"],

      ["WM_l", "WM_r"],
      ["WM_in", "WM_in"],
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
        { ...this.fence.Corner, weight: 10 },
        { ...this.fence.Flat, weight: 20 },
        { ...this.fence.InnerCorner, weight: 20 },
      ], {
        allowMove: true,
        isFrise: false,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0", "0", "0", "0D"], weight: 1000 },
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
        { ...this.fencePlatform.Corner, weight: 50 },
        { ...this.fencePlatform.Flat, weight: 100 },
        { ...this.fencePlatform.InnerCorner, weight: 100 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // HS
      ...applyGroup([
        { ...this.wallManor.Door, weight: 300 },
        { ...this.wallManor.Wall, weight: 300 },
        // { ...this.manorSimple.Wall_RoofWindows, weight: 0 },
        { ...this.wallManor.Wall_Windows, weight: 0 },
        { ...this.wallManor.Corner, weight: 300 },
        // { ...this.manorSimple.Corner_B, weight: 0 },
        { ...this.wallManor.InnerCorner, weight: 400 },
        { ...this.wallManor.Inside_Full, weight: 300 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
