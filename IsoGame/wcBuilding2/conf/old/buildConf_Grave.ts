import { AbstractWcBuildConf, WcConfRawGroup } from "../../AbstractBuildConf.ts";

export class WcBuildConf_Grave1 extends AbstractWcBuildConf {
  // this.ROOF_PREFIX = "roofHigh"
  ROOF_PREFIX = "roof";
  // this.WALL_PREFIX = "wWllWood"
  WALL_PREFIX = "wall";

  FENCE_SUFFIX = "#H40_C125_S40_B70";
  ROOF_SUFFIX = "#H0_S100_C100_B100"; // '#H190_S75_C75_B125'
  // this.WALL_SUFFIX = '#H0_S100_C100_B100' // '#H200_S20_C135_B105'
  WALL_SUFFIX = "#H0_S120_C70_B115";

  constructor(conf = {}) {
    super(conf);

    this.faceLinkWeight = {
      "X": 1,

      /**/
      "Bo": 0,
      "Bi": 1,
      "SBi": 1,

      "Bl": 2,
      "Br": 2,

      "0": 0,
      /**/
      "SCi": 4,
      "S0": 4,
      // --
      "CiG": 4,

      /**/

      "Co": 1,
      "Ci": 4,
      "Cr": 6,
      "Cl": 6,

      "Wo": 7,
      "WoD": 7,
      "SWoD": 8,

      "Wi": 8,
      "WiD": 8,

      "Wr": 10,
      "Wl": 10,

      "A": 10,
    };

    this.faceLinks = [
      ["X", "X"],

      ["Xl", "Xr"],
      /* -----------* /
            ['X', 'Ci'],
            ['Ci', 'X'],
            /**/

      /**/
      ["SBo", "SBi"],
      ["SBi", "SBo"],

      ["S0", "SCi"],
      ["SCi", "S0"],
      /**/

      /* -----------*/
      ["Bo", "Bi"],

      ["Bl", "Br"],

      ["SBl", "SBr"],

      /**/
      ["0G", "CiG"],
      /**/
      ["0", "Ci"],

      ["Cl", "Cr"],

      ["Clc", "Cr"],
      ["Cl", "Crc"],

      ["Wo", "Wi"],

      ["Wo", "WiD"],

      ["SWoD", "WiD"],

      ["Wl", "Wr"],

      ["A", "A"],
    ];
  }

  override get __TILE_START(): WcConfRawGroup[] {
    return [{
      face: ["SBo", "Xl", "X", "Xr"],
      items: [
        {
          weight: 0,
          color: [32, 32, 32],
          allowMove: true,
          isFrise: true,
          functions: [],
          assets: [
            // {h:0, key: "ironFenceBorder", keyR:2, sufix:this.FENCE_SUFFIX },
          ],
        },
      ],
      // ironFenceBorder_NW#_
    }];
    /*
        face: ['SWoD', 'Cl', 'Ci', 'Cr'],
        items: [
            { weight:0, color: [128, 128, 128],  allowMove:true, isFrise: true, functions: [], items:[
                // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
                {h:0, key: "platform_side", keyR:0, sufix:this.WALL_SUFFIX },
            ]},
        ]
        */
  }
  override get __TILE_LIST(): WcConfRawGroup[] {
    const actionsEmptyFlat = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
      // {func:"setFrise", isFrise:true},
      // this.tile.isFrise = true
    ];
    const actionsEmpty = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
    ];
    const actionsColor = [
      { func: "lvlAvgSquare", size: 5 },
      { func: "lvlAvgSquare", size: 7 },
      { func: "colorSquare", size: 5, color: [128, 128, 128] },
    ];

    return [
      // * --------------------------------------------------

      // X - null
      {
        face: [null, null, null, null],
        items: [
          {
            weight: 0,
            colorT: [0, 10, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },
      {
        face: ["X", null, null, null],
        items: [
          {
            weight: 0,
            colorT: [0, 20, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },
      {
        face: ["X", "X", null, null],
        items: [
          {
            weight: 0,
            colorT: [0, 30, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },
      {
        face: ["X", null, "X", null],
        items: [
          {
            weight: 0,
            colorT: [0, 30, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },
      {
        face: ["X", "X", "X", null],
        items: [
          {
            weight: 0,
            colorT: [0, 40, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },
      // == X ===
      {
        face: ["X", "X", "X", "X"],
        items: [
          {
            weight: 0,
            colorT: [0, 50, 0],
            allowMove: true,
            functions: [...actionsEmpty],
          },
        ],
      },

      // * --------------------------------------------------
      // * --------------------------------------------------
      // * --------------------------------------------------

      /// O - Bi
      {
        face: ["Xr", "Xl", "X", "X"],
        items: [
          {
            weight: 0,
            color: [92, 92, 92],
            allowMove: true,
            isFrise: true,
            functions: [...actionsColor],
          },
        ],
      },
      {
        face: ["Bo", "Xl", "X", "Xr"],
        items: [
          {
            weight: 0,
            color: [92, 92, 92],
            allowMove: false,
            isFrise: true,
            functions: [...actionsColor],
            assets: [
              {
                h: 0,
                key: "ironFenceBorder",
                keyR: 2,
                sufix: this.FENCE_SUFFIX,
              },
            ],
          },
        ],
        // ironFenceBorder_NW#_
      },
      {
        face: ["Bo", "Bo", "Xl", "Xr"],
        items: [
          {
            weight: 0,
            color: [92, 92, 92],
            allowMove: false,
            isFrise: true,
            functions: [...actionsColor],
            assets: [
              {
                h: 0,
                key: "ironFenceBorderCurve",
                keyR: 1,
                sufix: this.FENCE_SUFFIX,
              },
            ],
          },
        ],
      },

      /// O - Bi
      {
        face: ["0", "Bi", "Bi", "Bi"],
        items: [
          {
            weight: .1,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [],
          },
        ],
      },
      {
        face: ["Br", "Bl", "Bi", "Bi"],
        items: [
          {
            weight: .05,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [
              {
                h: 0,
                key: "pillarSquare",
                keyR: 0,
                sufix: "#H180_C120_S35_B80",
              },
            ],
          },
          {
            weight: .05,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [
              {
                h: 0,
                key: "pillarSquare",
                keyR: 0,
                sufix: "#H180_C120_S35_B80",
              },
            ],
          },
          // { weight:0, colorT: [255, 255, 255], key: "platform_cornerOpen", keyR:3,  allowMove:true},
        ],
      },
      {
        face: ["Br", "0", "Bl", "Bi"],
        items: [
          {
            weight: .1,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [],
          },
          // { weight:0, colorT: [255, 255, 255], key: "platform_side", keyR:3,  allowMove:true},
        ],
      },
      {
        face: ["0", "0", "Bl", "Br"],
        items: [
          {
            weight: .1,
            color: [104, 104, 104],
            allowMove: false,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [
              { h: 0, key: "bones", keyR: 0, sufix: "#H180_C120_S35_B80" },
            ],
          },
          // { weight:0, colorT: [255, 255, 255], key: "platform_cornerDot", keyR:1,  allowMove:true},
        ],
      },

      // * --------------------------------------------------
      // * --------------------------------------------------
      // * --------------------------------------------------
      // * --------------------------------------------------

      // == 0 ===
      {
        face: ["0", "0", "0", "0"],
        items: [
          {
            weight: .1,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [],
          },
        ],
      },

      /* ----------------------------------------------- */
      // Grave Alternative
      {
        face: ["Br", "0G", "Bl", "Bi"],
        items: [
          {
            weight: 0,
            color: [104, 104, 104],
            allowMove: false,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [
              { h: 0, key: "altarWood", keyR: 0, sufix: "#H180_C120_S35_B80" },
            ],
          },
        ],
      },
      {
        face: ["Wo", "Cl", "CiG", "Cr"],
        items: [
          {
            weight: 0,
            color: [128, 128, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              {
                h: 0,
                key: "gravestoneRound",
                keyR: 0,
                sufix: "#H180_C120_S35_B80",
              },
            ],
          },
        ],
      },

      /* ----------------------------------------------- */

      /// W - C
      {
        face: ["Ci", "Ci", "Crc", "Clc"],
        items: [
          {
            weight: 0,
            color: [128, 128, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_cornerOpen", keyR:1, sufix:this.WALL_SUFFIX },
            ],
          },
        ],
      },
      {
        face: ["Wo", "Cl", "Ci", "Cr"],
        items: [
          {
            weight: .25,
            color: [128, 128, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_side", keyR:0, sufix:this.WALL_SUFFIX },
            ],
          },
          {
            weight: .15,
            color: [128, 128, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
        ],
      },
      {
        face: ["Wo", "Wo", "Cl", "Cr"],
        items: [
          {
            weight: .2,
            color: [128, 128, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_cornerDot", keyR:1, sufix:this.WALL_SUFFIX },
            ],
          },
        ],
      },

      /// A - Wi
      {
        face: ["A", "Wi", "WiD", "Wi"],
        items: [
          {
            weight: 0,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:0, key: "corridor_end", keyR:2, sufix:this.WALL_SUFFIX },
            ],
          },
        ],
      },
      {
        face: ["A", "Wi", "A", "Wi"],
        items: [
          {
            weight: 25,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:0, key: "corridor_", keyR:0, sufix:this.WALL_SUFFIX },
            ],
          },
          {
            weight: 25,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
        ],
      },
      {
        face: ["A", "A", "Wi", "Wi"],
        items: [
          {
            weight: 5,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:0, key: "corridor_corner", keyR:3, sufix:this.WALL_SUFFIX },
            ],
          },
          {
            weight: 5,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
        ],
      },
      {
        face: ["A", "A", "A", "Wi"],
        items: [
          {
            weight: 15,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:0, key: "corridor_split", keyR:0, sufix:this.WALL_SUFFIX },
            ],
          },
          {
            weight: 25,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
        ],
      },
      /// A
      {
        face: ["A", "A", "A", "A"],
        items: [
          {
            weight: 5,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:0, key: "corridor_cross", keyR:0, sufix:this.WALL_SUFFIX },
            ],
          },
          {
            weight: 5,
            color: [104, 104, 104],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
        ],
      },

      // * --------------------------------------------------
      // * --------------------------------------------------
      // * --------------------------------------------------
      // * --------------------------------------------------

      // * --------------------------------------------------
      // S Connections
      {
        face: ["Br", "S0", "Bl", "SBi"],
        items: [
          {
            weight: 0,
            color: [32, 32, 32],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmpty],
            assets: [
              // {h:0, key: "altarWood", keyR:0, sufix:"#H180_C120_S35_B80"},
            ],
          },
        ],
      },

      {
        face: ["Wo", "Cl", "SCi", "Cr"],
        items: [
          {
            weight: .3,
            color: [32, 32, 32],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_side", keyR:0, sufix:this.WALL_SUFFIX },
              { h: 0, key: "debris", keyR: 0, sufix: "#H350_C105_S50_B85" },
            ],
          },
          // { weight:.05, color: [128, 128, 128],  allowMove:true, isFrise: true, functions: [...actionsEmptyFlat], items:[
          // ]},
        ],
      },

      {
        face: ["Ci", "SCi", "Crc", "Clc"],
        items: [
          {
            weight: .01,
            color: [32, 32, 128],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_cornerOpen", keyR:1, sufix:this.WALL_SUFFIX },
            ],
          },
        ],
      },
      {
        face: ["SCi", "Ci", "Crc", "Clc"],
        items: [
          {
            weight: .01,
            color: [32, 128, 32],
            allowMove: true,
            isFrise: true,
            functions: [...actionsEmptyFlat],
            assets: [
              // {h:1, key: "Corner", keyR:3, sufix:this.ROOF_SUFFIX },
              // {h:0, key: "platform_cornerOpen", keyR:1, sufix:this.WALL_SUFFIX },
            ],
          },
        ],
      },
    ];
  }
}
