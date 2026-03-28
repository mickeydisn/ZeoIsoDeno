import { WcAbstractBuildConf, WcConfTile } from "../wcAbstractBuildConf.ts";
import { wcAsset_CoridorPipe } from "./assetsCollection/wcAsset_CoridorPipe.ts";
import { wcAsset_CoridorPipe2 } from "./assetsCollection/wcAsset_CoridorPipe2.ts";
import { wcAsset_Enter } from "./assetsCollection/wcAsset_Entrer.ts";
import {
  FenceCollapseType,
  WcAsset_Fence2,
} from "./assetsCollection/wcAsset_Fence2.ts";
import { wcAsset_X } from "./assetsCollection/wcAsset_X.ts";
import {
  actionsEmpty,
  applyGroup,
  tagFaces,
} from "./assetsCollection/wcUtils.ts";

export class WcBuildConf_LabPipeA extends WcAbstractBuildConf {
  private colorConf: Record<string, string>;

  private enter: wcAsset_Enter;
  private faceX: wcAsset_X;

  private fence: WcAsset_Fence2;
  // private fencePlatform: WcAsset_FencePlatform;
  private corridor: wcAsset_CoridorPipe;
  private corridor2: wcAsset_CoridorPipe2;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      FENCE_PLATFORM_SUFFIX: `#H${(rand + -120) % 360}_S10_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S90_C140_B95`,
    };

    this.enter = new wcAsset_Enter();
    this.faceX = new wcAsset_X();
    this.fence = new WcAsset_Fence2({
      tag: "F2_",
      suffix: this.colorConf.FENCE_PLATFORM_SUFFIX,
      collapseType: FenceCollapseType.NoSquare,
    });
    // this.fencePlatform = new WcAsset_FencePlatform(this.colorConf.WALL_SUFFIX);
    this.corridor = new wcAsset_CoridorPipe(this.colorConf.WALL_SUFFIX);
    this.corridor2 = new wcAsset_CoridorPipe2(this.colorConf.WALL_SUFFIX);

    this.faceLinkWeight = {
      //
      ...this.faceX.faceLinkWeight(),

      ...this.fence.faceLinkWeight(0, 1, 5),

      ...this.enter.faceLinkWeight(),

      "0": 1,

      /*/ FP
      "FP_out": 0,
      "FP_r": 10,
      "FP_l": 10,
      "FP_in": 15,
      */
      "CP2_outD": 0,
      "CP2_out": 0,
      "CP2_r": 20,
      "CP2_l": 20,
      "CP2_in": 25,

      // CL
      "CP_outD": 0,
      "CP_out": 0,
      "CP_r": 20,
      "CP_l": 20,
      "CP_in": 25,

      "CP_s": 0,
      "CP2_s": 0,
    };

    this.faceLinks = [
      ...this.faceX.getFaceLinks({
        in: ["F2_out"],
      }),

      ...this.fence.getFaceLinks({
        out: ["X"],
        in: ["CP_out", "CP_outD"],
      }),

      ...this.enter.getFaceLinks({
        out: ["X"],
        l: ["F2_r", "F2_r#X"],
        r: ["F2_l", "F2_l#X"],
        door: ["CP_outD"],
      }),

      // -----
      ["F2_in", "0"],

      ["CP_s", "CP_in"],
      ["CP2_s", "CP2_in"],

      ["CP_in", "CP_in"],
      ["CP_in#X", "CP_in"],

      // ----
      // ----
      ["F2_in", "CP2_out"],
      ["F2_in", "CP2_outD"],

      ["CP2_in", "CP2_in"],
      ["CP2_in#X", "CP2_in"],
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
      // F
      ...this.fence.groupAsset({
        isFrise: true,
      }),

      // --------------------------------------------------
      // E
      ...this.enter.groupAsset(),

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
      // CP
      ...applyGroup([
        // { ...tagFaces(this.corridor.Door, [["in", "#X"]]), weight: 0 },
        { ...tagFaces(this.corridor.Door2, [["in", "#X"]]), weight: 0 },
        { ...this.corridor.Flat, weight: 18 },
        { ...this.corridor.Flat_NoSupport, weight: 2 },
        { ...this.corridor.Flat_Ring, weight: 10 },
        { ...this.corridor.Flat_Open, weight: 10 },
        { ...tagFaces(this.corridor.Corner, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor.Corner_Round, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor.TJoin, [["in", "#X"]]), weight: 100 },
        { ...tagFaces(this.corridor.CrossJoin, [["in", "#X"]]), weight: 100 },
      ], {
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty,
      }),

      ...applyGroup([
        { ...this.corridor.Silo, face: ["CP_s", "CP_s", "0", "0"] },
        { ...this.corridor.Silo, face: ["CP_s", "0", "CP_s", "0"] },
        { ...this.corridor.Silo, face: ["CP_s", "CP_s", "CP_s", "0"] },

        { ...this.corridor2.SiloUP, face: ["CP2_s", "CP2_s", "0", "0"] },
        { ...this.corridor2.SiloUP, face: ["CP2_s", "0", "CP2_s", "0"] },
      ], {
        weight: 2,
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty,
      }),

      ...applyGroup([
        { ...this.corridor2.Silo, face: ["CP_s", "CP2_s", "0", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "0", "0"] },

        { ...this.corridor2.Silo, face: ["CP2_s", "0", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP2_s", "CP_s", "0"] },
        { ...this.corridor2.Silo, face: ["CP2_s", "CP_s", "CP2_s", "0"] },
      ], {
        weight: 40,
        allowMove: true,
        color: [110, 110, 110],
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
      // CP2
      ...applyGroup([
        { ...tagFaces(this.corridor2.Door, [["in", "#X"]]), weight: 0 },
        // { ...tagFaces(this.corridor2.Door2, [["in", "#X"]]), weight: 0 },
        { ...this.corridor2.Flat, weight: 5 },
        { ...this.corridor2.Flat_NoSupport, weight: 0 },
        { ...this.corridor2.Flat_Ring, weight: 50 },
        { ...this.corridor2.Flat_Open, weight: 5 },
        { ...tagFaces(this.corridor2.Corner, [["in", "#X"]]), weight: 10 },
        {
          ...tagFaces(this.corridor2.Corner_Round, [["in", "#X"]]),
          weight: 10,
        },
        { ...tagFaces(this.corridor2.TJoin, [["in", "#X"]]), weight: 30 },
        { ...tagFaces(this.corridor2.CrossJoin, [["in", "#X"]]), weight: 30 },
      ], {
        color: [128, 128, 142],
        allowMove: true,
        isFrise: true,
        functions: actionsEmpty,
      }),
      // --------------------------------------------------
    ];
  }
}
