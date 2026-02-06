import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_CoridorLab } from "./assetsItems/assetItem_CoridorLab.ts";
import { AssetItem_Fence } from "./assetsItems/assetItem_Fence.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";

export class WcBuildConf_LabBorder2 extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      FENCE_SUFFIX: `#H${rand + 10}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S120_C90_B95`,
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
        // color: [140, 140, 140],
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
      "X": 0,

      "Xin": 0,

      "Bout": 0,
      "Bl": 1,
      "Br": 1,
      "Bin": 1,

      "0": 1,

      "Pout": 0,
      "Pr": 1,
      "Pl": 1,
      "Pin": 1,

      "WoD": 0,
      "SWoD": 1,

      "Wout": 1,
      "WoutD": 1,

      "A": 1,
    };

    this.faceLinks = [
      ["X", "X"],

      ["X", "Bout"],

      ["Bl", "Br"],

      ["Bin", "Pout"],

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
          functions: [],
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
      // Group X
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
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fence.Corner_A,
          },
        ],
      },
      {
        face: ["Br", "Bin", "Bl", "Bout"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fence.Flat_A,
          },
        ],
      },
      {
        face: ["Bin", "Bin", "Bl", "Br"],
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
            weight: 0,
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
            weight: 0,
            assets: this.ast.fenceIn.Corner,
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 4,
            assets: this.ast.fenceIn.Flat,
          },
        ],
      },
      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 5,
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
            weight: 100,
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
            weight: 100,
            assets: this.ast.corridor.CrossJoin,
          },
        ],
      },
      // --------------------------------------------------
    ];
  }
}
