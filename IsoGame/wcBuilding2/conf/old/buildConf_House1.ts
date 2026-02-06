import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_InsideHouse } from "./assetsItems/assetItem_InsideHouse.ts";
import { AssetItem_WallHouse } from "./assetsItems/assetItem_WallHouse.ts";

export class WcBuildConf_House1 extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 360);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S100_C90_B95`,
      ROOF_SUFFIX: `#H${(rand + -110) % 360}_S50_C110_B95`,
    };

    this.ast = {
      wallHouse: new AssetItem_WallHouse(
        this.colorConf.WALL_SUFFIX,
        this.colorConf.ROOF_SUFFIX,
      ),
      insideHouse: new AssetItem_InsideHouse(
        this.colorConf.WALL_SUFFIX,
        this.colorConf.ROOF_SUFFIX,
      ),
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
      W: {
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
        color: [100, 100, 100],
        allowMove: false,
        isFrise: true,
        functions: [
          ...actionsEmpty,
        ],
      },
    };

    this.faceLinkWeight = {
      "P1": 0,

      "Sx": 0,
      "SBl": 0,
      "SBr": 0,

      "S0o": 0,
      "S0i": 0,
      "WoDs": 0,

      "null": 1,
      "X": 1,
      // 'X0': 0,
      // '0X': 2,

      "Bl": 1,
      "Br": 1,

      "Br2": 1,
      "Bl2": 1,

      "0": 1,
      "Xin": 1,

      "Wout": 1,
      "WoutD": 1,
      "WoD": 1,
      "Wr": 1,
      "Wl": 1,
      "A": 1,
    };

    this.faceLinks = [
      ["P1", "X"],

      ["P1", "Sx"],

      ["X", "X"],

      ["Sx", "Sx"],

      ["S0o", "S0i"],

      // ---
      ["Xin", "Wout"],

      ["Xin", "WoutD"],

      ["WoD", "WoutD"],

      ["WoutD", "WoDs"],

      ["WoDs", "WiDs"],

      ["Wl", "Wr"],

      ["A", "A"],
      // -----
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
    ];
    return [
      {
        face: ["Xin", "X", "Sx", "X"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            color: [64, 64, 64],
            allowMove: true,
            isFrise: true,
          },
        ],
      },
    ];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    return [
      // ======================================================================
      // ======================================================================
      {
        face: ["X", null, null, null],
        items: [this.group.X],
      },
      {
        face: ["X", "X", null, null],
        items: [this.group.X],
      },
      {
        face: ["X", null, "X", null],
        items: [this.group.X],
      },
      {
        face: ["X", "X", "X", null],
        items: [this.group.X],
      },

      {
        face: ["X", "X", "X", "X"],
        items: [this.group.W],
      },
      // ======================================================================
      // ======================================================================

      {
        face: ["Xin", "X", "X", "X"],
        items: [{
          ...this.group.W,
        }],
      },
      {
        face: ["Xin", "Xin", "X", "X"],
        items: [{
          ...this.group.W,
        }],
      },

      // ======================================================================
      // ======================================================================
      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: .1,
            assets: this.ast.wallHouse.Corner_A,
          },
          {
            ...this.group.A,
            weight: .1,
            assets: this.ast.wallHouse.Corner_B,
          },
        ],
      },

      /// O - A

      {
        face: ["Wr", "A", "Wl", "WoutD"],
        items: [
          {
            ...this.group.A,
            weight: .1,
            assets: this.ast.wallHouse.Wall_DF,
          },
        ],
      },
      {
        face: ["Wr", "A", "Wl", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 0,
            assets: this.ast.wallHouse.Wall_DF,
          },
          {
            ...this.group.A,
            weight: 6,
            assets: this.ast.wallHouse.Wall_FF,
          },
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallHouse.Wall_WF,
          },
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallHouse.Wall_WW,
          },
        ],
      },

      {
        face: ["A", "A", "Wl", "Wr"],
        items: [
          {
            ...this.group.A,
            weight: 4,
            assets: this.ast.wallHouse.InnerCorner_A,
          },
        ],
      },

      {
        face: ["A", "A", "A", "A"],
        items: [
          {
            ...this.group.A,
            weight: .4,
            assets: this.ast.insideHouse.Inside_Full_A,
          },
        ],
      },

      /*
          A
       A  .  A
          A
      */

      // ----------------------------------
      /// Connect TO Start

      {
        face: ["Sx", "X", "X", "X"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            color: [52, 52, 52],
          },
        ],
      },
    ];
  }
}

// -----------------------------------------
