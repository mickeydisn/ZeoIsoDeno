import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_CoridorLab } from "./assetsItems/assetItem_CoridorLab.ts";
import { AssetItem_Fence2 } from "./assetsItems/assetItem_Fence2.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";
import { AssetItem_WallLab } from "./assetsItems/assetItem_WallLab.ts";

export class WcBuildConf_RLab2 extends AbstractWcBuildConf {
  // this.ROOF_PREFIX = "roofHigh"
  ROOF_PREFIX = "roof";
  // this.WALL_PREFIX = "wWllWood"
  WALL_PREFIX = "wall";

  private colorConf: Record<string, string>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 360);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + -120) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S120_C90_B95`,
    };

    this.ast = {
      fence: new AssetItem_Fence2(this.colorConf.FENCE_SUFFIX),
      platform: new AssetItem_FencePlatform(this.colorConf.WALL_SUFFIX),
      wallLab: new AssetItem_WallLab(this.colorConf.WALL_SUFFIX),
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

      "Bout": 1,
      "Bl": 1,
      "Br": 1,
      "Bin": 1,

      "0": 0,

      "Pout": 1,
      "Pr": 1,
      "Pl": 1,
      "Pin": 1,
      "Pin0": 1,

      "PinD": 1,
      "WoutD": 1,

      "Wout": 1,
      "Wr": 1,
      "Wl": 1,
      "Win": 1,

      "Wr2": 1,
      "Wl2": 1,
      /*

      "A": 1,
      "Ao": 1,
      "Ai": 1,
      */
    };

    this.faceLinks = [
      ["X", "X"],

      // ["Xin", "Bout"],
      // ["Bout", "Xin"],
      // ------

      ["X", "Bout"],

      ["Bl", "Br"],

      ["Bin", "Pout"],

      ["Pl", "Pr"],

      ["PinD", "WoutD"],

      // ------

      ["Pin", "Wout"],
      ["Pin0", "0"],
      ["Pin", "0"],

      ["0", "Wout"],

      // ------
      ["Wl", "Wr"],
      // ------

      ["Win", "Win"],

      ["WCin", "Cin"],

      ["Cin", "Cin"],

      // ------
      ["Win2", "Win"],

      ["Wl2", "Wr"],
      ["Wl", "Wr2"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [
      {
        face: ["0", "0", "0", "0"],
        items: [{ ...this.group.X }],
      },
    ];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    // ======================================================================
    // ======================================================================

    // ======================================================================
    // ======================================================================

    return [
      // X - null
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

      // ----------------------------
      /*
      {
        face: ["Xin", "X", "X", "X"],
        items: [{ ...groupX }],
      },
      {
        face: ["Xin", "Xin", "X", "X"],
        items: [{ ...groupX }],
      },
      */

      // --------------------------------

      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            assets: this.ast.fence.Corner,
          },
        ],
      },
      {
        face: ["Br", "Bin", "Bl", "Bout"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            assets: this.ast.fence.Flat,
          },
        ],
      },
      {
        face: ["Bin", "Bin", "Bl", "Br"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            assets: this.ast.fence.InnerCorner,
          },
        ],
      },
      /* --------------- */
      /* --------------- */
      {
        face: ["Pout", "Pout", "Pr", "Pl"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            assets: this.ast.platform.Corner,
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            assets: this.ast.platform.Flat,
          },
        ],
      },
      { // FRONT DORE
        face: ["PinD", "Wout", "Pin0", "Wout"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            color: [255, 0, 255],
            assets: this.ast.corridor.Door,
          },
        ],
      },

      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            assets: this.ast.platform.InnerCorner,
          },
        ],
      },

      /* --------------- */
      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            color: [150, 150, 255],
          },
        ],
      },

      /* --------------- */

      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            assets: this.ast.wallLab.Corner_B,
          }, /*
          {
            ...groupW,
            weight: 0,
            assets: wallLab.Corner_A,
          },*/
        ],
      },
      {
        face: ["Wr", "Win", "Wl", "Wout"],
        items: [
          {
            ...this.group.FI,
            weight: 1,
            assets: this.ast.wallLab.Wall_FS,
          }, /*
          {
            ...groupW,
            weight: 2,
            assets: wallLab.Wall_CS,
          },
          {
            ...groupW,
            weight: 2,
            assets: wallLab.Wall_DS,
          },
          {
            ...groupW,
            weight: 2,
            assets: wallLab.Wall_WS,
          },*/
        ],
      },

      {
        face: ["Win2", "Win2", "Wl2", "Wr2"],
        items: [
          {
            ...this.group.FI,
            weight: 3,
            assets: this.ast.wallLab.InnerCorner,
          },
        ],
      },

      {
        face: ["Wr", "Win", "Wl", "WoutD"],
        items: [
          {
            ...this.group.FI,
            weight: 6,
            color: [200, 200, 0],
            assets: this.ast.wallLab.Wall_ToCorridor,
          },
        ],
      },

      /// ----------------
      /// ----------------
      /// ----------------

      {
        face: ["Cin", "Wout", "Cin", "Wout"],
        items: [
          {
            ...this.group.FI,
            weight: 0,
            color: [200, 200, 0],
            assets: this.ast.wallLab.Corridor_DD,
          },
        ],
      },
    ];
  }
}
