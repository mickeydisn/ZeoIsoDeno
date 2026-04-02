# Phase 1: Type System Foundation

**Goal:** Update all type definitions to support tile groups in the editor schema
**Dependencies:** None

## Tasks

- [x] Task: Add TileGroupConfig interface to editor/types.ts
  - Detail: Define group structure matching WcConfRawGroup with shared face + multiple items
  - File: `IsoGame/wcBuilding2/editor/types.ts`
  - Fields: id, face, weight, items (array of tile items without face)

- [x] Task: Update BuildingConfig interface
  - Detail: Add optional `groups: TileGroupConfig[]` property
  - File: `IsoGame/wcBuilding2/editor/types.ts`

- [x] Task: Update AssetCollectionConfig interface
  - Detail: Add optional `groups: TileGroupConfig[]` property
  - File: `IsoGame/wcBuilding2/editor/types.ts`

- [x] Task: Update TileConfig to be partial in group items
  - Detail: Define TileGroupItem type that omits face property
  - File: `IsoGame/wcBuilding2/editor/types.ts`

- [x] Task: Bump schema version to 1.1
  - Detail: Update CURRENT_VERSION constant and add to SUPPORTED_VERSIONS
  - File: `IsoGame/wcBuilding2/editor/types.ts`
