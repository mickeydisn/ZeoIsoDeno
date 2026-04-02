# Phase 4: Editor UI Integration

**Goal:** Add native group editing support to the web editor interface
**Dependencies:** Phase 2

## Tasks

- [x] Task: Create GroupEditor web component
  - Detail: New component for editing tile groups with shared face editor + item list
  - File: `IsoGame/wcBuilding2/editor/web/js/components/groupEditor.ts`

- [x] Task: Update asset collection panel
  - Detail: Add group tab/section alongside tiles, support create/edit/delete groups
  - File: `IsoGame/wcBuilding2/editor/web/js/panels/assetCollection.ts`

- [x] Task: Update building panel
  - Detail: Add group support in building configuration editor
  - File: `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`

- [ ] Task: Add tile grid group visualization
  - Detail: Highlight grouped tiles in preview canvas, show expansion preview
  - File: `IsoGame/wcBuilding2/editor/web/js/components/canvas2d.ts`

- [ ] Task: Implement group create/conversion actions
  - Detail: Add "Create Group from Selected Tiles" button
  - File: `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`

- [ ] Task: Implement group ungroup action
  - Detail: Add "Ungroup" button that expands group into individual tiles
  - File: `IsoGame/wcBuilding2/editor/web/js/panels/building.ts`