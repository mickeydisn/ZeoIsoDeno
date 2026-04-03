import {
  WcConfRawGroup,
  WcConfRawTile,
  WcConfTile,
  WcConfTileAsset,
  WcConfTileFunction,
} from "./wcAbstractBuildConf.ts";
import { WcFace } from "./wcBuildFace.ts";

// ---------------------------------------------
// ---------------------------------------------

export const confsGroup_to_confsTile = (
  confs: WcConfRawGroup[],
): WcConfTile[] => {
  const flatConfs = confs.map((conf) =>
    conf.items.map((i) => ({ ...i, face: conf.face } as WcConfTile))
  ).flat();
  return flatConfs.map((conf) => confRawTile_to_confsTile(conf)).flat();
};

export const confsRawTile_to_confsTile = (
  confs: WcConfTile[],
): WcConfTile[] => {
  return confs.flatMap((conf) => confRawTile_to_confsTile(conf));
};
// ---------------------------------------------

const confRawTile_to_confsTile = (conf: WcConfTile): WcConfTile[] => {
  const DIRECTIONS = ["_NW", "_NE", "_SE", "_SW"];

  // Implement shifting internally to remove dependency
  const shiftArrayByOne = <T>(arr: T[]): T[] => {
    if (arr.length <= 1) return [...arr];
    return [arr[arr.length - 1], ...arr.slice(0, arr.length - 1)];
  };

  // Handle appending direction key to an object
  const appendDirectionKey = (
    obj: WcConfTileFunction,
    axeIndex: number,
  ): void => {
    if (!obj.key) return;

    const rotation = obj.keyR || 0;
    const dirIndex = (axeIndex + 4 - rotation) % 4;
    const suffix = obj.sufix || "";
    obj.key = obj.key + DIRECTIONS[dirIndex] + suffix;

    if (obj.off) {
      console.log("---------------------------------------------- CONF OG ");
      obj.off = {
        x: dirIndex < 2 ? obj.off.x : -obj.off.x,
        y: dirIndex == 0 || dirIndex == 3 ? obj.off.y : -obj.off.y,
      };
    }
  };

  // Process a collection of items
  const processCollection = (
    collection: WcConfTileAsset[] | undefined,
    axeIndex: number,
  ): WcConfTileFunction[] | undefined => {
    if (!collection) return undefined;

    return collection.map((item) => {
      const itemCopy = { ...item };
      appendDirectionKey(itemCopy, axeIndex);
      return itemCopy;
    });
  };

  // Generate rotated versions
  let currentFace = [...conf.face];

  return [0, 1, 2, 3].map((axeIndex) => {
     // Create a copy of the configuration
    const result: WcConfTile = { ...conf } as WcConfTile;

     // Apply direction tag to main key
    appendDirectionKey(result, axeIndex);

     // Process functions and items collections
       result.functions = processCollection(result.functions, axeIndex);
    result.assets = processCollection(result.assets, axeIndex);

    // Set the current face rotation
    result.face = [...currentFace] as WcFace;

    // Rotate face for the next iteration
    currentFace = shiftArrayByOne(currentFace);

    return result;
  });
};

// ---------------------------------------------
// ---------------------------------------------

export function pickRandomWeightedObject(
  array: WcConfTile[],
  rand: number | null = null,
): WcConfTile | null {
  if (array.length === 0) return null;

  const mrand = rand !== null ? rand : Math.random();
   // Calculate the total weight of all objects in the array
  const totalWeight = array.reduce((acc, obj) => acc + (obj?.weight || .01), 0);

  // Generate a random number between 0 and the total weight
  const randomWeight = mrand * totalWeight;

  // Iterate through the objects and accumulate their weights until
  // the accumulated weight exceeds the randomWeight
  let accumulatedWeight = 0;
  for (const obj of array) {
    accumulatedWeight += obj?.weight || .01;
    if (accumulatedWeight >= randomWeight) {
      // Return the object when the accumulated weight exceeds the random weight
      return obj;
    }
  }

  // This should not happen, but if it does, return null or handle the case appropriately
  return null;
}

// ---------------------------------------------
// ---------------------------------------------


type TileGroupType = "Corner" | "Flat" | "InnerCorner";

const groupFaces: Record<TileGroupType, WcFace> = {
  "Corner": ["in", 'l', "out", "r"] as WcFace,
  "Flat": ["in", "in", "out", "out"] as WcFace,
  "InnerCorner": ["in", "out", "out", "r"] as WcFace,
  
};

export function getGroupFace(groupType: TileGroupType): WcFace {
  return groupFaces[groupType];
}


 /*

═══════════════════════════════════════════════════════════════
   COMPLETE TILE TYPE LIST
═══════════════════════════════════════════════════════════════


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

═══════════════════════════════════════════════════════════════
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


═══════════════════════════════════════════════════════════════
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
  COMPLETE EDGE TYPE LIST
═══════════════════════════════════════════════════════════════

  - eq: connected to another tile on the same layer
  - in: connected to another tile on inner layer
  - out: not connected to another tile on outer layer
  - outD: not connected to another tile on outer layer, but has a door asset (e.g. door frame)
  - l: connected to another tile on the same layer on the left face
  - r: connected to another tile on the same layer on the right face


═══════════════════════════════════════════════════════════════
  CONNECTION RULES
═══════════════════════════════════════════════════════════════

Same layer:
  layer.eq   ↔  layer.eq          inner connection continues
  layer.r    ↔  layer.l           wall face continues
  layer.in   ↔  layer.in          corridor continues

Inner layer:
  layer.in   ↔  layer.in          inner connection

Outer layer  (outer → inner only):
  LayerN.in  ↔  LayerN+1.out   
  LayerN.in  ↔  LayerN+1.outD   

───────────────────────────────────────────────────────────────  
  L0 <eq────eq> L0
  L0 <l──────r> L0
  L0 <in───out> L1 <in───out> L2 <in───out> L3 ... N 
───────────────────────────────────────────────────────────────  

═══════════════════════════════════════════════════════════════
  SUFFIX CONSTRAINTS  (_A _B …)
═══════════════════════════════════════════════════════════════
  
   Edges match if:
     - neither has a suffix, OR
     - both share the same suffix
  
   Suffixed ↔ bare is still allowed.
  
   Example — prevent two Corner tiles from touching:
     Corner.r_A  can only meet  Corner.l_A
     assign Corner_NW and Corner_NE different suffixes
     → they can never be placed adjacent





     
██████████████████████████████████████████████████████████████████
██████████████████████████████████████████████████████████████████

═══════════════════════════════════════════════════════════════
   COMPLETE TILE LIST
═══════════════════════════════════════════════════════════════
       
  ░	▒	▓ █ 
  ▛ ▜ ▟ ▙ ▀ ▐ ▄ ▌
  ▘ ▝ ▗ ▖ ▔ ▕ ▁ ▏
  ---------------------------------------------------
  ▁	▂	▃	▄	▅	▆	▇	█
  ---------------------------------------------------
  ░ ▒ ▓   : empty tile (░ lighter, ▓ darker)






---------------------------------------------------
FullOut        : ['out'  , 'out'   , 'out' , 'out'   ]
▛ ▀ ▜
▌ ░ ▐
▙ ▄ ▟
---------------------------------------------------
CorridorEnd    : ['in'   , 'out'  , 'out'  , 'out'  ]
▌ ░ ▐
▌ ░ ▐
▙ ▄ ▟
---------------------------------------------------
CorridorDoor   : ['in'   , 'out'  , 'outD' , 'out'  ]
▛ ░ ▜
▌ ░ ▐
▙ D ▟
---------------------------------------------------
CorridorPath   : ['in'   , 'out'  , 'in'   , 'out'  ]
▌ ░ ▐
▌ ░ ▐
▌ ░ ▐
---------------------------------------------------
CorridorCorner : ['in'   , 'in'   , 'out'  , 'out'  ]
▌ ░ ▝
▌ ░ ░
▙ ▄ ▄
---------------------------------------------------
CorridorTJoin  : ['in'   , 'in'   , 'in'   , 'out'  ]
▌ ░ ▝
▌ ░ ░
▌ ░ ▗
---------------------------------------------------
HouseCorner     : [ 'r'    , 'l'    ,'out'  , 'out' ]
▌ R ░
▌ ░ L
▙ ▄ ▄
---------------------------------------------------
HouseCornerInner    : ['in'   , 'in'   , 'l'    , 'r'    ]
░ L ▙
░ ░ R
░ ░ ░
---------------------------------------------------
HouseWall           : ['in'   , 'l'    , 'out'  , 'r'    ]
░ ░ ░
R ░ L
▄ ▄ ▄
---------------------------------------------------
HouseWallDoor       : ['in'   , 'l'    , 'outD' , 'r'    ]
░ ░ ░
R ░ L
▄ D ▄
---------------------------------------------------
FullIn         : ['in'   , 'in'    , 'in' , 'in'    ]
░ ░ ░
░ ░ ░
░ ░ ░




---------------------------------------------------
---------------------------------------------------
---------------------------------------------------
╔═════════╦═════════╦══════════╗
╠═════════╬═════════╬══════════╣
║  ░ ░ ░  ║  ▛ ▀ ▀  ║   ▀ ▀ ▀  ║
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▒ ▒ ▒  ║
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▒ ▒ ▒  ║
╠═════════╬═════════╬══════════╣
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▛ ▀ ▀  ║
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▌ ▓ ▓  ║
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▙ ▄ ▄  ║
╠═════════╬═════════╬══════════╣
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▒ ▒ ▒  ║
║  ░ ░ ░  ║  ▌ ▒ ▒  ║   ▒ ▒ ▒  ║
║  ░ ░ ░  ║  ▙ ▄ ▄  ║   ▄ ▄ ▄  ║
╠═════════╬═════════╬══════════╣
╚═════════╩═════════╩══════════╝


   */