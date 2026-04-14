/*
  HouseSingle         : ['out'  , 'out'   , 'out' , 'out'  ]
  HouseCorner         : ['out'  , 'out'  , 'r'    , 'l'    ]
  HouseCornerInner    : ['eq'   , 'eq'   , 'l'    , 'r'    ]
  HouseWall           : ['eq'   , 'l'    , 'out'  , 'r'    ]
  HouseWallDoor       : ['eq'   , 'l'    , 'outD' , 'r'    ]
  HouseIn             : ['eq'   , 'eq'    , 'eq' , 'eq'    ]

╔═════════╦═════════╦═════════╦═════════╦═════════╦═════════╗
║  ▛ ▀ ▜  ║  ▌ R ░  ║  ░ L ▙  ║  ░ ░ ░  ║  ░ ░ ░  ║  ░ ░ ░  ║
║  ▌ ░ ▐  ║  ▌ ░ L  ║  ░ ░ R  ║  R ░ L  ║  R ░ L  ║  ░ ░ ░  ║
║  ▙ ▄ ▟  ║  ▙ ▄ ▄  ║  ░ ░ ░  ║  ▄ ▄ ▄  ║  ▄ D ▄  ║  ░ ░ ░  ║
╚═════════╩═════════╩═════════╩═════════╩═════════╩═════════╝

*/
 

export const assetLayerHouse = {
    "HouseSingle": {
        label: "HouseSingle",
        face: ['out'  , 'out'   , 'out' , 'out'  ],
    },
    "HouseCorner": {
        label: "HouseCorner",
        face: ['out'  , 'out'  , 'r'    , 'l'    ],
    },
    "HouseCornerInner": {
        label: "HouseCornerInner",
        face: ['eq'   , 'eq'   , 'l'    , 'r'    ],
    },
    "HouseWall": {
        label: "HouseWall",
        face: ['eq'   , 'l'    , 'out'  , 'r'    ],
    },
    "HouseWallDoor": {
        label: "HouseWallDoor",
        face: ['eq'   , 'l'    , 'outD' , 'r'    ],
    },
    "HouseIn": {
        label: "HouseIn",
        face: ['eq'   , 'eq'    , 'eq' , 'eq'    ],
    },
}


