import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_Fence2 } from "./assetsItems/assetItem_Fence2.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";
import { AssetItem_WallLab } from "./assetsItems/assetItem_WallLab.ts";

export class WcBuildConf_RLab1 extends AbstractWcBuildConf {
  // this.ROOF_PREFIX = "roofHigh"
  ROOF_PREFIX = "roof";
  // this.WALL_PREFIX = "wWllWood"
  WALL_PREFIX = "wall";

  ROOF_SUFFIX = "#H0_S100_C100_B100"; // '#H190_S75_C75_B125'
  WALL_SUFFIX = "#H170_S120_C70_B115"; // '#H200_S20_C135_B105'
  // this.WALL_SUFFIX = '#H350_S70_C100_B70_I'

  constructor(conf = {}) {
    super(conf);

    this.faceLinkWeight = {
      "X": 0,
      "Xin": 0,
      "Bout": 1,

      "Bl": 1,
      "Br": 1,

      "0": 0,

      "Pout": 1,
      "Pr": 1,
      "Pl": 1,

      "Pin": 0,
      "Wout": 1,
      "Wr": 1,
      "Wl": 1,
      "Wrx": 1,
      "Wlx": 1,

      "A": 1,
      "Ao": 1,
      "Ai": 1,
    };

    this.faceLinks = [
      ["X", "X"],

      ["Xin", "Bout"],

      ["Bl", "Br"],

      ["0", "Pout"],

      ["Pl", "Pr"],

      ["Pin", "Wout"],

      ["Wl", "Wr"],

      ["Wlx", "Wr"],
      ["Wl", "Wrx"],

      ["A", "A"],

      ["Ao", "Ao"],

      ["Ao", "Ai"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [{
      face: ["A", "A", "A", "A"],
      items: [
        {
          weight: .5,
          color: [0, 0, 0],
          isFrise: true,
          functions: [
            //...actionsEmptyFlat
          ],
          assets: [
            {
              h: 2,
              key: this.ROOF_PREFIX + "Point",
              keyR: 3,
              sufix: this.ROOF_SUFFIX,
            },
            {
              h: 1.5,
              key: this.WALL_PREFIX + "BlockHalf",
              keyR: 0,
              sufix: this.WALL_SUFFIX,
            },
          ],
        },
      ],
    }];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];
    // ======================================================================

    const groupX: WcConfRawTile = {
      weight: 0,
      color: [140, 140, 140],
      allowMove: false,
      isFrise: false,
      functions: [
        ...actionsEmpty,
      ],
      empty: true,
    };

    const groupW: WcConfRawTile = {
      weight: 0,
      color: [128, 128, 128],
      allowMove: true,
      isFrise: true,
      functions: [
        ...actionsEmpty,
      ],
      empty: true,
    };

    // ======================================================================
    // ======================================================================
    const fence = new AssetItem_Fence2();
    const platform = new AssetItem_FencePlatform();
    const wallLab = new AssetItem_WallLab();
    // ======================================================================
    // ======================================================================

    return [
      // X - null
      {
        face: ["X", "", "", null],
        items: [{ ...groupX }],
      },
      {
        face: ["X", "X", null, null],
        items: [{ ...groupX }],
      },
      {
        face: ["X", null, "X", null],
        items: [{ ...groupX }],
      },
      {
        face: ["X", "X", "X", null],
        items: [{ ...groupX }],
      },
      // == X ===
      {
        face: ["X", "X", "X", "X"],
        items: [{ ...groupX }],
      },
      /// O - Bi
      {
        face: ["Xin", "X", "X", "X"],
        items: [{ ...groupX }],
      },
      {
        face: ["Xin", "Xin", "X", "X"],
        items: [{ ...groupX }],
      },

      /// O - Bi
      {
        face: ["0", "Bout", "Bout", "Bout"],
        items: [{ ...groupX }],
      },
      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: fence.Corner,
          },
        ],
      },
      {
        face: ["Br", "0", "Bl", "Bout"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: fence.Flat,
          },
        ],
      },
      {
        face: ["0", "0", "Bl", "Br"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: fence.InnerCorner,
          },
        ],
      },
      // == 0 ===
      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...groupW,
            weight: 0,
          },
        ],
      },
      // ---------------
      {
        face: ["Pout", "Pout", "Pr", "Pl"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: platform.Corner,
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: platform.Flat,
          },
        ],
      },
      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...groupW,
            weight: 0,
            assets: platform.InnerCorner,
          },
        ],
      },

      // ---------------

      {
        face: ["Wr", "Wl", "Wout", "Wout"],
        items: [
          {
            ...groupW,
            weight: .2,
            assets: wallLab.Corner_A,
          },
          {
            ...groupW,
            weight: .2,
            assets: wallLab.Corner_A,
          },
        ],
      },
      {
        face: ["Wr", "A", "Wl", "Wout"],
        items: [
          {
            ...groupW,
            weight: 2,
            assets: wallLab.Wall_CS,
          },
          {
            ...groupW,
            weight: 2,
            assets: wallLab.Wall_FS,
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
          },
        ],
      },

      {
        face: ["A", "A", "Wlx", "Wrx"],
        items: [
          {
            ...groupW,
            weight: 5,
            assets: wallLab.Wall_ToCorridor,
          },
        ],
      },

      /// ----------------

      {
        face: ["Wr", "Ao", "Wl", "Wout"],
        items: [
          {
            ...groupW,
            weight: 10,
            assets: wallLab.Wall_WS,
          },
        ],
      },

      {
        face: ["Ai", "Ai", "Ai", "Ai"],
        items: [
          {
            ...groupW,
            weight: 40,
            assets: wallLab.InsideWall,
          },
        ],
      },
    ];
  }
}
