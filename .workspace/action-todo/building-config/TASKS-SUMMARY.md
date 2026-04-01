# TASKS-SUMMARY — Building Configuration Editor

## Project Context

The **Building Configuration Editor** is a web-based companion tool for the ZeoIsoDeno isometric game. It enables designers to extract, edit, and preview building configurations (houses, manors, labs, graveyards) that are currently hardcoded as TypeScript classes. The editor provides visual interfaces for managing tile definitions, face constraints, asset collections, and generation parameters — eliminating the need for direct TS code changes. All editor code is isolated in `IsoGame/wcBuilding2/editor/` with zero modifications to existing game code.

---

## Goal Project Structure

```
IsoGame/wcBuilding2/editor/
├── types.ts                        # JSON schema type interfaces
├── extractor.ts                    # Runtime TS class → JSON extraction
├── loader.ts                       # Runtime JSON → WcAbstractBuildConf loading
├── server.ts                       # Deno HTTP endpoints (isolated)
├── conf/                           # JSON config storage (auto-created)
│   ├── asset-collections/          # WallHouse.json, FenceSimple.json, ...
│   ├── buildings/                  # HouseA.json, GraveA.json, ...
│   └── registry.json               # Index of all configs
└── web/
    ├── index.html                  # Editor entry point
    ├── css/editor.css              # Isolated styles
    └── js/
        ├── state.ts                # Centralized state management
        ├── api.ts                  # API client (fetch wrapper)
        ├── panels/
        │   ├── library.ts          # Left sidebar: config list
        │   ├── building.ts         # Main: Building editor panel
        │   ├── assetCollection.ts  # Main: Asset collection editor
        │   └── tile.ts             # Modal: Tile editor
        ├── components/
        │   ├── faceEditor.ts       # 4-face input widget (NW, NE, SE, SW)
        │   ├── assetList.ts        # Add/remove/reorder tile assets
        │   ├── faceLinkTable.ts    # Face links editor (unique pairs)
        │   ├── weightTable.ts      # Face key weight table
        │   ├── canvas2d.ts         # 2D isometric preview
        │   └── colorPicker.ts      # Color suffix helper
        └── services/
            ├── preview.ts          # Generation preview service
            └── assetPreview.ts     # Asset image loading service
```

---

## Phase Checklist

- [x] **Phase 1: Types & Runtime Extractor** — Define JSON schema interfaces and implement extraction of TS building configs and asset collections into valid JSON. Must handle two asset collection patterns: getter-based (WallHouse) and groupAsset-based (Fence). Must deduplicate faceLinks and exclude runtime-only values like `mainLvl`.
- [ ] **Phase 2: Deno Server Endpoints** — Create isolated HTTP endpoints for config listing, extraction, saving, preview generation, and asset listing. Mount separately from game routes in `webServer.ts`.
- [ ] **Phase 3: Web Shell & Library Panel** — Build HTML entry point, state management, API client, and searchable library sidebar showing all extractable TS classes and existing JSON configs.
- [ ] **Phase 4: Building Editor Panel** — Implement full building config editor with: parameters (growLoopCount, endLoopMax), asset collection references, face weight table, face links table (unique pairs), start tiles section, and tile list with CRUD.
- [ ] **Phase 5: Tile Editor & Components** — Create modal tile editor with 4-direction face configuration, asset list CRUD, function list, 2D canvas preview, and color suffix picker.
- [ ] **Phase 6: Asset Collection Editor & Preview** — Build asset collection editing panel with parameter editing (color suffixes), tile listing, and generation preview canvas.
- [ ] **Phase 7: Config Loader & Round-Trip Validation** — Implement JSON → WcAbstractBuildConf loader for optional runtime integration. Validate round-trip consistency (extract → edit → save → load → generate).