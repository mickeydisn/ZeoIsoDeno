# Building Configuration Editor — Plan Summary v4 (Final Review)

## Review Status
**v3 Plan Reviewed** → This v4 version corrects critical misunderstandings discovered through deep code analysis.

---

## Critical Corrections from Code Analysis (v3 → v4)

### CORRECTION 1: Asset Collection Architecture

**v3 Plan (INCORRECT)**: Assumed all asset collections have a `groupAsset()` method that returns tiles.

**Actual Code (CORRECT)**:
| Class | Has `groupAsset()` | Tile Pattern |
|-------|-------------------|--------------|
| `WcAsset_WallHouse` | ❌ NO | Individual getters: `Corner`, `Wall`, `Wall_Door`, `InnerCorner`, etc. |
| `WcAsset_Fence2` (base) | ✅ YES | `groupAsset({flatW, cornerW, innerW, isFrise})` returns composed tiles |
| `WcAsset_FenceSimple` | ✅ inherited | Calls parent's `groupAsset()` |
| `WcAsset_FencePlatform` | ✅ inherited | Calls parent's `groupAsset()` |
| `WcAsset_Enter` | ❌ NO | Has `groupInit()` and `groupAsset()` (different signature) |
| `wcAsset_X` | ❌ NO | Has `groupAsset()` but minimal tiles |

**Implication**: Extraction cannot use a uniform `groupAsset()` call. Must:
1. Use reflection/introspection to find all getters on the class
2. OR manually list the tile-producing getters for each asset collection
3. Call `applyGroup()` wrapper as done in the building config (e.g., `applyGroup([{...this.houseSimple.Wall_Door, weight: 30}], {allowMove: true, ...})`)

### CORRECTION 2: Face Keys are Dynamically Computed

**v3 Plan (INCORRECT)**: Treated face keys like `["WH_r", "WH_l", "WH_out", "WH_out"]` as static values.

**Actual Code (CORRECT)**: Face keys are computed at getter invocation time:
```typescript
// In wcAsset_WallHouse.ts
get Corner(): WcConfTile {
  return {
    face: ["r", "l", "out", "out"].map((p) => (this.tag + p)) as WcFace,
    // tag = "WH_" → face = ["WH_r", "WH_l", "WH_out", "WH_out"]
    ...
  };
}
```

**Implication**: Extracted tiles will have fully-resolved face keys when getters are called. This is correct for extraction. But the JSON should **also** store template form for reusability.

### CORRECTION 3: Tile Weight is Applied by `applyGroup()`, Not in Getters

**v3 Plan (INCORRECT)**: Showed `weight` as part of individual tile definitions.

**Actual Code (CORRECT)**: Getters return tiles with `weight: 0`. Weight is applied by `applyGroup()` in the building config:
```typescript
// In buildConf_HouseA.ts
...applyGroup([
  { ...this.houseSimple.Wall_Door, weight: 30 },  // Weight ADDED here
  { ...this.houseSimple.Wall, weight: 30 },
], {
  allowMove: true,
  isFrise: true,
  functions: actionsEmpty,
}),
```

**Implication**: Extracted tiles will have correct weights, but the JSON loses the association between the original getter name and the tile. Need to preserve tile `id` during extraction.

### CORRECTION 4: faceLinks are Doubled in `init()`

**v3 Plan (INCORRECT)**: Showed faceLinks as single-directional pairs.

**Actual Code (CORRECT)**: In `wcAbstractBuildConf.ts:140-143`:
```typescript
this.faceLinks = this.faceLinks.map((link) => [
  [link[0], link[1]] as [string, string],
  [link[1], link[0]] as [string, string],  // BIDIRECTIONAL
]).flat();
```

**Implication**: Extracted faceLinks will have 2x the entries. Editor should show only unique pairs and understand the bidirectional nature. Save should store unique pairs.

### CORRECTION 5: Two Registry Systems Exist

**v3 Plan (PARTIALLY CORRECT)**: Only referenced `wcBuildAction.ts` registry.

**Actual Code (CORRECT)**:
| File | Registry | Key Type | Values |
|------|----------|----------|--------|
| `wcBuildAction.ts` | `indexBuildingConfigClass` | Class name string | `WcBuildConf_HouseA`, `WcBuildConf_GraveA`, etc. |
| `buildingConfigRegistry.ts` | `buildingConfigRegistry` Map | ID string | `house_a`, `grave_a`, `manor_a`, etc. |

**Implication**: Editor needs to map between both systems. Use class names for extraction, IDs for runtime creation.

### CORRECTION 6: `mainLvl` is Set at Runtime, Not in Config

**v3 Plan (MISLEADING)**: Listed `mainLvl` as a building parameter.

**Actual Code (CORRECT)**: `mainLvl` is set during generation (`wcBuildFactory.ts:155`):
```typescript
this.mainLvl = this.fm.getTile(x, y).lvl;
this.configuration.mainLvl = this.mainLvl;
```

**Implication**: `mainLvl` should NOT be in the editable JSON. It's a runtime value. Store it only as metadata if needed.

### CORRECTION 7: Asset Suffix Pattern Understanding

**v3 Plan (CORRECT but incomplete)**: Showed suffix patterns but didn't explain the full structure.

**Actual Code**: Color filter suffix format is: `#H{height}_C{color}_S{saturation}_B{brightness}`
```
#H210_C115_S35_B120  →  Height=210, Color=115, Saturation=35, Brightness=120
```

These match the color filter system used in the game's asset loader.

---

## Current State Analysis (Verified)

### Core Classes (Read-Only — No Modifications)

| File | Class | Purpose |
|------|-------|---------|
| `wcAbstractBuildConf.ts` | `WcAbstractBuildConf` | Base config class. Defines `WcConfTile`, `WcConfRawTile`, `WcConfTileAsset`, `WcConfTileFunction` interfaces. Manages tile indexing by face key. |
| `wcBuildFactory.ts` | `WcBuildFactoryGenarator` | Building generation: init → grow loop → close loop → clean |
| `wcBuildTile.ts` | `WcBuildTile` | Individual tile with face constraint propagation algorithm |
| `wcBuildAction.ts` | `WcBuildActions` | Singleton registry + action handlers (`createBuilding`, `destroyBuilding`) |
| `wcBuildFace.ts` | Types | `WcFace = [WcKeyFace, WcKeyFace, WcKeyFace, WcKeyFace]` (4 dirs: NW, NE, SE, SW) |
| `wcUtils.ts` | Utilities | `confsGroup_to_confsTile`, `confsRawTile_to_confsTile`, `pickRandomWeightedObject`, rotation logic in `confRawTile_to_confsTile` |
| `conf/assetsCollection/wcUtils.ts` | Asset Utils | `applyGroup`, `tagFaces`, `actionsEmpty` |

### Building Config Hierarchy (6 Classes)

| Class | Asset Collections Used |
|-------|----------------------|
| `WcBuildConf_HouseA` | WcAsset_WallHouse, WcAsset_FenceSimple, WcAsset_FencePlatform, WcAsset_Enter |
| `WcBuildConf_GraveA` | WcAsset_FenceGrave, WcAsset_Enter, WcAsset_X, special grave tiles |
| `WcBuildConf_ManorA` | WcAsset_WallManor, WcAsset_FenceSimple, WcAsset_Enter |
| `WcBuildConf_LabBorderA` | WcAsset_CorridorLab, WcAsset_Enter |
| `WcBuildConf_LabPipeA` | WcAsset_CorridorPipe, WcAsset_Enter |
| `WcBuildConf_RLabA` | WcAsset_WallRLab, WcAsset_CorridorLab, WcAsset_Enter |

### Asset Collection Classes

| Class | Type | Key Features |
|-------|------|--------------|
| `WcAsset_WallHouse` | Wall-based | Getters: Corner, Corner_B, Wall, Wall_Door, Wall_Windows, Wall_RoofWindows, InnerCorner, InnerCorner_X, Inside_Full |
| `WcAsset_WallManor` | Wall-based | Similar to WallHouse with manor-specific assets |
| `WcAsset_FenceSimple` | Fence-based | Extends WcAsset_Fence2, uses groupAsset() |
| `WcAsset_FencePlatform` | Fence-based | Extends WcAsset_Fence2, different asset keys |
| `WcAsset_FenceGrave` | Fence-based | Grave-specific fence with pillars and iron fence |
| `WcAsset_Enter` | Entrance | groupInit() for start tile, groupAsset() for entrance tiles |
| `WcAsset_CorridorLab` | Lab corridor | Lab-specific corridor tiles |
| `WcAsset_CorridorPipe` | Lab pipe | Lab pipe system tiles |

### WcConfTile Structure (Verified)

```typescript
interface WcConfTile {
  face: WcFace;                    // [NW, NE, SE, SW] — each is string | null
  weight: number;                  // Selection weight (0 = never auto-selected)
  
  allowMove?: boolean;             // Allow terrain modification
  isFrise?: boolean;               // Decorative (no collision)
  empty?: boolean;                 // Empty tile (no assets rendered)
  
  assets?: WcConfTileAsset[];      // Visual assets
  functions?: WcConfTileFunction[]; // Functions (e.g., {func: "lvlAvgSquare", size: 5})
  
  colorT?: [number, number, number]; // Top color override
  color?: [number, number, number];  // Base color override
  h?: number;                      // Height override
  lvl?: number;                    // Level override (set at runtime)
}

interface WcConfTileAsset {
  key?: string;      // Asset key in loader (e.g., "wallDoor")
  keyR?: number;     // Rotation index 0-3
  sufix?: string;    // Color filter (e.g., "#H210_C115_S35_B120")
  h?: number;        // Height layer (0, 1, 2)
  off?: {x, y};      // Offset
}
```

### Building Generation Algorithm (Verified)

```
1. INIT: Place start tile from configuration.TILE_START_OPTIONS
   - Randomly weighted pick from startTileOptions
   
2. GROW LOOP (growLoopCount iterations):
   a. Process "forced" tiles (only 1 possible face → deterministic)
   b. Process "open" tiles (multiple faces → pick highest score)
   c. Each tile propagates face constraints to neighbors
   
3. CLOSE LOOP (endLoopMax iterations):
   a. Process "forced" tiles
   b. Process "close" tiles (pick lowest weight face)
   c. Propagate constraints
   
4. CLEAN: Fix tiles with null faces → set to ["X", "X", "X", "X"]
```

---

## Solution Architecture (v4 — Corrected)

### Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Runtime extraction** | Instantiate TS config classes, call `__TILE_START_RAW`/`__TILE_LIST_RAW` getters, process results |
| **JSON-first storage** | Editor works with JSON; TS generation is optional output |
| **Mirror existing structure** | JSON maps directly to `WcConfTile` structure |
| **Preserve composition** | Store tile origin (which asset collection getter) for traceability |
| **Deduplicate faceLinks** | Show unique pairs in UI; expand to bidirectional at load time |
| **Full isolation** | All new code in `IsoGame/wcBuilding2/editor/` |

### Directory Structure

```
IsoGame/wcBuilding2/
  editor/
    ├── types.ts                       # JSON schema interfaces
    ├── extractor.ts                   # Runtime: TS class → JSON
    ├── loader.ts                      # Runtime: JSON → WcAbstractBuildConf
    ├── generator.ts                   # JSON → TypeScript code (optional output)
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
            │   ├── faceLinkTable.ts   # Face links editor (unique pairs)
            │   ├── weightTable.ts     # Face link weights table
            │   ├── canvas2d.ts        # 2D tile preview
            │   └── colorPicker.ts     # Color suffix helper
            │
            └── services/
                ├── preview.ts         # Run building generation (server)
                └── assetPreview.ts    # Load asset images
```

---

## JSON Schema Design (v4 — Corrected)

### Asset Collection JSON

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
      ],
      "sourceGetter": "Corner"
    },
    {
      "id": "Wall_Door",
      "face": ["WH_r", "WH_in", "WH_l", "WH_outD"],
      "weight": 0,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wallDoor", "keyR": 1, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ],
      "sourceGetter": "Wall_Door"
    }
  ]
}
```

**v4 Key Change**: Added `sourceGetter` field to track which getter produced this tile. Essential for regeneration.

### Building Configuration JSON

```json
{
  "version": "1.0",
  "type": "building",
  "id": "HouseA",
  "metadata": {
    "classRef": "WcBuildConf_HouseA",
    "sourceFile": "buildConf_HouseA",
    "registryId": "house_a"
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
    "WH_outD": 1,
    "WH_in": 30,
    "WH_r": 25,
    "WH_l": 25,
    "WH_rX": 25,
    "WH_lX": 25
  },
  "faceLinks": [
    ["X", "F_out"],
    ["F_in", "FP_out"],
    ["WH_l", "WH_r"],
    ["WH_l", "WH_rX"],
    ["WH_lX", "WH_r"],
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
      "functions": [{ "func": "lvlAvgSquare", "size": 5 }],
      "sourceTileId": "Wall_Door",
      "sourceCollection": "WallHouse"
    }
  ]
}
```

**v4 Key Changes**:
1. Added `registryId` to map to `buildingConfigRegistry.ts`
2. `faceLinkWeight` includes `WH_outD`, `WH_rX`, `WH_lX` which exist in HouseA
3. Added `sourceTileId` and `sourceCollection` for traceability
4. Removed `mainLvl` from params (it's runtime)

---

## UI Design (v4 — Same as v3)

The UI design from v3 is sound. The wireframes correctly represent the data model:

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
│                  │  │  │ WallHouse      tag:WH_  [edit] [🔗]   │ │
│  ── Asset Coll ─ │  │  │ FenceSimple    tag:F_   [edit] [🔗]   │ │
│  ▸ WallHouse     │  │  │ Enter          tag:E_   [edit] [🔗]   │ │
│  ▸ WallManor     │  │  │ [+ Add Asset Collection]              │ │
│  ▸ FenceSimple   │  │  └───────────────────────────────────────┘ │
│  ▸ FencePlatform │  │                                            │
│  ▸ CorridorLab   │  │  ── Face Link Weights ──────────────────   │
│  ▸ CorridorPipe  │  │  ┌────────────┬─────────┬─────┬──────────┐ │
│  ▸ Enter         │  │  │ Face Key   │ Weight  │     │ [Add]    │ │
│                  │  │  ├────────────┼─────────┼─────┼──────────┤ │
│  ── Actions ──   │  │  │ X          │    0    │     │ [Del]    │ │
│  [⬇️ Extract TS] │  │  │ F_out      │    0    │     │ [Del]    │ │
│  [⬆️ Import JSON]│  │  │ F_in       │    5    │     │ [Del]    │ │
│  [💾 Save]       │  │  │ WH_out     │    1    │     │ [Del]    │ │
│  [📤 Export All] │  │  │ WH_in      │   30    │     │ [Del]    │ │
│                  │  │  └────────────┴─────────┴─────┴──────────┘ │
│  ── Recent ──    │  │                                            │
│  📄 HouseA.json  │  │  ── Face Links (Unique Pairs) ──────────   │
│  📄 WallHouse.json│ │  ┌─────────────┬─────────────┬────────────┤ │
│  ────────        │  │  │ From        │ To          │ [Actions]  │ │
│                  │  │  ├─────────────┼─────────────┼────────────┤ │
│                  │  │  │ X           │ F_out       │ [🗑️]      │ │
│                  │  │  │ F_in        │ FP_out      │ [🗑️]      │ │
│                  │  │  │ WH_l        │ WH_r        │ [🗑️]      │ │
│                  │  │  │ WH_l        │ WH_rX       │ [🗑️]      │ │
│                  │  │  │ [+ Add Link]                            │ │
│                  │  │  └─────────────┴─────────────┴────────────┘ │
│                  │  │                                            │
│                  │  │  ── Start Tiles ─────────────────────────  │
│                  │  │  [Edit Start Tiles (1)]                    │
│                  │  │                                            │
│                  │  │  ── Tiles ───────────────────────────────  │
│                  │  │  [Edit Tiles (N)]  │  [+ Add Tile]       │ │
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

## Tile Editor (v4 — Corrected)

```
┌─ Tile Editor ────────────────────────────────────────────────────┐
│                                                                  │
│  Tile ID: [WallWithDoor_____________]                            │
│  Source: [WallHouse → Wall_Door] (readonly)                     │
│                                                                  │
│  ── Face Configuration ──────────────────────────────────────── │
│  Face Key (4 directions: NW, NE, SE, SW):                       │
│  ┌─────────┬─────────┬─────────┬─────────┐                      │
│  │  NW     │  NE     │  SE     │  SW     │                      │
│  │ WH_r    │ WH_in   │ WH_l    │ WH_outD │                      │
│  │ [▼]     │ [▼]     │ [▼]     │ [▼]     │                      │
│  └─────────┴─────────┴─────────┴─────────┘                      │
│  ⚡ Dropdown shows: all known face keys from registry            │
│                                                                  │
│  ── Properties ──────────────────────────────────────────────── │
│  Weight: [30]                                                    │
│  ☐ Allow Move     ☑ Is Frise     ☐ Empty                        │
│  Height: [__]     Level: [__]                                    │
│  Color: [🎨] [12, 12, 16]                                        │
│                                                                  │
│  ── Assets ──────────────────────────────────────────────────── │
│  ┌──────┬───────────┬─────┬──────────────────┬────────┬───────┐ │
│  │ Layer│ Asset Key │ Rot │ Suffix           │ Height │ [🗑️]  │ │
│  ├──────┼───────────┼─────┼──────────────────┼────────┼───────┤ │
│  │ h:1  │ roof      │ [3] │ {ROOF_SUFFIX}   │ 1      │ [🗑️]  │ │
│  │ h:0  │ wallDoor  │ [1] │ {WALL_SUFFIX}   │ 0      │ [🗑️]  │ │
│  └──────┴───────────┴─────┴──────────────────┴────────┴───────┘ │
│  [+ Add Asset]                                                   │
│  💡 Suffix {PARAM_NAME} references collection params            │
│  Or enter raw: #H210_C115_S35_B120                              │
│                                                                  │
│  ── Functions ───────────────────────────────────────────────── │
│  ┌──────────────────────┬────────┬────────────────────────────┐ │
│  │ Function             │ Size   │ [Actions]                  │ │
│  ├──────────────────────┼────────┼────────────────────────────┤ │
│  │ lvlAvgSquare         │ [5]    │ [🗑️]                      │ │
│  └──────────────────────┴────────┴────────────────────────────┘ │
│  [+ Add Function]                                                │
│                                                                  │
│  ── Preview ────────────────────────────────────────────────── │
│  [2D Canvas: Tile with assets rendered isometrically]           │
│  [Uses game asset loader from img/asset_opti/]                   │
│                                                                  │
│                    [Cancel]  [Save & Close]                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan (v4 — Corrected)

### Phase 1: Types & Extractor (5-6h) ⚠️ MORE COMPLEX

**Goal**: Define JSON types and implement runtime extraction from TS classes.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/types.ts`
2. `IsoGame/wcBuilding2/editor/extractor.ts`

**Extraction approach** (Runtime instantiation — requires per-class knowledge):

```typescript
// extractor.ts

// Known asset collection classes with their getter methods
const ASSET_COLLECTION_CLASSES: Record<string, {
  class: any;
  tileGetters: string[];
}> = {
  "WcAsset_WallHouse": {
    class: WcAsset_WallHouse,
    tileGetters: ["Corner", "Corner_B", "Wall_Door", "Wall", "Wall_RoofWindows", 
                  "Wall_Windows", "InnerCorner", "InnerCorner_X", "Inside_Full"]
  },
  "WcAsset_WallManor": {
    class: WcAsset_WallManor,
    tileGetters: ["Corner", "Wall_Door", "Wall", "Wall_Windows", "InnerCorner", "InnerCorner_X"]
  },
  "WcAsset_FenceSimple": {
    class: WcAsset_FenceSimple,
    usesGroupAsset: true,
    groupAssetParams: { flatW: 10, cornerW: 10, innerW: 50, isFrise: false }
  },
  // ... etc
};

const BUILDING_CLASSES: Record<string, typeof WcAbstractBuildConf> = {
  "WcBuildConf_HouseA": WcBuildConf_HouseA,
  "WcBuildConf_GraveA": WcBuildConf_GraveA,
  "WcBuildConf_ManorA": WcBuildConf_ManorA,
  "WcBuildConf_LabBorderA": WcBuildConf_LabBorderA,
  "WcBuildConf_LabPipeA": WcBuildConf_LabPipeA,
  "WcBuildConf_RLabA": WcBuildConf_RLabA,
};

class ConfigExtractor {
  
  static extractBuilding(className: string, params = {}): BuildingConfig {
    const ConfClass = BUILDING_CLASSES[className];
    if (!ConfClass) throw new Error(`Unknown class: ${className}`);
    
    const conf = new ConfClass(params);
    conf.init();
    
    return {
      version: "1.0",
      type: "building",
      id: className.replace("WcBuildConf_", ""),
      metadata: {
        classRef: className,
        sourceFile: className.toLowerCase().replace("wcbuildconf_", "buildConf_"),
        registryId: this.findRegistryId(className),
      },
      params: {
        growLoopCount: conf.growLoopCount,
        endLoopMax: conf.endLoopMax,
      },
      faceLinkWeight: { ...conf.faceLinkWeight },
      faceLinks: this.deduplicateFaceLinks(conf.faceLinks),
      startTiles: conf.startTileOptions.map(t => this.tileToJson(t)),
      tiles: conf.listTileOptions.map(t => this.tileToJson(t)),
      assetCollections: this.extractAssetCollectionRefs(conf),
    };
  }
  
  static extractAssetCollection(className: string, params = {}): AssetCollectionConfig {
    const entry = ASSET_COLLECTION_CLASSES[className];
    if (!entry) throw new Error(`Unknown class: ${className}`);
    
    const instance = new entry.class(params);
    
    const tiles: TileConfig[] = [];
    
    if (entry.usesGroupAsset) {
      // Fence-based: call groupAsset with default params
      tiles.push(...instance.groupAsset(entry.groupAssetParams || {
        flatW: 0, cornerW: 0, innerW: 0, isFrise: false
      }).map(t => this.tileToJson(t)));
    } else {
      // Getter-based: call each getter
      for (const getter of entry.tileGetters) {
        if (getter in instance) {
          const tile = instance[getter];
          tiles.push({
            ...this.tileToJson(tile),
            id: getter,
            sourceGetter: getter,
          });
        }
      }
    }
    
    return {
      version: "1.0",
      type: "assetCollection",
      id: className.replace("WcAsset_", ""),
      tag: instance.tag,
      tiles,
      // Extract params if available
      params: this.extractParams(instance),
    };
  }
  
  private static deduplicateFaceLinks(links: [string, string][]): [string, string][] {
    const seen = new Set<string>();
    return links.filter(([a, b]) => {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  private static tileToJson(tile: WcConfTile): TileConfig {
    return {
      face: [...tile.face],
      weight: tile.weight,
      assets: tile.assets?.map(a => ({ ...a })),
      functions: tile.functions?.map(f => ({ ...f })),
      allowMove: tile.allowMove,
      isFrise: tile.isFrise,
      empty: tile.empty,
      color: tile.color,
      h: tile.h,
    };
  }
}
```

**v4 Key Change**: Extraction must handle two patterns (getter-based WallHouse, groupAsset-based Fence). Cannot use a single approach.

### Phase 2: Server Endpoints (3-4h)

**Goal**: Create API endpoints for the editor.

**File**: `IsoGame/wcBuilding2/editor/server.ts`

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/editor/extract/building/:className` | POST | Extract TS building class to JSON (Deno server-side) |
| `/editor/extract/asset-collection/:className` | POST | Extract TS asset collection to JSON |
| `/editor/list` | GET | List all configs (TS classes + existing JSON) |
| `/editor/list/classes` | GET | List all available TS classes for extraction |
| `/editor/save/building/:name` | POST | Save JSON building config to `conf/buildings/` |
| `/editor/save/asset-collection/:name` | POST | Save JSON asset collection to `conf/asset-collections/` |
| `/editor/preview/generate` | POST | Run building generation, return tile grid data |
| `/editor/assets/list` | GET | List available game assets from `img/asset_opti/` |
| `/editor/asset-preview/:key` | GET | Get asset image for preview |

**Server implementation** (isolated Deno routes):

```typescript
// server.ts — Deno HTTP router (compatible with existing webServer.ts pattern)

import { ConfigExtractor, BUILDING_CLASSES, ASSET_COLLECTION_CLASSES } from "./extractor.ts";

// GET /editor/list/classes — Lists all extractable classes
router.get("/editor/list/classes", async (ctx) => {
  ctx.response.body = {
    buildings: Object.keys(BUILDING_CLASSES),
    assetCollections: Object.keys(ASSET_COLLECTION_CLASSES),
  };
});

// POST /editor/extract/building/:className
router.post("/editor/extract/building/:className", async (ctx) => {
  const { className } = ctx.params;
  const body = ctx.request.body();
  const params = await body.value; // Optional constructor params
  
  try {
    const json = ConfigExtractor.extractBuilding(className, params || {});
    ctx.response.body = json;
  } catch (e) {
    ctx.response.status = 400;
    ctx.response.body = { error: e.message };
  }
});

// POST /editor/save/building/:name
router.post("/editor/save/building/:name", async (ctx) => {
  const { name } = ctx.params;
  const body = ctx.request.body();
  const config = await body.value;
  
  const path = `IsoGame/wcBuilding2/editor/conf/buildings/${name}.json`;
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2));
  
  ctx.response.body = { success: true, path };
});

// POST /editor/preview/generate
router.post("/editor/preview/generate", async (ctx) => {
  const body = ctx.request.body();
  const configJson: BuildingConfig = await body.value;
  
  // Load config from JSON, run generation, return result
  const result = await PreviewService.generate(configJson);
  ctx.response.body = result;
});
```

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
interface EditorState {
  configs: {
    buildings: BuildingConfig[];
    assetCollections: AssetCollectionConfig[];
  };
  
  activeConfig: {
    type: "building" | "assetCollection" | null;
    id: string | null;
    data: BuildingConfig | AssetCollectionConfig | null;
    isDirty: boolean;
  };
  
  ui: {
    editingTile: { tile: TileConfig | null; parentCollection: string | null } | null;
    showTileEditor: boolean;
    showAssetCollectionEditor: boolean;
    libraryFilter: string;
  };
}

class StateManager {
  private state: EditorState;
  private listeners: Set<Listener>;
  
  subscribe(listener: Listener): () => void;
  dispatch(action: Action): void;
  getConfig(type: string, id: string): BuildingConfig | AssetCollectionConfig | null;
  saveConfig(type: string, id: string, data: any): Promise<void>;
}
```

### Phase 4: Building Editor Panel (5-6h)

**Goal**: Full building config editor with face weight/link/tables.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`
2. `IsoGame/wcBuilding2/editor/web/js/components/faceLinkTable.ts`
3. `IsoGame/wcBuilding2/editor/web/js/components/weightTable.ts`

**Key Components**:

| Component | Purpose | v4 Notes |
|-----------|---------|----------|
| `faceLinkTable.ts` | Edit face links as unique "From → To" pairs | Deduplicate; expand to bidirectional at save time |
| `weightTable.ts` | Edit face key weights | Simple key-value table |
| `tileList.ts` | Tile list with edit/add/delete/filter | Show source getter info |
| `assetCollectionRef.ts` | Reference and edit asset collection params | Link to assetCollection editor |

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
| `assetList.ts` | Add/remove/reorder tile assets with suffix template support |
| `canvas2d.ts` | 2D isometric tile preview using game asset images |
| `colorPicker.ts` | Color suffix helper (#Hxxx_Cxx_Sxx_Bxx format) |

**v4 Important Detail**: Asset suffixes can be templates (`{ROOF_SUFFIX}`) or raw values (`#H210_C115_S35_B120`). The editor must handle both. When saving, preserve template references if the tile came from an asset collection.

### Phase 6: Asset Collection Editor + Preview (4-5h)

**Goal**: Edit asset collections with parameter management and visual preview.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts`
2. `IsoGame/wcBuilding2/editor/web/js/services/preview.ts`
3. `IsoGame/wcBuilding2/editor/web/js/services/assetPreview.ts`

**v4 Challenges**:
- Wall-based collections define tiles via getters → editor must know getter structure
- Fence-based collections use `groupAsset()` → editor deals with parameterized tile sets
- Solution: Editor loads collection class metadata to understand tile structure

### Phase 7: Config Loader (3-4h)

**Goal**: Load JSON configs back into gameplay at runtime.

**File**: `IsoGame/wcBuilding2/editor/loader.ts`

**Approach**:

```typescript
// loader.ts
class ConfigLoader {
  static async loadBuilding(id: string, params = {}): Promise<WcAbstractBuildConf> {
    // 1. Try JSON first
    const jsonPath = `IsoGame/wcBuilding2/editor/conf/buildings/${id}.json`;
    try {
      const jsonText = await Deno.readTextFile(jsonPath);
      const json = JSON.parse(jsonText);
      return this.buildFromJSON(json);
    } catch {
      // 2. Fall back to TS class
      const entry = getBuildingConfigEntry(id);
      if (entry) {
        return entry.createConfig(params);
      }
      // 3. Try by class name
      const className = `WcBuildConf_${id}`;
      const mapping = { ...indexBuildingConfigClass };
      if (mapping[className]) {
        return new mapping[className](params);
      }
      throw new Error(`Building config not found: ${id}`);
    }
  }
  
  private static buildFromJSON(json: BuildingConfig): WcAbstractBuildConf {
    const conf = new WcAbstractBuildConf({
      growLoopCount: json.params.growLoopCount,
      endLoopMax: json.params.endLoopMax,
    });
    
    conf.faceLinkWeight = json.faceLinkWeight;
    
    // Expand unique faceLinks to bidirectional
    conf.faceLinks = json.faceLinks.flatMap(
      ([a, b]: [string, string]) => [[a, b], [b, a]]
    ) as [string, string][];
    
    conf.startTileOptions = json.startTiles.map(this.tileFromJSON);
    conf.listTileOptions = json.tiles.map(this.tileFromJSON);
    
    conf.init();
    return conf;
  }
  
  private static tileFromJSON(json: TileConfig): WcConfTile {
    return {
      face: json.face as WcFace,
      weight: json.weight,
      assets: json.assets,
      functions: json.functions,
      allowMove: json.allowMove,
      isFrise: json.isFrise,
      empty: json.empty,
      color: json.color,
      h: json.h,
    };
  }
}
```

**Integration** — Minimal change to `wcBuildAction.ts`:

```typescript
// OPTIONAL: Wrap existing registry to try JSON first
import { ConfigLoader } from "../editor/loader.ts";

// Replace in createBuilding handler:
const buildingConf = await ConfigLoader.loadBuilding(conf.buildingType, {
  growLoopCount: conf.growLoopCount || 50,
  endLoopMax: conf.endLoopMax || 200,
});
```

---

## Isolation Guarantees

| Aspect | Approach |
|--------|----------|
| **Server code** | New endpoints in `editor/server.ts` only — mounted separately |
| **Game code** | `loader.ts` wraps existing registry — optional integration |
| **CSS** | All styles in `editor/web/css/editor.css` — no game CSS changes |
| **Build** | Editor served statically; optional TypeScript bundling |
| **Data** | JSON configs in `editor/conf/` — existing `conf/*.ts` untouched |
| **Runtime** | Editor loaded via `/editor/web/index.html` — separate from game |
| **Registry** | Uses existing `buildingConfigRegistry.ts` — no modifications needed |

---

## Data Flow Diagram (v4 — Corrected)

```
┌──────────────────────────────────────────────────────────────┐
│                   EXISTING CODE (Read-Only)                   │
│                                                               │
│  WcBuildConf_HouseA ──┐                                      │
│  WcBuildConf_GraveA ──┤                                      │
│  WcAsset_WallHouse  ──┤── getters: Corner, Wall, Wall_Door  │
│  WcAsset_FenceSimple ─┤── groupAsset({params})              │
│  WcAsset_Enter      ──┤── groupInit(), groupAsset()         │
│                         └─── faceLinkWeight() ──────────────┥ │
│                         └─── getFaceLinks({links}) ─────────┤ │
└─────────────────────────────────────────────────────────────┼─┘
                                                              │
                                          Runtime Extract     ▼
┌──────────────────────────────────────────────────────────────┐
│                    EDITOR (New Code)                          │
│                                                               │
│  1. EXTRACT:                                                  │
│     ConfigExtractor.extractBuilding("WcBuildConf_HouseA")    │
│       → new HouseA({}) → conf.init()                         │
│       → Read __TILE_START_RAW (entrance tiles)               │
│       → Read __TILE_LIST_RAW (all tiles)                     │
│       → Serialize: faceLinkWeight, deduplicated faceLinks    │
│       → Return BuildingConfig JSON                           │
│                                                               │
│  2. EDIT:                                                     │
│     Web UI manipulates JSON                                   │
│     - Face weights table                                      │
│     - Tile CRUD with face config (4 dirs)                     │
│     - Asset list with suffix template/raw support             │
│     - Face links as unique pairs                              │
│                                                               │
│  3. SAVE:                                                     │
│     JSON → editor/conf/buildings/HouseA.json                  │
│     JSON → editor/conf/asset-collections/WallHouse.json       │
│                                                               │
│  4. LOAD (Runtime):                                           │
│     ConfigLoader.loadBuilding("HouseA")                       │
│       → Try JSON first → deserialize to WcConfTile[]         │
│       → Expand unique faceLinks to bidirectional             │
│       → Create WcAbstractBuildConf with tiles                │
│       → conf.init() (rebuilds face index)                    │
│                                                               │
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
    ├── types.ts                       # BuildingConfig, AssetCollectionConfig, TileConfig interfaces
    ├── extractor.ts                   # ConfigExtractor with class registry
    ├── loader.ts                      # ConfigLoader: JSON → WcAbstractBuildConf
    ├── generator.ts                   # Optional: JSON → TS code generation
    ├── server.ts                      # Deno HTTP endpoints
    │
    ├── conf/                          # JSON storage (created by editor)
    │   ├── asset-collections/         # WallHouse.json, FenceSimple.json, ...
    │   ├── buildings/                 # HouseA.json, GraveA.json, ...
    │   └── registry.json              # Index of all configs
    │
    └── web/
        ├── index.html                 # Editor entry point
        ├── css/
        │   └── editor.css             # Isolated styles
        └── js/
            ├── state.ts               # Centralized state management
            ├── api.ts                 # API client
            ├── panels/
            │   ├── library.ts         # Config list sidebar
            │   ├── building.ts        # Building editor panel
            │   ├── assetCollection.ts # Asset collection editor
            │   └── tile.ts            # Tile editor modal/panel
            ├── components/
            │   ├── faceEditor.ts      # 4-face input widget
            │   ├── assetList.ts       # Asset CRUD table
            │   ├── faceLinkTable.ts   # Face link pair table (deduplicated)
            │   ├── weightTable.ts     # Weight key-value table
            │   ├── canvas2d.ts        # 2D isometric preview
            │   └── colorPicker.ts     # Color suffix (#H_C_S_B) helper
            └── services/
                ├── preview.ts         # Generation preview service
                └── assetPreview.ts    # Asset image loading service
```

---

## Testing Strategy

1. **Extraction tests**: All 6 building configs extract to valid JSON with correct structure
   - Verify faceLinkWeight contains all keys used in faceLinks
   - Verify tiles have valid face arrays (4 elements)
   - Verify deduplicated faceLinks have unique pairs

2. **Round-trip tests**: Extract → Save → Load → Generate → compare tile counts
   - Must produce identical building shape from same seed

3. **Visual tests**: Asset previews match game rendering
   - Test with known assets: roof, wall, wallDoor

4. **Constraint tests**: Face propagation works correctly in editor
   - Test bidirectional faceLinks expansion on load

5. **Isolation tests**: Game runs unchanged after adding editor
   - No imports from editor/ in game code without explicit integration

---

## Success Criteria

1. ✅ All 6 existing building configs can be extracted to JSON via UI
2. ✅ JSON configs can be loaded and used for building generation (round-trip)
3. ✅ Editor has clear sections: Library, Building Editor, Tile Editor, Asset Collection Editor
4. ✅ Face configuration visualizes 4 directions (NW, NE, SE, SW)
5. ✅ Asset preview uses game asset loader (images from `img/asset_opti/`)
6. ✅ All code isolated in `IsoGame/wcBuilding2/editor/` directory
7. ✅ Zero breaking changes to existing game functionality
8. ✅ Building generation preview renders on canvas
9. ✅ Face links stored as unique pairs, expanded to bidirectional at load time

---

## Timeline Estimate

| Phase | Description | Hours |
|-------|-------------|-------|
| 1 | Types & Extractor (corrected for getter/groupAsset patterns) | 5-6h |
| 2 | Server Endpoints | 3-4h |
| 3 | Web Shell & Library | 4-5h |
| 4 | Building Editor Panel | 5-6h |
| 5 | Tile Editor Panel | 5-6h |
| 6 | Asset Collection Editor + Preview | 4-5h |
| 7 | Config Loader | 3-4h |
| **Total** | | **~29-36 hours** |

---

## v4 Change Summary (from v3)

| Area | v3 Issue | v4 Fix |
|------|---------|--------|
| Asset Collections | Assumed uniform `groupAsset()` | Handle two patterns: getters (WallHouse) vs groupAsset() (Fence) |
| Face Keys | Treated as static | Recognize dynamic computation at getter time |
| Tile Weights | Shown in tile definitions | Track that weights come from `applyGroup()` wrapper |
| faceLinks | Single-directional | Deduplicate for storage; expand to bidirectional on load |
| mainLvl | Listed as parameter | Removed — it's a runtime value |
| Registry | Single system | Map between `indexBuildingConfigClass` and `buildingConfigRegistry` |
| Asset Suffixes | Basic description | Full format: `#H{height}_C{color}_S{saturation}_B{brightness}` |
| Tile Traceability | Not tracked | Added `sourceGetter` and `sourceTileId`/`sourceCollection` fields |
| Extraction | Simple getter call | Per-class getter list required for non-groupAsset classes |
| Timeline | 28-35h | 29-36h (slightly larger due to extraction complexity) |

---

## Next Steps

1. **Review and approve** this plan — pay special attention to the extraction complexity
2. **Create `types.ts`** — Define all JSON schema interfaces with `sourceGetter` traceability
3. **Create `extractor.ts`** — Implement runtime extraction with per-class getter lists
4. **Test extraction** — Extract HouseA, verify JSON is valid and complete
5. **Generate first JSON configs** — Extract all 6 buildings + asset collections
6. **Create `index.html`** — Start the web editor shell
7. **Build Library panel** — Show list of extractable configs
8. **Iterate through remaining panels** in order: Building → Tile → Asset Collection
9. **Implement Loader** — Enable JSON configs in game (optional, minimal changes)
10. **Test and validate** — Round-trip, isolation, visual tests