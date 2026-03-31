# Project Structure Analysis

This document analyzes the ZeoIsoDeno project structure, split into two parts:
- **Part 1**: Files needed by `web/indexIso.html` (the isometric game)
- **Part 2**: Files/directories that can be removed (if their contents aren't needed elsewhere)

---

## Part 1: Required Files for `web/indexIso.html`

### HTML Entry Point
- `web/indexIso.html`

### CSS Files
- `web/stylesIso.css`
- External (CDN): `https://www.w3schools.com/w3css/4/w3.css`
- External (CDN): `https://www.w3schools.com/lib/w3-theme-blue-grey.css`
- External (CDN): `https://fonts.googleapis.com/css?family=Open+Sans`
- External (CDN): `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`
- External (CDN): `https://unpkg.com/htmx.org@1.9.5`

### Web JavaScript/TypeScript Files
- `web/js/main.ts`
- `web/js/gameWorker.ts` (used as Web Worker for game logic)
- `web/js/gobalState.ts`
- `web/js/keyboad.ts`
- `web/js/renderWorker.ts`
- `web/js/simplex-noise.js`
- `web/js/menu/flyMenu.ts`
- `web/js/menu/infoMenu.ts`
- `web/js/menu/toolMenu.ts`
- `web/js/menu/toolMenuHandlers.ts`
- `web/js/menu/toolMenuRender.ts`
- `web/js/menu/toolMenuState.ts`
- `web/js/worker/messageHandler.ts` - used by `gameWorker.ts` and `main.ts`

### Core Game Engine (IsoGame/)
- `IsoGame/word.ts` - World class
- `IsoGame/entity/CitienBheavior.ts`
- `IsoGame/entity/CitizenTrais.ts`
- `IsoGame/entity/cityEntity.ts`
- `IsoGame/entity/typeEntityBehavior.ts`
- `IsoGame/city/city.ts`
- `IsoGame/city/cityNode.ts`
- `IsoGame/city/graph.ts`
- `IsoGame/city/nodeMap.ts`
- `IsoGame/city/pathConfig.ts`
- `IsoGame/city/pathFactory.ts`
- `IsoGame/map/interface.ts`
- `IsoGame/map/tileActions.ts`
- `IsoGame/map/tileUtil.js`
- `IsoGame/map/object/tile.ts`
- `IsoGame/map/object/chunk.ts`
- `IsoGame/map/object/tileRaw.ts`
- `IsoGame/map/object/tilesMatrix.ts`
- `IsoGame/map/object/biomes.ts`
- `IsoGame/map/factory/factoryMap.ts`
- `IsoGame/map/factory/factoryGenerator.ts`
- `IsoGame/map/factory/factoryTileGenerator.ts`
- `IsoGame/map/factory/factoryTileRawGenerator.ts`
- `IsoGame/map/factory/factoryBiomes.ts`
- `IsoGame/map/factory/scripts/simplex-noise.ts` (or .js)
- `IsoGame/mapIso/canvasMapDrawer.ts`
- `IsoGame/mapIso/grid.ts`
- `IsoGame/mapIso/asset/assetLoaderOpti.ts`
- `IsoGame/mapIso/asset/assetOptiConfig.ts`
- `IsoGame/mapIso/asset/assetUtils.ts`
- `IsoGame/mapIso/iso/color.ts`
- `IsoGame/mapIso/iso/isomer.ts`
- `IsoGame/mapIso/iso/path.ts`
- `IsoGame/mapIso/iso/point.ts`
- `IsoGame/mapIso/iso/vector.ts`
- `IsoGame/mapIso/iso/shape.ts`
- `IsoGame/tools/assetTools.ts`
- `IsoGame/tools/buildingConfigRegistry.ts`
- `IsoGame/tools/colorTools.ts`
- `IsoGame/tools/structureTools.ts`
- `IsoGame/tools/terrainTools.ts`
- `IsoGame/tools/toolBuilder.ts`
- `IsoGame/tools/toolRegistry.ts`
- `IsoGame/utils/SingletonBase.ts`
- `IsoGame/wcBuilding2/wcAbstractBuildConf.ts`
- `IsoGame/wcBuilding2/wcBuildAction.ts`
- `IsoGame/wcBuilding2/wcBuildFace.ts`
- `IsoGame/wcBuilding2/wcBuildFactory.ts`
- `IsoGame/wcBuilding2/wcBuildTile.ts`
- `IsoGame/wcBuilding2/wcBuildTileDrawer.ts`
- `IsoGame/wcBuilding2/wcUtils.ts`
- `IsoGame/wcBuilding2/conf/*.ts` - All building configurations
- `IsoGame/wcBuilding2/conf/assetsCollection/*.ts` - Asset collection files
- `IsoGame/menu/globalState.ts`
- `IsoGame/menu/widjetAction.ts`
- `IsoGame/menu/widjetActionsPlayer.ts`
- `IsoGame/menu/widjetBtt.ts`

### Image Assets
- `img/asset_opti/*.png` - All asset sprite sheets (AstroBase.png, AstroPlatform.png, AstroRocket.png, etc.)
- `img/asset_opti/*/` - All asset subdirectories containing individual images

### Configuration/Build Files
- `deno.json` - Deno configuration
- `webServer.ts` - Web server entry point

---

## Part 2: Files/Directories That Can Be Removed

### If only `indexIso.html` is needed:

#### Alternative HTML Views
- `web/indexIsoThree.html` - Three.js based view (has own inline rendering)
- `web/indexIsoThree_ref.html` - Reference version of Three.js view
- `web/palette.html` - Image editor palette view

#### Palette Editor (jsP/)
If `palette.html` is not used:
- `web/jsP/main.ts`
- `web/jsP/main2.ts`
- `web/jsP/old/colorEdit.js`
- `web/jsP/old/colorPallet.js`
- `web/jsP/old/colorUtils.js`
- `web/jsP/old/mainPallet.js`
- `web/jsP/old/tranformeModule.js`
- `web/jsP/pallet/*.ts` - All palette editor modules

#### Web Worker (not used by indexIso.html)
- `web/jsWorker/main.ts` - Used by `palette.html`
- `web/jsWorker/mainWorker.ts` - Used by `palette.html`

Note: `web/js/worker/messageHandler.ts` is REQUIRED by `web/js/gameWorker.ts` and `web/js/main.ts`.

#### Documentation (diff-click-canava/)
If not needed for reference:
- `diff-click-canava/*.md` - All ADR/PRD documents

#### Images & Documents
- `documents/` - Document images for documentation
- `img/untitled folder/` - Untagged image processing files
- `img/untitled_folder/` - Duplicate of untitled folder (case variation)

#### Unused Web Files
- `web/mainDom.ts` - Referenced but not by indexIso.html
- `web/styles.css` - Not used by indexIso.html (uses stylesIso.css)
- `web/styles2.css` - Not used by indexIso.html

#### IsoGame/worker/ Alternative Implementations
- `IsoGame/worker/` - Alternative worker implementations only used by `web/jsP/main.ts` and `web/jsP/main2.ts` (palette editor), NOT by `indexIso.html`
  - `IsoGame/worker/game/GameWorker.ts`
  - `IsoGame/worker/game/GameWorkerState.ts`
  - `IsoGame/worker/game/commands/`
  - `IsoGame/worker/main/InterfaceModule.ts`
  - `IsoGame/worker/main/commands/`
  - `IsoGame/worker/shared/`

#### Legacy/JS Building Configs
- `IsoGame/wcBuilding2/js/*.js` - Legacy JavaScript building configs (TypeScript versions exist)

#### Entity v2
- `IsoGame/entity/v2/` - Alternative entity implementations

#### Map Action/Factory Scripts
- `IsoGame/map/factory/scripts/` - Simplex noise (if not used by main)

#### Other
- `Dockerfile` - If not deploying via Docker
- `uploads/` - Upload directory
- `*.DS_Store` - macOS metadata files

---

## Dependency Diagram (Simplified)

```
web/indexIso.html
├── web/stylesIso.css
├── web/js/main.ts
│   ├── IsoGame/mapIso/canvasMapDrawer.ts
│   ├── IsoGame/mapIso/grid.ts
│   ├── web/js/menu/flyMenu.ts
│   ├── web/js/menu/toolMenu.ts (and related)
│   ├── web/js/menu/InfoMenu.ts
│   ├── web/js/gameWorker.ts
│   │   ├── IsoGame/city/*.ts
│   │   ├── IsoGame/map/factory/factoryMap.ts
│   │   ├── IsoGame/map/tileActions.ts
│   │   ├── IsoGame/mapIso/asset/assetLoaderOpti.ts
│   │   │   └── IsoGame/mapIso/asset/assetOptiConfig.ts
│   │   │       └── img/asset_opti/*.png
│   │   ├── IsoGame/mapIso/canvasMapDrawer.ts
│   │   ├── IsoGame/tools/*.ts
│   │   ├── IsoGame/wcBuilding2/*.ts
│   │   └── IsoGame/word.ts
│   ├── web/js/gobalState.ts
│   ├── web/js/keyboad.ts
│   └── web/js/worker/messageHandler.ts
└── External CDN resources
```

---

## Notes

1. **Image Assets**: The `img/asset_opti/` directory contains all the sprite sheets referenced in `assetOptiConfig.ts`. Removing any of these will break asset loading.

2. **Worker Sharing**: `web/js/gameWorker.ts` is shared between `indexIso.html` and `indexIsoThree.html`. Removing it would break both views.

3. **Palette Editor**: The entire `jsP/` and `jsWorker/` directories are only needed for `palette.html`. Additionally, `jsP/` uses `IsoGame/worker/main/InterfaceModule.ts`.

4. **Three.js View**: `indexIsoThree.html` is self-contained for rendering but shares the `web/js/gameWorker.ts` backend.

5. **web/js/worker/messageHandler.ts**: This file is required by `web/js/gameWorker.ts` and `web/js/main.ts`. Do NOT remove it.
