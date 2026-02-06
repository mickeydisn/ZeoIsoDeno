import {
  AbstractWcBuildConf,
  WcConfRawGroup,
  WcConfRawTile,
} from "../../AbstractBuildConf.ts";
import { AssetItem_Fence2 } from "./assetsItems/assetItem_Fence2.ts";
import { AssetItem_FencePlatform } from "./assetsItems/assetItem_FencePlatform.ts";
import { AssetItem_WallLab } from "./assetsItems/assetItem_WallLab.ts";

export class WcBuildConf_RLab3 extends AbstractWcBuildConf {
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

      // ------
      ["Bl", "Br"],
      // ------
      ["Bin", "Pout"],

      // ------
      ["Pl", "Pr"],
      // ------

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
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];
    const groupX: WcConfRawTile = {
      weight: 0,
      color: [0, 128, 255],
      allowMove: false,
      isFrise: true,
      functions: [
        ...actionsEmpty,
      ],
      empty: true,
    };

    return [
      {
        face: ["0", "0", "0", "0"],
        items: [{ ...groupX }],
      },
      /*
      {
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
    } */
    ];
  }

  override get __TILE_LIST(): WcConfRawGroup[] {
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];
    // ======================================================================

    const groupX: WcConfRawTile = {
      weight: 0,
      color: [0, 0, 128],
      allowMove: false,
      isFrise: true,
      functions: [
        ...actionsEmpty,
      ],
      empty: true,
    };

    const groupW: WcConfRawTile = {
      weight: 0,
      color: [0, 0, 128],
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
        face: ["X", null, null, null],
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
      {
        face: ["X", "X", "X", "X"],
        items: [{ ...groupX }],
      },

      // --------------------------------

      {
        face: ["Br", "Bl", "Bout", "Bout"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [128, 128, 255],
          },
        ],
      },
      {
        face: ["Br", "Bin", "Bl", "Bout"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [128, 128, 255],
          },
        ],
      },
      {
        face: ["Bin", "Bin", "Bl", "Br"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [128, 128, 255],
          },
        ],
      },
      /* --------------- */
      /* --------------- */
      {
        face: ["Pout", "Pout", "Pr", "Pl"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [255, 128, 128],
          },
        ],
      },
      {
        face: ["Pin", "Pl", "Pout", "Pr"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [255, 128, 128],
          },
        ],
      },
      { // FRONT DORE
        face: ["PinD", "Wout", "Pin0", "Wout"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [255, 128, 128],
          },
        ],
      },

      {
        face: ["Pin", "Pin", "Pl", "Pr"],
        items: [
          {
            ...groupX,
            weight: 0,
            color: [255, 128, 128],
          },
        ],
      },

      /* --------------- */
      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            ...groupX,
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
            ...groupX,
            weight: 0,
            color: [255, 255, 255],
          }, /*
          {
            ...groupX,
            weight: 0,
            assets: wallLab.Corner_A,
          },*/
        ],
      },
      {
        face: ["Wr", "Win", "Wl", "Wout"],
        items: [
          {
            ...groupX,
            weight: 1,
            color: [255, 255, 255],
          },
        ],
      },

      {
        face: ["Win2", "Win2", "Wl2", "Wr2"],
        items: [
          {
            ...groupX,
            weight: 3,
            color: [255, 255, 255],
          },
        ],
      },

      {
        face: ["Wr", "Win", "Wl", "WoutD"],
        items: [
          {
            ...groupX,
            weight: 6,
            color: [255, 255, 255],
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
            ...groupX,
            weight: 0,
            color: [255, 255, 255],
          },
        ],
      },
    ];
  }
}
