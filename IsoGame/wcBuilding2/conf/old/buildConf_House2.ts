import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_Fence } from "./assetsItems/assetItem_Fence.ts";
import { AssetItem_InsideHouse } from "./assetsItems/assetItem_InsideHouse.ts";
import { AssetItem_WallHouse } from "./assetsItems/assetItem_WallHouse.ts";

export class WcBuildConf_House2 extends AbstractWcBuildConf {
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
      fence: new AssetItem_Fence(this.colorConf.FENCE_SUFFIX),
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
      FX: {
        weight: 0,
        color: [100, 100, 100],
        allowMove: true,
        isFrise: false,
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

      "X": 1,

      "0": 0,
      "Xin": 0,

      "Bout": 0,
      "Bl": 1,
      "Br": 1,
      "Bin": 1,

      "Wout": 1,
      "Wr": 1,
      "Wl": 1,

      "A": 1,
    };

    this.faceLinks = [
      ["P1", "X"],

      // ---

      ["X", "X"],
      // ---

      ["X", "Bout"],

      ["Bl", "Br"],

      ["Bin", "Wout"],

      // ---

      ["Bin", "0"],

      ["0", "0"],
      // ---
      ["Wl", "Wr"],

      ["A", "A"],
      // -----
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [
      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 0,
            assets: this.ast.wallHouse.Corner_A,
          },
        ],
      },
    ];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    // ======================================================================
    // ======================================================================

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
        items: [this.group.X],
      },
      // ======================================================================
      // ======================================================================

      {
        face: ["Xin", "X", "X", "X"],
        items: [{
          ...this.group.X,
        }],
      },
      {
        face: ["Xin", "Xin", "X", "X"],
        items: [{
          ...this.group.X,
        }],
      },

      // ======================================================================
      // ======================================================================

      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...this.group.FX,
            weight: 0,
            assets: this.ast.fence.Corner_A,
          },
        ],
      },
      {
        face: ["Br", "Bin", "Bl", "Bout"],
        items: [
          {
            ...this.group.FX,
            weight: 1,
            assets: this.ast.fence.Flat_A,
          },
        ],
      },
      {
        face: ["Bin", "Bin", "Bl", "Br"],
        items: [
          {
            ...this.group.FX,
            weight: 10,
            assets: this.ast.fence.InnerCorner_A,
          },
        ],
      },
      // ======================================================================

      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...this.group.FX,
            weight: 1.3,
            color: [255, 255, 255],
          },
        ],
      },

      // ======================================================================
      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 0,
            assets: this.ast.wallHouse.Corner_A,
          },
          {
            ...this.group.A,
            weight: 0,
            assets: this.ast.wallHouse.Corner_B,
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
            weight: 2,
            assets: this.ast.wallHouse.InnerCorner_A,
          },
        ],
      },
      // -----

      {
        face: ["A", "A", "A", "A"],
        items: [
          {
            ...this.group.A,
            weight: .1,
            assets: this.ast.insideHouse.Inside_Full_A,
          },
        ],
      },
    ];
  }
}

// -----------------------------------------
