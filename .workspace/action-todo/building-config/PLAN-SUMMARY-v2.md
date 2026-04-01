# Building Configuration Editor - Plan Summary v2

## Objective

Create a **standalone, isolated** web-based editor for building configurations that:
1. **Loads existing in-code configurations** (TypeScript classes) into a visual editor
2. **Saves/exports configurations** as JSON files
3. Provides a **user-friendly interface** with clear menu sections: Load/Save, Asset Group, Tile, Building
4. **Visualizes assets** using the existing asset loader system
5. **Isolates all new code** in dedicated directories — zero impact on existing game code

---

## Current State Analysis

### Existing System
- **Configuration classes** (`IsoGame/wcBuilding2/conf/`): TypeScript classes define buildings
  - `WcAbstractBuildConf`: Base class with tile generation logic
  - `WcAsset_*` classes: Asset collections (walls, fences, corridors, etc.)
  - `WcBuildConf_*` classes: Concrete building definitions (HouseA, GraveA, ManorA, etc.)
- **Factory system** (`WcBuildFactoryGenarator`): Generates buildings from configs
- **Registry** (`wcBuildAction.ts`): Hardcoded map of building config classes
- **Assets** live in `img/asset_opti/` directories (Town1, Wall, AstroBase, etc.)

### Problems
- All configs are hardcoded TypeScript — adding buildings requires code changes
- No visual preview or editing capability
- Complex class hierarchy is hard to understand for non-developers
- No JSON export/import capability

---

## Solution Architecture

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Isolated code directory** | All new code in `IsoGame/wcBuilding2/editor/` — no modifications to existing files |
| **Runtime config extraction** | Parse existing TypeScript configs by instantiating them and serializing their properties |
| **Asset loader integration** | Use existing asset paths from `img/` for visual preview |
| **JSON-first storage** | All edits saved as JSON; TypeScript code generation is optional |

### Directory Structure

```
IsoGame/wcBuilding2/
  editor/                          # ALL NEW CODE ISOLATED HERE
    configTypes.ts                 # JSON schema interfaces
    configExtractor.ts             # Extract config from TS classes at runtime
    configLoader.ts                # Load JSON configs back into game objects
    assetRegistry.ts               # Map asset keys to image paths
    
    web/
      indexBuildConfig.html        # Editor entry point (standalone page)
      css/
        editor.css                 # Editor-specific styles (no impact on game CSS)
      js/
        editor/
          main.ts                  # Entry point — initializes editor
          state.ts                 # Centralized editor state
          
          panels/
            loadSavePanel.ts       # Load/Save section UI
            assetGroupPanel.ts     # Asset Group section UI  
            tilePanel.ts           # Tile section UI
            buildingPanel.ts       # Building section UI
          
          components/
            faceSelector.ts        # 4-face key selector widget
            assetPreview.ts        # Asset thumbnail with rotation preview
            tileCanvas.ts          # Canvas-based tile grid preview
            paramEditor.ts         # Generic key-value parameter editor
            listManager.ts         # Reusable add/remove/reorder list UI
          
          services/
            configService.ts       # Load/save configs (JSON + TS extraction)
            assetService.ts        # Fetch asset list and images from loader
            previewService.ts      # Render tile/preview on canvas
            
    conf/                          # JSON config files (NEW, alongside TS)
      assets/
        WallHouse.json
        FenceSimple.json
        ...
      buildings/
        HouseA.json
        GraveA.json
        ...

web/
  indexBuildConfig.html            # Symlink or redirect to editor/indexBuildConfig.html
```

---

## JSON Schema Design

### Building Configuration JSON

```json
{
  "version": "1.0",
  "type": "building",
  "name": "HouseA",
  "classRef": "WcBuildConf_HouseA",
  "params": {
    "growLoopCount": 50,
    "endLoopMax": 2000,
    "mainLvl": null
  },
  "assetCollections": [
    {
      "class": "WcAsset_WallHouse",
      "tag": "WH_",
      "params": {
        "WALL_SUFFIX": "#H210_C115_S35_B120",
        "ROOF_SUFFIX": "#H0_S1_C128_B64"
      },
      "sourceFile": "wcAsset_WallHouse"
    }
  ],
  "faceLinkWeight": {
    "X": 0,
    "F_out": 0,
    "F_in": 5,
    "WH_out": 1,
    "WH_in": 30
  },
  "faceLinks": [
    ["X", "F_out"],
    ["F_in", "FP_out"],
    ["WH_l", "WH_r"]
  ],
  "tiles": {
    "start": [
      {
        "name": "EntranceOpen",
        "face": ["E#Open", "E#Open", "E#Door", "E#Open"],
        "weight": 0,
        "allowMove": true,
        "empty": true,
        "color": [12, 12, 16]
      }
    ],
    "list": [
      {
        "name": "WallWithDoor",
        "face": ["WH_r", "WH_in", "WH_l", "WH_outD"],
        "weight": 30,
        "assets": [
          { "key": "roof", "keyR": 3, "sufix": "#H0_S1_C128_B64", "h": 1 },
          { "key": "wallDoor", "keyR": 1, "sufix": "#H210_C115_S35_B120", "h": 0 }
        ],
        "allowMove": true,
        "isFrise": true,
        "functions": [{ "name": "actionsEmpty" }]
      }
    ]
  }
}
```

### Asset Collection JSON

```json
{
  "version": "1.0",
  "type": "assetCollection",
  "name": "WallHouse",
  "class": "WcAsset_WallHouse",
  "tag": "WH_",
  "params": {
    "WALL_SUFFIX": "#H210_C115_S35_B120",
    "ROOF_SUFFIX": "#H0_S1_C128_B64"
  },
  "tiles": [
    {
      "name": "Corner",
      "face": ["WH_r", "WH_l", "WH_out", "WH_out"],
      "weight": 0,
      "assets": [
        { "key": "roofCorner", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wallCorner", "keyR": 2, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ]
    },
    {
      "name": "Wall",
      "face": ["WH_r", "WH_in", "WH_l", "WH_out"],
      "weight": 0,
      "assets": [
        { "key": "roof", "keyR": 3, "sufix": "{ROOF_SUFFIX}", "h": 1 },
        { "key": "wall", "keyR": 1, "sufix": "{WALL_SUFFIX}", "h": 0 }
      ]
    }
  ],
  "availableAssets": {
    "roof": ["roof", "roofCorner", "roofCornerRound", "roofWindow", "roofPoint"],
    "wall": ["wall", "wallCorner", "wallDoor", "wallWindowGlass", "wallBlock"]
  }
}
```

---

## UI Design — Menu Sections

```
┌──────────────────────────────────────────────────────────────────┐
│  Building Config Editor                              [?] [⚙️]   │
├──────────────────────────────────────────────────────────────────┤
│  Sidebar                  │  Main Content                        │
│                           │                                      │
│  ┌─────────────────────┐  │  ┌──────────────────────────────┐   │
│  │ 📂 Load/Save        │  │  │  [Tab indicators: Active]    │   │
│  │   • Load from Code  │  │  │                              │   │
│  │   • Load JSON       │  │  │  ┌────────────────────────┐  │   │
│  │   • Save JSON       │  │  │  │                        │  │   │
│  │   • Save All        │  │  │  │   Active Panel         │  │   │
│  │                     │  │  │  │   (contextual view)    │  │   │
│  │                     │  │  │  │                        │  │   │
│  ├─────────────────────┤  │  │  └────────────────────────┘  │   │
│  │ 📦 Asset Groups     │  │  │                              │   │
│  │   • WallHouse       │◄─┼──│  ┌────────────────────────┐  │   │
│  │   • FenceSimple     │  │  │  │   Asset Preview Area   │  │   │
│  │   • CorridorLab     │  │  │  │   [canvas 400x300]     │  │   │
│  │   • [+ New]         │  │  │  └────────────────────────┘  │   │
│  │                     │  │  │                              │   │
│  ├─────────────────────┤  │  │  [Quick Actions Bar]         │   │
│  │ 🧱 Tile Templates   │  │  │  [+ Add Tile] [Duplicate]   │   │
│  │   • (per asset)     │◄─┼──│  [Preview Grid] [Edit Face] │   │
│  │                     │  │  │                              │   │
│  ├─────────────────────┤  │  └──────────────────────────────┘   │
│  │ 🏗️ Building        │  │                                      │
│  │   • HouseA          │  │  ┌──────────────────────────────┐   │
│  │   • GraveA          │◄─┼──│  Properties Editor            │   │
│  │   • ManorA          │  │  │  Name:  [_____________]      │   │
│  │   • [+ New]         │  │  │  Grow:  [____] End: [____]   │   │
│  └─────────────────────┘  │  └──────────────────────────────┘   │
│                           │                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Section Details

#### 1. Load/Save Section
- **Load from Code**: Instantiates existing TypeScript config classes and extracts their data into JSON format
- **Load JSON**: Browse and load `.json` files from `editor/conf/` directory
- **Save JSON**: Export current config as JSON file to `editor/conf/`
- **Save All**: Batch export all loaded configs
- **Recent Files**: Quick access to recently edited configs

#### 2. Asset Group Section
- **List** all asset collections (WallHouse, FenceSimple, etc.)
- **Select** an asset group to edit its properties:
  - Tag prefix (e.g., `WH_`)
  - Default suffixes (wall color, roof color)
  - Constructor parameters
- **Visual Preview**: Shows all tiles in the asset group as thumbnails
- **Asset Browser**: Browse available game assets from `img/asset_opti/` with search

#### 3. Tile Section
- **Tile List**: Shows all tile templates for the selected asset group
- **Tile Editor** (appears when tile is selected):
  ```
  ┌─ Tile: WallWithDoor ─────────────────────────┐
  │                                               │
  │  Face Configuration (4 sides):               │
  │  ┌─────┬─────┬─────┬─────┐                   │
  │  │  NW │  NE │  SE │  SW │                   │
  │  │WH_r │WH_in│WH_l │WH_outD│                  │
  │  └─────┴─────┴─────┴─────┘                   │
  │                                               │
  │  Weight: [30] ────────────                    │
  │                                               │
  │  Assets:                                      │
  │  ┌─────────────────────────────────────────┐  │
  │  │ [roof] R:[3] [#H0_S1_C128_B64] H:[1]   │  │
  │  │ [wallDoor] R:[1] [#H210...] H:[0]      │  │
  │  │ [+ Add Asset]                           │  │
  │  └─────────────────────────────────────────┘  │
  │                                               │
  │  ☐ Allow Move  ☑ Is Frise  ☐ Empty           │
  │                                               │
  │  Preview: [2D isometric tile preview]         │
  │                                               │
  └───────────────────────────────────────────────┘
  ```

#### 4. Building Section
- **Building List**: Shows all building configs (HouseA, GraveA, ManorA, etc.)
- **Building Editor**:
  ```
  ┌─ Building: HouseA ───────────────────────────┐
  │                                               │
  │  Basic Settings:                             │
  │  Name: [HouseA________]                      │
  │  Grow Loop Count: [50]    End Loop Max: [2000]│
  │  Main Level: [____] (optional)               │
  │                                               │
  │  Referenced Asset Groups:                    │
  │  ┌─────────────────────────────────────────┐  │
  │  │ WallHouse    [edit] [remove]            │  │
  │  │ FenceSimple  [edit] [remove]            │  │
  │  │ FencePlatform [edit] [remove]           │  │
  │  │ Entrance     [edit] [remove]            │  │
  │  │ [+ Add Asset Group]                     │  │
  │  └─────────────────────────────────────────┘  │
  │                                               │
  │  Face Link Weights:                          │
  │  ┌─────────────────┬────────┐                │
  │  │ Face Key        │ Weight │                │
  │  ├─────────────────┼────────┤                │
  │  │ X               │   0    │                │
  │  │ F_out           │   0    │                │
  │  │ F_in            │   5    │                │
  │  │ WH_out          │   1    │                │
  │  │ WH_in           │  30    │                │
  │  └─────────────────┴────────┘                │
  │  [+ Add Face Key]                            │
  │                                               │
  │  Face Links (connections):                   │
  │  ┌─────────────────┬─────────────────┐       │
  │  │ From            │ To              │       │
  │  ├─────────────────┼─────────────────┤       │
  │  │ X               │ F_out           │       │
  │  │ F_in            │ FP_out          │       │
  │  │ WH_l            │ WH_r            │       │
  │  └─────────────────┴─────────────────┘       │
  │  [+ Add Link]                                │
  │                                               │
  │  Tile Lists:                                 │
  │  [Start Tiles (1)]    [Regular Tiles (24)]   │
  │                                               │
  │  Generation Preview:                         │
  │  [▶ Run Preview]  [Clear]                    │
  │  [Canvas showing generated building grid]    │
  │                                               │
  └───────────────────────────────────────────────┘
  ```

---

## Implementation Plan

### Phase 1: Infrastructure — Config Extractor & Types (4-5h)

**Goal**: Extract existing TypeScript configs into JSON format without modifying any existing code.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/configTypes.ts` — TypeScript interfaces for all JSON schemas
2. `IsoGame/wcBuilding2/editor/configExtractor.ts` — Runtime extraction logic
3. `IsoGame/wcBuilding2/editor/assetRegistry.ts` — Maps asset keys to image paths

**How extraction works**:
```typescript
// configExtractor.ts
class ConfigExtractor {
  // Instantiate a TS config class and serialize its state
  static extractBuilding(conf: WcAbstractBuildConf): BuildingConfigJSON {
    conf.init(); // Run init to populate tile options
    
    return {
      version: "1.0",
      type: "building",
      params: {
        growLoopCount: conf.growLoopCount,
        endLoopMax: conf.endLoopMax,
        mainLvl: conf.mainLvl ?? null,
      },
      faceLinkWeight: conf.faceLinkWeight,
      faceLinks: conf.faceLinks,
      tiles: {
        start: conf.startTileOptions.map(this.tileToJSON),
        list: conf.listTileOptions.map(this.tileToJSON),
      },
    };
  }

  // Extract asset collection config
  static extractAssetCollection(asset: any): AssetCollectionJSON {
    return {
      version: "1.0",
      type: "assetCollection", 
      tag: asset.tag,
      params: this.extractParams(asset),
      tiles: this.extractAssetTiles(asset),
    };
  }
}
```

**Key insight**: We extract at runtime by instantiating the existing classes — no parsing of TypeScript source needed.

### Phase 2: Web Editor — Shell & Load/Save (4-5h)

**Goal**: Create the HTML shell with sidebar navigation and Load/Save functionality.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/indexBuildConfig.html` — Main page
2. `IsoGame/wcBuilding2/editor/web/css/editor.css` — Isolated styles
3. `IsoGame/wcBuilding2/editor/web/js/editor/main.ts` — Entry point
4. `IsoGame/wcBuilding2/editor/web/js/editor/state.ts` — Centralized state
5. `IsoGame/wcBuilding2/editor/web/js/editor/services/configService.ts` — Load/save logic
6. `IsoGame/wcBuilding2/editor/web/js/editor/panels/loadSavePanel.ts` — Load/Save UI

**Load/Save flow**:
```
User clicks "Load from Code"
  → Fetch /editor/extract-config?type=building&name=HouseA
  → Server instantiates WcBuildConf_HouseA
  → ConfigExtractor serializes to JSON
  → Editor receives JSON and populates state
  
User clicks "Save JSON"
  → Editor serializes current state to JSON blob
  → POST /editor/save-config
  → Server writes to editor/conf/buildings/HouseA.json
```

### Phase 3: Asset Group Panel & Asset Preview (5-6h)

**Goal**: Full Asset Group editing with visual asset previews from the game's asset loader.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/editor/services/assetService.ts` — Fetch asset list/images
2. `IsoGame/wcBuilding2/editor/web/js/editor/panels/assetGroupPanel.ts` — Asset Group UI
3. `IsoGame/wcBuilding2/editor/web/js/editor/components/assetPreview.ts` — Asset thumbnail preview
4. `IsoGame/wcBuilding2/editor/web/js/editor/components/paramEditor.ts` — Parameter editor widget

**Asset visualization**:
- Assets are loaded from `img/asset_opti/{group}/{name}.png`
- Asset preview component renders thumbnails in a grid
- Selecting an asset shows it in larger preview with rotation options
- Color suffix preview using canvas hue/saturation filters

### Phase 4: Tile Panel — Tile Template Editor (5-6h)

**Goal**: Edit individual tile templates with face configuration, assets, and properties.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/editor/panels/tilePanel.ts` — Tile panel UI
2. `IsoGame/wcBuilding2/editor/web/js/editor/components/faceSelector.ts` — 4-face selector widget
3. `IsoGame/wcBuilding2/editor/web/js/editor/components/tileCanvas.ts` — Canvas tile preview
4. `IsoGame/wcBuilding2/editor/web/js/editor/components/listManager.ts` — Reusable list UI

**Tile editor features**:
- **Face Selector**: 4 dropdown inputs (NW, NE, SE, SW) with auto-complete from existing face keys
- **Asset List**: Add/remove/reorder assets per tile with dropdown from available assets
- **Property Toggles**: Allow Move, Is Frise, Empty checkboxes
- **Canvas Preview**: 2D isometric preview of tile with assigned assets

### Phase 5: Building Panel — Full Building Editor (5-6h)

**Goal**: Complete building configuration editor with generation preview.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/web/js/editor/panels/buildingPanel.ts` — Building panel UI
2. `IsoGame/wcBuilding2/editor/web/js/editor/services/previewService.ts` — Generation preview renderer

**Building editor features**:
- **Basic Settings**: Name, grow loop count, end loop max
- **Asset References**: Select and configure asset collections
- **Face Link Weights**: Table editor for face key weights
- **Face Links**: Connection table (from → to)
- **Tile Lists**: Link to tile editor for start and regular tiles
- **Generation Preview**: Run building generation algorithm and render result on canvas

### Phase 6: Config Loader — JSON to Runtime (3-4h)

**Goal**: Load JSON configs back into the game at runtime.

**Files to create**:
1. `IsoGame/wcBuilding2/editor/configLoader.ts` — JSON config loader

**How loading works**:
```typescript
// configLoader.ts
class ConfigLoader {
  // Build a config object from JSON
  static async loadBuildingConfig(name: string): Promise<WcAbstractBuildConf> {
    const json = await this.fetchJSON(`/editor/conf/buildings/${name}.json`);
    return this.buildFromJSON(json);
  }

  private static buildFromJSON(json: BuildingConfigJSON): WcAbstractBuildConf {
    const conf = new WcAbstractBuildConf({
      growLoopCount: json.params.growLoopCount,
      endLoopMax: json.params.endLoopMax,
    });
    
    conf.faceLinkWeight = json.faceLinkWeight;
    conf.faceLinks = json.faceLinks;
    
    // Rebuild tile options from JSON
    conf.__setTileOptionsFromJSON(json.tiles);
    
    conf.init();
    return conf;
  }
}
```

**Integration** (minimal change to existing code):
```typescript
// wcBuildAction.ts — ONLY modification to existing code
// Add JSON config support alongside existing class registry:
const jsonConfigLoader = new JsonConfigLoader();
const indexBuildingConfigClass = {
  ...existingClassMap,  // Existing TS classes
  ...await jsonConfigLoader.loadAll(),  // JSON configs merged in
};
```

---

## Communication Between Server and Editor

### API Endpoints (New — Isolated)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/editor/extract-config` | GET | Extract TS config to JSON (type: building/asset, name) |
| `/editor/save-config` | POST | Save JSON config to disk |
| `/editor/list-configs` | GET | List all configs (TS + JSON) with metadata |
| `/editor/assets/list` | GET | List available game assets |
| `/editor/assets/image` | GET | Fetch asset image by key |
| `/editor/preview/generate` | POST | Run building generation and return tile data |
| `/editor/preview/render` | GET | Render generation result to PNG |

These endpoints are implemented in a new file: `IsoGame/wcBuilding2/editor/editorRoutes.ts` — no modifications to existing server routes.

---

## Isolation Guarantees

| Aspect | Approach |
|--------|----------|
| **Server code** | New endpoints in `editor/editorRoutes.ts` only — no changes to `webServer.ts` or existing handlers |
| **Game code** | `configLoader.ts` adds to existing registry — no modifications to `wcBuildAction.ts` structure |
| **CSS** | Editor styles in `editor/web/css/editor.css` — no changes to `stylesIso.css` |
| **Build** | Editor bundled separately via esbuild — no impact on game bundle |
| **Data** | JSON configs stored in `editor/conf/` — existing `conf/*.ts` files untouched |
| **Runtime** | Editor loaded via `/web/indexBuildConfig.html` — separate from game page |

---

## File Structure Summary

```
IsoGame/wcBuilding2/
  editor/
    ├── configTypes.ts              # JSON schema interfaces
    ├── configExtractor.ts          # TS → JSON extraction
    ├── configLoader.ts             # JSON → TS loading
    ├── assetRegistry.ts            # Asset key → path mapping
    ├── conf/                       # JSON config storage
    │   ├── assets/                 # Asset collection JSONs
    │   └── buildings/              # Building config JSONs
    └── web/
        ├── indexBuildConfig.html   # Editor entry page
        ├── css/
        │   └── editor.css          # Isolated styles
        └── js/
            └── editor/
                ├── main.ts         # Entry point
                ├── state.ts        # Centralized state
                ├── panels/
                │   ├── loadSavePanel.ts
                │   ├── assetGroupPanel.ts
                │   ├── tilePanel.ts
                │   └── buildingPanel.ts
                ├── components/
                │   ├── faceSelector.ts
                │   ├── assetPreview.ts
                │   ├── tileCanvas.ts
                │   ├── paramEditor.ts
                │   └── listManager.ts
                └── services/
                    ├── configService.ts
                    ├── assetService.ts
                    └── previewService.ts
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| HTML | W3.CSS (consistent with existing `indexIso.html`) |
| CSS | Custom in `editor.css` — no game CSS modifications |
| Script | TypeScript (bundled with esbuild, same as existing build) |
| Canvas | HTML5 Canvas 2D for tile/preview rendering |
| Storage | JSON files on disk + LocalStorage for editor state |
| Server | Deno HTTP routes (isolated in `editorRoutes.ts`) |

---

## Testing Strategy

1. **Extraction tests**: Verify all 6 existing building configs extract to valid JSON
2. **Round-trip tests**: Extract → Save → Load → Generate → compare with original
3. **Visual tests**: Asset previews match game rendering
4. **Isolation tests**: Game still works after adding editor — no side effects
5. **UI tests**: Each panel works independently

---

## Success Criteria

1. ✅ All existing building configs can be extracted to JSON via UI
2. ✅ JSON configs can be loaded and used for building generation
3. ✅ Editor has 4 clear sections: Load/Save, Asset Group, Tile, Building
4. ✅ Asset preview uses game asset loader (images from `img/`)
5. ✅ All code isolated in `IsoGame/wcBuilding2/editor/` directory
6. ✅ Zero breaking changes to existing game functionality
7. ✅ Configurations save as clean, readable JSON files
8. ✅ Building editor provides visual preview of generation result

---

## Timeline Estimate

| Phase | Description | Hours |
|-------|-------------|-------|
| 1 | Config Extractor & Types | 4-5h |
| 2 | Web Editor Shell & Load/Save | 4-5h |
| 3 | Asset Group Panel & Preview | 5-6h |
| 4 | Tile Panel — Template Editor | 5-6h |
| 5 | Building Panel — Full Editor | 5-6h |
| 6 | Config Loader — JSON Runtime | 3-4h |
| **Total** | | **~26-32 hours** |

---

## Next Steps

1. **Review and approve** this plan
2. **Create `configTypes.ts`** — Define all JSON schema interfaces
3. **Create `configExtractor.ts`** — Implement runtime extraction logic
4. **Generate first JSON configs** — Extract HouseA and WallHouse as examples
5. **Create `indexBuildConfig.html`** — Start the web editor shell
6. **Build Load/Save panel** — First functional UI section
7. **Iterate through remaining panels** in order: Asset Group → Tile → Building
8. **Implement ConfigLoader** — Enable JSON configs in game
9. **Test and validate** — Round-trip, isolation, visual tests