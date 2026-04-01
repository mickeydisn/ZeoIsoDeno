# Product Requirements Document (PRD) — Building Configuration Editor
## Version 1.0

---

## Table of Contents
1. [Overview](#1-overview)
2. [Goals & Objectives](#2-goals--objectives)
3. [Target Users](#3-target-users)
4. [Scope & Boundaries](#4-scope--boundaries)
5. [Architecture Summary](#5-architecture-summary)
6. [Data Model](#6-data-model)
7. [User Stories](#7-user-stories)
   - [Epic A: Foundation & Extraction](#epic-a-foundation--extraction)
   - [Epic B: Web Editor Shell](#epic-b-web-editor-shell)
   - [Epic C: Building Configuration Editor](#epic-c-building-configuration-editor)
   - [Epic D: Tile Editor](#epic-d-tile-editor)
   - [Epic E: Asset Collection Editor](#epic-e-asset-collection-editor)
   - [Epic F: Preview & Validation](#epic-f-preview--validation)
   - [Epic G: Runtime Integration](#epic-g-runtime-integration)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Timeline & Milestones](#10-timeline--milestones)
11. [Appendix: Technical Reference](#11-appendix-technical-reference)

---

## 1. Overview

### 1.1 Product Description
The Building Configuration Editor is a web-based tool for creating, viewing, and editing building configurations used in the ZeoIsoDeno isometric game. The editor provides a visual interface to manage procedurally generated building types (houses, manors, labs, graveyards) and their constituent asset collections (walls, fences, corridors, entrances).

### 1.2 Problem Statement
Currently, building configurations are defined as TypeScript classes with hardcoded tile definitions, face constraints, and weight parameters. Modifying these requires:
- Direct TypeScript code changes
- Deep understanding of the constraint propagation algorithm
- Manual management of face compatibility rules
- No visual preview of the generated buildings

This creates a high barrier to entry for level designers and makes iterating on building designs slow and error-prone.

### 1.3 Solution
A web-based editor that:
1. **Extracts** existing TypeScript configurations into JSON format via runtime instantiation
2. **Edits** configurations through a visual interface with structured forms
3. **Saves** configurations as JSON files for version control
4. **Previews** generated buildings using 2D canvas rendering
5. **Loads** JSON configs back into the game at runtime (optional integration)

### 1.4 Context
This is a companion tool to the ZeoIsoDeno game. It follows the existing Deno-based architecture and isolates all editor code in `IsoGame/wcBuilding2/editor/`.

---

## 2. Goals & Objectives

### 2.1 Primary Goals
| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | Extract all 6 existing building configs to valid JSON | All 6 configs extract without errors |
| P0 | Edit building parameters, face weights, and face links | UI renders editable tables for all properties |
| P0 | Edit individual tiles with face config, assets, functions | Tile editor modal with full CRUD |
| P0 | Save edited configs as JSON files to disk | JSON files written to `editor/conf/` |
| P1 | Preview generated buildings on canvas | "Run Generation" produces visual output |
| P1 | Edit asset collections with parameter management | Color suffix and param editing UI |
| P2 | Load JSON configs at runtime in the game | Round-trip: extract → edit → save → load → generate |

### 2.2 Non-Goals (Out of Scope)
- Modifying the building generation algorithm itself
- Adding new building types beyond the 6 existing ones
- 3D preview (only 2D isometric canvas)
- Multi-user collaboration or version history
- Importing external building configs (only extraction from existing TS)
- Modifying the existing TypeScript config classes

---

## 3. Target Users

### 3.1 User Personas

| Persona | Role | Technical Skill | Primary Use Case |
|---------|------|-----------------|------------------|
| **Game Developer** | Programmer | High | Extract configs, validate JSON round-trip, debug generation |
| **Level Designer** | Designer | Medium | Adjust tile weights, face links, and colors to create building variants |
| **Artist** | Asset Creator | Low-Medium | Preview how assets look in tiles, adjust color suffixes |

### 3.2 User Journeys

**Journey 1: Extract and Iterate**
1. Developer starts the editor
2. Clicks "Extract TS → HouseA"
3. JSON is generated and displayed in the editor
4. Developer modifies tile weights (e.g., increase door frequency)
5. Saves to `buildings/HouseA_variant.json`
6. Runs generation preview to verify changes
7. Config is ready for runtime use

**Journey 2: Edit Asset Collection**
1. Designer opens WallHouse collection from library
2. Adjusts the `WALL_SUFFIX` color parameter
3. Saves collection
4. Changes propagate to all buildings using that collection
5. Previews affected building to verify

---

## 4. Scope & Boundaries

### 4.1 In-Scope Features
- Runtime extraction of TS config classes to JSON
- JSON-first editing with TypeScript code generation (optional output)
- Web-based UI with library sidebar, main editor, and modal panels
- 2D isometric canvas preview
- Configuration storage in `IsoGame/wcBuilding2/editor/conf/`
- Deno HTTP server endpoints for all operations
- Config loader for optional runtime JSON integration

### 4.2 Out-of-Scope Features
- Modifying `wcAbstractBuildConf.ts`, `wcBuildFactory.ts`, `wcBuildTile.ts`, or asset collection classes
- Changes to game rendering logic
- Database or external storage (JSON files on disk only)
- Authentication or access control
- Undo/redo (state is in-memory; save is the persistence point)
- Export to other formats (PNG, SVG, etc.)

### 4.3 Isolation Guarantees

| Aspect | Approach |
|--------|----------|
| **Server code** | New endpoints in `editor/server.ts` — mounted separately from game routes |
| **Game code** | `loader.ts` wraps existing registry — optional, no forced changes |
| **CSS** | All styles in `editor/web/css/editor.css` — no game CSS modifications |
| **Data** | JSON configs in `editor/conf/` — existing `conf/*.ts` untouched |
| **Runtime** | Editor served statically at `/editor/web/index.html` — separate from game page |
| **Registry** | Reads existing `indexBuildingConfigClass` and `buildingConfigRegistry` — no modifications |

---

## 5. Architecture Summary

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Library   │  │ Main Editor  │  │ Preview Canvas (2D)   │ │
│  │ Panel     │  │ Panel(s)     │  │                       │ │
│  └───────────┘  └──────────────┘  └───────────────────────┘ │
│                          │                                    │
│                    API Client (fetch)                         │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────┼───────────────────────────────────┐
│                        DENO SERVER                           │
│  ┌─────────────────────────┐                                 │
│  │ Server Endpoints        │                                 │
│  │ - /editor/list          │                                 │
│  │ - /editor/extract/*     │                                 │
│  │ - /editor/save/*        │                                 │
│  │ - /editor/preview        │                                 │
│  └──────────┬──────────────┘                                 │
│             │                                                 │
│  ┌──────────┴──────────────┐  ┌────────────────────────────┐ │
│  │ ConfigExtractor         │  │ PreviewService             │ │
│  │ (TS Class → JSON)       │  │ (JSON → Generation Result) │ │
│  └──────────┬──────────────┘  └────────────────────────────┘ │
│             │                                                 │
│  ┌──────────┴──────────────────────────────────────────────┐  │
│  │               EXISTING GAME CLASSES (Read-Only)          │ │
│  │  WcBuildConf_HouseA, WcAsset_WallHouse, etc.             │ │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Directory Structure

```
IsoGame/wcBuilding2/editor/
├── types.ts                    # JSON schema interfaces
├── extractor.ts                # Runtime: TS class → JSON
├── loader.ts                   # Runtime: JSON → WcAbstractBuildConf
├── server.ts                   # Deno HTTP endpoints
│
├── conf/                       # JSON config storage (auto-created)
│   ├── asset-collections/      # WallHouse.json, FenceSimple.json, ...
│   ├── buildings/              # HouseA.json, GraveA.json, ...
│   └── registry.json           # Index of all configs
│
└── web/
    ├── index.html              # Editor entry point
    ├── css/
    │   └── editor.css          # Isolated styles
    └── js/
        ├── state.ts            # Centralized state management
        ├── api.ts              # API client (fetch wrapper)
        │
        ├── panels/
        │   ├── library.ts      # Left sidebar: config list
        │   ├── building.ts     # Main: Building config editor
        │   ├── assetCollection.ts # Main: Asset collection editor
        │   └── tile.ts         # Modal/Panel: Tile editor
        │
        ├── components/
        │   ├── faceEditor.ts   # 4-face input widget (NW, NE, SE, SW)
        │   ├── assetList.ts    # Add/remove/reorder assets
        │   ├── faceLinkTable.ts # Face links editor (unique pairs)
        │   ├── weightTable.ts  # Face key weight table
        │   ├── canvas2d.ts     # 2D tile/preview rendering
        │   └── colorPicker.ts  # Color suffix (#H_C_S_B) helper
        │
        └── services/
            ├── preview.ts      # Generation preview service
            └── assetPreview.ts # Load asset images for preview
```

---

## 6. Data Model

### 6.1 Asset Collection JSON Schema

```typescript
interface AssetCollectionConfig {
  version: "1.0";
  type: "assetCollection";
  id: string;                    // e.g., "WallHouse"
  metadata: {
    classRef: string;            // e.g., "WcAsset_WallHouse"
    sourceFile: string;          // e.g., "wcAsset_WallHouse"
  };
  tag: string;                   // e.g., "WH_"
  params: Record<string, string>; // e.g., { WALL_SUFFIX: "#H210...", ROOF_SUFFIX: "..." }
  paramsSchema: Record<string, {
    type: "color" | "string";
    label: string;
  }>;
  tiles: TileConfig[];
}
```

### 6.2 Building Configuration JSON Schema

```typescript
interface BuildingConfig {
  version: "1.0";
  type: "building";
  id: string;                    // e.g., "HouseA"
  metadata: {
    classRef: string;            // e.g., "WcBuildConf_HouseA"
    sourceFile: string;          // e.g., "buildConf_HouseA"
    registryId: string;          // e.g., "house_a" (from buildingConfigRegistry.ts)
  };
  params: {
    growLoopCount: number;       // Number of grow iterations (5-100)
    endLoopMax: number;          // Max close iterations (50-1000)
  };
  assetCollections: AssetCollectionRef[];
  faceLinkWeight: Record<string, number>; // Face key → weight
  faceLinks: [string, string][];            // Unique pairs (expanded to bidirectional at load)
  startTiles: TileConfig[];
  tiles: TileConfig[];
}

interface AssetCollectionRef {
  id: string;
  classRef: string;
  tag: string;
  params: Record<string, string>;
  sourceFile: string;
}

interface TileConfig {
  id?: string;
  face: [string | null, string | null, string | null, string | null]; // [NW, NE, SE, SW]
  weight: number;
  assets?: WcConfTileAsset[];
  functions?: WcConfTileFunction[];
  allowMove?: boolean;
  isFrise?: boolean;
  empty?: boolean;
  color?: [number, number, number];
  colorT?: [number, number, number];
  h?: number;
  lvl?: number;
  // Traceability
  sourceGetter?: string;
  sourceTileId?: string;
  sourceCollection?: string;
}

interface WcConfTileAsset {
  key?: string;       // Asset key (e.g., "wallDoor")
  keyR?: number;      // Rotation index 0-3
  sufix?: string;     // Color filter (#H210_C115_S35_B120 or {PARAM_REF})
  h?: number;         // Height layer 0, 1, 2
  off?: { x: number; y: number };
}

interface WcConfTileFunction {
  func: string;       // e.g., "lvlAvgSquare"
  size?: number;      // e.g., 5
}
```

### 6.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `faceLinks` stored as unique pairs | Runtime doubles them (bidirectional); storage should be deduplicated |
| `weight` on TileConfig | Weight is applied by `applyGroup()` wrapper at extraction; tiles carry the resolved weight |
| `sourceGetter` / `sourceTileId` / `sourceCollection` | Traceability — essential for regeneration and understanding tile origins |
| `params` with `{PARAM_REF}` syntax in assets | Preserves template references so color changes propagate to all tiles |
| `registryId` in metadata | Maps JSON configs to `buildingConfigRegistry.ts` at runtime |
| `mainLvl` NOT in JSON | It's a runtime value set during generation, not a configuration parameter |

---

## 7. User Stories

### EPIC A: Foundation & Extraction

---

#### Story A.1: JSON Schema Types Definition
| Field | Value |
|-------|-------|
| **ID** | A.1 |
| **Title** | Define JSON Schema Type Interfaces |
| **Story** | As a developer, I need TypeScript interfaces for all JSON config structures, so that the editor has a type-safe foundation |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `types.ts` |
| **Acceptance Criteria** | |
| 1 | `BuildingConfig` interface matches the JSON schema defined in Section 6.2 |
| 2 | `AssetCollectionConfig` interface matches Section 6.1 |
| 3 | `TileConfig`, `WcConfTileAsset`, `WcConfTileFunction` interfaces match `WcConfTile` from `wcAbstractBuildConf.ts` |
| 4 | `AssetCollectionRef` interface for building→collection references |
| 5 | All types compile without errors |
| **Dependencies** | None (first file to implement) |
| **Notes** | Must add `sourceGetter`, `sourceTileId`, `sourceCollection` fields for traceability (v4 correction) |

---

#### Story A.2: Config Extractor — Building Classes
| Field | Value |
|-------|-------|
| **ID** | A.2 |
| **Title** | Implement Runtime Extraction for Building Configs |
| **Story** | As a developer, I need to extract all 6 existing TypeScript building configs into JSON format at runtime, so that the editor can work with JSON representations |
| **Priority** | P0 |
| **Effort** | 4h |
| **Module** | `extractor.ts` |
| **Acceptance Criteria** | |
| 1 | `ConfigExtractor.extractBuilding(className, params?)` instantiates the TS config class and returns valid `BuildingConfig` JSON |
| 2 | `startTileOptions` extracted from `__TILE_START_RAW` or `__TILE_START` |
| 3 | `listTileOptions` extracted from `__TILE_LIST_RAW` or `__TILE_LIST` |
| 4 | `faceLinkWeight` copied directly from config instance |
| 5 | `faceLinks` deduplicated (unique pairs only — bidirectional pairs removed) |
| 6 | `metadata.registryId` correctly mapped to `buildingConfigRegistry.ts` IDs |
| 7 | All 6 building classes are extractable: HouseA, GraveA, ManorA, LabBorderA, LabPipeA, RLabA |
| 8 | `mainLvl` is NOT included in the extracted JSON (runtime value) |
| **Dependencies** | Story A.1 (types) |
| **Notes** | Must call `conf.init()` before extraction to populate `listTileOptions` and `startTileOptions`. Face links are doubled in init(), so deduplication is critical. |

---

#### Story A.3: Config Extractor — Asset Collections
| Field | Value |
|-------|-------|
| **ID** | A.3 |
| **Title** | Implement Runtime Extraction for Asset Collections |
| **Story** | As a developer, I need to extract asset collections using two different patterns (getter-based and groupAsset-based), so that all tile data is captured correctly |
| **Priority** | P0 |
| **Effort** | 4h |
| **Module** | `extractor.ts` |
| **Acceptance Criteria** | |
| 1 | Getter-based extraction for `WcAsset_WallHouse`, `WcAsset_WallManor`, `WcAsset_WallRLab` works by iterating known getter names (Corner, Wall_Door, etc.) |
| 2 | Group-based extraction for `WcAsset_FenceSimple`, `WcAsset_FencePlatform`, `WcAsset_FenceGrave` calls `groupAsset({flatW, cornerW, innerW, isFrise})` |
| 3 | Special handling for `WcAsset_Enter` with `groupInit()` and `groupAsset()` |
| 4 | `tag` and `params` (WALL_SUFFIX, ROOF_SUFFIX, etc.) captured in JSON |
| 5 | Each extracted tile includes `sourceGetter` field indicating origin |
| 6 | `paramsSchema` defines UI hints (color type for suffix params) |
| 7 | All 10 asset collection classes extractable |
| **Dependencies** | Story A.1 (types) |
| **Notes** | CRITICAL: Wall-based classes do NOT have `groupAsset()` — they expose individual getters. This is the v4 correction from the plan. Must maintain a per-class getter map: ```ts const WALLHOUSE_GETTERS = ["Corner", "Corner_B", "Wall", "Wall_Door", ...] ``` |

---

#### Story A.4: Server Endpoints
| Field | Value |
|-------|-------|
| **ID** | A.4 |
| **Story** | As a developer, I need Deno HTTP endpoints to serve the editor UI and handle extract/save/preview operations, so that the web interface can communicate with the backend |
| **Priority** | P0 |
| **Effort** | 3h |
| **Module** | `server.ts` |
| **Acceptance Criteria** | |
| 1 | `GET /editor/list` returns all configs (TS extractable + existing JSON) |
| 2 | `GET /editor/list/classes` returns all extractable TS class names |
| 3 | `POST /editor/extract/building/:className` extracts TS class to JSON |
| 4 | `POST /editor/extract/asset-collection/:className` extracts TS asset collection to JSON |
| 5 | `POST /editor/save/building/:name` writes JSON to `conf/buildings/{name}.json` |
| 6 | `POST /editor/save/asset-collection/:name` writes JSON to `conf/asset-collections/{name}.json` |
| 7 | `POST /editor/preview/generate` runs building generation and returns tile grid |
| 8 | `GET /editor/assets/list` returns available game assets from `img/asset_opti/` |
| 9 | `GET /editor/asset-preview/:key` returns asset image data |
| 10 | Endpoints are mounted separately from game routes |
| **Dependencies** | Stories A.2, A.3 (extraction) |
| **Notes** | Server should be compatible with existing `webServer.ts` pattern. The preview endpoint should accept a JSON config and return the result of running `WcBuildFactoryGenarator.start2()` on it. |

---

### EPIC B: Web Editor Shell

---

#### Story B.1: Editor HTML Entry Point
| Field | Value |
|-------|-------|
| **ID** | B.1 |
| **Title** | Create Editor HTML Entry Point |
| **Story** | As a user, I need a clean HTML page that serves as the entry point for the Building Configuration Editor, so that I can access the tool |
| **Priority** | P0 |
| **Effort** | 1h |
| **Module** | `web/index.html` |
| **Acceptance Criteria** | |
| 1 | Page loads without errors at `/editor/web/index.html` |
| 2 | Page has the header bar with title "Building Config Editor" |
| 3 | Left sidebar div for library panel |
| 4 | Main content div for editor panels |
| 5 | Modal container div for tile/asset editors |
| 6 | Loading indicator during data fetch |
| 7 | Error display area for API failures |
| 8 | Page references bundled/inline JS and CSS files |
| **Dependencies** | Story A.4 (server endpoints) |
| **Notes** | Keep style consistent with existing `indexIso.html` patterns. Dark theme preferred. |

---

#### Story B.2: State Management
| Field | Value |
|-------|-------|
| **ID** | B.2 |
| **Title** | Implement Centralized State Management |
| **Story** | As a developer, I need a centralized state store so that editor panels share consistent data and react to changes |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `web/js/state.ts` |
| **Acceptance Criteria** | |
| 1 | State has `configs.buildings[]` and `configs.assetCollections[]` arrays |
| 2 | State has `activeConfig` with `type`, `id`, `data` (BuildingConfig or AssetCollectionConfig), and `isDirty` flag |
| 3 | State has `ui.editingTile`, `ui.showTileEditor`, `ui.showAssetCollectionEditor` for modal control |
| 4 | State has `ui.libraryFilter` string for search |
| 5 | `subscribe()` pattern for panel re-renders on state change |
| 6 | `saveConfig()` posts JSON to API and marks `isDirty = false` |
| 7 | `loadConfigs()` fetches from `/editor/list` |
| 8 | State is persisted in memory (no localStorage) |
| **Dependencies** | Story A.1 (types) |
| **Notes** | Keep it simple — a pub/sub pattern is sufficient. No need for Redux-like complexity. |

---

#### Story B.3: API Client
| Field | Value |
|-------|-------|
| **ID** | B.3 |
| **Title** | Implement API Client |
| **Story** | As a developer, I need a typed API client wrapper so that all editor panels use consistent fetch calls with error handling |
| **Priority** | P0 |
| **Effort** | 1.5h |
| **Module** | `web/js/api.ts` |
| **Acceptance Criteria** | |
| 1 | `api.listConfigs()` → GET /editor/list |
| 2 | `api.listClasses()` → GET /editor/list/classes |
| 3 | `api.extractBuilding(className)` → POST /editor/extract/building/:className |
| 4 | `api.extractAssetCollection(className)` → POST /editor/extract/asset-collection/:className |
| 5 | `api.saveBuilding(name, config)` → POST /editor/save/building/:name |
| 6 | `api.saveAssetCollection(name, config)` → POST /editor/save/asset-collection/:name |
| 7 | `api.previewGenerate(config)` → POST /editor/preview/generate |
| 8 | `api.listAssets()` → GET /editor/assets/list |
| 9 | All methods return typed responses |
| 10 | Errors caught with user-friendly message |
| **Dependencies** | Story A.4 (server endpoints), Story A.1 (types) |

---

#### Story B.4: Library Panel
| Field | Value |
|-------|-------|
| **ID** | B.4 |
| **Title** | Build Library Sidebar Panel |
| **Story** | As a user, I need a searchable left sidebar listing all configs (TS extractable and existing JSON), so that I can quickly select what to edit |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `web/js/panels/library.ts` |
| **Acceptance Criteria** | |
| 1 | Sidebar renders with search/filter input at top |
| 2 | Items grouped into sections: "Buildings (TS)", "Buildings (JSON)", "Asset Collections (TS)", "Asset Collections (JSON)" |
| 3 | Each item shows: icon (🏗️ building, 📦 asset), name, and status (JSON exists / TS only) |
| 4 | Clicking an item loads it into `activeConfig` state |
| 5 | Filter input filters items by name (case-insensitive) |
| 6 | Action buttons at bottom: "Extract All", "Save All", "Export All" |
| 7 | Panel subscribes to state and re-renders on updates |
| **Dependencies** | Stories B.1, B.2, B.3 |
| **Notes** | Items should show different colors for: unsaved edits (yellow), saved (green), error (red) |

---

### EPIC C: Building Configuration Editor

---

#### Story C.1: Building Parameters Section
| Field | Value |
|-------|-------|
| **ID** | C.1 |
| **Title** | Building Parameters Editor |
| **Story** | As a level designer, I need to edit the building generation parameters, so that I can control how buildings are generated |
| **Priority** | P0 |
| **Effort** | 1.5h |
| **Module** | `web/js/panels/building.ts` |
| **Acceptance Criteria** | |
| 1 | "Parameters" section visible when a building config is active |
| 2 | `growLoopCount` editable as number input with range 5-100 |
| 3 | `endLoopMax` editable as number input with range 50-1000 |
| 4 | Values validated on change; invalid values show error |
| 5 | Changes mark config as `isDirty = true` |
| 6 | Metadata (classRef, registryId, sourceFile) displayed as read-only info |
| **Dependencies** | Story B.4 (library) |
| **Notes** | `mainLvl` must NOT be shown or editable (it's a runtime value) |

---

#### Story C.2: Asset Collection References Section
| Field | Value |
|-------|-------|
| **ID** | C.2 |
| **Title** | Asset Collection References in Building Config |
| **Story** | As a level designer, I need to see which asset collections a building uses and edit their parameters, so that I can control the visual style |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `web/js/panels/building.ts` |
| **Acceptance Criteria** | |
| 1 | "Asset Collections" section lists all collections used by the building |
| 2 | Each row shows: collection name, tag prefix, and param values (suffixes) |
| 3 | Edit button opens asset collection params in inline edit mode |
| 4 | "Add Asset Collection" button with dropdown of available collections |
| 5 | Delete button removes collection reference (with confirmation if tiles reference it) |
| 6 | Link button opens the collection in the library/asset editor panel |
| 7 | Param changes mark building config as dirty |
| **Dependencies** | Story C.1 |
| **Notes** | When editing params (like WALL_SUFFIX), changes should propagate to tiles that reference `{WALL_SUFFIX}` |

---

#### Story C.3: Face Link Weight Table
| Field | Value |
|-------|-------|
| **ID** | C.3 |
| **Title** | Face Link Weights Editor |
| **Story** | As a level designer, I need to edit face key weights in a table, so that I can control which tile faces are preferred during generation |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `web/js/components/weightTable.ts` |
| **Acceptance Criteria** | |
| 1 | Table shows all face keys and their weights |
| 2 | Weight column is editable as number input |
| 3 | Zero-weight items shown in muted styling |
| 4 | "Add Weight" button with dropdown of unused face keys |
| 5 | Delete button removes weight for a face key |
| 6 | Changes mark config as dirty immediately |
| 7 | Tooltip shows face key meaning (e.g., "WH_in" = "Wall Interior") |
| **Dependencies** | Story C.1 |
| **Notes** | Weights control tile selection probability — higher weight = more likely to appear. Weight of 0 = never auto-selected but can be used in deterministic placement. |

---

#### Story C.4: Face Links Table (Unique Pairs)
| Field | Value |
|-------|-------|
| **ID** | C.4 |
| **Title** | Face Links Pair Editor |
| **Story** | As a level designer, I need to see and edit which face keys can be adjacent to each other, stored as unique pairs, so that the building generation constraint algorithm works correctly |
| **Priority** | P0 |
| **Effort** | 3h |
| **Module** | `web/js/components/faceLinkTable.ts` |
| **Acceptance Criteria** | |
| 1 | Table shows all face link pairs as "From → To" rows |
| 2 | Only unique pairs stored (not bidirectional duplicates) |
| 3 | Each pair shows the source of the link (which TS class added it) |
| 4 | "Add Link" with two dropdowns: "From face key" and "To face key" |
| 5 | Dropdown populated with all known face keys from config |
| 6 | Delete button removes the pair |
| 7 | Visual indicator if a face key in a pair has no matching weight entry |
| 8 | Bidirectional expansion documented in save output |
| **Dependencies** | Story C.3 |
| **Notes** | At save time, unique pairs expand to `[a,b],[b,a]` per config. The UI should show that this is happening. Important: pairs like `[WH_l, WH_r]` and `[WH_l, WH_rX]` are distinct and both should appear. |

---

#### Story C.5: Start Tiles Section
| Field | Value |
|-------|-------|
| **ID** | C.5 |
| **Title** | Start Tiles Management |
| **Story** | As a level designer, I need to see and edit start tiles (the initial tile placed in building generation), so that I can control building entry points |
| **Priority** | P1 |
| **Effort** | 2h |
| **Module** | `web/js/panels/building.ts` |
| **Acceptance Criteria** | |
| 1 | "Start Tiles" section shows count of configured start tiles |
| 2 | Clicking "Edit Start Tiles" opens tile editor modal |
| 3 | Each start tile shows summary: faces, weight, empty flag |
| 4 | Tiles are cloned into the main tile list for editing |
| 5 | "Reset to Default" button restores TS class values |
| **Dependencies** | Story D.1 (tile editor) |
| **Notes** | Start tiles determine the initial face of the building's entrance. These feed the generation algorithm's INIT phase. |

---

#### Story C.6: Tile List Section
| Field | Value |
|-------|-------|
| **ID** | C.6 |
| **Title** | Tile List Management in Building Editor |
| **Story** | As a level designer, I need to browse, filter, search, and CRUD all tiles in a building configuration, so that I can add, remove, and modify tile types |
| **Priority** | P0 |
| **Effort** | 3h |
| **Module** | `web/js/panels/building.ts` |
| **Acceptance Criteria** | |
| 1 | "Tiles" section shows tile count and filter input |
| 2 | Tiles displayed in a compact table: ID, face preview, weight, source info |
| 3 | Filter input filters tiles by face key content or source getter |
| 4 | Clicking a tile opens it in the tile editor modal (Story D.1) |
| 5 | "Add Tile" button creates a new empty tile with face `[null,null,null,null]` |
| 6 | Duplicate tile button clones a tile |
| 7 | Delete tile button with confirmation |
| 8 | Sortable by face key, weight, source getter |
| 9 | Tiles from asset collections show source badge (e.g., "from WallHouse.Wall_Door") |
| **Dependencies** | Story D.1 (tile editor) |
| **Notes** | Tile editing is done through the modal (Story D.1). This component is the list management and summary view. |

---

### EPIC D: Tile Editor

---

#### Story D.1: Tile Editor Modal — Face Configuration
| Field | Value |
|-------|-------|
| **ID** | D.1 |
| **Title** | Tile Editor Modal — Face & Properties |
| **Story** | As a level designer, I need to edit a tile's face configuration (4 directions: NW, NE, SE, SW), weight, and boolean properties in a modal, so that I can control how tiles connect during generation |
| **Priority** | P0 |
| **Effort** | 3h |
| **Module** | `web/js/panels/tile.ts` |
| **Acceptance Criteria** | |
| 1 | Modal opens when clicking "Edit Tile" or "New Tile" |
| 2 | Tile ID input field (auto-generated if blank) |
| 3 | Source info (e.g., "WallHouse → Wall_Door") shown as read-only |
| 4 | Face configuration widget with 4 inputs: NW, NE, SE, SW |
| 5 | Each face input is a dropdown with all known face keys from config |
| 6 | `null` option available for each face direction |
| 7 | Weight input (0 = never randomly selected) |
| 8 | Boolean checkboxes: Allow Move, Is Frise, Empty |
| 9 | Optional Height and Level number inputs |
| 10 | Color picker for base color override (RGB) |
| 11 | "Preview" area shows 2D rendering of face config |
| 12 | "Cancel" and "Save & Close" buttons |
| 13 | Validation: face must be valid array of 4 elements |
| **Dependencies** | Component: faceEditor.ts (Story D.3) |
| **Notes** | Face key dropdowns should auto-complete. When selecting a face key, show tooltip with meaning: "WH_r" = "Wall Right connecting face". |

---

#### Story D.2: Tile Editor — Asset List
| Field | Value |
|-------|-------|
| **ID** | D.2 |
| **Title** | Tile Asset List Editor |
| **Story** | As a level designer, I need to add, remove, and configure visual assets on a tile, so that the tile renders correctly in the game |
| **Priority** | P0 |
| **Effort** | 3h |
| **Module** | `web/js/components/assetList.ts` |
| **Acceptance Criteria** | |
| 1 | Assets displayed in a table: Layer, Asset Key, Rotation, Suffix, Height |
| 2 | "Add Asset" button with dropdown of available game assets |
| 3 | Asset Key input with autocomplete from `/editor/assets/list` |
| 4 | Rotation selector (0, 90, 180, 270 or index 0-3) |
| 5 | Suffix input supports both template references (`{WALL_SUFFIX}`) and raw values (`#H210_C115_S35_B120`) |
| 6 | Height selector (0, 1, 2) for layer ordering |
| 7 | Delete button per asset row |
| 8 | Reorder via drag handles (optional / nice to have) |
| 9 | Suffix helper button opens color picker dialog (Story D.5) |
| | When template reference selected, suffix dropdown is populated from collection params |
| 10 | Preview area updates live when asset changes |
| **Dependencies** | Story C.2 (collection params for template refs), D.5 (color picker) |
| **Notes** | Template references like `{WALL_SUFFIX}` are resolved at runtime from the asset collection. The editor should show both the template and the resolved preview value. |

---

#### Story D.3: Face Editor Component
| Field | Value |
|-------|-------|
| **ID** | D.3 |
| **Title** | 4-Direction Face Editor Widget |
| **Story** | As a level designer, I need a compact widget that shows all 4 face directions visually, so that I can set face keys intuitively |
| **Priority** | P0 |
| **Effort** | 2h |
| **Module** | `web/js/components/faceEditor.ts` |
| **Acceptance Criteria** | |
| 1 | Widget displays 4 labeled inputs: NW, NE, SE, SW |
| 2 | Visual compass or diamond layout showing directions |
| 3 | Each input is a dropdown with all known face keys + null option |
| 4 | Face key values colored by type (WH_=blue, F_=green, E_=orange, etc.) |
| 5 | Shows warnings if face key is not compatible with linked faces |
| 6 | Component is reusable (used in tile editor and face links table) |
| **Dependencies** | None |
| **Notes** | The face layout corresponds to isometric directions: 0=NW, 1=NE, 2=SE, 3=SW. |

---

#### Story D.4: 2D Canvas Preview Component
| Field | Value |
|-------|-------|
| **ID** | D.4 |
| **Title** | Tile/Building 2D Canvas Preview |
| **Story** | As a level designer, I need a 2D canvas preview of tiles and generated buildings, so that I can visualize what the building will look like before deploying |
| **Priority** | P1 |
| **Effort** | 3h |
| **Module** | `web/js/components/canvas2d.ts` |
| **Acceptance Criteria** | |
| 1 | Canvas renders a single isometric tile with assets loaded from `img/asset_opti/` |
| 2 | Canvas renders a grid of tiles showing a generated building |
| 3 | Toggle to show/hide face key overlays on tiles |
| 4 | Toggle to show/hide asset visuals |
| 5 | Click on a tile in canvas shows its config in sidebar |
| 6 | Canvas clears when generation is not yet run |
| 7 | Canvas size is responsive within the preview panel |
| 8 | Uses HTML5 Canvas 2D context |
| **Dependencies** | Story F.2 (preview service), asset loader |
| **Notes** | Can start simple — just colored rectangles representing tiles, then add real asset images. Priority is showing the structural layout first. |

---

#### Story D.5: Color Suffix Picker
| Field | Value |
|-------|-------|
| **ID** | D.5 |
| **Title** | Color Suffix Helper Component |
| **Story** | As a level designer, I need a helper that constructs the color suffix format `#H{height}_C{color}_S{saturation}_B{brightness}`, so that I don't have to manually type these complex strings |
| **Priority** | P2 |
| **Effort** | 1.5h |
| **Module** | `web/js/components/colorPicker.ts` |
| **Acceptance Criteria** | |
| 1 | Button opens color picker dialog when clicking suffix field |
| 2 | Four sliders: Height (H), Color (C), Saturation (S), Brightness (B) |
| 3 | Live preview of the constructed suffix string |
| 4 | Copy-to-clipboard button for the suffix |
| 5 | Preset color swatches for common values |
| 6 | "Use template reference" option for collection-managed params |
| 7 | Color preview shows approximate rendered color |
| **Dependencies** | None |
| **Notes** | Example: `#H210_C115_S35_B120` → H=210, C=115, S=35, B=120. This format matches the game's asset color filter system. |

---

### EPIC E: Asset Collection Editor

---

#### Story E.1: Asset Collection Editor Panel
| Field | Value |
|-------|-------|
| **ID** | E.1 |
| **Title** | Asset Collection Editor Panel |
| **Story** | As an asset manager, I need to edit asset collection parameters and view all tiles they provide, so that I can manage the visual components used by buildings |
| **Priority** | P1 |
| **Effort** | 3h |
| **Module** | `web/js/panels/assetCollection.ts` |
| **Acceptance Criteria** | |
| 1 | Panel renders when asset collection is active in `activeConfig` |
| 2 | Header shows collection name, tag prefix, and class reference |
| 3 | "Parameters" section shows editable params (WALL_SUFFIX, ROOF_SUFFIX, etc.) |
| 4 | Color suffixes show color picker helper (Story D.5) |
| 5 | "Tiles" section lists all tiles this collection provides |
| 6 | Each tile row shows face key, asset count, and source getter |
| 7 | Clicking a tile opens it in tile editor (tiles are editable but source getter is read-only) |
| 8 | "Add Tile" button creates a new tile in the collection |
| 9 | "Save" button posts JSON to API |
| 10 | Panel distinguishes between getter-based (WallHouse) and group-based (Fence) collections |
| **Dependencies** | Stories B.2, D.1 |
| **Notes** | For group-based collections (fences), the editor should show the `groupAsset({flatW, cornerW, innerW, isFrise})` parameters as editable. Changes to these should re-extract the tile list from the TS class. |

---

#### Story E.2: Tile Source Traceability
| Field | Value |
|-------|-------|
| **ID** | E.2 |
| **Title** | Display Tile Origin Information |
| **Story** | As a developer, I need to see which asset collection and getter produced each tile, so that I understand tile provenance and can trace issues |
| **Priority** | P1 |
| **Effort** | 1h |
| **Module** | `web/js/components/assetList.ts`, `web/js/panels/building.ts` |
| **Acceptance Criteria** | |
| 1 | Every tile in the building editor shows `sourceCollection` and `sourceTileId` badges |
| 2 | Hovering shows detailed traceability: "From WallHouse.getter(Wall_Door) → HouseA" |
| 3 | Filtering can be done by source collection |
| 4 | `sourceGetter` displayed in tile details panel |
| **Dependencies** | Story A.3 (sourceGetter field in extraction) |

---

### EPIC F: Preview & Validation

---

#### Story F.1: Generation Preview Service
| Field | Value |
|-------|-------|
| **ID** | F.1 |
| **Title** | Server-Side Building Generation Preview |
| **Story** | As a developer, I need the server to accept a JSON building config, run the generation algorithm, and return the tile grid, so that the client can preview the generated building |
| **Priority** | P1 |
| **Effort** | 3h |
| **Module** | `web/js/services/preview.ts` |
| **Acceptance Criteria** | |
| 1 | Service accepts JSON `BuildingConfig` and POSTs to `/editor/preview/generate` |
| 2 | Server deserializes JSON to `WcConfTile[]` array |
| 3 | Server creates temporary `WcAbstractBuildConf` instance from JSON |
| 4 | Server runs `WcBuildFactoryGenarator.start2(0, 0)` to generate |
| 5 | Returns tile grid as `{x, y, tiles: [{x, y, tileType, face}]}` |
| 6 | Errors returned with descriptive message if generation fails |
| 7 | Generation uses same random seed for reproducibility (optional) |
| **Dependencies** | Story A.4 (server endpoint) |
| **Notes** | Generation result should include stats: tile count, grow iterations used, whether generation completed successfully. |

---

#### Story F.2: Building Preview Canvas
| Field | Value |
|-------|-------|
| **ID** | F.2 |
| **Title** | Client-Side Building Preview Canvas |
| **Story** | As a level designer, I need to run building generation and see the result on a 2D canvas, so that I can verify the configuration produces the expected output |
| **Priority** | P1 |
| **Effort** | 3h |
| **Module** | `web/js/panels/building.ts` (preview section) |
| **Acceptance Criteria** | |
| 1 | "Run Generation" button posts config to preview service |
| 2 | Canvas renders the generated tile grid as colored rectangles (face key overlays) |
| 3 | Toggle to show tile face keys as text on each tile |
| 4 | Toggle to show tile asset representations as isometric sprites |
| 5 | Canvas pan/zoom controls for large buildings |
| 6 | "Clear" button removes preview |
| 7 | Stats shown: tile count, generation duration, success/failure |
| 8 | Click on a canvas tile shows its raw config in a popup |
| **Dependencies** | Story F.1 (generation preview), D.4 (canvas component) |
| **Notes** | Start with colored rectangles for each tile type — walls one color, fence another, entrance different. Then add real asset sprites from `img/asset_opti/`. |

---

#### Story F.3: Face Conflict Detection & Validation
| Field | Value |
|-------|-------|
| **ID** | F.3 |
| **Title** | Face Constraint Validation in Editor |
| **Story** | As a level designer, I need the editor to warn me about invalid face configurations that would cause generation failures, so that I can catch errors before running generation |
| **Priority** | P2 |
| **Effort** | 2h |
| **Module** | `web/js/services/validation.ts` |
| **Acceptance Criteria** | |
| 1 | Editor checks all face keys in tiles against `faceLinks` table |
| 2 | Warns if a face key is used in a tile but has no face link |
| 3 | Warns if a face key has no weight entry |
| 4 | Warns if face links would create impossible configurations |
| 5 | Validation runs on save and shows warning dialog |
| 6 | Validation results shown in "Validation" tab of building editor |
| 7 | Errors block save, warnings allow override |
| **Dependencies** | Story C.4 (face links table) |

---

### EPIC G: Runtime Integration

---

#### Story G.1: Config Loader
| Field | Value |
|-------|-------|
| **ID** | G.1 |
| **Title** | JSON Config Loader for Runtime |
| **Story** | As a developer, I need the game to load JSON configs at runtime (falling back to TS classes), so that edited configs can be used without code changes |
| **Priority** | P2 |
| **Effort** | 3h |
| **Module** | `loader.ts` |
| **Acceptance Criteria** | |
| 1 | `ConfigLoader.loadBuilding(id, params)` attempts JSON load from `conf/buildings/{id}.json` |
| 2 | If JSON exists, deserializes to `WcConfTile[]` and creates `WcAbstractBuildConf` |
| 3 | Face links expanded from unique pairs → bidirectional (mirroring `init()` behavior) |
| 4 | If no JSON found, falls back to TS class via `buildingConfigRegistry` |
| 5 | If no TS class, returns error |
| 6 | `tileFromJSON` correctly deserializes face, weight, assets, functions, booleans |
| 7 | Loader calls `conf.init()` after construction (rebuilds face index) |
| 8 | `mainLvl` set at runtime (not from JSON) |
| **Dependencies** | All previous stories (need working extraction, editing, persistence) |
| **Notes** | Integration with existing `wcBuildAction.ts` is OPTIONAL — can be done via wrapper: ```ts const buildingConf = await ConfigLoader.loadBuilding(conf.buildingType, {...}); ``` |

---

#### Story G.2: Round-Trip Validation
| Field | Value |
|-------|-------|
| **ID** | G.2 |
| **Title** | Round-Trip Extraction and Loading Validation |
| **Story** | As a developer, I need to verify that the round-trip (extract → edit → save → load → generate) produces consistent results, so that the editor is production-ready |
| **Priority** | P2 |
| **Effort** | 3h |
| **Module** | Test/validation script |
| **Acceptance Criteria** | |
| 1 | All 6 building configs extract to valid JSON |
| 2 | Generated buildings from JSON configs produce same tile count distribution as TS configs (with same seed) |
| 3 | Face links are correctly deduplicated in JSON and correctly expanded on load |
| 4 | Asset collection parameter changes propagate correctly |
| 5 | No errors in browser console during editor operation |
| 6 | No modifications to existing game code (checked via git diff) |
| **Dependencies** | All stories (full system test) |
| **Notes** | This is a validation story — it gates the P2 milestone but doesn't need to be a separate deliverable. |

---

## 8. Non-Functional Requirements

### 8.1 Performance
| Requirement | Target |
|-------------|--------|
| Extraction time (single config) | < 500ms |
| Save/write time | < 100ms |
| Building generation preview (normal building) | < 2s |
| Tile list filtering (100+ tiles) | < 50ms |
| Canvas rendering (50x50 grid) | < 1s |
| Page load time | < 3s |

### 8.2 Compatibility
| Requirement | Target |
|-------------|--------|
| Browser Compatibility | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Node.js / Deno | Deno 1.40+ (compatible with project's Deno version) |
| Mobile Support | No — desktop-only tool |

### 8.3 Security
| Requirement | Target |
|-------------|--------|
| User Input Validation | All number inputs clamped to valid ranges; strings sanitized |
| File Write Safety | Writes only to `editor/conf/` directory; no path traversal |
| XSS Prevention | Text content escaped; no `innerHTML` with untrusted data |

### 8.4 Maintainability
| Requirement | Target |
|-------------|--------|
| Code Isolation | All editor code in `IsoGame/wcBuilding2/editor/` |
| Zero Breaking Changes | `git diff` on existing files shows no changes |
| Documentation | JSDoc on exported functions; `PLAN-SUMMARY-v4.md` referenced |
| Type Safety | All API responses typed; no `any` in editor code |

### 8.5 Data Quality
| Requirement | Target |
|-------------|--------|
| JSON Validity | All saved configs are valid JSON conforming to schema |
| Face Consistency | All tiles have 4-element face arrays |
| Weight Consistency | All weights ≥ 0 |
| Reference Integrity | `sourceTileId` and `sourceCollection` reference valid entities |

---

## 9. Acceptance Criteria

### 9.1 Must-Have (P0)
- [ ] All 6 building configs extracted to valid JSON via UI
- [ ] Building parameters editable (growLoopCount, endLoopMax)
- [ ] Face weight table editable with add/delete
- [ ] Face links editable as unique pairs
- [ ] Tile editor modal with face config (4 directions), assets, functions
- [ ] Tile list with add/duplicate/delete/filter/sort
- [ ] Asset collection reference editing in building editor
- [ ] JSON configs saved to `editor/conf/buildings/` and `editor/conf/asset-collections/`
- [ ] All code isolated in `IsoGame/wcBuilding2/editor/`

### 9.2 Should-Have (P1)
- [ ] 2D canvas preview of generated buildings
- [ ] Asset collection parameter editing (colors, suffixes)
- [ ] Asset list editor with drag-and-drop reordering
- [ ] Color picker for suffix construction
- [ ] Face conflict detection and validation warnings
- [ ] Tile source traceability (source getter/collection badges)

### 9.3 Nice-to-Have (P2)
- [ ] JSON config loader in game runtime
- [ ] Round-trip validation script
- [ ] Export/import of all configs as single JSON archive
- [ ] Multiple building preview side-by-side
- [ ] Tile asset drag-and-drop reordering in UI
- [ ] Keyboard shortcuts for common actions

---

## 10. Timeline & Milestones

### 10.1 Milestone Schedule

| Milestone | Stories | Estimated Hours | Target |
|-----------|---------|-----------------|--------|
| **M1: Foundation** | A.1, A.2, A.3, A.4 | 13-15h | Week 1-2 |
| **M2: Shell** | B.1, B.2, B.3, B.4 | 6-7.5h | Week 2-3 |
| **M3: Building Editor** | C.1, C.2, C.3, C.4, C.5, C.6 | 11-13h | Week 3-4 |
| **M4: Tile Editor** | D.1, D.2, D.3, D.4, D.5 | 12-13.5h | Week 4-5 |
| **M5: Asset Collection** | E.1, E.2 | 4-5h | Week 5 |
| **M6: Preview** | F.1, F.2, F.3 | 8-9h | Week 5-6 |
| **M7: Runtime Integration** | G.1, G.2 | 5-7h | Week 6 |
| **Buffer** | — | 4-6h | Week 7 |
| **Total** | | **~63-74h** | ~7 weeks |

### 10.2 Implementation Order

**Recommended order (dependencies respected):**

```
Phase 1 (Foundation):
  1. A.1 → JSON Schema Types
  2. A.2, A.3 → Extractor (parallel)
  3. A.4 → Server Endpoints
  4. Test: Extract all 6 buildings, verify JSON

Phase 2 (Web Shell):
  5. B.1 → HTML Entry Point
  6. B.2, B.3 → State + API (parallel)
  7. B.4 → Library Panel

Phase 3 (Building Editor):
  8. C.1 → Parameters Section
  9. C.2 → Asset Collection References
  10. C.3 → Face Weight Table
  11. C.4 → Face Links Table
  12. C.6 → Tile List (depends on D.1)

Phase 4 (Tile Editor):
  13. D.1, D.2 → Tile Modal + Asset List (parallel components)
  14. D.3 → Face Editor Component
  15. D.4 → Preview Canvas Component
  16. D.5 → Color Picker
  17. C.5 → Start Tiles (uses D.1)

Phase 5 (Asset Collection Editor):
  18. E.1 → Asset Collection Panel
  19. E.2 → Source Traceability

Phase 6 (Preview & Validation):
  20. F.1 → Generation Preview Service
  21. F.2 → Building Preview Canvas
  22. F.3 → Face Conflict Detection

Phase 7 (Runtime Integration):
  23. G.1 → Config Loader
  24. G.2 → Round-Trip Validation
```

---

## 11. Appendix: Technical Reference

### 11.1 Existing Building Config Hierarchy

| Class | File | Asset Collections Used |
|-------|------|----------------------|
| `WcBuildConf_HouseA` | `buildConf_HouseA.ts` | WallHouse, FenceSimple, FencePlatform, Enter |
| `WcBuildConf_GraveA` | `buildConf_GraveA.ts` | FenceGrave, Enter, X (special) |
| `WcBuildConf_ManorA` | `buildConf_ManorA.ts` | WallManor, FenceSimple, Enter |
| `WcBuildConf_LabBorderA` | `buildConf_LabBorderA.ts` | CorridorLab, Enter |
| `WcBuildConf_LabPipeA` | `buildConf_LabPipeA.ts` | CorridorPipe, Enter |
| `WcBuildConf_RLabA` | `buildConf_RLabA.ts` | WallRLab, CorridorLab, Enter |

### 11.2 Asset Collection Classes

| Class | File | Pattern | Key Features |
|-------|------|---------|--------------|
| `WcAsset_WallHouse` | `wcAsset_WallHouse.ts` | Getter-based | Getters: Corner, Corner_B, Wall, Wall_Door, Wall_Windows, Wall_RoofWindows, InnerCorner, InnerCorner_X, Inside_Full |
| `WcAsset_WallManor` | `wcAsset_WallManor.ts` | Getter-based | Similar to WallHouse with manor-specific assets |
| `WcAsset_FenceSimple` | `wcAsset_Fence2.ts` | Group-based | `groupAsset({flatW, cornerW, innerW, isFrise})` returns composed tiles |
| `WcAsset_FencePlatform` | `wcAsset_Fence2.ts` | Group-based | Inherits from WcAsset_Fence2, fencePlatform variant |
| `WcAsset_FenceGrave` | `wcAsset_FencePathGrave.ts` | Group-based | Grave-specific fence with pillars |
| `WcAsset_Enter` | `wcAsset_Entrer.ts` | Mixed | `groupInit()` for entrance tiles; `groupAsset()` for entrance variations |
| `WcAsset_CorridorLab` | `wcAsset_CorridorLab.ts` | Mixed | Lab corridor tiles |
| `WcAsset_CorridorPipe` | `wcAsset_CorridorPipe.ts` | Mixed | Lab pipe system tiles |
| `wcAsset_X` | `wcAsset_X.ts` | Group-based | X (unknown) special tiles |

### 11.3 Face Key System

| Prefix | Meaning | Example Keys |
|--------|---------|--------------|
| `WH_` | Wall House | `WH_r`, `WH_l`, `WH_in`, `WH_out`, `WH_outD`, `WH_rX`, `WH_lX` |
| `F_` | Fence | `F_out`, `F_in`, `F_r` |
| `FP_` | Fence Platform | `FP_out`, `FP_in`, `FP_r`, `FP_l` |
| `E#` | Entrance | `E#Open`, `E#Door` |
| `X` | Unknown/X | `X` |
| `0` | Empty space | `0`, `0in` |

### 11.4 Building Generation Algorithm (Overview)

```
1. INIT: Place start tile from configuration.startTiles
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

### 11.5 Color Suffix Format

```
#H{height}_C{color}_S{saturation}_B{brightness}

Example: #H210_C115_S35_B120
  H = Height layer (0-255)
  C = Color hue (0-255)
  S = Saturation (0-100)
  B = Brightness (0-255)
```

### 11.6 Key Files (Read-Only Reference)

| File | Purpose |
|------|---------|
| `IsoGame/wcBuilding2/wcAbstractBuildConf.ts` | Base config class with WcConfTile interface |
| `IsoGame/wcBuilding2/wcBuildFactory.ts` | Building generation algorithm |
| `IsoGame/wcBuilding2/wcBuildTile.ts` | Individual building tile with face constraint propagator |
| `IsoGame/wcBuilding2/wcBuildAction.ts` | Registry + creation handlers |
| `IsoGame/wcBuilding2/wcBuildFace.ts` | Face type definitions |
| `IsoGame/wcBuilding2/wcUtils.ts` | Utility functions: confsGroup_to_confsTile, pickRandomWeightedObject |
| `IsoGame/tools/buildingConfigRegistry.ts` | Building config registry with IDs |
| `IsoGame/wcBuilding2/conf/buildConf_*.ts` | Existing building config implementations |
| `IsoGame/wcBuilding2/conf/assetsCollection/*.ts` | Asset collection implementations |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **Face Key** | A string identifier for a direction on a tile (e.g., "WH_r" = Wall Right connecting face). 4 per tile: [NW, NE, SE, SW] |
| **Face Link** | A compatibility rule between two face keys. If tile A has key "x" on its NW side, the adjacent tile must have a compatible key on its SE side. |
| **Face Link Weight** | A numeric weight controlling how likely a face key is selected during generation. 0 = never auto-selected. |
| **Constraint Propagation** | The algorithm that eliminates impossible face combinations as tiles are placed, working outward from the building's center. |
| **WcConfTile** | The TypeScript type representing a tile configuration with face, weight, assets, and functions. |
| **applyGroup()** | A utility that wraps tiles with `allowMove`, `isFrise`, `functions` and applies weights. |
| **Asset Suffix** | A color filter string applied to game assets (e.g., `#H210_C115_S35_B120`). |
| **Asset Collection** | A group of related tile definitions (e.g., all wall tiles, all fence tiles). |
| **Building Config** | A complete set of tiles, face weights, and face links defining one building type. |
| **Source Getter** | The TS class getter method that produced a tile (e.g., "Wall_Door" from WcAsset_WallHouse). |
| **Round-Trip** | Extract → Save → Edit → Load → Generate cycle producing consistent results. |
| **Is Frise** | Boolean flag indicating a tile has no collision (decorative only). |
| **Allow Move** | Boolean flag indicating whether terrain can be modified on this tile. |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2026-04-01 | Cline AI | Initial PRD based on PLAN-SUMMARY-v4.md analysis |