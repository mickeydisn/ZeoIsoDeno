/*
═══════════════════════════════════════════════════════════════
  FenceSingle         : ['out'  , 'out'   , 'out' , 'out'  ]
  FenceCorner         : ['out'  , 'out'  , 'r'    , 'l'    ]
  FenceCornerInner    : ['in'   , 'in'   , 'l'    , 'r'    ]
  FenceWall           : ['in'   , 'l'    , 'out'  , 'r'    ]
  FenceWallDoor       : ['in'   , 'l'    , 'outD' , 'r'    ]

╔═════════╦═════════╦═════════╦═════════╦═════════╗
║  ▛ ▀ ▜  ║  ▌ R ▒  ║  ▒ L ▙  ║  ▒ ▒ ▒  ║  ▒ ▒ ▒  ║
║  ▌ ░ ▐  ║  ▌ ░ L  ║  ▒ ░ R  ║  R ░ L  ║  R ░ L  ║
║  ▙ ▄ ▟  ║  ▙ ▄ ▄  ║  ▒ ▒ ▒  ║  ▄ ▄ ▄  ║  ▄ D ▄  ║
╚═════════╩═════════╩═════════╩═════════╩═════════╝
*/

export const assetLayerFence = {
    "FenceSingle": {
        label: "FenceSingle",
        face: ['out'  , 'out'   , 'out' , 'out'  ],
    },
    "FenceCorner": {
        label: "FenceCorner",
        face: ['out'  , 'out'  , 'r'    , 'l'    ],
    },
    "FenceCornerInner": {
        label: "FenceCornerInner",
        face: ['in'   , 'in'   , 'l'    , 'r'    ],
    },
    "FenceWall": {
        label: "FenceWall",
        face: ['in'   , 'l'    , 'out'  , 'r'    ],
    },
    "FenceWallDoor": {
        label: "FenceWallDoor",
        face: ['in'   , 'l'    , 'outD' , 'r'    ],
    },
}

