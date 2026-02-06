import { AbstractWcBuildConf, WcConfTile } from "../AbstractBuildConf.ts";
import { wcAsset_EnterSimple } from "./assetsCollection/wcAsset_Entrer.ts";
import {
  FenceCollapseType,
  WcAsset_Fence2,
  WcAsset_FenceEnter,
  WcAsset_FenceGrave,
  WcAsset_FGraveAltar,
  WcAsset_FGraveBone,
  WcAsset_FGraveIn,
} from "./assetsCollection/wcAsset_Fence2.ts";
import { wcAsset_X } from "./assetsCollection/wcAsset_X.ts";
import { actionsEmpty, applyGroup } from "./assetsCollection/wcUtils.ts";

export class WcBuildConf_GraveA extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;

  private enter: wcAsset_EnterSimple;
  private fenceEnter: WcAsset_FenceEnter;

  private faceX: wcAsset_X;

  private fenceGrave: WcAsset_Fence2;
  private fGraveIn: WcAsset_Fence2;
  private fGraveBone: WcAsset_Fence2;
  private fGraveAltar: WcAsset_Fence2;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S50_C150_B115`,
    };

    this.enter = new wcAsset_EnterSimple();
    this.faceX = new wcAsset_X();

    this.fenceEnter = new WcAsset_FenceEnter({
      tag: "FE_",
      suffix: this.colorConf.FENCE_SUFFIX,
    });
    this.fenceGrave = new WcAsset_FenceGrave({
      tag: "FG_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.Exclude,
    });
    this.fGraveIn = new WcAsset_FGraveIn({
      tag: "FI_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.Exclude,
    });
    this.fGraveBone = new WcAsset_FGraveBone({
      tag: "FI_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.Exclude,
    });
    this.fGraveAltar = new WcAsset_FGraveAltar({
      tag: "FI2_",
      suffix: this.colorConf.FENCE_SUFFIX,
      collapseType: FenceCollapseType.NoSquare,
    });

    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),
      ...this.enter.faceLinkWeight(),

      ...this.fenceGrave.faceLinkWeight(0, 1, 1),

      ...this.fGraveIn.faceLinkWeight(0, 20, 15),
      ...this.fGraveAltar.faceLinkWeight(0, 20, 15),

      "0": 30,
    };

    this.faceLinks = [
      /// ---------------------
      // X
      ...this.faceX.getFaceLinks({
        in: ["FG_out", "FE_out"],
      }),

      /// ==============================
      ...this.enter.getFaceLinks({
        out: ["X"],
        l: ["FG_r", "FG_r#Xc", "FG_r#Xi"],
        r: ["FG_l", "FG_l#Xc", "FG_l#Xi"],
        door: ["FI_out"],
      }),
      /// ---------------------
      // FG_
      ...this.fenceGrave.getFaceLinks({
        out: ["X"],
        in: ["FP_out", "FI_out"],
      }),

      /// ==============================

      /// ---------------------
      // FI_
      ...this.fGraveIn.getFaceLinks({
        out: ["FG_in"],
        in: ["0"],
      }),
      /// ---------------------
      // FI2_
      ...this.fGraveAltar.getFaceLinks({
        out: ["FG_in"],
        in: ["0"],
      }),
      ...this.fGraveAltar.getFaceLinksSide({
        l: ["FI_r", "FI_r#Xc", "FI_r#Xi"],
        r: ["FI_l", "FI_l#Xc", "FI_l#Xi"],
      }),
      /// ==============================
      // 0
      ["0", "0"],
      // -----
    ];
  }

  override get __TILE_START_RAW(): WcConfTile[] {
    return this.enter.groupInit(); /* [
      {
        face: ["FG_in", "FG_l", "FG_out", "FG_r"],
        color: [0, 0, 0],
        weight: 0,
        allowMove: true,
        isFrise: false,
        empty: true,
      },
    ]; // * this.enter.groupInit(); /* */
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

      /// ==============================
      // --------------------------------------------------
      // FG_
      ...this.fenceGrave.groupAsset({
        flatW: 10,
        cornerW: 0,
        innerW: 13,
        isFrise: true,
      }),

      /// ==============================
      // FI_
      ...this.fGraveIn.groupAsset({
        flatW: 6,
        cornerW: 0,
        innerW: 12,
        isFrise: true,
      }),
      ...this.fGraveBone.groupAsset({
        flatW: 0,
        cornerW: 0,
        innerW: 12,
        isFrise: true,
      }),
      // FI2_
      ...this.fGraveAltar.groupAsset({
        flatW: 4,
        cornerW: 0,
        innerW: 0,
        isFrise: true,
      }),

      // --------------------------------------------------
      // 0
      ...applyGroup([
        { face: ["0", "0", "0", "0"], weight: 5 },
      ], {
        allowMove: true,
        isFrise: true,
        empty: true,
        color: [64, 64, 64],
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
