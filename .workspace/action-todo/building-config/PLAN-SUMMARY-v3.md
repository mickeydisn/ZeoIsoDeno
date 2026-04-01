# Building Configuration Editor - Plan Summary v3

## Objective

Create a **standalone, isolated** web-based editor for building configurations that:
1. **Loads existing in-code configurations** (TypeScript classes) and converts them to editable JSON
2. **Saves/exports configurations** as JSON files
3. Provides a **user-friendly interface** organized around the actual data model: AssetCollection, Tile, Building
4. **Visualizes assets** using the existing asset loader system
5. **Isolates all new code** in dedicated directories — zero impact on existing game code

---

## Current State Analysis

### Existing System Architecture

#### Core Classes (Read-Only — No Modifications)

| File | Class | Purpose |
|------|-------|---------|
| `wcAbstractBuildConf.ts` | `WcAbstractBuildConf` | Base config class with tile generation logic, face linking |
| `wcBuildFactory.ts` | `WcBuildFactoryGenerator` | Building generation algorithm (init → grow → close) |
| `wcBuildTile.ts` | `WcBuildTile` | Individual tile with face constraint propagation |
| `wcBuildAction.ts` | `WcBuildActions` | Registry + handler for building actions |
| `wcBuildFace.ts` | Types: `WcFace`, `WcKeyFace` | Face types: `[NW, NE, SE, SW]` = 4 directions |
| `wcUtils.ts` | Utilities | `confsGroup_to_confsTile`, `confsRawTile_to_confsTile`, `pickRandomWeightedObject` |
| `conf/assetsCollection/wcUtils.ts` | Asset Utils | `applyGroup`, `tagFaces`, `actionsEmpty` |

#### Configuration Pattern (How Buildings Are Defined)

```
WcBuildConf_HouseA (Building Config)
  ├── constructor() 
  │   ├── Creates AssetCollection instances with specific tags/suffixes
  │   │   ├── WcAsset_WallHouse (tag="WH_")
  │   │   ├── WcAsset_FenceSimple (tag="F_")
  │   │   ├── WcAsset_FencePlatform (tag="FP_")
  │   │   └── WcAsset_Enter (tag="E_")
  │   │
  │   ├── Sets faceLinkWeight: { "WH_in": 30, "WH_out": 1, ... }
  │   └── Sets faceLinks: [["X", "F_out"], ["F_in", "FP_out"], ...]
  │
  ├── get __TILE_START_RAW() → WcConfTile[]
  │   └── Returns entrance tile configs from asset collection
  │
  └── get __TILE_LIST_RAW() → WcConfTile[]
      └── Returns all tile configs by calling AssetCollection.groupAsset()
```

#### Asset Collection Pattern (How Asset Groups Work)

```
WcAsset_WallHouse (Asset Collection)
  ├── tag: "WH_"           → Prefix for all face keys
  ├── WALL_SUFFIX: "#H..." → Color filter string for walls
  ├── ROOF_SUFFIX: "#H..." → Color filter string for roofs
  │
  ├── getters defining tile types:
  │   ├── Corner      → face: ["WH_r", "WH_l", "WH_out", "WH_out"]
  │   ├── Wall        → face: ["WH_r", "WH_in", "WH_l", "WH_out"]
  │   ├── Wall_Door   → face: ["WH_r", "WH_in", "WH_l", "WH_outD"]
  │   └── InnerCorner → face: ["WH_in", "WH_in", "WH_l", "WH_r"]
  │
  ├── assets[] → [{ key, keyR, sufix, h }]
  │   └── key: asset name in loader (e.g., "roof", "wallDoor")
  │   └── keyR: rotation index 0-3
  │   └── sufix: color filter (e.g., "#H210_C115_S35_B120")
  │   └── h: height level (0=wall, 1=roof, 2=top)
  │
  └── Methods (computed at runtime):
      ├── groupAsset(options) → WcConfTile[]  (flat, corner, inner tiles)
      ├── faceLinkWeight(flat, corner, inner) → Record<string, number>
      └── getFaceLinks({in, out, l, r, door}) → [string, string][]
```

#### Building Generation Algorithm (Key Steps)

```
1. INIT: Place start tile with config from __TILE_START_RAW
2. GROW LOOP (growLoopCount iterations):
   - Process forced tiles (only 1 possible face)
   - Process open tiles (multiple faces, pick highest score)
   - Propagate face constraints to neighbors
3. CLOSE LOOP (endLoopMax iterations):
   - Process forced tiles
   - Process close tiles (pick lowest weight face)
   - Propagate constraints
4. CLEAN: Remove unconfigured tiles
```

#### WcConfTile Structure (The Core Data Unit)

```typescript
interface WcConfTile {
  face: WcFace;                    // [NW, NE, SE, SW] — each is string|null
  weight: number;                  // Selection weight for random choice
  
  allowMove?: boolean;             // Allow terrain modification
  isFrise?: boolean;               // Is decorative (no collision)
  empty?: boolean;                 // Empty tile (no assets)
  
  assets?: WcConfTileAsset[];      // Visual assets for this tile
  functions?: WcConfTileFunction[]; // Functions to apply (e.g., lvlAvgSquare)
  
  colorT?: [number, number, number]; // Top color override
  color?: [number, number, number];  // Base color override
  h?: number;                      // Height override
  lvl?: number;                    // Level override
}

interface WcConfTileAsset {
  key?: string;      // Asset key in loader (e.g., "wallDoor")
  keyR?: number;     // Rotation 0-3
  sufix?: string;    // Color filter (e.g., "#H210_C115_S35_B120")
  h?: number;        // Height layer (0, 1, 2)
  off?: {x, y};      // Offset
}
```

---

## Solution Architecture

### Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Runtime extraction** | Instantiate TS config classes, call getters, serialize to JSON |
| **JSON-first storage** | Editor works with JSON; TS generation is optional output |
| **Mirror existing structure** | JSON schema directly maps to `WcConfTile`, `WcConfTileAsset` |
| **Dev-friendly functions** | Complex faceLinks/faceLinkWeight get special UI helpers |
| **Full isolation** | All new code in `IsoGame/wcBuilding2/editor/` |

### Directory Structure

```
IsoGame/wcBuilding2/
  editor/
    ├── types.ts                       # JSON schema interfaces
    ├── extractor.ts                   # Runtime: TS class → JSON
    ├── loader.ts                      # Runtime: JSON → WcAbstractBuildConf
    ├── generator.ts                   # Optional: JSON → TypeScript code
    │
    ├── server.ts                      # Deno HTTP endpoints for editor
    │
    ├── conf/                          # JSON config storage (created by editor)
    │   ├── asset-collections/         # WallHouse.json, FenceSimple.json, ...
    │   ├── buildings/                 # HouseA.json, GraveA.json, ...
    │   └── registry.json              # Index of all configs
    │
    └── web/
        ├── index.html                 # Editor entry point
        ├── css/
        │   └── editor.css
        └── js/
            ├── state.ts               # Centralized state
            │
            ├── api.ts                 # API client (fetch wrapper)
            │
            ├── panels/
            │   ├── library.ts         # Left sidebar: config list
            │   ├── building.ts        # Main: Building editor
            │   ├── assetCollection.ts # Main: Asset collection editor
            │   └── tile.ts            # Modal/Panel: Tile editor
            │
            ├── components/
            │   ├── faceEditor.ts      # 4-face input (NW, NE, SE, SW)
            │   ├── assetList.ts       # Add/remove/reorder assets
            │   ├── faceLinkTable.ts   # Face links editor (from→to pairs)
            │   ├── weightTable.ts     # Face link weights table
            │   ├── canvas2d.ts        # 2D tile preview
            │   └── colorPicker.ts     # Color suffix helper
            │
            └── services/
                ├── preview.ts         # Run building generation (server)
                └── assetPreview.ts    # Load asset images
```

---

## JSON Schema Design

### Asset Collection JSON

Directly mirrors what `WcAsset_WallHouse` produces at runtime:

```json
{
  "version": "1.0",
  "type": "assetCollection",
  "id": "WallHouse",
  "metadata": {
    "classRef": "WcAsset_WallHouse",
    "sourceFile": "wcAsset_WallHouse"
  },
  "tag": "WH_",
  "params": {
    "WALL_SUFFIX": "#H210_C115_S35_B120",
    "ROOF_SUFFIX": "#H0_S1_C128_B64"
  },
  "paramsSchema": {
    "WALL_SUFFIX": { "type": "color", "label": "Wall Color" },
    "ROOF_SUFFIX": { "type": "color", "label": "Roof Color" }
  },
  "tiles": [
    {
      "id": "Corner",
      "face": ["WH_r", "WH_l", "WH_out", "WH_out"],
      "weight": 0,
      "assets": [
        { "key": "roofCorner", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wallCorner", "keyR": 2, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ]
    },
    {
      "id": "Wall",
      "face": ["WH_r", "WH_in", "WH_l", "WH_out"],
      "weight": 0,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wall", "keyR": 1, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ]
    },
    {
      "id": "Wall_Door",
      "face": ["WH_r", "WH_in", "WH_l", "WH_outD"],
      "weight": 0,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wallDoor", "keyR": 1, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ]
    }
  ],
  "availableAssets": {
    "roof": ["roof", "roofCorner", "roofCornerRound", "roofWindow", "roofPoint"],
    "wall": ["wall", "wallCorner", "wallDoor", "wallWindowGlass", "wallBlock"]
  }
}
```

### Building Configuration JSON

Directly mirrors what `WcBuildConf_HouseA` produces at runtime:

```json
{
  "version": "1.0",
  "type": "building",
  "id": "HouseA",
  "metadata": {
    "classRef": "WcBuildConf_HouseA",
    "sourceFile": "buildConf_HouseA"
  },
  "params": {
    "growLoopCount": 50,
    "endLoopMax": 2000
  },
  "assetCollections": [
    {
      "id": "WallHouse",
      "classRef": "WcAsset_WallHouse",
      "tag": "WH_",
      "params": {
        "WALL_SUFFIX": "#H210_C115_S35_B120",
        "ROOF_SUFFIX": "#H0_S1_C128_B64"
      },
      "sourceFile": "wcAsset_WallHouse"
    },
    {
      "id": "FenceSimple",
      "classRef": "WcAsset_FenceSimple",
      "tag": "F_",
      "params": {
        "suffix": "#H10_S50_C150_B115"
      },
      "sourceFile": "wcAsset_Fence2"
    }
  ],
  "faceLinkWeight": {
    "X": 0,
    "F_out": 0,
    "F_in": 5,
    "WH_out": 1,
    "WH_in": 30,
    "WH_r": 25,
    "WH_l": 25
  },
  "faceLinks": [
    ["X", "F_out"],
    ["F_in", "FP_out"],
    ["WH_l", "WH_r"],
    ["WH_in", "WH_in"]
  ],
  "startTiles": [
    {
      "face": ["E#Open", "E#Open", "E#Door", "E#Open"],
      "weight": 0,
      "allowMove": true,
      "empty": true,
      "color": [12, 12, 16]
    }
  ],
  "tiles": [
    {
      "id": "WallWithDoor",
      "face": ["WH_r", "WH_in", "WH_l", "WH_outD"],
      "weight": 30,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "#H0_S1_C128_B64", "h": 1 },
        { "key": "wallDoor", "keyR": 1, "sufix": "#H210_C115_S35_B120", "h": 0 }
      ],
      "allowMove": true,
      "isFrise": true,
      "functions": [{ "func": "lvlAvgSquare", "size": 5 }]
    }
  ]
}
```

---

## UI Design

```
┌────────────────────────────────────────────────────────────────────┐
│  🏗️ Building Config Editor                              [?] [⚙️]   │
├──────────────────┬─────────────────────────────────────────────────┤
│  📚 Library      │  Main Editor Area                              │
│                  │                                                │
│  ┌─────────────┐ │  ┌───────────────────────────────────────────┐ │
│  │ 🔍 Filter   │ │  │  [Tab] Building   [Tab] Tile             │ │
│  └─────────────┘ │  └───────────────────────────────────────────┘ │
│                  │                                                │
│  ── Buildings ── │  ┌─ Building: HouseA ──────────────────────────┤
│  ▸ HouseA        │  │                                            │
│  ▸ GraveA        │  │  Parameters                                │
│  ▸ ManorA        │  │  Grow Loop: [50]  End Loop Max: [2000]    │
│  ▸ LabBorderA    │  │                                            │
│  ▸ LabPipeA      │  │  ── Asset Collections ──────────────────   │
│  ▸ RLabA         │  │  ┌───────────────────────────────────────┐ │
│                  │  │  │ WallHouse      tag:WH_  [edit] [🗑️]   │ │
│  ── Asset Coll ─ │  │  │ FenceSimple    tag:F_   [edit] [🗑️]   │ │
│  ▸ WallHouse     │  │  │ Enter          tag:E_   [edit] [🗑️]   │ │
│  ▸ WallManor     │  │  │ [+ Add Asset Collection]              │ │
│  ▸ FenceSimple   │  │  └───────────────────────────────────────┘ │
│  ▸ CorridorLab   │  │                                            │
│  ▸ CorridorPipe  │  │  ── Face Link Weights ──────────────────   │
│  ▸ Enter         │  │  ┌────────────┬─────────┬─────┬──────────┐ │
│                  │  │  │ Face Key   │ Weight  │     │ [Add]     │ │
│  ── Actions ──   │  │  ├────────────┼─────────┼─────┼──────────┤ │
│  [⬇️ Extract TS] │  │  │ X          │    0    │     │ [Del]    │ │
│  [⬆️ Import JSON]│  │  │ F_out      │    0    │     │ [Del]    │ │
│  [💾 Save]       │  │  │ F_in       │    5    │     │ [Del]    │ │
│  [📤 Export All] │  │  │ WH_out     │    1    │     │ [Del]    │ │
│                  │  │  │ WH_in      │   30    │     │ [Del]    │ │
│  ── Recent ──    │  │  └────────────┴─────────┴─────┴──────────┘ │
│  📄 HouseA.json  │  │                                            │
│  📄 WallHouse.json│ │  ── Face Links ─────────────────────────   │
│  ────────        │  │  ┌─────────────┬─────────────┬────────────┤ │
│                  │  │  │ From        │ To          │ [Actions]  │ │
│                  │  │  ├─────────────┼─────────────┼────────────┤ │
│                  │  │  │ X           │ F_out       │ [🗑️]      │ │
│                  │  │  │ F_in        │ FP_out      │ [🗑️]      │ │
│                  │  │  │ WH_l        │ WH_r        │ [🗑️]      │ │
│                  │  │  │ [+ Add Link]                            │ │
│                  │  │  └─────────────┴─────────────┴────────────┘ │
│                  │  │                                            │
│                  │  │  ── Start Tiles ─────────────────────────  │
│                  │  │  [Edit Start Tiles (1)]                    │
│                  │  │                                            │
│                  │  │  ── Tiles ───────────────────────────────  │
│                  │  │  [Edit Tiles (24)]  │  [+ Add Tile]       │
│                  │  └────────────────────────────────────────────┘ │
│                  │                                                │
│                  │  ┌─ Preview ──────────────────────────────────┐ │
│                  │  │  [▶ Run Generation]  [Clear]               │ │
│                  │  │  [2D Canvas: Generated building grid]       │ │
│                  │  │  [Toggle: Show faces / Show assets]         │ │
│                  │  └────────────────────────────────────────────┘ │
└──────────────────┴────────────────────────────────────────────────┘
```

---

## Tile Editor (Modal/Panel)

```
┌─ Tile Editor ────────────────────────────────────────────────────┐
│                                                                  │
│  Tile ID: [WallWithDoor_____________]                            │
│                                                                  │
│  ── Face Configuration ──────────────────────────────────────── │
│  Face Key (4 directions: NW, NE, SE, SW):                       │
│  ┌─────────┬─────────┬─────────┬─────────┐                      │
│  │  NW     │  NE     │  SE     │  SW     │                      │
│  │ WH_r    │ WH_in   │ WH_l    │ WH_outD │                      │
│  │ [▼]     │ [▼]     │ [▼]     │ [▼]     │                      │
│  └─────────┴─────────┴─────────┴─────────┘                      │
│                                                                  │
│  ── Properties ──────────────────────────────────────────────── │
│  Weight: [30]                                                    │
│  ☐ Allow Move     ☑ Is Frise     ☐ Empty                        │
│  Height: [__]     Level: [__]                                    │
│  Color: [🎨] [12, 12, 16]                                        │
│                                                                  │
│  ── Assets ──────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer │ Asset Key   │ Rot │ Suffix        │ Height │ [🗑️] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ h:1   │ roof        │ [3] │ {ROOF_SUFFIX} │ 1      │ [🗑️] │ │
│  │ h:0   │ wallDoor    │ [1] │ {WALL_SUFFIX} │ 0      │ [🗑️] │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [+ Add Asset]                                                   │
│  Available keys: [roof, roofCorner, wall, wallDoor, ...▼]       │
│                                                                  │
│  ── Functions ───────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Function              │ Size  │ [🗑️]                       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ lvlAvgSquare          │ [5]   │ [🗑️]                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [+ Add Function]                                                │
│                                                                  │
│  ── Preview ────────────────────────────────────────────────── │
│  [2D Canvas: Tile with assets rendered isometrically]           │
│                                                                  │
│                    [Cancel]  [Save & Close]                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Asset Collection Editor

```
┌─ Asset Collection: WallHouse ────────────────────────────────────┐
│                                                                  │
│  Tag Prefix: [WH_]                                               │
│                                                                  │
│  ── Parameters ───────────────────────────────────────────────── │
│  ┌─────────────────┬───────────────────────────┬────────────┐   │
│  │ Param Name      │ Value                     │ [Actions]  │   │
│  ├─────────────────┼───────────────────────────┼────────────┤   │
│  │ WALL_SUFFIX     │ 🎨 #H210_C115_S35_B120    │ [🗑️]      │   │
│  │ ROOF_SUFFIX     │ 🎨 #H0_S1_C128_B64        │ [🗑️]      │   │
│  └─────────────────┴───────────────────────────┴────────────┘   │
│  [+ Add Parameter]                                               │
│                                                                  │
│  ── Defined Tiles ───────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tile ID          │ Face Preview        │ [Actions]        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Corner           │ [r][l][out][out]    │ [Edit] [🗑️]     │ │
│  │ Wall             │ [r][in][l][out]     │ [Edit] [🗑️]     │ │
│  │ Wall_Door        │ [r][in][l][outD]    │ [Edit] [🗑️]     │ │
│  │ Wall_Windows     │ [r][in][l][out]     │ [Edit] [🗑️]     │ │
│  │ InnerCorner      │ [in][in][l][r]      │ [Edit] [🗑️]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [+ Add Tile]                                                    │
│                                                                  │
│  ── Available Assets ───────────────────────────────────────── │
│  Used to populate dropdowns in tile editor.                     │
│  ┌──────────────┬─────────────────────────────────────────────┐ │
│  │ Asset Group  │ Available Keys                              │ │
│  ├──────────────┼─────────────────────────────────────────────┤ │
│  │ roof         │ roof, roofCorner, roofCornerRound, ...      │ │
│  │ wall         │ wall, wallCorner, wallDoor, wallWindow...   │ │
│  └──────────────┴─────────────────────────────────────────────┘ │
│                                                                  │
│                    [Cancel]  [Save]                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Types & Extractor (4-5h)

**Goal**: Define JSON types and implement runtime extraction from TS classes.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/types.ts`
2. `IsoGame/wcBuilding2/editor/extractor.ts`

**Extraction approach** (Runtime instantiation — no TS parsing):

```typescript
// extractor.ts
class ConfigExtractor {
  
  /** Extract a building config by instantiating and serializing */
  static extractBuilding(confClass: typeof WcAbstractBuildConf, params = {}): BuildingConfig {
    const conf = new confClass(params);
    conf.init(); // Run init to process tile options
    
    return {
      version: "1.0",
      type: "building",
      params: {
        growLoopCount: conf.growLoopCount,
        endLoopMax: conf.endLoopMax,
        mainLvl: conf.mainLvl ?? null,
      },
      faceLinkWeight: { ...conf.faceLinkWeight },
      faceLinks: [...conf.faceLinks],
      startTiles: this.tilesToJson(conf.startTileOptions),
      tiles: this.tilesToJson(conf.listTileOptions),
    };
  }
  
  /** Extract tiles from __TILE_LIST_RAW / __TILE_START_RAW */
  static extractRawTiles(conf: WcAbstractBuildConf): { start: WcConfTile[], list: WcConfTile[] } {
    return {
      start: conf.__TILE_START_RAW,
      list: conf.__TILE_LIST_RAW,
    };
  }
  
  private static tilesToJson(tiles: WcConfTile[]): TileConfig[] {
    return tiles.map(t => ({
      face: [...t.face],
      weight: t.weight ?? 0,
      assets: t.assets ? t.assets.map(a => ({ ...a })) : undefined,
      functions: t.functions ? t.functions.map(f => ({ ...f })) : undefined,
      allowMove: t.allowMove,
      isFrise: t.isFrise,
      empty: t.empty,
      color: t.color,
      h: t.h,
    }));
  }
}
```

**Registry of all existing configs** (for extraction UI):

```typescript
// Known class registry (from wcBuildAction.ts)
const BUILDING_CLASSES = {
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
};

// Known asset collection classes
const ASSET_COLLECTION_CLASSES = {
  "WcAsset_WallHouse": WcAsset_WallHouse,
  "WcAsset_WallManor": WcAsset_WallManor,
  "WcAsset_FenceSimple": WcAsset_FenceSimple,
  "WcAsset_FencePlatform": WcAsset_FencePlatform,
  "WcAsset_FenceGrave": WcAsset_FenceGrave,
  "WcAsset_Enter": WcAsset_Enter,
  "WcAsset_CorridorLab": WcAsset_CorridorLab,
  "WcAsset_CorridorPipe": WcAsset_CorridorPipe,
};
```

---

### Phase 2: Server Endpoints (3-4h)

**Goal**: Create API endpoints for the editor. Zero modification to existing server code.

**File**: `IsoGame/wcBuilding2/editor/server.ts`

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/editor/extract/building/:name` | GET | Extract TS building to JSON |
| `/editor/extract/asset-collection/:name` | GET | Extract TS asset collection to JSON |
| `/editor/list` | GET | List all configs (TS + existing JSON) |
| `/editor/save/building/:name` | POST | Save JSON building config |
| `/editor/save/asset-collection/:name` | POST | Save JSON asset collection config |
| `/editor/preview/generate` | POST | Run building generation, return tile data |
| `/editor/assets/list` | GET | List available game assets from `img/` |

**Server implementation pattern** (isolated Deno routes):

```typescript
// server.ts
import { Router } from "https://deno.land/x/oak/mod.ts"; // or existing router pattern

const router = new Router();

// Extract existing TS config to JSON
router.get("/editor/extract/building/:name", async (ctx) => {
  const { name } = ctx.params;
  const configClass = BUILDING_CLASSES[name];
  if (!configClass) {
    ctx.response.status = 404;
    return;
  }
  
  const json = ConfigExtractor.extractBuilding(configClass);
  ctx.response.body = json;
});

// Save JSON config to disk
router.post("/editor/save/building/:name", async (ctx) => {
  const { name } = ctx.params;
  const body = ctx.request.body();
  const config = await body.value;
  
  const path = `IsoGame/wcBuilding2/editor/conf/buildings/${name}.json`;
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2));
  
  ctx.response.body = { success: true, path };
});

// Run building generation preview
router.post("/editor/preview/generate", async (ctx) => {
  const body = ctx.request.body();
  const config: BuildingConfig = await body.value;
  
  // Create config from JSON, run generation, return tile data
  const result = await runGenerationPreview(config);
  ctx.response.body = result;
});
```

---

### Phase 3: Web Shell & Library Panel (4-5h)

**Goal**: Create editor page with library sidebar showing all configs.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/index.html`
2. `IsoGame/wcBuilding2/editor/web/css/editor.css`
3. `IsoGame/wcBuilding2/editor/web/js/api.ts`
4. `IsoGame/wcBuilding2/editor/web/js/state.ts`
5. `IsoGame/wcBuilding2/editor/web/js/panels/library.ts`

**State management**:

```typescript
// state.ts
interface EditorState {
  // Current loaded configs
  configs: {
    buildings: BuildingConfig[];
    assetCollections: AssetCollectionConfig[];
  };
  
  // Currently selected/active
  activeConfigType: "building" | "assetCollection" | null;
  activeConfigId: string | null;
  
  // UI state
  editingTile: TileConfig | null;
  showTileEditor: boolean;
}

class EditorState {
  private state: EditorState;
  private listeners: Set<Listener>;
  
  // Subscription pattern for reactive UI
  subscribe(listener: Listener): () => void;
  dispatch(action: Action): void;
}
```

---

### Phase 4: Building Editor Panel (5-6h)

**Goal**: Full building config editor with face weight/link/tables.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`
2. `IsoGame/wcBuilding2/editor/web/js/components/faceLinkTable.ts`
3. `IsoGame/wcBuilding2/editor/web/js/components/weightTable.ts`

**Key Components**:

| Component | Purpose |
|-----------|---------|
| `faceLinkTable.ts` | Edit face links as "From → To" pairs |
| `weightTable.ts` | Edit face key weights as a sortable table |
| `tileList.ts` | Tile list with edit/add/delete |
| `assetCollectionRef.ts` | Reference and edit asset collection params |

---

### Phase 5: Tile Editor Panel (5-6h)

**Goal**: Edit individual tiles with face config, assets, functions.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/panels/tile.ts`
2. `IsoGame/wcBuilding2/editor/web/js/components/faceEditor.ts`
3. `IsoGame/wcBuilding2/editor/web/js/components/assetList.ts`
4. `IsoGame/wcBuilding2/editor/web/js/components/canvas2d.ts`

**Key Components**:

| Component | Purpose |
|-----------|---------|
| `faceEditor.ts` | 4-face dropdown inputs (NW, NE, SE, SW) |
| `assetList.ts` | Add/remove/reorder tile assets |
| `canvas2d.ts` | 2D isometric tile preview |
| `colorPicker.ts` | Visual color suffix picker |

---

### Phase 6: Asset Collection Editor + Preview (4-5h)

**Goal**: Edit asset collections with parameter management and visual preview.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts`
2. `IsoGame/wcBuilding2/editor/web/js/services/preview.ts`
3. `IsoGame/wcBuilding2/editor/web/js/services/assetPreview.ts`

---

### Phase 7: Config Loader (3-4h)

**Goal**: Load JSON configs back into the game at runtime.

**File**: `IsoGame/wcBuilding2/editor/loader.ts`

**Approach**:

```typescript
// loader.ts
class ConfigLoader {
  static async loadBuilding(id: string): Promise<WcAbstractBuildConf> {
    // 1. Try JSON first
    const jsonPath = `IsoGame/wcBuilding2/editor/conf/buildings/${id}.json`;
    try {
      const json = JSON.parse(await Deno.readTextFile(jsonPath));
      return this.buildFromJSON(json);
    } catch {
      // 2. Fall back to TS class
      const classRef = BUILDING_CLASSES[id];
      return new classRef({});
    }
  }
  
  private static buildFromJSON(json: BuildingConfig): WcAbstractBuildConf {
    const conf = new WcAbstractBuildConf({
      growLoopCount: json.params.growLoopCount,
      endLoopMax: json.params.endLoopMax,
    });
    
    conf.faceLinkWeight = json.faceLinkWeight;
    conf.faceLinks = json.faceLinks;
    
    // Set tiles from JSON
    conf.startTileOptions = json.startTiles.map(this.tileFromJSON);
    conf.listTileOptions = json.tiles.map(this.tileFromJSON);
    
    conf.init();
    return conf;
  }
}
```

**Integration** — Minimal change to `wcBuildAction.ts`:

```typescript
// ONLY addition to existing code — wrap the registry
import { ConfigLoader } from "../editor/loader.ts";

// Modify the index to try JSON first, then fall back to TS
const originalClassMap = { ...indexBuildingConfigClass };

// Extended registry that checks JSON first
async function getBuildingConfig(type: string): Promise<WcAbstractBuildConf> {
  return await ConfigLoader.loadBuilding(type);
}
```

---

## Isolation Guarantees

| Aspect | Approach |
|--------|----------|
| **Server code** | New endpoints in `editor/server.ts` only |
| **Game code** | `loader.ts` wraps existing registry — optional integration |
| **CSS** | All styles in `editor/web/css/editor.css` — no game CSS changes |
| **Build** | Editor bundled separately |
| **Data** | JSON configs in `editor/conf/` — existing `conf/*.ts` untouched |
| **Runtime** | Editor loaded via `/editor/web/index.html` — separate from game |

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    EXISTING CODE (Read-Only)                 │
│                                                              │
│  WcBuildConf_HouseA ──┐                                     │
│  WcBuildConf_GraveA ──┤                                     │
│  WcAsset_WallHouse  ──┤── get __TILE_LIST_RAW() ──┐         │
│  WcAsset_FenceSimple ─┤                           │         │
│                         └─── get faceLinkWeight() ─┤         │
│                         └─── get faceLinks() ───────┤         │
└─────────────────────────────────────────────────────┼────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    EDITOR (New Code)                         │
│                                                              │
│  1. EXTRACT:                                                 │
│     ConfigExtractor.extractBuilding(HouseA)                  │
│       → Instantiate class, call getters, serialize to JSON   │
│                                                              │
│  2. EDIT:                                                    │
│     Web UI manipulates JSON (face weights, tiles, assets)    │
│                                                              │
│  3. SAVE:                                                    │
│     JSON → editor/conf/buildings/HouseA.json                 │
│                                                              │
│  4. LOAD (Runtime):                                          │
│     ConfigLoader.loadBuilding("HouseA") → JSON → WcConf      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| HTML | Custom (consistent with existing `indexIso.html`) |
| CSS | Custom in `editor.css` — isolated |
| Script | TypeScript (bundled with esbuild) |
| Canvas | HTML5 Canvas 2D for tile/preview rendering |
| Storage | JSON files on disk + state in memory |
| Server | Deno HTTP routes (isolated in `editor/server.ts`) |

---

## File Structure Summary

```
IsoGame/wcBuilding2/
  editor/
    ├── types.ts                       # JSON schema: BuildingConfig, AssetCollectionConfig, TileConfig
    ├── extractor.ts                   # Runtime: TS class → JSON
    ├── loader.ts                      # Runtime: JSON → WcAbstractBuildConf
    ├── generator.ts                   # Optional: JSON → TS code
    ├── server.ts                      # Deno HTTP endpoints
    │
    ├── conf/                          # JSON storage (created by editor)
    │   ├── asset-collections/         # WallHouse.json, ...
    │   ├── buildings/                 # HouseA.json, ...
    │   └── registry.json              # Index
    │
    └── web/
        ├── index.html                 # Editor entry
        ├── css/
        │   └── editor.css             # Isolated styles
        └── js/
            ├── state.ts               # Centralized state
            ├── api.ts                 # API client
            ├── panels/
            │   ├── library.ts         # Config list sidebar
            │   ├── building.ts        # Building editor
            │   ├── assetCollection.ts # Asset collection editor
            │   └── tile.ts            # Tile editor
            ├── components/
            │   ├── faceEditor.ts      # 4-face input widget
            │   ├── assetList.ts       # Asset CRUD
            │   ├── faceLinkTable.ts   # Link pair table
            │   ├── weightTable.ts     # Weight table
            │   ├── canvas2d.ts        # 2D preview
            │   └── colorPicker.ts     # Color suffix helper
            └── services/
                ├── preview.ts         # Generation preview
                └── assetPreview.ts    # Asset image loading
```

---

## Testing Strategy

1. **Extraction tests**: All 6 building configs extract to valid JSON with correct structure
2. **Round-trip tests**: Extract → Save → Load → Generate → compare tile counts
3. **Visual tests**: Asset previews match game rendering
4. **Constraint tests**: Face propagation works correctly in editor
5. **Isolation tests**: Game runs unchanged after adding editor

---

## Success Criteria

1. ✅ All 6 existing building configs can be extracted to JSON via UI
2. ✅ JSON configs can be loaded and used for building generation
3. ✅ Editor has clear sections: Library, Building Editor, Tile Editor, Asset Collection Editor
4. ✅ Face configuration visualizes 4 directions (NW, NE, SE, SW)
5. ✅ Asset preview uses game asset loader (images from `img/asset_opti/`)
6. ✅ All code isolated in `IsoGame/wcBuilding2/editor/` directory
7. ✅ Zero breaking changes to existing game functionality
8. ✅ Building generation preview renders on canvas

---

## Timeline Estimate

| Phase | Description | Hours |
|-------|-------------|-------|
| 1 | Types & Extractor | 4-5h |
| 2 | Server Endpoints | 3-4h |
| 3 | Web Shell & Library | 4-5h |
| 4 | Building Editor Panel | 5-6h |
| 5 | Tile Editor Panel | 5-6h |
| 6 | Asset Collection Editor + Preview | 4-5h |
| 7 | Config Loader | 3-4h |
| **Total** | | **~28-35 hours** |

---

## Next Steps

1. **Review and approve** this plan
2. **Create `types.ts`** — Define all JSON schema interfaces
3. **Create `extractor.ts`** — Implement runtime extraction logic
4. **Generate first JSON configs** — Extract HouseA and WallHouse as examples
5. **Create `index.html`** — Start the web editor shell
6. **Build Library panel** — Show list of extractable configs
7. **Iterate through remaining panels** in order: Building → Tile → Asset Collection
8. **Implement Loader** — Enable JSON configs in game
9. **Test and validate** — Round-trip, isolation, visual tests