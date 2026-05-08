# TASK-PLAN-save-chuck.md

This document outlines the implementation plan for the Delta-Based Chunk Saving System.

## Architecture Summary
The system will track modifications to tiles at the `Chunk` level. Instead of saving every tile, only "deltas" (differences from the raw generated state) will be persisted. This ensures minimal storage and efficient synchronization.

- **Frontend (Worker):** Tracks dirty tiles, manages IndexedDB deltas.
- **Backend (Deno):** Provides SQLite-backed REST API for permanent storage.
- **Sync:** Bidirectional sync between IndexedDB and SQLite.

## Implementation Steps

### Phase 1: Foundation (Tile & Chunk)
1. **Modify `Tile` (`IsoGame/map/object/tile.ts`):**
    - Add `isDirty: boolean` flag.
    - Implement `checkDirty()`: Compare current values (`lvl`, `color`, `items`, `isBlock`, `isFrise`) against `genLvl2`, `genColor`, etc.
    - Implement `toDeltaJson()`: Return only modified properties.
    - Implement `applyDelta(delta: any)`: Update tile state from a delta object.
2. **Modify `Chunk` (`IsoGame/map/object/chunk.ts`):**
    - Implement `getDeltas()`: Collect all dirty tiles in the chunk.
    - Implement `applyDeltas(deltas: any[])`: Apply a list of tile deltas to the chunk.

### Phase 2: Client Persistence (IndexedDB)
3. **Setup Database (`IsoGameAddon/iso/web/js/worker/db.ts`):**
    - Implement a lightweight IndexedDB wrapper (or use Dexie if available).
    - Stores: `chunks_meta` (cx, cy, timestamp), `tile_deltas` (chunkId, x, y, data).
4. **Implement Local Persistence Service:**
    - Methods to save and load deltas by chunk coordinates.

### Phase 3: Server Persistence (SQLite)
32. [x] **Backend Database:**
    - Initialize SQLite table for deltas in `webServer.ts` or a dedicated service.
33. [x] **REST API:**
    - `POST /api/map/deltas`: Batch save deltas.
    - `GET /api/map/deltas`: Fetch deltas for specific chunks.

### Phase 4: Integration
7. **Hook into FactoryMap (`IsoGame/map/factory/factoryMap.ts`):**
    - After generating a chunk, check local/remote storage for deltas and apply them.
8. **Auto-Save Mechanism:**
    - Trigger saving when `TilesActions` completes a batch of modifications.
    - Use a background synchronization task in the worker.

## Success Criteria
- Map modifications (level changes, coloring, item placement) persist after refreshing the browser.
- Only modified tiles are stored in the database.
- Large map edits are handled smoothly without blocking the main thread or worker.
