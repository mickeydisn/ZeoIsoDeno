/*
═══════════════════════════════════════════════════════════════
  CorridorSingle     : ['out'  , 'out'   , 'out' , 'out'  ]
  CorridorEnd        : ['eq'   , 'out'  , 'out'  , 'out'  ]
  CorridorDoor       : ['eq'   , 'out'  , 'outD' , 'out'  ]
  CorridorPath       : ['eq'   , 'out'  , 'eq'   , 'out'  ]
  CorridorCorner     : ['out'  , 'out'  , 'eq'   , 'eq'   ]
  CorridorTJoin      : ['eq'   , 'eq'   , 'eq'   , 'out'  ]
  CorridorCrossJoin  : ['eq'   , 'eq'   , 'eq'   , 'eq'   ]

╔═════════╦═════════╦═════════╦═════════╦═════════╦═════════╦═════════╗
║  ▛ ▀ ▜  ║  ▌ ░ ▐  ║  ▛ ░ ▜  ║  ▌ ░ ▐  ║  ▌ ░ ▝  ║  ▌ ░ ▝  ║  ▘ ░ ▝  ║                      
║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ▐  ║  ▌ ░ ░  ║  ▌ ░ ░  ║  ░ ░ ░  ║                      
║  ▙ ▄ ▟  ║  ▙ ▄ ▟  ║  ▙ D ▟  ║  ▌ ░ ▐  ║  ▙ ▄ ▄  ║  ▌ ░ ▗  ║  ▖ ░ ▗  ║                      
╚═════════╩═════════╩═════════╩═════════╩═════════╩═════════╩═════════╝
*/

export const assetLayerCorridor = {
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
        face: ['eq'  , 'eq'   , 'eq' , 'out'  ],
    },
    "CorridorCrossJoin": {
        label: "CorridorCrossJoin",
        face: ['eq'  , 'eq'   , 'eq' , 'eq'  ],
    },

}

 


const jo = {
    "CorridorDoor": [
        { label: "Door",
            face: ["in", "out", "outD", "out"],
            assets: [
            { h: 0, key: "platform_center", keyR: 0},
            { h: 0, key: "corridor_end", keyR: 2 },
            ],
        },
    ] ,  
    "CorridorPath" : [
        { label : "Flat",
            face: ["in", "out", "in", "out"],
            assets: [
                { h: 0, key: "corridor_", keyR: 0, },
            ],
        }, { label : "Flat_Detail",
            face: ["in", "out", "in", "out"],
            assets: [
            { h: 0, key: "corridor_detailed", keyR: 0, },
            ],   
        }, { label : "Flat_Window",
            face: ["in", "out", "in", "out"],
            assets: [
            {  h: 0, key: "corridor_window", keyR: 0 },
            ],
        }, 
    ] ,  
    "CorridorCorner" : [
        { label : "Flat_Detail",
            face: ["in", "in", "out", "out"],
            assets: [
                { h: 0, key: "corridor_corner", keyR: 3 },
            ],
        }, { label : "Corner_Round",
            face: ["in", "in", "out", "out"],
            assets: [
            { h: 0, key:  "platform_center", keyR: 0 },
            { h: 0, key: "corridor_cornerRound", keyR: 3 },
            ],
        },  
    ] ,    
    "CorridorTJoin" :  [
        { label : "TJoin",
        face: ["in", "in", "in", "out"],
        assets: [
        { h: 0, key: "corridor_split", keyR: 0 },
        ],

        },
    ],     
    "CorridorCrossJoin" : [
        {
            face: ["in", "in", "in", "in"],
            assets: [
            { h: 0, key: "corridor_cross", keyR: 0 },
            ],
        },   
    ] ,      
};
