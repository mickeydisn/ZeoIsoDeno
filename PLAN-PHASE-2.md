# Phase 2: Client-Side Persistence (IndexedDB)

**Goal:** Implement local storage using IndexedDB to store tile deltas.
**Dependencies:** Phase 1

## Tasks

- [x] Task: Set up Dexie.js or native IndexedDB wrapper
  - Detail: Create `IsoGameAddon/iso/web/js/worker/db.ts` to manage IndexedDB.
  - Detail: Define schemas for `MapChunks` (metadata) and `MapDeltas` (tile deltas).
- [x] Task: Implement `LocalPersistence` service
  - Detail: Create `saveChunkDeltas(cx, cy, deltas)` and `loadChunkDeltas(cx, cy)`.
- [x] Task: Integrate local loading into `FactoryMap`
  - Detail: Modify `IsoGame/map/factory/factoryMap.ts` to check local storage after chunk generation.
