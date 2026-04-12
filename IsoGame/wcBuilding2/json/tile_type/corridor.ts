/*
═══════════════════════════════════════════════════════════════
  CorridorSingle : ['out'  , 'out'   , 'out' , 'out'  ]
  CorridorEnd    : ['eq'   , 'out'  , 'out'  , 'out'  ]
  CorridorDoor   : ['eq'   , 'out'  , 'outD' , 'out'  ]
  CorridorPath   : ['eq'   , 'out'  , 'eq'   , 'out'  ]
  CorridorCorner : ['out'  , 'out'  , 'eq'   , 'eq'   ]
  CorridorTJoin  : ['eq'   , 'eq'   , 'eq'   , 'out'  ]

╔═════════╦═════════╦═════════╦═════════╦═════════╦═════════╗
║  ▛ ▀ ▜  ║  ▌ ░ ▐  ║  ▛ ░ ▜  ║  ▌ ░ ▐  ║  ▌ ░ ▝  ║  ▌ ░ ▝  ║                      
║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ░  ║  ▌ ░ ░  ║                      
║  ▙ ▄ ▟  ║  ▙ ▄ ▟  ║  ▙ D ▟  ║  ▌ ░ ▐  ║  ▙ ▄ ▄  ║  ▌ ░ ▗  ║                      
╚═════════╩═════════╩═════════╩═════════╩═════════╩═════════╝
*/

export const conf = {
    "CorridorSingle": {
        label: "CorridorSingle",
        face: ['out'  , 'out'   , 'out' , 'out'  ],
    },
    "CorridorEnd": {
        label: "CorridorEnd",
        face: ['eq'   , 'out'  , 'out'  , 'out'  ],
    },
    "CorridorDoor": {
        label: "CorridorDoor",
        face: ['eq'   , 'out'  , 'outD' , 'out'  ],
    },
    "CorridorPath": {
        label: "CorridorPath",
        face: ['eq'   , 'out'  , 'eq'   , 'out'  ],
    },
    "CorridorCorner": {
        label: "CorridorCorner",
        face: ['out'  , 'out'  , 'eq'   , 'eq'   ],
    },
    "CorridorTJoin": {
        label: "CorridorTJoin",
        face: ['out'  , 'out'   , 'out' , 'out'  ],
    },

}

 