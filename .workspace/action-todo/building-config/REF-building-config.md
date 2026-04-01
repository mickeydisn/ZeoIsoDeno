# Building Configuration Reference

## Overview

The building configuration system in `IsoGame/wcBuilding2/` uses a TypeScript-based class hierarchy to define how buildings are procedurally generated on a tile grid. Each building is defined by a configuration class that extends `WcAbstractBuildConf`.

## Core Types

### WcFace
A 4-element tuple representing the connections on each side of a tile: `[northWest, northEast, southEast, southWest]`. Each element is a string key (e.g., `"F_out"`, `"WH_in"`, `null`).

```typescript
type WcFace = [WcKeyFace, WcKeyFace, WcKeyFace, WcKeyFace];
type WcKeyFace = string | null;
```

### WcConfTile
The main tile configuration interface:
```typescript
interface WcConfTile {
  face: WcFace;                    // The 4-side face configuration
  weight: number;                  // Random selection weight
  assets?: WcConfTileAsset[];      // Visual assets to render
  functions?: WcConfTileFunction[];// Post-processing functions
  color?: [number, number, number];// RGB color
  colorT?: [number, number, number];
  allowMove?: boolean;             // Can be moved during generation
  isFrise?: boolean;               // Is a frieze/border tile
  empty?: boolean;                 // Is an empty/interior tile
  key?: string;                    // Asset key
  keyR?: number;                   // Asset rotation
  sufix?: string;                  // Asset suffix (e.g., color filter)
  h?: number;                      // Height level
  lvl?: number;                    // Map level
  t?: string;
}
```

### WcConfTileAsset
Visual asset definition:
```typescript
interface WcConfTileAsset {
  key?: string;           // Asset name in loader
  keyR?: number;          // Rotation (0-3)
  sufix?: string;         // Color/filter suffix (e.g., "#H200_S20_C135_B105")
  h?: number;             // Height offset
  off?: { x: number; y: number }; // Position offset
}
```

### WcConfTileFunction
Post-processing function:
```typescript
interface WcConfTileFunction {
  key?: string;
  keyR?: number;
  sufix?: string;
  size?: number;
  off?: { x: number; y: number };
}
```

### WcConfRawGroup
Group of tiles with shared face:
```typescript
interface WcConfRawGroup {
  face: WcFace;
  items: WcConfRawTile[];
  weight?: number;
}
```

## Configuration Class Structure

### WcAbstractBuildConf (Base Class)

```typescript
class WcAbstractBuildConf {
  growLoopCount: number;        // Max growth iterations
  endLoopMax: number;           // Max close/fill iterations
  
  faceLinkWeight: Record<string, number>;  // Face key weights
  faceLinks: [string, string][];           // Valid face connections
  
  listTileOptions: WcConfTile[];           // All tile options
  indexTileOptions_KeyFaceKey: Record<WcKeyTileFace, WcConfTile[]>; // Indexed by face key
  listFaceKey: WcFace[];                   // All valid face keys
  
  startTileOptions: WcConfTile[];          // Starting tile options
  mainLvl?: number;                        // Map level
}
```

**Key Methods:**
- `preInit()`: Called in constructor, subclasses override to set up config
- `init()`: Processes raw tile configs into final tile options
- `TILE_START_OPTIONS`: Returns valid starting tiles
- `TILE_START`: Returns random weighted starting tile
- `linkedFaceKey(face)`: Returns faces that can connect to given face

**Override Properties:**
- `__TILE_START_RAW`: Raw starting tiles (simple format)
- `__TILE_LIST_RAW`: Raw tile list (simple format)
- `__TILE_START`: Grouped starting tiles (group format)
- `__TILE_LIST`: Grouped tile list (group format)

## Asset Collection Classes

Asset collections are helper classes that generate tile configurations for specific building elements (walls, fences, corridors, etc.).

### Pattern: Asset Class Structure

```typescript
class WcAsset_SomeName {
  tag: string;                    // Prefix for face keys (e.g., "WH_")
  WALL_SUFFIX: string;           // Color suffix
  ROOF_SUFFIX: string;           // Color suffix
  
  // Face link weights
  faceLinkWeight(fout, fside, fin): Record<string, number>
  
  // Face connections
  getFaceLinks(links: {...}): [string, string][]
  
  // Tile configurations
  get SomeTile(): WcConfTile { ... }
  get AnotherTile(): WcConfTile { ... }
  
  // Generate tile group
  groupAsset(conf): WcConfTile[]
}
```

### Example: WcAsset_WallHouse

Generates wall/roof tile configurations:
- `Corner`: Corner tile with roof + wall corner
- `Corner_B`: Corner with round roof + diagonal wall
- `Wall_Door`: Wall segment with door
- `Wall`: Plain wall segment
- `Wall_RoofWindows`: Wall with window
- `Wall_Windows`: Wall with roof window + window
- `InnerCorner`: Inner corner (roof only)
- `InnerCorner_X`: Extended inner corner
- `Inside_Full`: Full interior tile

### Example: WcAsset_Fence2 (Base Fence Class)

Generates fence configurations with different collapse types:
- `FenceCollapseType.Simple`: Basic fence
- `FenceCollapseType.NoSquare`: Fence with extended corners
- `FenceCollapseType.Exclude`: Fence with exclude variants

Subclasses override `assetKey` to specify different fence visuals:
- `WcAsset_FenceSimple`: Simple fence
- `WcAsset_FencePlatform`: Platform fence
- `WcAsset_FenceGrave`: Grave fence
- `WcAsset_FenceEnter`: Entrance fence
- etc.

## Building Configuration Examples

### WcBuildConf_HouseA

A house building with:
- **Enter**: Entrance tiles (E_ prefix)
- **Fence**: Simple fence border (F_ prefix)
- **FencePlatform**: Platform around house (FP_ prefix)
- **WallHouse**: House walls (WH_ prefix)
- **X**: External/boundary tiles (X)

**Face Link Weights**: Control probability of each face type appearing

**Face Links**: Define valid connections:
```
X connects to F_out
F_in connects to FP_out
FP_in connects to WH_out
WH_l connects to WH_r (walls wrap around)
etc.
```

### WcBuildConf_GraveA

A graveyard building with:
- **EnterSimple**: Simple entrance
- **FenceGrave**: Grave fence border
- **FGraveIn**: Inner grave area
- **FGraveBone**: Bone decorations
- **FGraveAltar**: Altar tiles

### WcBuildConf_LabBorderA

A lab building with:
- **Fence**: Simple border fence
- **FencePlatform**: Platform
- **CorridorLab**: Lab corridor tiles (flat, corner, T-join, cross, etc.)

## Configuration Properties Reference

### Face Link Weights
Control the probability of each face type being selected:
```typescript
faceLinkWeight = {
  "WH_out": 1,      // Low weight = rare
  "WH_in": 30,      // High weight = common
  "WH_r": 25,
  "WH_l": 25,
}
```

### Face Links
Define which faces can connect to each other:
```typescript
faceLinks = [
  ["WH_l", "WH_r"],           // Left connects to right
  ["WH_in", "WH_in"],         // Interior connects to interior
  ["FP_in", "WH_out"],        // Platform interior connects to wall exterior
]
```

### Tile Properties
Each tile configuration includes:
- `face`: The 4-side face pattern
- `weight`: Selection probability (0 = forced, higher = more likely)
- `assets`: Visual assets to render
- `allowMove`: Can be repositioned during generation
- `isFrise`: Is a border/frieze tile
- `empty`: Is an empty/interior tile
- `color`: RGB color for minimap/debug
- `functions`: Post-processing functions (e.g., terrain smoothing)

### Asset Suffix Format
Color/filter suffix format: `#H{hue}_S{saturation}_C{contrast}_B{brightness}`
Example: `#H200_S20_C135_B105`

## Generation Flow

1. **Configuration Creation**: `new WcBuildConf_HouseA({ growLoopCount: 50 })`
2. **Initialization**: `conf.init()` processes raw tiles into indexed options
3. **Start Tile**: `conf.TILE_START` picks random weighted start tile
4. **Growth Loop**: Iteratively expand building by matching face connections
5. **Close Loop**: Fill remaining gaps with close matches
6. **Result**: Grid of `WcBuildTile` objects with assigned face configs

## JSON Serialization Requirements

To support JSON storage, the configuration needs to capture:

### Per Building Config:
```json
{
  "name": "HouseA",
  "growLoopCount": 10,
  "endLoopMax": 2000,
  "faceLinkWeight": { "WH_out": 1, "WH_in": 30 },
  "faceLinks": [["WH_l", "WH_r"], ["FP_in", "WH_out"]],
  "startTiles": [...],
  "tiles": [...]
}
```

### Per Tile:
```json
{
  "face": ["WH_r", "WH_in", "WH_l", "WH_out"],
  "weight": 30,
  "assets": [
    { "key": "roof", "keyR": 3, "sufix": "#H200_S20", "h": 1 },
    { "key": "wall", "keyR": 1, "sufix": "#H200_S20", "h": 0 }
  ],
  "allowMove": true,
  "isFrise": true,
  "color": [196, 196, 196],
  "functions": [{ "func": "lvlAvgSquare", "size": 5 }]
}
```

### Per Asset Collection:
```json
{
  "name": "WallHouse",
  "tag": "WH_",
  "wallSuffix": "#H210_C115_S35_B120",
  "roofSuffix": "#H0_S1_C128_B64",
  "tiles": [...]
}