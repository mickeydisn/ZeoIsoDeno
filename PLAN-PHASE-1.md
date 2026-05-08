# Phase 1: Foundation & Data Model

**Goal:** Enable `Tile` to track modifications and `Chunk` to identify modified tiles for saving.
**Dependencies:** None

## Tasks

- [x] Task: Add `isDirty` flag and comparison logic to `Tile`
  - Detail: Update `IsoGame/map/object/tile.ts` to include `isDirty` property.
  - Detail: Implement `checkDirty()` method in `Tile` that compares current state (`_currentLvl`, `_currentColor`, `items`, `isBlock`, `isFrise`) against generated values from `RawTile`.
- [x] Task: Implement `toDeltaJson()` in `Tile`
  - Detail: Create a method that returns only the properties that differ from their generated state.
- [x] Task: Update `Chunk` to handle delta-based loading
  - Detail: Modify `IsoGame/map/object/chunk.ts` to include a method `applyDeltas(deltas: any[])`.
- [x] Task: Create `MapPersistence` interface
  - Detail: Define common interface for Client and Server persistence in `IsoGame/map/interface.ts`.
