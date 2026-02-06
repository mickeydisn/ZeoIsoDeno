import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_CoridorLab } from "./assetsItems/assetItem_CoridorLab.ts";
import { AssetItem_Fence } from "./assetsItems/assetItem_Fence.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";

export class WcBuildConf_LabBorder1 extends AbstractWcBuildConf {
  private colorConf: Record<string, any>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    this.colorConf = {
      FENCE_SUFFIX: "#H150_S50_C170_B115",
      WALL_SUFFIX: "#H170_S120_C70_B115",
    };

    this.ast = {
      fence: new AssetItem_Fence(this.colorConf.FENCE_SUFFIX),
      fenceIn: new AssetItem_FencePlatform(this.colorConf.WALL_SUFFIX),
      corridor: new AssetItem_CoridorLab(this.colorConf.WALL_SUFFIX),
    };

    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];

    this.group = {
      X: {
        weight: 0,
        color: [140, 140, 140],
        allowMove: true,
        isFrise: false,
        functions: [
          ...actionsEmpty,
        ],
        empty: true,
      },
      FX: { // fence outside
        weight: 0,
        color: [100, 100, 100],
        allowMove: true,
        isFrise: false,
        functions: [
          ...actionsEmpty,
        ],
        empty: true,
      },
      FI: {
        weight: 0,
        color: [100, 100, 100],
        allowMove: true,
        isFrise: true,
        functions: [
          ...actionsEmpty,
        ],
        empty: true,
      },
      A: {
        weight: 0,
        color: [0, 0, 0],
        allowMove: false,
        isFrise: true,
        functions: [
          ...actionsEmpty,
        ],
      },
    };

    this.faceLinkWeight = {
      "X": 1,

      /**/
      "Xin": 0,

      "Bout": 1,
      "Bl": 1,
      "Br": 1,
      "Bin": 1,

      "0": 1,

      "Pout": 1,
      "Pr": 1,
      "Pl": 1,

      "Pin": 0,
      "WoD": 0,
      "SWoD": 1,

      "Wout": 1,
      "WoutD": 1,

      "A": 1,
    };

    this.faceLinks = [
      ["X", "X"],

      ["Xin", "Bout"],

      ["Bl", "Br"],

      ["Bin", "0"],

      ["0", "Pout"],

      ["Pl", "Pr"],

      ["Pin", "Wout"],

      ["Pin", "WoutD"],

      ["SWoD", "WoutD"],

      ["A", "A"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [{
      face: ["SWoD", "Pl", "Pout", "Pr"],
      items: [
        {
          weight: 0,
          color: [128, 128, 128],
          allowMove: true,
          isFrise: true,
          functions: [/*...actionsEmptyFlat*/],
          assets: this.ast.fenceIn.Flat,
        },
      ],
    }];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    // ======================================================================
    // ======================================================================

    return [
      // --------------------------------------------------

      {
        face: ["X", null, null, null],
        items: [{ ...this.group.X }],
      },
      {
        face: ["X", "X", null, null],
        items: [{ ...this.group.X }],
      },
      {
        face: ["X", null, "X", null],
        items: [{ ...this.group.X }],
      },
      {
        face: ["X", "X", "X", null],
        items: [{ ...this.group.X }],
      },
      {
        face: ["X", "X", "X", "X"],
        items: [{ ...this.group.X }],
      },

      // --------------------------------------------------

      {
        face: ["Xin", "X", "X", "X"],
        items: [{ ...this.group.X }],
      },
      {
        face: ["Xin", "Xin", "X", "X"],
        items: [{ ...this.group.X }],
      },

      // --------------------------------------------------

      {
        face: ["0", "Bout", "Bout", "Bout"],
        items: [{ ...this.group.FX }],
      },

      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fence.Corner_A,
          },
        ],
      },
      {
        face: ["Br", "0", "Bl", "Bout"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fence.Flat_A,
          },
        ],
      },
      {
        face: ["0", "0", "Bl", "Br"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fence.InnerCorner_A,
          },
        ],
      },

      // --------------------------------------------------

      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...this.group.FI,
            weight: 10,
            color: [255, 0, 255],
          },
        ],
      },

      // --------------------------------------------------

      {
        face: ["Pout", "Pout", "Pr", "Pl"],
        items: [
          {
            ...this.group.FI,
            weight: 1,
            assets: this.ast.fenceIn.Corner,
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 1,
            assets: this.ast.fenceIn.Flat,
          },
        ],
      },
      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 1,
            assets: this.ast.fenceIn.InnerCorner,
          },
        ],
      },

      // --------------------------------------------------

      {
        face: ["A", "Wout", "WoutD", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 0,
            assets: this.ast.corridor.Door,
          },
        ],
      },
      {
        face: ["A", "Wout", "A", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 30,
            assets: this.ast.corridor.Flat,
          },
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.corridor.Flat_Detail,
          },
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.corridor.Flat_Window,
          },
        ],
      },
      {
        face: ["A", "A", "Wout", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.corridor.Corner,
          },
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.corridor.Corner_Round,
          },
        ],
      },
      {
        face: ["A", "A", "A", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 20,
            assets: this.ast.corridor.TJoin,
          },
        ],
      },
      /// A
      {
        face: ["A", "A", "A", "A"],
        items: [
          {
            ...this.group.A,
            weight: 20,
            assets: this.ast.corridor.CrossJoin,
          },
        ],
      },
      // --------------------------------------------------
    ];
  }
}
