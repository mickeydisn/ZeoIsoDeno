import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_CoridorLab } from "./assetsItems/assetItem_CoridorLab.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";

export class WcBuildConf_Lab1 extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 255);

    this.colorConf = {
      WALL_SUFFIX: `#H${rand}_S120_C90_B95`,
    };

    this.ast = {
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

      "Pout": 4,
      "Pr": 6,
      "Pl": 6,

      "Pin": 0,
      "WoD": 0,
      "SWoD": 8,

      "Wout": 8,
      "WoutD": 8,

      "A": 10,
    };

    this.faceLinks = [
      ["X", "X"],

      ["X", "Pout"],

      ["Pl", "Pr"],

      ["Pin", "Wout"],

      ["Pin", "WoutD"],

      ["SWoD", "WoutD"],

      ["A", "A"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    const actionsEmptyFlat = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
      // {func:"setFrise", isFrise:true},
      // this.tile.isFrise = true
    ];
    return [{
      face: ["SWoD", "Pl", "Pout", "Pr"],
      items: [
        {
          weight: 0,
          colorT: [128, 128, 128],
          allowMove: true,
          isFrise: true,
          functions: [...actionsEmptyFlat],
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
        face: ["Pout", "Pout", "Pr", "Pl"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fenceIn.Corner,
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fenceIn.Flat,
          },
        ],
      },
      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...this.group.FX,
            assets: this.ast.fenceIn.InnerCorner,
          },
        ],
      },
      // --------------------------------------------------
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
        face: ["A", "A", "A", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 20,
            assets: this.ast.corridor.TJoin,
          },
        ],
      },
      // --------------------------------------------------
      {
        face: ["A", "A", "A", "A"],
        items: [{
          ...this.group.A,
          weight: 20,
          assets: this.ast.corridor.CrossJoin,
        }],
      },
    ];
  }
}
