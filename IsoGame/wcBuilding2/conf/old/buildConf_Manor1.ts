import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_Fence } from "./assetsItems/assetItem_Fence.ts";
import { AssetItem_InsideManor } from "./assetsItems/assetItem_InsideManor.ts";
import { AssetItem_WallManor } from "./assetsItems/assetItem_WallManor.ts";

export class WcBuildConf_Manor1 extends AbstractWcBuildConf {
  private colorConf: Record<string, string>;
  private ast: Record<string, any>;
  private group: Record<string, WcConfRawTile>;

  constructor(conf = {}) {
    super(conf);

    const rand = Math.floor(Math.random() * 360);

    this.colorConf = {
      FENCE_SUFFIX: `#H${(rand + 10) % 360}_S50_C150_B115`,
      WALL_SUFFIX: `#H${rand}_S50_C110_B95`,
      ROOF_SUFFIX: `#H${(rand + 10) % 360}_S50_C110_B95`,
    };

    this.ast = {
      fence: new AssetItem_Fence(this.colorConf.FENCE_SUFFIX),
      wallManor: new AssetItem_WallManor(
        this.colorConf.WALL_SUFFIX,
        this.colorConf.ROOF_SUFFIX,
      ),
      insideManor: new AssetItem_InsideManor(
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
      "X": 1,

      "Bout": 1,
      "Bl": 1,
      "Br": 1,
      "Bin": 1,

      "Br2": 1,
      "Bl2": 1,

      "0": 1,

      "WoutD": 1,
      "Wout": 1,
      "Wl": 1,
      "Wr": 1,
      "Win": 1,

      "A": 1,
    };

    this.faceLinks = [
      ["X", "X"],

      // ['0X', 'X0'],
      ["Bout", "X"],

      ["Bl", "Br"],
      ["Bin", "0"],

      ["Bl2", "Br2"],

      // -----

      ["0", "0"],
      ["0", "Wout"],
      ["0", "WoutD"],

      ["Wl", "Wr"],

      ["Win", "Win"],
      ["Win", "A"],
      ["A", "A"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [{
      face: ["0", "0", "0", "0"],
      items: [
        {
          weight: 0,
          color: [255, 255, 255],
          allowMove: true,
          isFrise: true,
          functions: [
            // ...actionsEmptyFlat
          ],
        },
      ],
    }];
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
        weight: 0,
        items: [this.group.X],
      },
      {
        face: ["X", "X", null, null],
        weight: 0,
        items: [this.group.X],
      },
      {
        face: ["X", null, "X", null],
        weight: 0,
        items: [this.group.X],
      },
      {
        face: ["X", "X", "X", null],
        weight: 0,
        items: [this.group.X],
      },

      {
        face: ["X", "X", "X", "X"],
        weight: 0,
        items: [this.group.X],
      },

      // ------------------------------------------------
      // ------------------------------------------------

      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [{
          ...this.group.X,
          weight: 0,
          assets: this.ast.fence.Corner_A,
        }],
      },
      {
        face: ["Br", "Bin", "Bl", "Bout"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            assets: this.ast.fence.Flat_A,
          },
        ],
      },
      {
        face: ["Bin", "Bin", "Bl", "Br"],
        items: [
          {
            ...this.group.X,
            weight: 0,
            assets: this.ast.fence.InnerCorner_A,
          },
        ],
      },
      // ------------------------------------------------
      // ------------------------------------------------

      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...this.group.FX,
            weight: 1,
          },
        ],
      },
      /*
      {
        face: ["0in", "0", "0", "0"],
        items: [
          {
            ...groupBorder,
            weight: 2,
          },
        ],
      },
      {
        face: ["0in", "0in", "0", "0"],
        items: [
          {
            ...groupBorder,
            weight: 1,
          },
        ],
      },
      */
      // ---------------------

      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallManor.Corner_A,
          },
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallManor.Corner_B,
          },
        ],
      },

      {
        face: ["Wr", "Win", "Wl", "WoutD"],
        items: [
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallManor.Flat_DWR,
          },
        ],
      },
      {
        face: ["Wr", "Win", "Wl", "Wout"],
        items: [
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.wallManor.Flat_DWR,
          },
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.wallManor.Flat_WWR,
          },
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.wallManor.Flat_WWW,
          },
        ],
      },
      {
        face: ["Win", "Win", "Wl", "Wr"],
        items: [
          {
            ...this.group.A,
            weight: 10,
            assets: this.ast.wallManor.InnerCorner_A,
          },
        ],
      },
      // ---------------------

      {
        face: ["A", "A", "A", "A"],
        items: [
          {
            ...this.group.A,
            weight: 1,
            assets: this.ast.insideManor.Inside_Full_A,
          },
        ],
      },
    ];
  }
}
