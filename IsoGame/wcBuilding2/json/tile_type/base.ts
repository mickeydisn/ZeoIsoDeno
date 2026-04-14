import { assetLayerCorridor } from "./corridor.ts";
import { assetLayerFence } from "./fences.ts";
import { assetLayerHouse } from "./house.ts";



export const assetLayerIn = {
    "In": {
        label: "HouseIn",
        face: ['eq'   , 'eq'    , 'eq' , 'eq'    ],
    },
}

export const assetLayerOut = {
    "Out": {
        label: "CorridorSingle",
        face: ['out'  , 'out'   , 'out' , 'out'  ],
    },
}

export const assetLayerCornner = {
    "Cornner": {
        label: "Cornner",
        face: ['out'  , 'out'  , 'eq'   , 'eq'   ],
    },
}

export const assetLayerCornerInner = {
    "CornerInner": {
        label: "CornerInner",
        face: ['eq'   , 'eq'   , 'l'    , 'r'    ],
    },
}

export const assetLayerWall = {
    "Wall": {
        label: "Wall",
        face: ['eq'   , 'l'    , 'out'  , 'r'    ],
    },
}

export const assetLayerWallD = {
    "WallDoor": {
        label: "WallDoor",
        face: ['eq'   , 'l'    , 'outD'  , 'r'    ],
    },
}

export const assetLayerPath = {
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
}

// ------------------


type AssetLayerKeyConfigType = {
    weitgh: number;
    assets?: string[];
};


export type AssetLayerFenceConfigType = {
    [K in keyof typeof assetLayerFence]?: AssetLayerKeyConfigType;
};


export type AssetLayerCorridorConfigType = {
    [K in keyof typeof assetLayerCorridor]?: AssetLayerKeyConfigType;
};


export type AssetLayerHouseConfigType = {
    [K in keyof typeof assetLayerHouse]?: AssetLayerKeyConfigType;
};

