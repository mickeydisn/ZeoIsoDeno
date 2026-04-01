# Building Config Editor

A web-based editor for viewing, editing, and saving building configurations for the ZeoIsoDeno isometric game engine.

## Overview

The Building Config Editor provides a visual interface for managing building configurations that control procedural building generation in the game. It supports a complete round-trip workflow:

1. **Extract** — TypeScript building config classes are extracted into JSON at runtime
2. **Edit** — JSON configs are edited through a web UI with visual previews
3. **Save** — Edited configs are saved as JSON files
4. **Load** — JSON configs can be loaded back into the game at runtime (optional)

### Architecture

All editor code is isolated in `IsoGame/wcBuilding2/editor/`. No modifications to existing game code are required.

```
IsoGame/wcBuilding2/editor/
├── types.ts              # JSON schema interfaces
├── extractor.ts          # TS class → JSON extraction
├── loader.ts             # JSON → TS class loading (runtime)
├── integration.ts        # Optional game integration wrapper
├── server.ts             # Deno HTTP API endpoints
├── validate.ts           # Round-trip validation script
├── conf/                 # Saved JSON configs
│   ├── buildings/        # Building configs (HouseA.json, etc.)
│   └── asset-collections/ # Asset collection configs
└── web/                  # Web UI
    ├── index.html
    ├── css/editor.css
    └── js/
        ├── api.ts        # API client
        ├── state.ts      # State management
        ├── main.ts       # Entry point
        ├── components/   # Reusable UI components
        ├── panels/       # Editor panels
        └── services/     # Preview and asset services
```

## Quick Start

### 1. Start the Editor Server

```bash
# From the project root
deno run --allow-read --allow-write --allow-net IsoGame/wcBuilding2/editor/server.ts
```

Or if using the serve script:

```bash
deno run --allow-read --allow-write --allow-net IsoGame/wcBuilding2/editor/web/serveEditor.ts
```

### 2. Open the Editor

Navigate to `http://localhost:8081/editor/index.html` in your browser.

### 3. Extract Configs

In the library sidebar, click "Extract All" to extract all building configs from their TypeScript classes.

### 4. Edit Configs

Click on a building config in the library to open it in the editor. Edit parameters face weights, face links, and tiles.

### 5. Save Configs

Click "Save All" in the library panel to save all edited configs to JSON files in `conf/buildings/`.

## JSON Schema

### BuildingConfig

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
    "endLoopMax": 200
  },
  "assetCollections": [
    {
      "id": "WallHouse",
      "classRef": "WcAsset_WallHouse",
      "tag": "WH_",
      "params": { "WALL_SUFFIX": "#H210_C115_S35_B120" },
      "sourceFile": "wcAsset_WallHouse"
    }
  ],
  "faceLinkWeight": {
    "WH_out": 100,
    "WH_outD": 50,
    "WH_in": 100
  },
  "faceLinks": [
    ["WH_out", "WH_in"],
    ["WH_in", "WH_r"]
  ],
  "startTiles": [
    {
      "face": ["WH_out", null, null, null],
      "weight": 100
    }
  ],
  "tiles": [
    {
      "face": ["WH_out", "WH_in", "WH_r", "WH_l"],
      "weight": 100,
      "assets": [{ "key": "wallDoor", "sufix": "{WALL_SUFFIX}" }],
      "allowMove": false,
      "isFrise": false,
      "empty": false
    }
  ]
}
```

### Key Design Decisions

- **faceLinks stored as unique pairs**: The editor stores only unique face link pairs (no bidirectional duplicates). When loaded into the game via `ConfigLoader`, they are automatically expanded to bidirectional links.
- **mainLvl excluded**: The `mainLvl` parameter is a runtime value set during generation and is never stored in JSON.
- **sourceGetter traceability**: Tiles extracted from getter-based asset collections include a `sourceGetter` field for traceability.

## Runtime Integration (Optional)

The editor includes an optional `ConfigLoader` module that enables JSON configs to be used at runtime in the game. This is completely optional — the game works without it via the existing TypeScript class instantiation.

### Using ConfigLoader

```typescript
import { ConfigLoader } from "../editor/loader.ts";

// Load a building config, preferring JSON if available
const conf = await ConfigLoader.loadBuilding("house_a", {
  growLoopCount: 50,
  endLoopMax: 200,
});
```

### Using the Integration Wrapper

```typescript
import { wrapCreateBuilding } from "../editor/integration.ts";

// Wrap your existing building creation function
const createBuildingWithJSON = wrapCreateBuilding(originalCreateBuilding);

// Now it will try JSON first, then fall back to TS
const conf = await createBuildingWithJSON("house_a", {
  growLoopCount: 50,
  endLoopMax: 200,
});
```

### Resolution Chain

When `ConfigLoader.loadBuilding()` is called, it follows this resolution chain:

1. **JSON file** — Try `conf/buildings/{id}.json` first
2. **Registry** — Fall back to `buildingConfigRegistry.ts` if JSON not found
3. **Class name** — Try instantiating by class name pattern as last resort
4. **Error** — Throw if nothing found

## Validation

Run the validation script to verify round-trip consistency:

```bash
deno run --allow-read --allow-write --allow-net IsoGame/wcBuilding2/editor/validate.ts
```

This tests:
1. All 6 building configs extract without errors
2. All asset collections extract correctly
3. JSON configs save and reload with correct structure
4. ConfigLoader resolution chain works
5. Performance is within targets (<500ms extraction, <100ms save)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/editor/list/classes` | List extractable TS classes |
| `GET` | `/editor/list` | List existing JSON configs |
| `POST` | `/editor/extract/building/:className` | Extract building config to JSON |
| `POST` | `/editor/extract/asset-collection/:className` | Extract asset collection to JSON |
| `POST` | `/editor/save/building/:name` | Save building JSON |
| `POST` | `/editor/save/asset-collection/:name` | Save asset collection JSON |
| `POST` | `/editor/preview/generate` | Run generation preview |
| `GET` | `/editor/assets/list` | List available game assets |
| `GET` | `/editor/asset-preview/:key` | Get asset image |

## Known Limitations

- Generation preview requires a full game context (World instance, map) — preview endpoint returns tile data but cannot render the full 3D preview
- Asset collection editing is read-only for groupAsset-based collections (must re-extract after changing groupAsset params)
- Undo/redo is not implemented — changes are applied immediately and marked as dirty until saved

## Troubleshooting

### "Unknown building config class" error
Ensure the class is registered in `BUILDING_CLASSES` in `extractor.ts`.

### "Building config not found" error at runtime
Check that the JSON file exists at `conf/buildings/{id}.json` with the correct ID. IDs are case-sensitive.

### Face links not working at runtime
Verify that faceLinkWeight entries exist for all face keys used in faceLinks and tiles. Zero-weight keys are valid but won't be auto-selected.

### Tiles not rendering assets
Check that asset keys in tile definitions match available assets in `img/asset_opti/`. Use `/editor/assets/list` to see available assets.

## File Locations

| What | Path |
|------|------|
| Editor source code | `IsoGame/wcBuilding2/editor/` |
| Saved building configs | `IsoGame/wcBuilding2/editor/conf/buildings/` |
| Saved asset collection configs | `IsoGame/wcBuilding2/editor/conf/asset-collections/` |
| Web UI | `IsoGame/wcBuilding2/editor/web/` |
| Building config classes | `IsoGame/wcBuilding2/conf/buildConf_*.ts` |
| Asset collection classes | `IsoGame/wcBuilding2/conf/assetsCollection/` |
| Registry | `IsoGame/tools/buildingConfigRegistry.ts` |