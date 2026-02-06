import { AbstractWcBuildConf, WcConfTile } from "../AbstractBuildConf.ts";
import { wcAsset_Enter } from "./assetsCollection/wcAsset_Entrer.ts";
import {
  FenceCollapseType,
  WcAsset_FencePlatform,
  WcAsset_FenceSimple,
} from "./assetsCollection/wcAsset_Fence2.ts";
import { WcAsset_WallHouse } from "./assetsCollection/wcAsset_WallHouse.ts";
import { wcAsset_X } from "./assetsCollection/wcAsset_X.ts";
import { actionsEmpty, applyGroup } from "./assetsCollection/wcUtils.ts";

export class WcBuildConf_HouseA extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;

  private enter: wcAsset_Enter;
  private faceX: wcAsset_X;

  private fence: WcAsset_FenceSimple;
  private fencePlatform: WcAsset_FencePlatform;
  private houseSimple: WcAsset_WallHouse;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S20_C150_B115`,
    };

    this.enter = new wcAsset_Enter();
    this.faceX = new wcAsset_X();

    this.fence = new WcAsset_FenceSimple({
      tag: "F_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.Exclude,
    });
    this.fencePlatform = new WcAsset_FencePlatform({
      tag: "FP_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.Exclude,
    });
    this.houseSimple = new WcAsset_WallHouse(this.colorConf.WALL_SUFFIX);

    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),

      ...this.fence.faceLinkWeight(0, 5, 10),

      ...this.enter.faceLinkWeight(),

      "0": 30,
      "0in": 30,

      ...this.fencePlatform.faceLinkWeight(1, 15, 20),

      // CL
      "WH_out": 1,
      "WH_outD": 1,
      "WH_in": 30,
      "WH_r": 25,
      "WH_l": 25,

      "WH_rX": 25,
      "WH_lX": 25,
    };

    this.faceLinks = [
      // X
      ...this.faceX.getFaceLinks({
        in: ["F_out"],
      }),
      // F_
      ...this.fence.getFaceLinks({
        out: ["X"],
        in: ["FP_out"],
      }),
      // E_
      ...this.enter.getFaceLinks({
        out: [
          "F_in",
          "FP_r",
          "FP_l",
          "FP_r#Xc",
          "FP_l#Xc",
          "FP_r#Xi",
          "FP_l#Xi",
        ],
        l: ["WH_out"],
        r: ["WH_out"],
        door: ["WH_outD"],
      }),

      // FP_
      ...this.fencePlatform.getFaceLinks({
        out: ["F_in"],
        in: ["WH_out"],
      }),

      ["0", "0"],
      ["0in", "WH_out"],
      ["0", "FP_in"],
      // -----
      ["0D", "WH_outD"],

      ["WH_l", "WH_r"],

      ["WH_l", "WH_rX"],
      ["WH_lX", "WH_r"],

      ["WH_in", "WH_in"],
    ];
  }

  override get __TILE_START_RAW(): WcConfTile[] {
    return this.enter.groupInit();
  }
  //override
  override get __TILE_LIST_RAW(): WcConfTile[] {
    // ======================================================================
    // ======================================================================

    return [
      // --------------------------------------------------
      // X
      ...this.faceX.groupAsset(),

      // --------------------------------------------------
      // E
      ...this.enter.groupAsset(),

      // --------------------------------------------------
      // F
      ...this.fence.groupAsset({
        flatW: 10,
        cornerW: 10,
        innerW: 50,
        isFrise: false,
      }),

      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0in", "0", "0", "0"], weight: 10 },
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [196, 196, 196],
        functions: actionsEmpty,
      }),

      // --------------------------------------------------
      // FP
      ...this.fencePlatform.groupAsset({
        flatW: 100,
        cornerW: 500,
        innerW: 400,
        isFrise: true,
      }),

      // --------------------------------------------------
      // WH
      ...applyGroup([
        { ...this.houseSimple.Wall_Door, weight: 30 },
      ], {
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),
      ...applyGroup([
        { ...this.houseSimple.Wall, weight: 30 },
        { ...this.houseSimple.Wall_RoofWindows, weight: 0 },
        { ...this.houseSimple.Wall_Windows, weight: 0 },
        { ...this.houseSimple.Corner, weight: 10 },
        { ...this.houseSimple.Corner_B, weight: 0 },
        { ...this.houseSimple.InnerCorner_X, weight: 200 },
        { ...this.houseSimple.Inside_Full, weight: 0 },
      ], {
        allowMove: false,
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
